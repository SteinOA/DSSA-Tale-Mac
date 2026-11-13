"""Local Mac Community-1 worker. Adapted from SteinOA Windows PR 1 (MIT)."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import time
import wave

os.environ["PYANNOTE_METRICS_ENABLED"] = "0"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["HF_HUB_DISABLE_IMPLICIT_TOKEN"] = "1"
REPO = "pyannote/speaker-diarization-community-1"
REVISION = "3533c8cf8e369892e6b79ff1bf80f7b0286a54ee"
FILES = ("config.yaml", "embedding/pytorch_model.bin", "segmentation/pytorch_model.bin",
         "plda/plda.npz", "plda/xvec_transform.npz")
EXPECTED_HASHES = {
    "config.yaml": "5ce2bfa9a938dc132cec1172592d65173cbb8f444ea1e4133f10f9391de155be",
    "embedding/pytorch_model.bin": "6f10ff60898a1d185fa22e1d11e0bfa8a92efec811f11bca48cb8cafebefd929",
    "segmentation/pytorch_model.bin": "7ad24338d844fb95985486eb1a464e32d229f6d7a03c9abe60f978bacf3f816e",
    "plda/plda.npz": "9b77bcd840692710dd3496f62ecfeed8d8e5f002fd991b785079b244eab7d255",
    "plda/xvec_transform.npz": "325f1ce8e48f7e55e9c8aa47e05d2766b7c48c4b25b8de8dd751e7a4cc5fbe8f",
}


def checksum(file):
    with file.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def diarize(request):
    os.environ["HF_HUB_OFFLINE"] = "1"
    started = time.perf_counter()
    model = Path(request["modelPath"]).resolve(strict=True)
    manifest = json.loads((model / "dssa-community-manifest.json").read_text(encoding="utf-8"))
    if manifest.get("repo") != REPO or manifest.get("revision") != REVISION or manifest.get("files") != EXPECTED_HASHES:
        raise ValueError("Unrecognized Community-1 model provenance")
    for name in FILES:
        if checksum(model / name) != manifest["files"][name]:
            raise ValueError("Community-1 model checksum mismatch")
    maximum = request.get("maxSpeakers", 15)
    if isinstance(maximum, bool) or not isinstance(maximum, int) or not 1 <= maximum <= 15:
        raise ValueError("Speaker cap must be between one and fifteen")
    device = request.get("device", "cpu")
    if device not in {"mps", "cpu"}:
        raise ValueError("Unsupported device")
    import numpy as np
    import torch
    from pyannote.audio import Pipeline
    torch.set_num_threads(4)
    if device == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS unavailable; choose CPU explicitly")
    # Use the already converted PCM audio directly; no online media or codecs.
    with wave.open(str(Path(request["audioPath"]).resolve(strict=True)), "rb") as stream:
        if (stream.getnchannels(), stream.getsampwidth(), stream.getframerate()) != (1, 2, 16000):
            raise ValueError("Expected mono 16 kHz PCM16 WAV")
        samples = np.frombuffer(stream.readframes(stream.getnframes()), dtype="<i2").astype(np.float32) / 32768
    pipeline = Pipeline.from_pretrained(str(model))
    # Bound transient VRAM while the user's Whisper model remains loaded.
    pipeline.segmentation_batch_size = 8
    pipeline.embedding_batch_size = 8
    pipeline.to(torch.device(device))
    loaded = time.perf_counter()
    output = pipeline({"waveform": torch.from_numpy(samples).unsqueeze(0), "sample_rate": 16000},
                      max_speakers=maximum, hook=progress_hook(len(samples) / 16000, started))
    if device == "mps":
        torch.mps.synchronize()
    labels = {}
    segments = []
    for turn, _, speaker in output.exclusive_speaker_diarization.itertracks(yield_label=True):
        labels.setdefault(speaker, f"speaker_{len(labels)}")
        segments.append({"start": turn.start, "end": turn.end, "speaker": labels[speaker]})
    return {"success": True, "engine": "pyannote-community-1", "device": device,
            "segments": segments, "overlaps": overlapping(output.speaker_diarization), "detectedSpeakerGroups": len(labels),
            "durationSeconds": len(samples) / 16000,
            "timings": {"loadSeconds": loaded - started,
                        "inferenceSeconds": time.perf_counter() - loaded,
                        "totalSeconds": time.perf_counter() - started},
            "mpsDriverBytesAfterInference": torch.mps.driver_allocated_memory() if device == "mps" else None,
            "peakRssBytes": __import__("resource").getrusage(__import__("resource").RUSAGE_SELF).ru_maxrss}



def emit(value):
    print(json.dumps(value), flush=True)

def overlapping(annotation):
    turns = [(t.start, t.end, label) for t, _, label in annotation.itertracks(yield_label=True)]
    intervals = []
    for i, (start, end, label) in enumerate(turns):
        for other_start, other_end, other in turns[i+1:]:
            if other_start >= end:
                break
            if other != label and min(end, other_end) > max(start, other_start):
                intervals.append({"start": max(start, other_start), "end": min(end, other_end)})
    return intervals

def progress_hook(duration, started):
    last = [0.0]
    def hook(step_name, artifact, file=None, total=None, completed=None):
        now = time.perf_counter()
        if now - last[0] < 0.25 and completed != total:
            return
        last[0] = now
        fraction = max(0, min(1, completed / total)) if total and completed is not None else None
        emit({"type": "progress", "step": str(step_name), "fraction": fraction,
              "processedSeconds": fraction * duration if fraction is not None else None,
              "durationSeconds": duration, "elapsedSeconds": now - started})
    return hook

def download(request):
    from huggingface_hub import snapshot_download
    token = request.get("token")
    if not isinstance(token, str) or not token.startswith("hf_"):
        raise ValueError("A user-approved Hugging Face token is required")
    destination = Path(request["modelPath"])
    snapshot_download(REPO, revision=REVISION, token=token, local_dir=destination, allow_patterns=list(FILES))
    for name in FILES:
        if checksum(destination / name) != EXPECTED_HASHES[name]:
            raise ValueError("Publisher model checksum mismatch")
    (destination / "dssa-community-manifest.json").write_text(json.dumps({"repo": REPO, "revision": REVISION, "files": EXPECTED_HASHES}))
    return {"success": True, "revision": REVISION}

def probe():
    import torch
    from pyannote.audio import Pipeline
    return {"success": True, "torch": torch.__version__, "mpsAvailable": torch.backends.mps.is_available(),
            "mpsBuilt": torch.backends.mps.is_built(), "cpu": True, "pipelineImported": Pipeline is not None}

if __name__ == "__main__":
    import sys
    # No token in argv, request files, stderr, logs or result metadata.
    try:
        request = json.loads(sys.stdin.read())
        action = request.get("action", "diarize")
        result = download(request) if action == "download" else probe() if action == "probe" else diarize(request)
        if request.get("resultPath"):
            target = Path(request["resultPath"])
            temp = target.with_suffix(".tmp")
            temp.write_text(json.dumps(result))
            temp.chmod(0o600)
            temp.replace(target)
        else:
            emit({"type": "result", "result": result})
    except Exception as error:
        # Error classes only: upstream exceptions may include credentials/paths.
        emit({"type": "error", "code": type(error).__name__})
        sys.exit(1)
