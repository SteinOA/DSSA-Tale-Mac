import { saveImportedConversation } from "./nbImportedConversation";
export type ImportPhase = "idle" | "reading" | "converting" | "cancelled" | "transcribing" | "diarizing" | "saving" | "complete" | "error";
export type ImportJobSnapshot = {
  id: number; phase: ImportPhase; fileName: string; startedAt: number; finishedAt: number | null;
  text: string; error: string; saved: Awaited<ReturnType<typeof saveImportedConversation>>;
  requestId: string; cancelRequested: boolean; completedChunks: number; totalChunks: number; completedSeconds: number; totalSeconds: number; resumedChunks: number;
  sourceAudio: { bytes?: ArrayBuffer; path?: string; name: string } | null;
};
export function importIsRunning(state: ImportJobSnapshot) {
  return ["reading", "converting", "transcribing", "diarizing", "saving"].includes(state.phase);
}
// Renderer-session owner, deliberately independent of React component lifetime.
// Navigation/unmount unsubscribes the view, never cancels the imported job.
// This does not survive closing the app and does not claim backend priority.
export function createNbImportJob() {
  let snapshot: ImportJobSnapshot = { id: 0, phase: "idle", fileName: "", startedAt: 0, finishedAt: null, text: "", error: "", saved: null, sourceAudio: null, requestId:"", cancelRequested:false, completedChunks:0,totalChunks:0,completedSeconds:0,totalSeconds:0,resumedChunks:0 };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<ImportJobSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const notify of listeners) notify();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async cancel(api: any) {
      if (!importIsRunning(snapshot) || !snapshot.requestId || snapshot.cancelRequested) return;
      update({cancelRequested:true});
      try { await api.nbCancelAudioImport(snapshot.requestId); }
      catch(error) {update({cancelRequested:false,error:String(error)});}
    },
    async start(file: Pick<File, "name" | "arrayBuffer">, options: { model: string; language: string; separateSpeakers: boolean; saveHistory?: boolean; getHistoryEnabled?: () => boolean }, api: any) {
      if (importIsRunning(snapshot)) return false;
      update({ id: snapshot.id + 1, phase: "reading", fileName: file.name, startedAt: Date.now(), finishedAt: null, text: "", error: "", saved: null, sourceAudio: null, requestId:"",cancelRequested:false,completedChunks:0,totalChunks:0,completedSeconds:0,totalSeconds:0,resumedChunks:0 });
      let unsubscribe: (()=>void) | undefined;
      try {
        // Production path never materializes the whole imported file in renderer memory.
        if (!options.separateSpeakers && api.nbImportAudioFile) {
          const filePath = api.getPathForFile(file);
          const requestId = `nb-import-${Date.now()}-${snapshot.id}`;
          update({requestId,sourceAudio:{path:filePath,name:file.name},phase:"converting"});
          unsubscribe=api.onNbAudioImportProgress?.((event:any,payload?:any)=>{
            const progress=payload ?? event;
            if(progress?.requestId !== requestId || snapshot.requestId !== requestId || !importIsRunning(snapshot))return;
            if(!["converting","transcribing","saving"].includes(progress.phase))return;
            const counters:Partial<ImportJobSnapshot>={};
            for(const key of ["completedChunks","totalChunks","completedSeconds","totalSeconds","resumedChunks"] as const){
              if(typeof progress[key] === "number" && Number.isFinite(progress[key]) && progress[key]>=0)counters[key]=progress[key];
            }
            update({...counters,phase:progress.phase});
          });
          const result=await api.nbImportAudioFile(filePath,{model:options.model,language:options.language,requestId});
          if(result?.cancelled){update({phase:"cancelled",finishedAt:Date.now()});return true;}
          if(!result?.success)throw new Error(result?.error || "Behandlingen av lydfilen mislyktes.");
          const text=typeof result.text === "string" ? result.text : "";
          update({text,phase:"saving"});
          const saved=(options.getHistoryEnabled?.() ?? options.saveHistory ?? true) ? await saveImportedConversation(api,file.name,text,result.segments) : null;
          update({saved,phase:"complete",finishedAt:Date.now()});
          return true;
        }
        // Compatibility path for old harnesses; diarization retains its existing API.
        const bytes = await file.arrayBuffer();
        update({ sourceAudio: { bytes, name: file.name }, phase: options.separateSpeakers ? "diarizing" : "transcribing" });
        let text = "";
        let parts: any[] | undefined;
        if (options.separateSpeakers) {
          const result = await api.diarizeAudioFile(api.getPathForFile(file), { nbTranscribe: true, model: options.model, language: options.language });
          if (!result?.success) throw new Error(result?.error || "Taleranalysen mislyktes.");
          parts = Array.isArray(result.segments) ? result.segments : [];
          const names = new Map<string, string>();
          text = parts!.filter(part => typeof part.text === "string" && part.text.trim()).map(part => {
            if (part.speaker && !names.has(part.speaker)) names.set(part.speaker, `Taler ${names.size + 1}`);
            const stamp = typeof part.start === "number" && Number.isFinite(part.start) && part.start >= 0
              ? `[${Math.floor(part.start / 60)}:${String(Math.floor(part.start % 60)).padStart(2, "0")}] ` : "";
            return stamp + (part.speaker ? names.get(part.speaker) + ": " : "") + part.text;
          }).join("\n\n");
          if (!text && typeof result.text === "string") text = result.text;
        } else {
          const result = await api.transcribeLocalWhisper(bytes, { model: options.model, language: options.language });
          if (!result?.success && result?.message !== "No audio detected" && result?.error !== "No audio detected") {
            throw new Error(result?.error || result?.message || "Talegjenkjenningen mislyktes.");
          }
          text = result.text || "";
        }
        update({ text, phase: "saving" });
        const saved = (options.getHistoryEnabled?.() ?? options.saveHistory ?? true) ? await saveImportedConversation(api, file.name, text, parts) : null;
        update({ saved, phase: "complete", finishedAt: Date.now() });
      } catch (error) {
        update({ phase: "error", error: error instanceof Error ? error.message : String(error), finishedAt: Date.now() });
      } finally { unsubscribe?.(); }
      return true;
    },
  };
}
export const nbImportJob = createNbImportJob();
