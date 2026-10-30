const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const debugLogger = require("./debugLogger");
const {
  downloadFile,
  createDownloadSignal,
  createDownloadInProgressError,
  validateFileSize,
  cleanupStaleDownloads,
  checkDiskSpace,
} = require("./downloadUtils");
const WhisperServerManager = require("./whisperServer");
const { createAbortError } = require("./abortError");
const { NbWhisperQueue } = require("./nbWhisperQueue");
const { getModelsDirForService } = require("./modelDirUtils");

const modelRegistryData = require("../models/modelRegistryData.json");

const CACHE_TTL_MS = 30000;

function getWhisperModelConfig(modelName) {
  const modelInfo = modelRegistryData.whisperModels[modelName];
  if (!modelInfo) return null;
  return {
    url: modelInfo.downloadUrl,
    size: modelInfo.expectedSizeBytes || modelInfo.sizeMb * 1_000_000,
    fileName: modelInfo.fileName,
    sha256: modelInfo.sha256,
  };
}

function getValidModelNames() {
  return Object.keys(modelRegistryData.whisperModels);
}

// WHISPER_GPU_FAILED holds a comma-separated list of backends that fell back
// to CPU on this machine (e.g. "cuda" or "cuda,vulkan")
function resolveFailedGpuBackends(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function shouldRewarmOnWake({
  isRemote,
  useCuda,
  useVulkan,
  modelName,
  transcribing,
  rewarmInFlight,
}) {
  // Only re-warm a running local GPU whisper-server: sleep evicts its model from
  // VRAM. Skip remote/CPU servers, and skip while a transcription (already warming
  // the server) or another re-warm is in flight. See #766.
  return !isRemote && !!(useCuda || useVulkan) && !!modelName && !transcribing && !rewarmInFlight;
}

class WhisperManager {
  constructor() {
    this.cachedFFmpegPath = null;
    this.currentDownloadProcess = null;
    this.ffmpegAvailabilityCache = { result: null, expiresAt: 0 };
    this.isInitialized = false;
    // Server manager for HTTP-based transcription
    this.serverManager = new WhisperServerManager();
    this.currentServerModel = null;
    this.cachedVadModelPath = undefined;
    this._transcribing = false;
    this._transcribingCount = 0;
    this._requestQueue = new NbWhisperQueue();
    this._rewarmInFlight = false;
    this._cudaBinaryManager = null;
    this._vulkanBinaryManager = null;
  }

  setGpuBinaryManagers({ cuda, vulkan }) {
    this._cudaBinaryManager = cuda || null;
    this._vulkanBinaryManager = vulkan || null;
  }

  // The GPU backend for every server start is resolved fresh from the current
  // env + installed packs, so enabling or removing a pack applies immediately
  // instead of after an app restart. A pack on disk implies intent: the user
  // downloaded it, so it engages unless WHISPER_*_ENABLED is explicitly set to
  // "false" (case-insensitive; an opt-out that survives without deleting the
  // pack). Requiring the flag to be present stranded downloaded packs on
  // silent CPU whenever the .env line was lost (#1340). WHISPER_GPU_FAILED
  // lists backends that crashed on this machine (persisted by ipcHandlers
  // when the server falls back to CPU); they stay off until the user retries
  // or re-downloads, so a doomed backend isn't re-attempted — and its model
  // reload re-paid — on every launch.
  resolveGpuStartOptions() {
    const failed = resolveFailedGpuBackends(process.env.WHISPER_GPU_FAILED);
    const useCuda =
      (process.env.WHISPER_CUDA_ENABLED || "").toLowerCase() !== "false" &&
      !failed.includes("cuda") &&
      !!this._cudaBinaryManager?.isDownloaded();
    const useVulkan =
      !useCuda &&
      (process.env.WHISPER_VULKAN_ENABLED || "").toLowerCase() !== "false" &&
      !failed.includes("vulkan") &&
      !!this._vulkanBinaryManager?.isDownloaded();
    return { useCuda, useVulkan };
  }

  // Re-resolve GPU options and reload the server in place. Used after a GPU
  // pack download, delete, or failure-retry so the change takes effect without
  // an app restart. Callers that had to stop the server before touching pack
  // files pass the model they captured first; no-op when none was loaded.
  async restartServerWithGpuPreference(modelName = this.currentServerModel) {
    if (!modelName || this.serverManager.isRemote) return { success: true, restarted: false };

    return this._getRequestQueue().run(async () => {
      const options = { ...this.serverManager.lastStartOptions, ...this.resolveGpuStartOptions() };
      await this._stopServerUnlocked();
      const result = await this._startServerUnlocked(modelName, options);
      return { ...result, restarted: true };
    });
  }

  getModelsDir() {
    return getModelsDirForService("whisper");
  }

  validateModelName(modelName) {
    // Only allow known model names to prevent path traversal attacks
    const validModels = getValidModelNames();
    if (!validModels.includes(modelName)) {
      throw new Error(`Invalid model name: ${modelName}. Valid models: ${validModels.join(", ")}`);
    }
    return true;
  }

  getModelPath(modelName) {
    this.validateModelName(modelName);
    const config = getWhisperModelConfig(modelName);
    return path.join(this.getModelsDir(), config.fileName);
  }

  getVadModelPath() {
    if (this.cachedVadModelPath !== undefined) return this.cachedVadModelPath;

    const fileName = "ggml-silero-v5.1.2.bin";
    const candidates = [];

    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, "bin", "whisper-vad", fileName));
    }
    candidates.push(path.join(__dirname, "..", "..", "resources", "bin", "whisper-vad", fileName));

    const resolved = candidates.find((p) => fs.existsSync(p)) || null;
    this.cachedVadModelPath = resolved;
    return resolved;
  }

  async initializeAtStartup(settings = {}) {
    const startTime = Date.now();

    try {
      this.isInitialized = true;

      await cleanupStaleDownloads(this.getModelsDir());

      // Pre-warm whisper-server if local mode enabled (eliminates 2-5s cold-start delay)
      const { localTranscriptionProvider, whisperModel } = settings;
      const { useCuda, useVulkan } = this.resolveGpuStartOptions();

      if (
        localTranscriptionProvider === "whisper" &&
        whisperModel &&
        this.serverManager.isAvailable()
      ) {
        const modelPath = this.getModelPath(whisperModel);

        if (fs.existsSync(modelPath)) {
          debugLogger.info("Pre-warming whisper-server", {
            model: whisperModel,
            modelPath,
            cuda: useCuda,
            vulkan: useVulkan,
          });

          try {
            const serverStartTime = Date.now();
            const warmed = await this.startServer(whisperModel, { useCuda, useVulkan });
            if (!warmed.success) throw new Error(warmed.reason);

            debugLogger.info("whisper-server pre-warmed successfully", {
              model: whisperModel,
              startupTimeMs: Date.now() - serverStartTime,
              port: this.serverManager.port,
            });
          } catch (err) {
            debugLogger.warn("Server pre-warm failed (will start on first use)", {
              error: err.message,
              model: whisperModel,
            });
            // Non-fatal: server will start on first transcription
          }
        } else {
          debugLogger.debug("Skipping server pre-warm: model not downloaded", {
            model: whisperModel,
            modelPath,
          });
        }
      } else {
        debugLogger.debug("Skipping server pre-warm", {
          reason:
            localTranscriptionProvider !== "whisper"
              ? "provider not whisper"
              : !whisperModel
                ? "no model selected"
                : "server binary not available",
        });
      }
    } catch (error) {
      debugLogger.warn("Whisper initialization error", {
        error: error.message,
      });
      this.isInitialized = true; // Mark initialized even on error
    }

    debugLogger.info("Whisper initialization complete", {
      totalTimeMs: Date.now() - startTime,
      serverRunning: this.serverManager.ready,
    });

    // Log dependency status for debugging
    await this.logDependencyStatus();
  }

  async logDependencyStatus() {
    const status = {
      whisperServer: {
        available: this.serverManager.isAvailable(),
        path: this.serverManager.getServerBinaryPath(),
      },
      ffmpeg: {
        available: false,
        path: null,
      },
      models: [],
    };

    // Check FFmpeg
    try {
      const ffmpegPath = await this.getFFmpegPath();
      status.ffmpeg.available = !!ffmpegPath;
      status.ffmpeg.path = ffmpegPath;
    } catch {
      // FFmpeg not available
    }

    // Check downloaded models
    for (const modelName of getValidModelNames()) {
      const modelPath = this.getModelPath(modelName);
      if (fs.existsSync(modelPath)) {
        try {
          const stats = fs.statSync(modelPath);
          status.models.push({
            name: modelName,
            size: `${Math.round(stats.size / (1024 * 1024))}MB`,
          });
        } catch {
          // Skip if can't stat
        }
      }
    }

    debugLogger.info("OpenWhispr dependency check", status);

    // Log a summary for easy scanning
    const serverStatus = status.whisperServer.available
      ? `✓ ${status.whisperServer.path}`
      : "✗ Not found";
    const ffmpegStatus = status.ffmpeg.available ? `✓ ${status.ffmpeg.path}` : "✗ Not found";
    const modelsStatus =
      status.models.length > 0
        ? status.models.map((m) => `${m.name} (${m.size})`).join(", ")
        : "None downloaded";

    debugLogger.info(`[Dependencies] whisper-server: ${serverStatus}`);
    debugLogger.info(`[Dependencies] FFmpeg: ${ffmpegStatus}`);
    debugLogger.info(`[Dependencies] Models: ${modelsStatus}`);
  }

  async startServer(modelName, options = {}) {
    return this._getRequestQueue().run(() => this._startServerUnlocked(modelName, options), { priority: "background" });
  }

  async _startServerUnlocked(modelName, options = {}) {
    if (!this.serverManager.isAvailable()) {
      return { success: false, reason: "whisper-server binary not found" };
    }

    const modelPath = this.getModelPath(modelName);
    if (!fs.existsSync(modelPath)) {
      return { success: false, reason: `Model "${modelName}" not downloaded` };
    }

    try {
      await this._verifyNbModel(modelName);
      await this.serverManager.start(modelPath, options);
      this.currentServerModel = modelName;
      debugLogger.info("whisper-server started", {
        model: modelName,
        port: this.serverManager.port,
      });
      return { success: true, port: this.serverManager.port };
    } catch (error) {
      debugLogger.error("Failed to start whisper-server", { error: error.message });
      return { success: false, reason: error.message };
    }
  }

  async stopServer() {
    return this._getRequestQueue().run(() => this._stopServerUnlocked());
  }

  async _stopServerUnlocked() {
    await this.serverManager.stop();
    this.currentServerModel = null;
  }

  async onWakeFromSleep() {
    const sm = this.serverManager;
    const modelName = this.currentServerModel;
    if (
      !shouldRewarmOnWake({
        isRemote: sm.isRemote,
        useCuda: sm.useCuda,
        useVulkan: sm.useVulkan,
        modelName,
        transcribing: this._transcribing,
        rewarmInFlight: this._rewarmInFlight,
      })
    ) {
      return false;
    }

    // Replay the last start options (VAD, threads) so the reloaded server
    // matches the signature the next dictation will use; a bare start would
    // otherwise be rejected by start()'s no-op guard and reload the model on
    // the first dictation. See #766. GPU flags are re-resolved so a backend
    // that failed since is not re-attempted.
    const options = { ...sm.lastStartOptions, ...this.resolveGpuStartOptions() };
    this._rewarmInFlight = true;
    try {
      debugLogger.info("Re-warming whisper-server after wake from sleep", { model: modelName });
      await this.stopServer();
      const result = await this.startServer(modelName, options);
      if (!result?.success) {
        debugLogger.warn("whisper-server wake re-warm failed", { reason: result?.reason });
        return false;
      }
      return true;
    } finally {
      this._rewarmInFlight = false;
    }
  }

  getServerStatus() {
    return this.serverManager.getStatus();
  }

  async checkWhisperInstallation() {
    const serverPath = this.serverManager.getServerBinaryPath();
    if (!serverPath) {
      return { installed: false, working: false };
    }

    return {
      installed: true,
      working: this.serverManager.isAvailable(),
      path: serverPath,
    };
  }

  nbPrecomputeIdentity(options = {}) {
    const model = this.getModelPath(options.model || "nb-large-full");
    const stat = fs.statSync(model);
    return {
      model, modelSize: stat.size, modelMtime: stat.mtimeMs,
      requestModel: options.model || "nb-large-full",
      language: options.language || "auto",
      decoder: {
        initialPrompt: options.initialPrompt || null,
        fields: options.skipDecoderThresholds === true ? {} : require("./whisperServer").INFERENCE_DECODER_FIELDS,
        skipDecoderThresholds: options.skipDecoderThresholds === true,
        vadEnabled: options.vadEnabled === true,
        vadModel: options.vadEnabled === true ? this.getVadModelPath() || null : null,
        vadConfig: options.vadConfig || null,
        gpu: this.resolveGpuStartOptions(),
        acceleration: process.env.NB_ACCELERATION || "auto",
        nbRecovery: "non-silent-nocaptions-suppress-nst-v1",
      },
    };
  }

  async _verifyNbModel(modelName, signal) {
    const pinned = getWhisperModelConfig(modelName);
    if (pinned?.sha256) await require("./nbWhisperDownload").verifyModel(this.getModelPath(modelName), pinned, signal);
  }

  async transcribeLocalWhisper(audioBlob, options = {}) {
    debugLogger.logWhisperPipeline("transcribeLocalWhisper - start", {
      options,
      audioBlobType: audioBlob?.constructor?.name,
      audioBlobSize: audioBlob?.byteLength || audioBlob?.size || 0,
      serverAvailable: this.serverManager.isAvailable(),
      serverReady: this.serverManager.ready,
    });

    // Server mode required
    if (!this.serverManager.isAvailable()) {
      throw new Error(
        "whisper-server binary not found. Please ensure the app is installed correctly."
      );
    }

    const model = options.model || "nb-large-full";
    const language = options.language || null;
    const initialPrompt = options.initialPrompt || null;
    const vadEnabled = options.vadEnabled === true;
    const vadConfig = options.vadConfig || null;
    const modelPath = this.getModelPath(model);

    if (!fs.existsSync(modelPath)) {
      throw new Error(`Whisper model "${model}" not downloaded. Please download it from Settings.`);
    }

    await this._verifyNbModel(model, options.signal);

    return await this.transcribeViaServer(audioBlob, model, language, initialPrompt, {
      vadEnabled,
      vadConfig,
      signal: options.signal,
      skipDecoderThresholds: options.skipDecoderThresholds === true,
      priority: options.priority === "background" ? "background" : "interactive",
      nbNormalized: options.nbNormalized === true,
      nbCacheLookup: options.nbCacheLookup,
      nbIdentity: options.nbCacheLookup ? this.nbPrecomputeIdentity(options) : null,
    });
  }

  async transcribeViaServer(audioBlob, model, language, initialPrompt = null, options = {}) {
    // Mark the server busy so a wake re-warm doesn't kill an in-flight dictation. See #766.
    this._transcribingCount = (this._transcribingCount || 0) + 1;
    this._transcribing = true;
    try {
      return await this._runServerTranscription(audioBlob, model, language, initialPrompt, options);
    } finally {
      this._transcribingCount--;
      this._transcribing = this._transcribingCount > 0;
    }
  }

  async _runServerTranscription(audioBlob, model, language, initialPrompt = null, options = {}) {
    // An already-cancelled upload skips the server boot entirely.
    if (options.signal?.aborted) {
      throw createAbortError("whisper-server transcription cancelled");
    }

    // Convert audioBlob to Buffer if needed
    let audioBuffer;
    if (Buffer.isBuffer(audioBlob)) {
      audioBuffer = audioBlob;
    } else if (ArrayBuffer.isView(audioBlob)) {
      audioBuffer = Buffer.from(audioBlob.buffer, audioBlob.byteOffset, audioBlob.byteLength);
    } else if (audioBlob instanceof ArrayBuffer) {
      audioBuffer = Buffer.from(audioBlob);
    } else if (typeof audioBlob === "string") {
      audioBuffer = Buffer.from(audioBlob, "base64");
    } else if (audioBlob && audioBlob.buffer && typeof audioBlob.byteLength === "number") {
      audioBuffer = Buffer.from(audioBlob.buffer, audioBlob.byteOffset || 0, audioBlob.byteLength);
    } else {
      throw new Error(`Unsupported audio data type: ${typeof audioBlob}`);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Audio buffer is empty - no audio data received");
    }

    // Normalize independently of model startup; FFmpeg never owns the engine.
    const wav = options.nbNormalized ? audioBuffer : await this.serverManager._convertToWav(audioBuffer);
    if (options.signal?.aborted) throw createAbortError("Whisper job cancelled");
    const chunks = ["nb-large", "nb-large-full"].includes(model)
      ? require("./nbAudioChunks").splitPcm16Wav(wav) : [wav];
    const results = [];
    for (const chunk of chunks) {
      results.push(await this._decodeQueuedWindow(chunk, model, language, initialPrompt, options));
    }
    return this.parseWhisperResult(chunks.length === 1 ? results[0] : {
      text: results.map(result => result.text || "").join(" "),
    });
  }

  _getRequestQueue() {
    return this._requestQueue || (this._requestQueue = new NbWhisperQueue());
  }

  async _decodeQueuedWindow(wav, model, language, initialPrompt, options = {}) {
    if (options.signal?.aborted) throw createAbortError("Whisper job cancelled");
    // MUST remain outside the lock: a matching background inference may itself
    // be waiting for that lock. No approximate/partial cache results are used.
    if (typeof options.nbCacheLookup === "function") {
      const cached = await options.nbCacheLookup(wav, options.nbIdentity);
      if (options.signal?.aborted) throw createAbortError("Whisper job cancelled");
      if (cached !== undefined) return cached;
    }
    return this._getRequestQueue().run(async () => {
      const modelPath = this.getModelPath(model);
      await this._verifyNbModel(model, options.signal);
      let stopping;
      const stopOwnedDecode=()=>{stopping ||= this.serverManager.stop();stopping.catch(()=>{});};
      if(options.nbStopOnAbort)options.signal?.addEventListener('abort',stopOwnedDecode,{once:true});
      try {
      if(options.signal?.aborted)throw createAbortError('Whisper import cancelled');
      await this.serverManager.start(modelPath, {
        ...this.resolveGpuStartOptions(),
        vadEnabled: options.vadEnabled === true,
        vadModelPath: options.vadEnabled === true ? this.getVadModelPath() : null,
        vadConfig: options.vadConfig || null,
      });
      this.currentServerModel = model;
      if (options.signal?.aborted) throw createAbortError("Whisper job cancelled");
      // Keep the engine lock until HTTP completion even on cancellation. Native
      // whisper.cpp keeps computing after a disconnected client; early unlock
      // would permit a model switch to kill another request's active decode.
      return await this.serverManager._transcribeNormalizedWav(wav, {
        language, initialPrompt, skipDecoderThresholds: options.skipDecoderThresholds, timestamps: options.timestamps === true,
      });
      } catch(error) {
        if(options.signal?.aborted)throw createAbortError('Whisper import cancelled');
        throw error;
      } finally {
        if(options.nbStopOnAbort)options.signal?.removeEventListener('abort',stopOwnedDecode);
        if(stopping)await stopping;
      }
    }, { priority: options.priority, signal: options.signal });
  }

  // Internal main-process API for bounded disk imports. The caller owns file
  // decoding, persistence/checkpoints and offsets. Silent windows are results,
  // not failed imports. Never expose this normalized-input shortcut over IPC.
  async transcribeNormalizedWhisperWindow(wav, options = {}) {
    const pcm = require("./nbAudioChunks").getPcm16WavData(wav);
    if (!pcm.length || pcm.length > 28 * 32000) throw new Error("Expected one PCM window of at most 28 seconds");
    const model = options.model || "nb-large-full";
    if (!["nb-large", "nb-large-full"].includes(model)) throw new Error("NB Large model required");
    return this._decodeQueuedWindow(wav, model, options.language || null, options.initialPrompt || null,
      { ...options, nbStopOnAbort:true, priority: options.priority || "background", nbCacheLookup: undefined });
  }

  async transcribeViaLan(audioBlob, url, options = {}) {
    // Legacy remote mode is not exposed by the Mac UI, but must not change the
    // shared manager into remote mode while a local window is still decoding.
    return this._getRequestQueue().run(() => this._transcribeViaLanUnlocked(audioBlob, url, options),
      { priority: options.priority, signal: options.signal });
  }

  async _transcribeViaLanUnlocked(audioBlob, url, options = {}) {
    debugLogger.info("Transcription mode: LAN", { url, language: options.language || "auto" });

    await this.serverManager.connectRemote(url);

    let audioBuffer;
    if (Buffer.isBuffer(audioBlob)) {
      audioBuffer = audioBlob;
    } else if (ArrayBuffer.isView(audioBlob)) {
      audioBuffer = Buffer.from(audioBlob.buffer, audioBlob.byteOffset, audioBlob.byteLength);
    } else if (audioBlob instanceof ArrayBuffer) {
      audioBuffer = Buffer.from(audioBlob);
    } else if (typeof audioBlob === "string") {
      audioBuffer = Buffer.from(audioBlob, "base64");
    } else if (audioBlob && audioBlob.buffer && typeof audioBlob.byteLength === "number") {
      audioBuffer = Buffer.from(audioBlob.buffer, audioBlob.byteOffset || 0, audioBlob.byteLength);
    } else {
      throw new Error(`Unsupported audio data type: ${typeof audioBlob}`);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Audio buffer is empty - no audio data received");
    }

    debugLogger.logWhisperPipeline("transcribeViaLan - sending to server", {
      bufferSize: audioBuffer.length,
      url,
      language: options.language,
    });

    const startTime = Date.now();
    const result = await this.serverManager.transcribe(audioBuffer, {
      language: options.language || null,
      initialPrompt: options.initialPrompt || null,
    });
    const elapsed = Date.now() - startTime;

    debugLogger.logWhisperPipeline("transcribeViaLan - completed", {
      elapsed,
      resultKeys: Object.keys(result),
    });

    return this.parseWhisperResult(result);
  }

  // Normalize whitespace: replace newlines with spaces and collapse multiple spaces
  // whisper.cpp returns text with \n between audio segments which causes formatting issues
  normalizeWhitespace(text) {
    return text.replace(/<\|[^|]*\|>/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }

  parseWhisperResult(output) {
    // Handle both string (from CLI) and object (from server) inputs
    let result;
    if (typeof output === "string") {
      debugLogger.logWhisperPipeline("Parsing result (string)", { length: output.length });
      try {
        result = JSON.parse(output);
      } catch (parseError) {
        // Try parsing as plain text (non-JSON output)
        const text = this.normalizeWhitespace(output);
        if (text && !this.isBlankAudioMarker(text)) {
          return { success: true, text };
        }
        throw new Error(`Failed to parse Whisper output: ${parseError.message}`);
      }
    } else if (typeof output === "object" && output !== null) {
      debugLogger.logWhisperPipeline("Parsing result (object)", { keys: Object.keys(output) });
      result = output;
    } else {
      throw new Error(`Unexpected Whisper output type: ${typeof output}`);
    }

    // Handle whisper.cpp JSON format (CLI mode)
    if (result.transcription && Array.isArray(result.transcription)) {
      const text = this.normalizeWhitespace(result.transcription.map((seg) => seg.text).join(""));
      if (!text || this.isBlankAudioMarker(text)) {
        return { success: false, message: "No audio detected" };
      }
      return { success: true, text };
    }

    // Handle whisper-server format (has "text" field directly)
    if (result.text !== undefined) {
      const text = typeof result.text === "string" ? this.normalizeWhitespace(result.text) : "";
      if (!text || this.isBlankAudioMarker(text)) {
        return { success: false, message: "No audio detected" };
      }
      return { success: true, text };
    }

    // A response with neither shape is a broken backend, not silence. Reporting it
    // as "No audio detected" sends users chasing their microphone when the engine
    // is at fault, so surface it as the transcription failure it is.
    const serverError = typeof result.error === "string" && result.error.trim();
    return {
      success: false,
      error: "invalid_response",
      message: serverError
        ? `Transcription engine error: ${serverError}`
        : "Transcription engine returned an unexpected response",
    };
  }

  // Check if text is a whisper.cpp blank audio marker
  isBlankAudioMarker(text) {
    // whisper.cpp outputs "[BLANK_AUDIO]" when there's silence or insufficient audio
    const normalized = text.trim().toLowerCase();
    return normalized === "[blank_audio]" || normalized === "[ blank_audio ]";
  }

  async downloadWhisperModel(modelName, progressCallback = null) {
    this.validateModelName(modelName);
    const modelConfig = getWhisperModelConfig(modelName);

    const modelPath = this.getModelPath(modelName);
    const modelsDir = this.getModelsDir();

    if (fs.existsSync(modelPath)) {
      try {
      const stats = modelConfig.sha256 ? await require("./nbWhisperDownload").verifyModel(modelPath, modelConfig) : await fsPromises.stat(modelPath);
      return {
        model: modelName,
        downloaded: true,
        path: modelPath,
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024)),
        success: true,
      };
      } catch (error) {
        if (!modelConfig.sha256 || error.code !== "DOWNLOAD_CORRUPTED") throw error;
        // Explicit download request repairs only after verified replacement.
      }
    }

    if (this.currentDownloadProcess) {
      throw createDownloadInProgressError(modelName, this.currentDownloadProcess.model);
    }

    const { signal, abort } = createDownloadSignal();
    const downloadProcess = {
      abort,
      model: modelName,
      phase: "progress",
      percentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    };
    this.currentDownloadProcess = downloadProcess;

    try {
      await fsPromises.mkdir(modelsDir, { recursive: true });

      const spaceCheck = await checkDiskSpace(modelsDir, modelConfig.size * 1.2);
      if (!spaceCheck.ok) {
        throw new Error(
          `Not enough disk space to download model. Need ~${Math.round((modelConfig.size * 1.2) / 1_000_000)}MB, ` +
            `only ${Math.round(spaceCheck.availableBytes / 1_000_000)}MB available.`
        );
      }

      const transfer = modelConfig.sha256
        ? (_url, destination, transferOptions) => require("./nbWhisperDownload").downloadVerifiedModel(modelConfig, destination, {
            ...transferOptions, download: downloadFile,
            onVerifying: () => { downloadProcess.phase = "verifying"; progressCallback?.({ type: "verifying", model: modelName, percentage: 100 }); },
          }) : downloadFile;
      await transfer(modelConfig.url, modelPath, {
        timeout: 600000,
        signal,
        expectedSize: modelConfig.size,
        onProgress: (downloadedBytes, totalBytes) => {
          downloadProcess.percentage =
            totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          downloadProcess.downloadedBytes = downloadedBytes;
          downloadProcess.totalBytes = totalBytes;
          if (progressCallback) {
            progressCallback({
              type: "progress",
              model: modelName,
              downloaded_bytes: downloadedBytes,
              total_bytes: totalBytes,
              percentage: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
            });
          }
        },
      });

      await validateFileSize(modelPath, modelConfig.size);

      const stats = await fsPromises.stat(modelPath);

      if (progressCallback) {
        progressCallback({ type: "complete", model: modelName, percentage: 100 });
      }

      return {
        model: modelName,
        downloaded: true,
        path: modelPath,
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024)),
        success: true,
      };
    } catch (error) {
      if (error.isAbort) {
        throw Object.assign(new Error("Download interrupted by user"), {
          code: "DOWNLOAD_CANCELLED",
        });
      }
      throw error;
    } finally {
      if (this.currentDownloadProcess === downloadProcess) {
        this.currentDownloadProcess = null;
      }
    }
  }

  async cancelDownload() {
    if (this.currentDownloadProcess) {
      this.currentDownloadProcess.abort();
      return { success: true, message: "Download cancelled" };
    }
    return { success: false, error: "No active download to cancel" };
  }

  async checkModelStatus(modelName) {
    const modelPath = this.getModelPath(modelName);
    const activeDownload = this.currentDownloadProcess?.model === modelName;
    const downloadStatus = {
      isDownloading: activeDownload,
      isInstalling: false,
      downloadProgress: activeDownload ? this.currentDownloadProcess.percentage : 0,
      downloadedBytes: activeDownload ? this.currentDownloadProcess.downloadedBytes : 0,
      totalBytes: activeDownload ? this.currentDownloadProcess.totalBytes : 0,
    };

    if (fs.existsSync(modelPath)) {
      const stats = await fsPromises.stat(modelPath);
      const config = getWhisperModelConfig(modelName);
      if (config?.sha256) {
        try { await require("./nbWhisperDownload").verifyModel(modelPath, config); }
        catch { return { model: modelName, downloaded: false, success: true, verificationError: "DOWNLOAD_CORRUPTED", ...downloadStatus }; }
      }
      return {
        model: modelName,
        downloaded: true,
        path: modelPath,
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / (1024 * 1024)),
        success: true,
        ...downloadStatus,
      };
    }

    return { model: modelName, downloaded: false, success: true, ...downloadStatus };
  }

  async listWhisperModels() {
    const models = getValidModelNames();
    const modelInfo = [];

    for (const model of models) {
      const status = await this.checkModelStatus(model);
      modelInfo.push(status);
    }

    return {
      models: modelInfo,
      cache_dir: this.getModelsDir(),
      success: true,
    };
  }

  async deleteWhisperModel(modelName) {
    const modelPath = this.getModelPath(modelName);

    if (fs.existsSync(modelPath)) {
      const stats = await fsPromises.stat(modelPath);
      await fsPromises.unlink(modelPath);
      return {
        model: modelName,
        deleted: true,
        freed_bytes: stats.size,
        freed_mb: Math.round(stats.size / (1024 * 1024)),
        success: true,
      };
    }

    return { model: modelName, deleted: false, error: "Model not found", success: false };
  }

  async deleteAllWhisperModels() {
    const modelsDir = this.getModelsDir();
    let totalFreed = 0;
    let deletedCount = 0;

    try {
      if (!fs.existsSync(modelsDir)) {
        return { success: true, deleted_count: 0, freed_bytes: 0, freed_mb: 0 };
      }

      const files = await fsPromises.readdir(modelsDir);
      for (const file of files) {
        if (file.endsWith(".bin")) {
          const filePath = path.join(modelsDir, file);
          try {
            const stats = await fsPromises.stat(filePath);
            await fsPromises.unlink(filePath);
            totalFreed += stats.size;
            deletedCount++;
          } catch {
            // Continue with other files if one fails
          }
        }
      }

      return {
        success: true,
        deleted_count: deletedCount,
        freed_bytes: totalFreed,
        freed_mb: Math.round(totalFreed / (1024 * 1024)),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // FFmpeg methods (still needed for audio format conversion)
  async getFFmpegPath() {
    if (this.cachedFFmpegPath) {
      return this.cachedFFmpegPath;
    }

    let ffmpegPath;

    try {
      ffmpegPath = require("ffmpeg-static");
      ffmpegPath = path.normalize(ffmpegPath);

      if (process.platform === "win32" && !ffmpegPath.endsWith(".exe")) {
        ffmpegPath += ".exe";
      }

      debugLogger.debug("FFmpeg static path from module", { ffmpegPath });

      // Try unpacked ASAR path first (production builds unpack ffmpeg-static)
      // Handle both forward slashes and backslashes for cross-platform compatibility
      const unpackedPath = ffmpegPath.includes("app.asar")
        ? ffmpegPath.replace(/app\.asar([/\\])/, "app.asar.unpacked$1")
        : null;

      if (unpackedPath) {
        debugLogger.debug("Checking unpacked ASAR path", { unpackedPath });
        if (fs.existsSync(unpackedPath)) {
          if (process.platform !== "win32") {
            try {
              fs.accessSync(unpackedPath, fs.constants.X_OK);
            } catch {
              debugLogger.debug("FFmpeg not executable, attempting chmod", { unpackedPath });
              try {
                fs.chmodSync(unpackedPath, 0o755);
              } catch (chmodErr) {
                debugLogger.warn("Failed to chmod FFmpeg", { error: chmodErr.message });
              }
            }
          }
          debugLogger.debug("Found FFmpeg in unpacked ASAR", { path: unpackedPath });
          this.cachedFFmpegPath = unpackedPath;
          return unpackedPath;
        } else {
          debugLogger.warn("Unpacked ASAR path does not exist", { unpackedPath });
        }
      }

      // Try original path (development or if not in ASAR)
      if (fs.existsSync(ffmpegPath)) {
        if (process.platform !== "win32") {
          fs.accessSync(ffmpegPath, fs.constants.X_OK);
        }
        debugLogger.debug("Found FFmpeg at bundled path", { path: ffmpegPath });
        this.cachedFFmpegPath = ffmpegPath;
        return ffmpegPath;
      } else {
        debugLogger.warn("Bundled FFmpeg path does not exist", { ffmpegPath });
      }
    } catch (err) {
      debugLogger.warn("Bundled FFmpeg not available", { error: err.message });
    }

    // Try system FFmpeg paths
    const systemCandidates =
      process.platform === "darwin"
        ? ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]
        : process.platform === "win32"
          ? ["C:\\ffmpeg\\bin\\ffmpeg.exe"]
          : ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"];

    debugLogger.debug("Trying system FFmpeg candidates", { candidates: systemCandidates });

    for (const candidate of systemCandidates) {
      if (fs.existsSync(candidate)) {
        debugLogger.debug("Found system FFmpeg", { path: candidate });
        this.cachedFFmpegPath = candidate;
        return candidate;
      }
    }

    debugLogger.error("FFmpeg not found anywhere");
    return null;
  }

  async checkFFmpegAvailability() {
    const now = Date.now();
    if (
      this.ffmpegAvailabilityCache.result !== null &&
      now < this.ffmpegAvailabilityCache.expiresAt
    ) {
      return this.ffmpegAvailabilityCache.result;
    }

    const ffmpegPath = await this.getFFmpegPath();
    const result = ffmpegPath
      ? { available: true, path: ffmpegPath }
      : { available: false, error: "FFmpeg not found" };

    this.ffmpegAvailabilityCache = { result, expiresAt: now + CACHE_TTL_MS };
    return result;
  }

  async getDiagnostics() {
    const diagnostics = {
      platform: process.platform,
      arch: process.arch,
      resourcesPath: process.resourcesPath || null,
      isPackaged: !!process.resourcesPath && !process.resourcesPath.includes("node_modules"),
      ffmpeg: { available: false, path: null, error: null },
      whisperServer: { available: false, path: null },
      modelsDir: this.getModelsDir(),
      models: [],
    };

    // Check FFmpeg
    try {
      this.cachedFFmpegPath = null; // Clear cache for fresh check
      const ffmpegPath = await this.getFFmpegPath();
      if (ffmpegPath) {
        diagnostics.ffmpeg = { available: true, path: ffmpegPath, error: null };
      } else {
        diagnostics.ffmpeg = { available: false, path: null, error: "Not found" };
      }
    } catch (err) {
      diagnostics.ffmpeg = { available: false, path: null, error: err.message };
    }

    // Check whisper server
    if (this.serverManager) {
      const serverPath = this.serverManager.getServerBinaryPath?.();
      diagnostics.whisperServer = {
        available: this.serverManager.isAvailable(),
        path: serverPath || null,
      };
    }

    // Check downloaded models
    try {
      const modelsDir = this.getModelsDir();
      if (fs.existsSync(modelsDir)) {
        const files = fs.readdirSync(modelsDir);
        diagnostics.models = files
          .filter((f) => f.startsWith("ggml-") && f.endsWith(".bin"))
          .map((f) => f.replace("ggml-", "").replace(".bin", ""));
      }
    } catch {
      // Ignore errors reading models dir
    }

    return diagnostics;
  }
}

module.exports = WhisperManager;
module.exports.shouldRewarmOnWake = shouldRewarmOnWake;
module.exports.resolveFailedGpuBackends = resolveFailedGpuBackends;
