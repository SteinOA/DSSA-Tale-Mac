import { AudioLines, Keyboard, Mic, Palette, Settings2, Sparkles, ArrowRight } from "lucide-react";
import NBWhisperDownloads from "./NBWhisperDownloads";
import NBModelGuide from "./NBModelGuide";
import { NBCloudBrand } from "./NBCloudBrand";
import { nbImportRetentionSnapshot } from "../utils/nbImportRetentionSnapshot";
import { usePolicyStore } from "../stores/policyStore";
import { effectiveLocalHistoryEnabled, isPolicyActionAllowed } from "../stores/policyRules";
import { nbImportJob, importIsRunning } from "../utils/nbImportJob";
import nnPanel from "../locales/nn/nbPanel.json";
import { nbModelDownloadProgress } from "../utils/nbModelDownloadProgress";
import { saveImportedConversation } from "../utils/nbImportedConversation";
import React, { useEffect, useState, useSyncExternalStore, useRef } from "react";
import { HotkeyListInput } from "./ui/HotkeyListInput";
import ControlPanel from "./ControlPanel";
import { useMeetingRecordingStore, stopRecording as stopMeetingRecording } from "../stores/meetingRecordingStore";
import { useSettingsStore } from "../stores/settingsStore";
import { getAudioOutput, saveAudioOutput, testAudioOutput } from "../utils/nbAudioOutput";

export default function NBControlPanel() {
  const s = useSettingsStore();
  const meetingRecording = useMeetingRecordingStore(state=>state.isRecording);
  const meetingTranscribing = useMeetingRecordingStore(state=>state.isTranscribing);
  const api = (window as any).electronAPI;
  const importPolicy = usePolicyStore();
  const importRetention = nbImportRetentionSnapshot(importPolicy,s.dataRetentionEnabled,s.transcriptRetentionDays);
  useEffect(()=>{
    // Keep backend checkpoint policy current even while an import is running.
    void api.nbSetImportRetention?.(importRetention).catch(()=>{});
  },[api,importRetention.enabled,importRetention.synced,importRetention.retentionDays]);
  const [pasteStatus,setPasteStatus] = useState<any>(null);
  const refreshPasteStatus=async()=>{try{if(api.nbPasteStatus)setPasteStatus(await api.nbPasteStatus());}catch{setPasteStatus(null);}};
  const [includeTimestamps,setIncludeTimestamps] = useState(false);
  const [includeSpeakers,setIncludeSpeakers] = useState(false);
  const ui=(value:string)=>s.uiLanguage === "en" ? (NB_ENGLISH[value] || value) : s.uiLanguage === "nn" ? ((nnPanel as Record<string,string>)[value] || value) : value;
  const [memory,setMemory] = useState<any>(null);
  const [preferences,setPreferences] = useState<any>({});
  const [sourceAudio,setSourceAudio] = useState<{bytes?:ArrayBuffer,path?:string,name:string}|null>(null);
  const [limit,setLimit] = useState(()=>localStorage.getItem("nbDictationMinutes") || "10");
  const [profile,setProfile] = useState<any>(null);
  const [accent,setAccent] = useState(()=>localStorage.getItem("nbAccent") || "#2563eb");
  const [acceleration,setAcceleration] = useState("auto");
  const [speakerEngine,setSpeakerEngine]=useState(()=>localStorage.getItem("nbSpeakerEngine") || "community-1");
  const [communityStatus,setCommunityStatus]=useState<any>(null);
  const [communityToken,setCommunityToken]=useState("");
  const [communityTerms,setCommunityTerms]=useState(false);
  const [channelMode,setChannelMode]=useState("inspect");
  const [wordAlignment,setWordAlignment]=useState(()=>localStorage.getItem("nbWordAlignment") || "native");
  const [communityDevice,setCommunityDevice]=useState("cpu");
  const [textLanguage,setTextLanguage]=useState<string | null>(null);
  useEffect(()=>{void api.nbCommunityStatus?.().then((status:any)=>{setCommunityStatus(status);setCommunityDevice(status?.device || "cpu");}).catch(()=>{});},[api]);
  const [separateSpeakers, setSeparateSpeakers] = useState(false);
  const [advanced, setAdvanced] = useState(true);
  const [panelFocus,setPanelFocus] = useState("settings");
  const openNBPanel=(section="settings")=>{setPanelFocus(["settings","files","assistant","speech","shortcuts","recording","appearance","system"].includes(section) ? section : "settings");setAdvanced(false);};
  const [systemVersion,setSystemVersion] = useState("");
  const [debugState,setDebugState] = useState<{enabled:boolean;logPath?:string;logLevel?:string}|null>(null);
  const [systemBusy,setSystemBusy] = useState(false);
  useEffect(()=>{
    if(panelFocus!=="system" || advanced)return;
    let active=true;
    void Promise.all([api.getAppVersion(),api.getDebugState()]).then(([version,debug])=>{
      if(active){setSystemVersion(version.version || "");setDebugState(debug);}
    }).catch(()=>{if(active)setMessage("Kunne ikke hente systeminformasjon. Prøv igjen.");});
    return()=>{active=false;};
  },[panelFocus,advanced,api]);
  const [models, setModels] = useState<any[]>([]);
  const [downloadStatus,setDownloadStatus] = useState<any>(null);
  const refreshModels = async () => {
    const available=(await api.modelGetAll()).filter((m:any)=>["qwen2.5-1.5b-instruct-q5_k_m","qwen3.5-2b-q4_k_m","qwen3.5-4b-q4_k_m","qwen3-8b-q4_k_m"].includes(m.id));
    setModels(available);
    const active=available.find((m:any)=>m.isDownloading);
    if(active)setDownloadStatus({modelId:active.id,progress:active.downloadProgress,downloadedSize:active.downloadedSize,totalSize:active.totalSize});
  };
  const selectedModel=models.find(m=>m.id===s.cleanupModel);
  const downloadError=(result:any)=>{
    const messages:Record<string,string>={DOWNLOAD_IN_PROGRESS:"En modell lastes allerede ned. Vent til den er ferdig.",INSUFFICIENT_DISK_SPACE:"Ikke nok ledig lagringsplass. Frigjør plass og prøv igjen.",DOWNLOAD_CANCELLED:"Nedlastingen ble avbrutt. Du kan prøve igjen.",MODEL_NOT_FOUND:"Velg en språkmodell fra listen først.",NETWORK_ERROR:"Nedlastingen mislyktes. Kontroller internettforbindelsen og prøv igjen.",DOWNLOAD_FAILED:"Modellserveren svarte med en feil. Prøv igjen senere.",DOWNLOAD_CORRUPTED:"Modellfilen er ufullstendig eller skadet. Last den ned på nytt."};
    return ui(messages[result.code] || "Nedlastingen mislyktes. Prøv igjen.")+(result.error ? " ("+result.error+")" : "");
  };
  const downloadSelectedModel=async()=>{
    if(!selectedModel || selectedModel.isDownloaded || downloadStatus)return;
    setBusy(true);setDownloadStatus({modelId:selectedModel.id,progress:0,downloadedSize:0,totalSize:selectedModel.sizeBytes});setMessage("");
    try{const result=await api.modelDownload(selectedModel.id);if(!result.success){setMessage(downloadError(result));return;}await refreshModels();setMessage("Språkmodellen er klar.");}
    catch(error){setMessage(downloadError({error:String(error)}));}
    finally{setBusy(false);setDownloadStatus(null);}
  };
  useEffect(()=>api.onModelDownloadProgress?.((ipcEvent:unknown,payload:unknown)=>{
    const event=nbModelDownloadProgress(ipcEvent,payload);
    if(!event)return;
    if(event.type==="complete"||event.type==="error"){
      setDownloadStatus((current:any)=>current?.modelId===event.modelId?null:current);
      void refreshModels();
      if(event.type==="error")setMessage(downloadError(event));
    }else setDownloadStatus(event);
  }),[s.uiLanguage]);
  const register = async (value:string, meeting=false) => {
    const result = await (meeting ? api.registerMeetingHotkey(value) : api.updateHotkey(value));
    if(!result?.success) {setMessage("Hurtigtasten kunne ikke registreres. Velg en annen kombinasjon.");return false;}
    if(meeting) s.setMeetingKey(value); else s.setDictationKey(value);
    return true;
  };
  const runAI = async (task:"cleanup"|"notes"|"assistant") => {
    if(!text.trim()) return;
    setBusy(true);setMessage("Arbeider med lokal språkmodell …");
    try {
      const instruction = task === "cleanup" ? "Rett tegnsetting og åpenbare skrivefeil. Bevar mening og alle fakta. Returner bare den rettede teksten." : task === "notes" ? "Formater teksten som et ryddig notat med overskrifter og punktliste. Ikke finn på fakta eller beslutninger." : "Svar på brukerens spørsmål. Du kan bare svare med tekst og har ikke tilgang til andre apper. Vær tydelig om usikkerhet.";
      const result=await api.processLocalReasoning(text,s.cleanupModel,null,{nbTask:task,language:textLanguage || s.preferredLanguage,temperature:0.2,systemPrompt:instruction+" Skriv på "+((textLanguage || s.preferredLanguage)==="nn"?"nynorsk.":"bokmål.")});
      if(result.integrity?.accepted === false){
        setMessage("Originalteksten er beholdt fordi modellen endret ord eller fakta.");
        return;
      }
      if(!result.success) throw new Error(result.error);
      setText(result.text);
      setMessage(task === "notes" ? "Referatutkast med kontrollerte kildesitater. Kontroller sammenhengen før bruk." : "Ferdig. Kontroller teksten før bruk.");
    }catch(e){setMessage(String(e));}finally{setBusy(false);}
  };
  const saveText = async (format="docx") => {
    try{const result=await api.nbSaveDocument(text,format,{includeTimestamps,includeSpeakers,language:textLanguage || s.preferredLanguage});if(result.success)setMessage("Dokumentet er lagret på valgt sted.");}catch(error){setMessage(String(error));}
  };
  useEffect(()=>{document.documentElement.style.setProperty("--nb-accent",accent);localStorage.setItem("nbAccent",accent);},[accent]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [output, setOutput] = useState(getAudioOutput);
  const refreshDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter(d=>d.kind === "audioinput"));
      if (api.nbAudioOutputs) {
        const nativeOutputs = await api.nbAudioOutputs();
        setOutputs(nativeOutputs.map((d:any)=>({deviceId:d.uid,label:d.label,kind:"audiooutput"})));
      } else setOutputs(all.filter(d=>d.kind === "audiooutput"));
    } catch { setMessage("Kunne ikke hente lydenheter. Prøv igjen."); }
  };
  const [message, setMessage] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    s.setUseLocalWhisper(true); s.setTranscriptionMode("local");
    s.setLocalTranscriptionProvider("whisper");
    s.setMeetingTranscriptionMode("local");s.setMeetingLocalTranscriptionProvider("whisper");
    s.setUploadTranscriptionMode("local");s.setUploadLocalTranscriptionProvider("whisper");
    s.setNoteFormattingMode("local");s.setChatAgentMode("local");
    if(!["nb-large","nb-large-full"].includes(s.whisperModel))s.setWhisperModel("nb-large-full");
    if(!["nb-large","nb-large-full"].includes(s.meetingWhisperModel))s.setMeetingWhisperModel("nb-large-full");
    if(!["nb-large","nb-large-full"].includes(s.uploadWhisperModel))s.setUploadWhisperModel("nb-large-full");
    s.setCleanupMode("local");
    if(!["no","nn"].includes(s.preferredLanguage))s.setPreferredLanguage("no");
    if(!localStorage.getItem("nbUiLanguageInitialized")){if(!localStorage.getItem("uiLanguage"))s.setUiLanguage("nb");localStorage.setItem("nbUiLanguageInitialized","true");}
    void refreshPasteStatus();
    void api.nbGetPreferences().then(setPreferences);
    const refreshMemory=()=>{void api.nbMemory().then(setMemory).catch(()=>setMemory(null));};refreshMemory();const memoryTimer=setInterval(refreshMemory,5000);
    void api.nbLocalProfile().then(setProfile);
    void api.nbGetAcceleration().then(setAcceleration);
    void refreshModels();
    const refresh = refreshDevices;
    void refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    const openNBSettings=()=>openNBPanel();window.addEventListener("nb-open-settings",openNBSettings);
    const meetingPending = api.onMeetingNoteNavigationPending?.(()=>setAdvanced(true));
    const onFocus = () => { void refresh(); void refreshPasteStatus(); };
    window.addEventListener("focus", onFocus);
    return () => {window.removeEventListener("nb-open-settings",openNBSettings);clearInterval(memoryTimer);meetingPending?.();navigator.mediaDevices.removeEventListener("devicechange", refresh);window.removeEventListener("focus", onFocus);};
  }, []);
  const importJob = useSyncExternalStore(nbImportJob.subscribe, nbImportJob.getSnapshot);
  const importing = importIsRunning(importJob);
  const displayedImportId = useRef(0);
  useEffect(() => {
    // A new job replaces the previous result once; progress and navigation must not clear edits.
    if (!importing || !importJob.id || displayedImportId.current === importJob.id) return;
    displayedImportId.current = importJob.id;
    setText("");
    setSourceAudio(null);
    setMessage("");
  }, [importJob.id, importing]);
  const importPhaseText: Record<string, string> = { converting: "Klargjør lydfilen …", cancelled: "Avbrutt. Velg samme lydfil for å fortsette.", reading: "Leser lydfilen …", transcribing: "Transkriberer lokalt …", diarizing: "Transkripsjon ferdig. Fordeler talere lokalt …", saving: "Lagrer samtalen …", complete: "Lydfilen er ferdig behandlet.", error: "Behandlingen av lydfilen mislyktes." };
  const [importClock,setImportClock] = useState(Date.now());
  useEffect(() => {
    if (!importing) return;
    const timer = setInterval(()=>setImportClock(Date.now()),1000);
    return ()=>clearInterval(timer);
  }, [importing]);
  const importElapsed = Math.max(0,Math.floor(((importJob.finishedAt ?? importClock) - importJob.startedAt) / 1000));
  useEffect(() => {
    if (importJob.id && ["complete", "error", "cancelled"].includes(importJob.phase)) {
      setTextLanguage(importJob.language || null);
      setText(importJob.text);
      setSourceAudio(importJob.sourceAudio);
      setMessage(importJob.phase === "error" ? importJob.error : !importJob.saved ? (importJob.text.trim() ? "Teksten er klar. Historikk er slått av; samtalen er ikke lagret." : "Ingen tale ble funnet.") : importJob.saved.complete
        ? ui("Samtalen er lagret under Notater:") + " «" + importJob.saved.title + "»"
        : "Teksten er lagret under Notater, men taler-/tidsdata kunne ikke lagres. Originalteksten er beholdt.");
    }
  }, [importJob.id, importJob.phase]);
  const transcribe = async (buffer: ArrayBuffer, importedFileName?: string) => {
    setBusy(true); setMessage("Transkriberer lokalt …");
    try {
      const result = await api.transcribeLocalWhisper(buffer, {model:s.whisperModel,language:s.preferredLanguage});
      if(!result.success) {
        if(result.message === "No audio detected" || result.error === "No audio detected") {setMessage("Ingen tale ble registrert. Kontroller valgt mikrofon og at den mottar lyd.");return;}
        throw new Error(result.error || result.message || "Talegjenkjenningen mislyktes.");
      }
      setText(result.text || "");
      if(importedFileName && result.text?.trim()){
        const saved=await saveImportedConversation(api,importedFileName,result.text);
        setMessage(saved?.complete ? ui("Samtalen er lagret under Notater:")+" «"+saved.title+"»" : "Teksten er lagret under Notater, men taler-/tidsdata kunne ikke lagres. Originalteksten er beholdt.");
      }else setMessage(result.text?.trim() ? "Ferdig. Ingen lyd er lastet opp." : "Ingen tale ble funnet.");
    } catch(error) {setMessage(String(error));} finally {setBusy(false);}
  };
  const testMic = async () => {
    setBusy(true); setMessage("Tar opp 5 sekunder fra valgt mikrofon. Snakk nå …");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:s.microphoneSelectionMode === "specific" ? {deviceId:{exact:s.selectedMicDeviceId}} : true});
      const recorder = new MediaRecorder(stream); const chunks: Blob[]=[];
      recorder.ondataavailable = (e) => {if(e.data.size) chunks.push(e.data);};
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const bytes=await new Blob(chunks,{type:recorder.mimeType}).arrayBuffer();setSourceAudio({bytes,name:"DSSA-mikrofonopptak.webm"});await transcribe(bytes);
      };
      recorder.start(); setTimeout(() => recorder.stop(),5000);
    } catch(error) {setMessage(String(error));setBusy(false);}
  };
  const pageTitles: Record<string,string> = {settings:"Innstillinger",files:"Lydfiler",assistant:"Assistent",speech:"Tale og mikrofon",shortcuts:"Hurtigtaster",recording:"Opptak og innliming",appearance:"Utseende og språk",system:"System"};
  const content = <div className="nb-control-panel" data-page={panelFocus} style={{padding:"24px",maxWidth:980,margin:"20px auto",fontFamily:"system-ui",fontSize:16,lineHeight:1.55}}>
    <style>{`.nb-control-panel button{border:1px solid color-mix(in srgb,var(--nb-accent) 45%,transparent);border-radius:6px;padding:5px 9px;margin:3px 4px 3px 0}.nb-control-panel button:hover:not(:disabled){background:color-mix(in srgb,var(--nb-accent) 14%,transparent)}.nb-control-panel button:disabled{opacity:.5}.nb-control-panel select,.nb-control-panel input,.nb-control-panel textarea{border:1px solid #8885;border-radius:5px;padding:4px;margin:3px;max-width:100%}.nb-control-panel input[type=checkbox]{accent-color:var(--nb-accent)}.nb-control-panel h1{color:var(--nb-accent);margin-bottom:12px}.nb-control-panel h2{font-weight:650;font-size:14px;margin:8px 0}.nb-control-panel section{margin-top:8px}.nb-control-panel section>label{display:inline-block;margin:4px 0}.nb-control-panel textarea{resize:none;overflow-y:auto}.nb-control-panel p{margin:7px 0}.nb-control-panel select option{background:Canvas;color:CanvasText}`}</style>
    <h1 style={{fontSize:22,fontWeight:700}}>{ui(pageTitles[panelFocus])}</h1>
    {(meetingRecording || meetingTranscribing) && <aside role="status" style={{padding:12,border:"1px solid var(--nb-accent)",borderRadius:8}}>{ui(meetingRecording ? "Møteopptak pågår" : "Møtet transkriberes …")}{" "}{meetingRecording && <button onClick={()=>void stopMeetingRecording()}>{ui("Stopp møteopptaket")}</button>}</aside>}
    {(panelFocus === "speech" || panelFocus === "assistant") && memory && <p><small>{ui("Minne:")} {(memory.rss/2**30).toFixed(1)} / {(memory.total/2**30).toFixed(0)} GB · {ui("App og modellmotorer (RSS)")}</small></p>}
    {message && <p role="status">{ui(message)}</p>}
    {panelFocus === "settings" && <section>
      <p>{ui("Velg en innstillingsside i menyen eller nedenfor.")}</p>
      <div className="nb-settings-grid">{([
        {id:"assistant",icon:Sparkles,description:"Talemodell, målform og valgfri tekstopprydding."},
        {id:"speech",icon:Mic,description:"Velg mikrofon og høyttaler, og kontroller tillatelser."},
        {id:"shortcuts",icon:Keyboard,description:"Velg tastene som starter og stopper opptak."},
        {id:"recording",icon:AudioLines,description:"Lengde på opptak, lydsignaler og automatisk innliming."},
        {id:"appearance",icon:Palette,description:"Lyst eller mørkt tema, aksentfarge og menyspråk."},
        {id:"system",icon:Settings2,description:"Versjon, oppdateringsvalg og lokal feilsøkingslogg."}
      ]).map(({id,icon:Icon,description})=><article className="nb-settings-tile" key={id}><div className="nb-settings-tile-title"><Icon aria-hidden="true" size={23}/><h2>{ui(pageTitles[id])}</h2></div><p>{ui(description)}</p><button aria-label={ui("Åpne")+" "+ui(pageTitles[id])} onClick={()=>openNBPanel(id)}>{ui("Åpne")}<ArrowRight aria-hidden="true" size={16}/></button></article>)}</div>
      <p>{ui("Alt behandles lokalt. Valgene lagres automatisk.")}</p>
    </section>}
    {panelFocus === "speech" && <section>
      <p>{ui("Talemodell")}: NB-Whisper Large — {s.whisperModel==="nb-large-full"?ui("full presisjon"):ui("kvantisert q5_0")}</p>
      <button onClick={()=>openNBPanel("assistant")}>{ui("Velg modeller og les forklaringen")}</button>
      <label>{ui("Mikrofon") + " "}<select aria-label={ui("Mikrofon")} value={s.microphoneSelectionMode === "specific" ? s.selectedMicDeviceId : "system"} onChange={(e)=>{const d=devices.find((d)=>d.deviceId===e.target.value);if(d){s.setSelectedMicDevice(d.deviceId,d.label);s.setMicrophoneSelectionMode("specific");}else{s.setMicrophoneSelectionMode("system");}}}><option value="system">{ui("Følg Mac-ens standardmikrofon")}</option>{s.microphoneSelectionMode === "specific" && !devices.some(d=>d.deviceId===s.selectedMicDeviceId) && <option value={s.selectedMicDeviceId}>{s.selectedMicDeviceLabel || ui("Valgt mikrofon")} – {ui("ikke tilkoblet")}</option>}{devices.filter(d=>d.deviceId!=="default").map(d=><option key={d.deviceId} value={d.deviceId}>{d.label || "Mikrofon"}</option>)}</select></label>
      <p><label>{ui("Høyttaler for appens lyder")} <select aria-label={ui("Høyttaler for appens lyder")} value={output.deviceId} onChange={e=>{const device=outputs.find(d=>d.deviceId===e.target.value);const next={deviceId:e.target.value,label:device?.label || ""};saveAudioOutput(next.deviceId,next.label);setOutput(next);setMessage("");}}>
        <option value="">{ui("Følg Mac-ens standardutgang")}</option>
        {output.deviceId && !outputs.some(d=>d.deviceId===output.deviceId) && <option value={output.deviceId}>{output.label || ui("Valgt høyttaler")} – {ui("ikke tilkoblet")}</option>}
        {outputs.filter(d=>d.deviceId!=="default" && d.deviceId!=="communications").map(d=><option key={d.deviceId} value={d.deviceId}>{d.label || ui("Høyttaler")}</option>)}
      </select></label></p>
      {output.deviceId && !outputs.some(d=>d.deviceId===output.deviceId) && <p role="status">{ui("Valgt høyttaler er ikke tilgjengelig. Valget beholdes. Koble den til igjen, eller velg standardutgang selv.")}</p>}
      <button disabled={busy} onClick={async()=>{setBusy(true);try{await testAudioOutput();setMessage("Testlyden er spilt på valgt utgang. Hørte du tonen?");}catch(error){setMessage(ui("Kunne ikke spille på valgt utgang. Koble til høyttaleren, oppdater listen eller velg standardutgang.")+" "+(error instanceof Error ? error.message : String(error)));}finally{setBusy(false);}}}>{ui("Test høyttaler")}</button>{" "}
      <button onClick={()=>void refreshDevices()}>{ui("Oppdater lydenheter")}</button>
      <p><small>{ui("Høyttalervalget gjelder appens testlyd og dikteringslyder. Det endrer ikke Mac-ens lydruting. Valget beholdes etter omstart.")}</small></p>
      <p><small>{ui("BlackHole er en virtuell lydinngang. Den hører bare lyd som sendes til den.")}</small></p>
      <button disabled={busy} onClick={testMic}>{ui("Test valgt mikrofon i 5 sekunder")}</button>
      <p><button onClick={()=>api.openMicrophoneSettings()}>{ui("Mikrofontillatelse")}</button><button onClick={()=>api.openAccessibilitySettings()}>{ui("Tilgjengelighet og innliming")}</button></p>
      <section aria-label={ui("Automatisk innliming")}>
        <h2>{ui(pasteStatus?.trusted && pasteStatus?.canPost && pasteStatus?.nativeAvailable ? "Automatisk innliming: klar" : "Automatisk innliming trenger Mac-tillatelse")}</h2>
        {!(pasteStatus?.trusted && pasteStatus?.canPost && pasteStatus?.nativeAvailable) && <p>{ui("Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet (Enhetskontroll og datatilgang på macOS 27). Slå på DSSA Tale og start appen på nytt. Er den allerede på, fjern den gamle oppføringen og legg til appen fra Programmer på nytt.")}</p>}
        <button onClick={()=>void refreshPasteStatus()}>{ui("Kontroller innliming")}</button>
        <button disabled={busy||!pasteStatus?.trusted||!pasteStatus?.canPost||!pasteStatus?.nativeAvailable} onClick={async()=>{setBusy(true);setMessage("Åpner et eget testdokument i Tekstredigering og kontrollerer innlimingen …");try{const result=await api.nbTestPaste();setMessage(result.success ? (result.verified ? "Testteksten er bekreftet i dokumentet." : "Tastetrykket er sendt, men mottakeren lar ikke appen kontrollere teksten. Teksten er beholdt i utklippstavlen; bruk ⌘V hvis den ikke vises.") : (result.error || "Innlimingstesten mislyktes."));}catch(error){setMessage(String(error));}finally{setBusy(false);void refreshPasteStatus();}}}>{ui("Test i et tomt dokument")}</button>
      </section>
      {text && <textarea aria-label={ui("Resultat av mikrofontest")} readOnly value={text} style={{width:"100%",height:70}}/>}
    </section>}
    {panelFocus === "shortcuts" && <section>
      <p>{ui("Diktering – klikk på feltet og trykk ønsket tastekombinasjon.")}</p>
      <HotkeyListInput value={s.dictationKey} required onChange={(v)=>register(v)}/>
      <p role="status">{ui("Aktiv hurtigtast")}: <strong>{s.activeDictationKey || ui("Ikke bekreftet")}</strong></p>
      {s.dictationHotkeyRegistration.status === "registering" && <p role="status">{ui("Aktiverer lagret hurtigtast …")}</p>}
      {s.dictationHotkeyRegistration.status === "waiting" && <p role="status">{ui("Venter på at hurtigtasten skal bli klar …")}</p>}
      {s.dictationHotkeyRegistration.status === "failed" && s.activeDictationKey!==s.dictationKey && <p role="alert">{ui("Den lagrede hurtigtasten kunne ikke aktiveres. Bruk den aktive tasten ovenfor, eller velg en annen kombinasjon. Den lagrede innstillingen er beholdt.")}</p>}
      <label>{ui("Opptaksmåte") + " "}<select value={s.activationMode} onChange={(e)=>s.setActivationMode(e.target.value as "tap"|"push")}><option value="tap">{ui("Trykk for å starte og stoppe")}</option><option value="push">{ui("Hold inne for å snakke")}</option></select></label>
      <p>{ui("Møtesnarvei – åpner møteopptak i den komplette arbeidsflaten.")}</p>
      <HotkeyListInput value={s.meetingKey} onChange={(v)=>register(v,true)} onClear={()=>register("",true)}/>
    </section>}
    {panelFocus === "recording" && <section>
      <label>{ui("Maksimal dikteringstid") + " "}<select value={limit} onChange={e=>{setLimit(e.target.value);localStorage.setItem("nbDictationMinutes",e.target.value);}}><option value="5">{ui("5 minutter")}</option><option value="10">{ui("10 minutter")}</option><option value="30">{ui("30 minutter")}</option><option value="0">{ui("Stopp manuelt")}</option></select></label><br/>
      <label><input type="checkbox" checked={s.autoPasteEnabled} onChange={e=>s.setAutoPasteEnabled(e.target.checked)}/>{" " + ui("Lim inn teksten automatisk i aktiv app")}</label><br/>
      <label><input type="checkbox" checked={s.keepTranscriptionInClipboard} onChange={e=>s.setKeepTranscriptionInClipboard(e.target.checked)}/>{" " + ui("Behold teksten i utklippstavlen")}</label>
      <label><input type="checkbox" checked={s.audioCuesEnabled} onChange={e=>s.setAudioCuesEnabled(e.target.checked)}/>{" " + ui("Lyd ved start og stopp av diktering")}</label><br/>
      <label><input type="checkbox" checked={s.floatingIconAutoHide} onChange={e=>s.setFloatingIconAutoHide(e.target.checked)}/>{" " + ui("Skjul dikteringsikonet automatisk når det er inaktivt")}</label>
      <label>{ui("Møtebehandling") + " "}<select value={preferences.meetingMode || "after"} onChange={async e=>setPreferences(await api.nbSetPreferences({meetingMode:e.target.value}))}><option value="after">{ui("Ta opp først, transkriber etterpå (standard)")}</option><option value="live">{ui("Transkriber under møtet")}</option></select></label><br/>
      <label><input type="checkbox" checked={!!preferences.autoTeams} onChange={async e=>setPreferences(await api.nbSetPreferences({autoTeams:e.target.checked}))}/>{" " + ui("Start automatisk når Teams bruker mikrofonen (utprøving)")}</label>
    </section>}
    {panelFocus === "appearance" && <section>
      <label>{ui("Utseende") + " "}<select value={s.theme} onChange={e=>s.setTheme(e.target.value as "light"|"dark"|"auto")}><option value="auto">{ui("Følg Mac-en")}</option><option value="light">{ui("Lyst")}</option><option value="dark">{ui("Mørkt")}</option></select></label>
      <label>{ui("Aksentfarge") + " "}<select value={accent} onChange={e=>setAccent(e.target.value)}><option value="#2563eb">{ui("Blå")}</option><option value="#059669">{ui("Grønn")}</option><option value="#9333ea">{ui("Lilla")}</option><option value="#d97706">{ui("Rav")}</option><option value="#dc2626">{ui("Rød")}</option><option value="#64748b">{ui("Grå")}</option></select></label><br/>
      <label>{ui("Menyspråk") + " "}<select value={s.uiLanguage} onChange={e=>s.setUiLanguage(e.target.value)}><option value="nb">{ui("Norsk bokmål")}</option><option value="nn">Norsk nynorsk</option><option value="en">English</option></select></label>
    </section>}
    {panelFocus === "system" && <section>
      <h2>DSSA Tale</h2>
      <p>{ui("Appversjon")}: {systemVersion || "—"}</p>
      <h2>{ui("Oppdateringer")}</h2>
      <p>{ui("Automatiske oppdateringer er slått av. Denne lokale NB-utgaven oppdateres manuelt med en ny installasjonspakke, slik at OpenWhispr-oppdateringer ikke erstatter tilpasningen.")}</p>
      <h2>{ui("Feilsøking")}</h2>
      <label><input type="checkbox" checked={debugState?.enabled ?? false} disabled={!debugState || systemBusy} onChange={async e=>{
        const enabled=e.target.checked;setSystemBusy(true);
        try{const result=await api.setDebugLogging(enabled);if(!result?.success)throw new Error(result?.error || ui("Kunne ikke endre feilsøkingslogging."));setDebugState(await api.getDebugState());}
        catch(error){setMessage(String(error));}finally{setSystemBusy(false);}
      }}/>{" "}{ui("Detaljert feilsøkingslogging")}</label>
      <p><small>{ui("Loggene lagres lokalt. Slå på detaljert logging ved feilsøking og slå den av igjen etterpå.")}</small></p>
      <button disabled={systemBusy} onClick={async()=>{try{const result=await api.openLogsFolder();if(!result?.success)setMessage(ui("Kunne ikke åpne loggmappen."));}catch{setMessage(ui("Kunne ikke åpne loggmappen."));}}}>{ui("Åpne loggmappe")}</button>
      {debugState?.logPath && <p style={{fontSize:12,overflowWrap:"anywhere"}}>{ui("Loggfil")}: {debugState.logPath}</p>}
    </section>}
    {panelFocus === "assistant" && <section className="nb-model-card">
      <h2>{ui("1. Talemodell – lyd til tekst")}</h2>
      <p>{ui("NB-Whisper gjør lyd til tekst. Full presisjon (3,10 GB) og q5_0 (1,08 GB) er begge Large-modeller. q5_0 bruker vanligvis mindre minne.")}</p>
      <p>{ui("Velg bokmål eller nynorsk. Nynorsk trenger ingen hjelpemodell. Språkvalget beholdes til du endrer det selv.")}</p>
      <label>{ui("Målform") + " "}<select aria-label={ui("Målform")} value={s.preferredLanguage} onChange={(e)=>s.setPreferredLanguage(e.target.value)}><option value="no">{ui("Bokmål")}</option><option value="nn">{ui("Nynorsk")}</option></select></label><br/>
      <label>{ui("Modell") + " "}<select aria-label={ui("Modell")} value={s.whisperModel} onChange={(e)=>{s.setWhisperModel(e.target.value);s.setMeetingWhisperModel(e.target.value);s.setUploadWhisperModel(e.target.value);}}><option value="nb-large">{ui("NB-Whisper Large – kvantisert q5_0 (mindre minne)")}</option><option value="nb-large-full">{ui("NB-Whisper Large – full presisjon (standard)")}</option></select></label><br/>
      <label>{ui("Akselerasjon for talegjenkjenning") + " "}<select value={acceleration} disabled={busy} onChange={async e=>{const value=e.target.value;try{await api.nbSetAcceleration(value);setAcceleration(value);setMessage("Akselerasjonen endres når appen startes på nytt.");}catch(error){setMessage(String(error));}}}><option value="auto">{ui("Automatisk – Apple Silicon")}</option><option value="metal">Metal – Apple Silicon</option><option value="cpu">{ui("CPU – uten grafikkakselerasjon")}</option></select></label><br/>
      <p>{ui("Automatisk bruker Metal på Apple Silicon. CPU kan være tregere.")}</p>
      <p role="status" style={{fontSize:14}}>{ui("Aktiv talemotor")}: {memory?.engine?.active === "coreml" ? ui("CoreML-enkoder + Metal") : memory?.engine?.active === "metal" ? "Metal" : memory?.engine?.active === "cpu" ? "CPU" : "—"} · {ui(memory?.engine?.starting ? "Klargjøring …" : memory?.engine?.ready ? "Klar" : "Ikke startet")}</p>
      <NBWhisperDownloads compact language={s.uiLanguage} selected={s.whisperModel}/>
    </section>}
    {panelFocus === "assistant" && <section id="nb-ai" className="nb-model-card">
      <h2>{ui("2. Tekstopprydding – valgfritt")}</h2>
      <p className="nb-cleanup-start"><strong>{ui("Prøv uten hjelpemodell først.")}</strong>{" "}{ui("Da får du teksten direkte fra NB-Whisper, uten ekstra behandlingstid eller omskriving. Slå bare på opprydding hvis du ønsker hjelp etterpå.")}</p>
      <p>{ui("En valgfri Qwen-modell rydder eller formaterer teksten etterpå. Den erstatter ikke NB-Whisper og kan gjøre feil.")}</p>
      <label>{ui("Lokal språkmodell")}<br/><select aria-label={ui("Lokal språkmodell")} disabled={busy||!!downloadStatus} value={selectedModel ? s.cleanupModel : ""} onChange={e=>{s.setCleanupModel(e.target.value);s.setCleanupProvider("qwen");s.setNoteFormattingMode("local");s.setNoteFormattingProvider("qwen");s.setNoteFormattingModel(e.target.value);s.setChatAgentMode("local");s.setChatAgentProvider("qwen");s.setChatAgentModel(e.target.value);s.setUseCleanupModel(false);}}><option value="">{ui("Uten hjelpemodell – prøv dette først")}</option>{models.map(m=><option key={m.id} value={m.id}>{m.name} ({m.size}){m.isDownloaded?" – "+ui("klar"):""}</option>)}</select></label>
      <button disabled={busy||!!downloadStatus||!selectedModel||selectedModel.isDownloaded} onClick={downloadSelectedModel}>{ui(selectedModel?.isDownloaded ? "Modellen er klar" : "Last ned valgt modell")}</button><br/>
      {downloadStatus && <div role="status"><label>{ui("Laster ned språkmodellen …")} {Math.floor(downloadStatus.progress || 0)} %<progress style={{width:"100%"}} max={100} value={downloadStatus.progress || 0}/></label><small>{((downloadStatus.downloadedSize||0)/1e9).toFixed(2)} / {((downloadStatus.totalSize||0)/1e9).toFixed(2)} GB</small></div>}

      <label><input type="checkbox" disabled={!models.some(m=>m.id===s.cleanupModel&&m.isDownloaded)} checked={s.useCleanupModel} onChange={e=>s.setUseCleanupModel(e.target.checked)}/>{" " + ui("Rydd diktering automatisk (av som standard)")}</label>
      {selectedModel && <NBModelGuide model={selectedModel}/>}
    </section>
    }
    {panelFocus === "files" && <section id="nb-files">
      <h2>{ui("Prøv en lydfil")}</h2>
      <p role="status"><strong>{s.uiLanguage === "en" ? "Speech model:" : s.uiLanguage === "nn" ? "Talemodell:" : "Talemodell:"}</strong>{" NB-Whisper Large — "}{s.whisperModel === "nb-large-full" ? ui("full presisjon") : s.whisperModel === "nb-large" ? ui("kvantisert q5_0") : ui("ukjent modellvalg")}</p>
      <p>{s.uiLanguage === "en" ? "This model turns the audio file into text locally. Choose between full precision and the smaller q5_0 file in Assistant. Both are Large models." : s.uiLanguage === "nn" ? "Denne modellen gjer lydfila om til tekst lokalt. Vel mellom full presisjon og den mindre q5_0-fila under Assistent. Begge er Large-modellar." : "Denne modellen gjør lydfilen om til tekst lokalt. Velg mellom full presisjon og den mindre q5_0-filen under Assistent. Begge er Large-modeller."}</p>
      <div aria-label={ui("Mine lydmapper")} style={{display:"flex",gap:8,flexWrap:"wrap"}}>{([["google","Google Disk"],["onedrive","OneDrive / SharePoint"],["icloud","iCloud Drive"]] as const).map(([id,label])=><button key={id} data-provider={id} data-emphasis="primary" onClick={async()=>{try{const result=await api.nbCloudFolderOpen(id);if(!result.success)setMessage(ui("Velg eller kontroller fast mappe under Integrasjoner først."));}catch{setMessage(ui("Kunne ikke åpne mappen. Kontroller mappevalget under Integrasjoner."));}}}><NBCloudBrand provider={id}/>{label}</button>)}</div>
      <p><small>{ui("Åpner den valgte mappen i Finder. Velg deretter lydfilen nedenfor eller dra den til appens filvalg.")}</small></p>

      <button onClick={()=>api.nbOpenVoiceMemos()}>{ui("Åpne Apple Taleopptak")}</button><button onClick={async()=>{const result=await api.nbStorageFolder();if(result.path)setPreferences({...preferences,documentFolder:result.path});}}>{ui("Velg dokumentmappe")}</button>
      <p>{ui("Velg en lokal WAV-, MP3-, M4A- eller WebM-fil. Filen behandles på Mac-en.")}</p>
      <label><input type="checkbox" checked={separateSpeakers} onChange={e=>setSeparateSpeakers(e.target.checked)}/>{" " + ui("Skill talere med lokal talermodell")}</label>
      {separateSpeakers && <section aria-label="Motor for stemmeutskillelse">
        <label>Motor for stemmeutskillelse <select value={speakerEngine} onChange={e=>{setSpeakerEngine(e.target.value);localStorage.setItem("nbSpeakerEngine",e.target.value);}}><option value="community-1">Community-1 (pyannote, valgfri)</option><option value="sherpa-onnx">Eksisterende sherpa-onnx</option></select></label>
        <p>Automatisk antall talere, maksimalt 15 med Community-1. Dette er stemmegrupper, ikke bekreftede personer. En språkmodell erstatter ikke talermodellen.</p>
        <label>Originalens lydkanaler <select value={channelMode} onChange={e=>setChannelMode(e.target.value)}><option value="inspect">Undersøk først (anbefalt)</option><option value="mix">Jeg velger nedmiksing til mono</option>{Array.from({length:Math.min(32,importJob.channelInspection?.channels || 2)},(_,i)=><option key={i} value={`channel:${i}`}>Bruk bare kanal {i+1}</option>)}</select></label>
        <label>Ordtider <select value={wordAlignment} onChange={e=>{setWordAlignment(e.target.value);localStorage.setItem("nbWordAlignment",e.target.value);}}><option value="native">Standard – raskere, med NB-Whisper-ordtider</option><option value="whisperx" disabled={!communityStatus?.alignmentReadyLanguages?.includes(s.preferredLanguage==='nn'?'nn':'no')}>Presis – WhisperX, ekstra lokal modell</option></select></label>
        <p>Presis ordjustering bruker mer tid og minne. Egen modell kreves for bokmål og nynorsk. Den endrer ikke teksten og er ikke en talermodell.</p>
        <button disabled={busy||importing} onClick={async()=>{setBusy(true);try{const r=await api.nbAlignmentConfigure(s.preferredLanguage);if(r.success)setCommunityStatus(r);else if(!r.cancelled)setMessage(r.error);}finally{setBusy(false);}}}>Velg separat WhisperX-miljø og ordmodell</button>
        <p>Originalen beholdes. Ved flere kanaler må du velge kanal eller nedmiksing. Uavhengige mikrofoner kan gi bedre grunnlag hver for seg; automatisk sammenkobling mellom kanaler er ikke implementert.</p>
        {speakerEngine==='community-1' && <div>
          <p>{communityStatus?.modelReady ? `Community-1 er konfigurert (${communityStatus.device}). Kjøring på denne Mac-en må kontrolleres med lyd.` : 'Community-1 trenger et separat Python-miljø og en separat modellnedlasting.'}</p>
          <label>Prosessor <select value={communityDevice} onChange={async e=>{const device=e.target.value;setCommunityDevice(device);if(communityStatus?.configured){setBusy(true);try{const r=await api.nbCommunitySetDevice(device);if(r.success)setCommunityStatus(r);else setMessage(r.error);}finally{setBusy(false);}}}}><option value="cpu">CPU</option><option value="mps">MPS – utprøving, krever faktisk lydtest</option></select></label>
          <button disabled={busy||importing} onClick={async()=>{setBusy(true);try{const r=await api.nbCommunityConfigure(communityDevice);if(r.success)setCommunityStatus(r);else if(!r.cancelled)setMessage(r.error);}finally{setBusy(false);}}}>Velg Community-1 Python-miljø</button>
          <p><a href="https://huggingface.co/pyannote/speaker-diarization-community-1" target="_blank" rel="noreferrer">Godkjenn modelltilgang og CC-BY-4.0 hos Hugging Face</a></p>
          <label><input type="checkbox" checked={communityTerms} onChange={e=>setCommunityTerms(e.target.checked)}/>Jeg har selv godkjent vilkårene hos Hugging Face</label>
          <p><label>Hugging Face-lesetilgangsnøkkel (lagres i macOS Keychain) <input type="password" autoComplete="off" value={communityToken} onChange={e=>setCommunityToken(e.target.value)}/></label></p>
          <button disabled={busy||importing||!communityTerms||!communityStatus?.configured} onClick={async()=>{setBusy(true);const token=communityToken;setCommunityToken('');try{const r=await api.nbCommunityDownload(token,communityTerms);setCommunityStatus(await api.nbCommunityStatus());setMessage(r.success?'Modellen er lastet ned og kontrollert. Inference skjer lokalt.':r.error);}finally{setBusy(false);}}}>Hent modellen separat</button>
          {busy && <button onClick={()=>void api.nbCommunityCancelSetup()}>Avbryt modellnedlasting</button>}
        </div>}
      </section>}
      <input aria-label={ui("Velg lokal lydfil")} type="file" accept="audio/*,video/*,.webm,.mp4,.mov,.mkv" disabled={busy || importing} onChange={e=>{
        const file=e.target.files?.[0];
        if (!file || busy || importing) return;
        e.target.value = "";
        void nbImportJob.start(file, { model:s.whisperModel, language:s.preferredLanguage, separateSpeakers,speakerEngine:speakerEngine as "community-1" | "sherpa-onnx",channelMode,wordAlignment, getHistoryEnabled:()=>{const policy=usePolicyStore.getState();return isPolicyActionAllowed(policy) && effectiveLocalHistoryEnabled(policy,useSettingsStore.getState().dataRetentionEnabled);} }, api);
      }}/>
      {importing && <p>{ui("Du kan bytte visning mens lydfilen behandles. La appen være åpen.")}</p>}
    </section>}
    {(panelFocus === "files" || panelFocus === "assistant") && <section aria-label={ui("Tekst og eksport")}>
      <textarea aria-label={ui(panelFocus === "assistant" ? "Tekst eller spørsmål" : "Transkribert tekst")} style={{width:"100%",height:120,padding:12,border:"1px solid #8885",borderRadius:8}} value={text} onChange={(e)=>setText(e.target.value)}/>
      {panelFocus === "files" && <button disabled={!sourceAudio||busy||importing} onClick={async()=>{if(sourceAudio){const result=sourceAudio.path ? await api.nbSaveAudioFromPath(sourceAudio.path,sourceAudio.name) : await api.nbSaveAudio(sourceAudio.bytes,sourceAudio.name);if(result.success)setMessage("Lydfilen er lagret på valgt sted.");}}}>{ui("Lagre lydfil")}</button>}
      <p><label><input type="checkbox" checked={includeTimestamps} onChange={e=>setIncludeTimestamps(e.target.checked)}/>{" " + ui("Ta med tidsstempler")}</label>{" "}<label><input type="checkbox" checked={includeSpeakers} onChange={e=>setIncludeSpeakers(e.target.checked)}/>{" " + ui("Ta med talernavn eller talernummer")}</label></p>
      <button onClick={()=>api.writeClipboard(text)} disabled={!text||busy||importing}>{ui("Kopier teksten")}</button>{" "}<button data-emphasis="primary" disabled={!text||busy||importing} onClick={()=>saveText("docx")}>{ui("Lagre som Word-dokument")}</button>
      <button data-emphasis="primary" disabled={!text||busy||importing} onClick={()=>saveText("pdf")}>{ui("Lagre som PDF")}</button>
      <button data-emphasis="primary" disabled={!text||busy||importing} onClick={()=>saveText("txt")}>{ui("Lagre som tekstfil")}</button>
      <p>{(["cleanup","notes","assistant"] as const).map((task,i)=><button key={task} disabled={busy||importing||!text||!models.some(m=>m.id===s.cleanupModel&&m.isDownloaded)} onClick={()=>runAI(task)}>{ui(["Rydd teksten","Formater notat","Spør lokal assistent"][i])}</button>)}</p>
    </section>}
  </div>;
  const system=memory?.system;
  const percent=(value:unknown)=>typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)} %` : "—";
  const gib=(value:unknown)=>typeof value === "number" && Number.isFinite(value) ? `${(value/2**30).toFixed(1)} GB` : "—";
  const pressure=system?.pressure === "normal" ? "Normalt" : system?.pressure === "warning" ? "Høyt" : system?.pressure === "critical" ? "Kritisk" : "Ukjent";
  const status=<footer aria-label={ui("Systemstatus")} style={{flexShrink:0,display:"flex",flexWrap:"wrap",gap:"6px 18px",padding:"7px 16px",borderTop:"1px solid var(--color-border)",background:"var(--color-surface-1)",color:"var(--color-muted-foreground)",fontSize:13,fontVariantNumeric:"tabular-nums"}}>
    {importJob.id > 0 && <span role="status" style={{flexBasis:"100%"}}>
      <button onClick={()=>{openNBPanel("files");if(!importing){setText(importJob.text);setSourceAudio(importJob.sourceAudio);setMessage(importJob.error || ui(importPhaseText[importJob.phase]));}}}>{ui("Lydfil")}: {importJob.fileName}</button>{" "}
      {ui(importPhaseText[importJob.phase] || "")} · Tid brukt: {importElapsed} s
      {importJob.totalSeconds>0 && <span> · Opptak: {Math.round(importJob.totalSeconds)} s · Behandlet lyd i dette trinnet: {Math.round(importJob.completedSeconds)} s</span>}
      {importing && <span> · {({segmentation:"Finner talepartier",embeddings:"Sammenligner stemmer",discrete_diarization:"Fordeler talere",loading:"Laster talermodell",channels:"Undersøker lydkanaler",word_alignment:"Kobler ord til lyden"} as Record<string,string>)[importJob.stageLabel || ""] || ui(importPhaseText[importJob.phase] || "")} · Anslått resttid for trinnet: {(()=>{const fraction=importJob.phase==='transcribing' && importJob.totalSeconds ? importJob.completedSeconds/importJob.totalSeconds : importJob.stageFraction;return fraction && fraction>0 && fraction<1 ? Math.ceil((importClock-(importJob.stageStartedAt || importJob.startedAt))/1000*(1-fraction)/fraction)+' s (anslag)' : 'beregnes';})()}</span>}
      {importJob.channelInspection && <p role="status">Kanaler: {importJob.channelInspection.channels || "ukjent"}. Undersøkt de første 30 sekundene; uavhengighet kan ikke bekreftes automatisk.</p>}
      {importJob.warning && <p role="status">{importJob.warning}</p>}
      {importJob.diarizationSummary && <p>{importJob.diarizationSummary.assigned}/{importJob.diarizationSummary.total} tekstsegmenter merket · {importJob.diarizationSummary.detectedGroups} stemmegrupper. Gi navn og korriger merkingen under Notater.</p>}
      {importing && (importJob.phase === "transcribing" && importJob.totalChunks>0 ? <span> {Math.min(100,Math.floor(importJob.completedChunks/importJob.totalChunks*100))} % · {importJob.completedChunks}/{importJob.totalChunks} {ui("deler")} <progress aria-label={ui("Lydfilen behandles")} max={importJob.totalChunks} value={importJob.completedChunks} style={{width:90,marginLeft:8}}/></span> : <progress aria-label={ui("Lydfilen behandles")} style={{width:90,marginLeft:8}}/>)}
      {importJob.resumedChunks>0 && <span> · {ui("Gjenopptatt:")} {importJob.resumedChunks} {ui("deler")}</span>}
      {importing && importJob.requestId && importJob.phase!=="saving" && <button disabled={importJob.cancelRequested} onClick={()=>void nbImportJob.cancel(api)}>{ui(importJob.cancelRequested ? "Avbryter …" : "Avbryt og behold fremdrift")}</button>}
    </span>}
    <span title={ui("Appen og modellmotorenes CPU-bruk, målt som andel av hele Mac-ens prosessorkapasitet.")}>{ui("App CPU")} {percent(memory?.cpuPercent)}</span>
    <span title={ui("Samlet arbeidsminne for appen og dens modellmotorer (RSS). Delt minne kan telles flere ganger.")}>{ui("App RAM")} {gib(memory?.rss)} / {gib(memory?.total)} {typeof memory?.rss === "number" && memory.total>0 ? `(${Math.round(memory.rss/memory.total*100)} %)` : ""}</span>
    <span title={ui("GPU-tallet gjelder hele Mac-en. Separat GPU-bruk for appen er ikke tilgjengelig.")}>{ui("Mac GPU")} {percent(system?.gpuPercent)}</span>
    <span>{ui("Bytteminne")} {gib(system?.swapBytes)}</span>
    <span>{ui("Minnepress")}: {ui(pressure)}</span>
  </footer>;
  return <ControlPanel nbStatus={status} nbSettings={openNBPanel} nbProfile={profile} nbContent={advanced ? undefined : content} nbSection={advanced ? undefined : panelFocus} nbOnNavigate={()=>setAdvanced(true)}/>;
}

const NB_ENGLISH: Record<string,string> = {
"Transkripsjon ferdig. Fordeler talere lokalt …":"Transcription complete. Assigning speakers locally …",
"Talemodell, målform og valgfri tekstopprydding.":"Speech model, written language and optional text cleanup.",
"Velg mikrofon og høyttaler, og kontroller tillatelser.":"Choose microphone and speaker, and check permissions.",
"Velg tastene som starter og stopper opptak.":"Choose the keys that start and stop recording.",
"Lengde på opptak, lydsignaler og automatisk innliming.":"Recording length, sound cues and automatic pasting.",
"Lyst eller mørkt tema, aksentfarge og menyspråk.":"Light or dark theme, accent colour and interface language.",
"Versjon, oppdateringsvalg og lokal feilsøkingslogg.":"Version, update choices and local diagnostic logs.",
"Åpne":"Open",

"NB-Whisper gjør lyd til tekst. Full presisjon (3,10 GB) og q5_0 (1,08 GB) er begge Large-modeller. q5_0 bruker vanligvis mindre minne.":"NB-Whisper turns audio into text. Full precision (3.10 GB) and q5_0 (1.08 GB) are both Large models. q5_0 generally uses less memory.",
"Velg bokmål eller nynorsk. Nynorsk trenger ingen hjelpemodell. Språkvalget beholdes til du endrer det selv.":"Choose Bokmål or Nynorsk. Nynorsk needs no helper model. Your language choice stays until you change it.",
"Automatisk bruker Metal på Apple Silicon. CPU kan være tregere.":"Automatic uses Metal on Apple Silicon. CPU may be slower.",
"En valgfri Qwen-modell rydder eller formaterer teksten etterpå. Den erstatter ikke NB-Whisper og kan gjøre feil.":"An optional Qwen model cleans up or formats the text afterwards. It does not replace NB-Whisper and can make mistakes.",

"Aktiv hurtigtast":"Active shortcut",
"Ikke bekreftet":"Not confirmed",
"Aktiverer lagret hurtigtast …":"Activating saved shortcut …",
"Venter på at hurtigtasten skal bli klar …":"Waiting for the shortcut to become ready …",
"Den lagrede hurtigtasten kunne ikke aktiveres. Bruk den aktive tasten ovenfor, eller velg en annen kombinasjon. Den lagrede innstillingen er beholdt.":"The saved shortcut could not be activated. Use the active shortcut above or choose another combination. Your saved preference has been preserved.",

"Begge valgene er NB-Whisper Large. Full presisjon er en større fil på omtrent 3,10 GB. q5_0 er den kvantiserte utgaven på omtrent 1,08 GB og bruker vanligvis mindre minne. Prøv begge hvis du vil sammenligne fart og gjenkjenning.":"Both choices are NB-Whisper Large. Full precision is a larger file of about 3.10 GB. q5_0 is the quantized version of about 1.08 GB and usually uses less memory. Try both to compare speed and recognition.",
"Velg nynorsk for tekst på nynorsk, eller bokmål for tekst på bokmål. Du trenger ikke en ekstra hjelpemodell for nynorsk. Valget beholdes til du endrer det selv. Talegjenkjenningen kan likevel gjøre feil.":"Choose Nynorsk for Nynorsk text, or Bokmål for Bokmål text. Nynorsk does not require an extra helper model. Your choice stays until you change it. Speech recognition can still make mistakes.",

"Uten hjelpemodell – prøv dette først":"Without a helper model – try this first",
"Prøv uten hjelpemodell først.":"Try without a helper model first.",
"Da får du teksten direkte fra NB-Whisper, uten ekstra behandlingstid eller omskriving. Slå bare på opprydding hvis du ønsker hjelp etterpå.":"You get the text directly from NB-Whisper without extra processing time or rewriting. Enable cleanup only if you want help afterwards.",

"Modeller":"Models",
"Talemodell":"Speech model",
"Velg modeller og les forklaringen":"Choose models and read the explanation",
"1. Talemodell – lyd til tekst":"1. Speech model – audio to text",
"NB-Whisper lytter til opptaket og skriver ordene dine. Velg bokmål eller nynorsk. Denne modellen trengs for diktering, lydimport og transkripsjon av møter.":"NB-Whisper listens to the recording and writes your words. Choose Bokmål or Nynorsk. This model is required for dictation, audio import and meeting transcription.",
"2. Tekstopprydding – valgfritt":"2. Text cleanup – optional",
"En Qwen-språkmodell arbeider med teksten etter NB-Whisper. Den kan rydde tegnsetting, formatere notater og hjelpe med referatutkast. Den hører ikke lyd og er ikke nødvendig for vanlig diktering. La opprydding være av hvis du vil beholde den rå transkripsjonen.":"A Qwen language model works with the text after NB-Whisper. It can clean punctuation, format notes and help draft summaries. It does not hear audio and is not required for ordinary dictation. Leave cleanup off to preserve the raw transcription.",
"Assistenten bruker den valgfrie språkmodellen til å arbeide med tekst. Talemodellen NB-Whisper brukes først når lyd skal bli tekst.":"The assistant uses the optional language model to work with text. NB-Whisper is used first when converting audio into text.",
"Ingen valgt":"None selected",
"Metal bruker grafikkdelen i Apple-brikken. CPU bruker prosessoren og kan være tregere. Denne pakken inneholder ikke Core ML-encoder.":"Metal uses the graphics part of the Apple chip. CPU uses the processor and may be slower. This package does not include a Core ML encoder.",

 "full presisjon":"full precision",
 "kvantisert q5_0":"quantized q5_0",
 "ukjent modellvalg":"unknown model selection",
 "System":"System",
 "Appversjon":"App version",
 "Oppdateringer":"Updates",
 "Automatiske oppdateringer er slått av. Denne lokale NB-utgaven oppdateres manuelt med en ny installasjonspakke, slik at OpenWhispr-oppdateringer ikke erstatter tilpasningen.":"Automatic updates are off. This local NB edition is updated manually with a new installer, so OpenWhispr updates do not replace the customization.",
 "Feilsøking":"Diagnostics",
 "Detaljert feilsøkingslogging":"Detailed diagnostic logging",
 "Loggene lagres lokalt. Slå på detaljert logging ved feilsøking og slå den av igjen etterpå.":"Logs are stored locally. Enable detailed logging when troubleshooting and turn it off afterwards.",
 "Åpne loggmappe":"Open logs folder",
 "Loggfil":"Log file",
 "Kunne ikke hente systeminformasjon. Prøv igjen.":"Could not load system information. Try again.",
 "Kunne ikke endre feilsøkingslogging.":"Could not change diagnostic logging.",
 "Kunne ikke åpne loggmappen.":"Could not open the logs folder.",

 "Teksten er klar. Historikk er slått av; samtalen er ikke lagret.":"The text is ready. History is off; the conversation was not saved.",
 "Klargjør lydfilen …":"Preparing audio file …",
 "Avbrutt. Velg samme lydfil for å fortsette.":"Cancelled. Select the same audio file to resume.",
 "deler":"chunks", "Gjenopptatt:":"Resumed:", "Avbryter …":"Cancelling …", "Avbryt og behold fremdrift":"Cancel and keep progress",
 "Taleranalysen mislyktes.":"Speaker analysis failed.",
 "Talegjenkjenningen mislyktes.":"Speech recognition failed.",
  "Leser lydfilen …": "Reading audio file …", "Lagrer samtalen …": "Saving conversation …",
  "Lydfilen er ferdig behandlet.": "Audio file processing completed.", "Behandlingen av lydfilen mislyktes.": "Audio file processing failed.",
  "Du kan bytte visning mens lydfilen behandles. La appen være åpen.": "You can navigate while the audio file is processed. Keep the app open.",
  "Lydfil": "Audio file", "Lydfilen behandles": "Processing audio file",

 "Originalteksten er beholdt fordi modellen endret ord eller fakta.":"The original text was kept because the model changed words or facts.",
 "Referatutkast med kontrollerte kildesitater. Kontroller sammenhengen før bruk.":"Draft minutes with verified source quotes. Check the context before use.",
 "Aktiv talemotor":"Active speech engine",
 "Klargjøring …":"Preparing …",
 "Klar":"Ready",
 "Ikke startet":"Not started",
 "CoreML-enkoder + Metal":"CoreML encoder + Metal",
 "Kontroller talerfordelingen der.":"Check speaker assignments there.",
 "Samtalen er lagret under Notater:":"Conversation saved in Notes:",
 "klar":"ready",
 "Valgt mikrofon":"Selected microphone",
 "Testteksten er bekreftet i dokumentet.":"Test text verified in the document.",
 "Tastetrykket er sendt, men mottakeren lar ikke appen kontrollere teksten. Teksten er beholdt i utklippstavlen; bruk ⌘V hvis den ikke vises.":"The keystroke was sent, but the target does not allow text verification. Text remains in the clipboard; use ⌘V if it is not visible.",
 "Teksten er lagret under Notater, men taler-/tidsdata kunne ikke lagres. Originalteksten er beholdt.":"Text saved in Notes, but speaker/timing data could not be saved. The original text was kept.",
 "Automatisk – Apple Silicon":"Automatic – Apple Silicon",
 "Første oppstart med CoreML kan ta 12–25 sekunder. Metal brukes hvis CoreML ikke er tilgjengelig.":"First CoreML startup may take 12–25 seconds. Metal is used if CoreML is unavailable.",
 "Systemstatus":"System status",
 "Samlet CPU-belastning siden forrige måling":"Overall CPU load since the previous sample",
 "Apple GPU deler minnet med systemet. — betyr at måling ikke er tilgjengelig.":"Apple GPU shares system memory. — means the metric is unavailable.",
 "Aktive minnesider, minne reservert av macOS og komprimert minne. CPU og GPU deler RAM.":"Active pages, memory reserved by macOS and compressed memory. CPU and GPU share RAM.",
 "RAM aktiv":"Active RAM",
 "Minnepress":"Memory pressure",
 "Bytteminne":"Swap",
 "Normalt":"Normal",
 "Høyt":"Warning",
 "Kritisk":"Critical",
 "Ukjent":"Unknown",

  "Høyttaler for appens lyder":"Speaker for app sounds",
  "Følg Mac-ens standardutgang":"Use the Mac’s default output",
  "Valgt høyttaler":"Selected speaker", "Høyttaler":"Speaker", "ikke tilkoblet":"disconnected",
  "Test høyttaler":"Test speaker", "Oppdater lydenheter":"Refresh audio devices",
  "Kunne ikke hente lydenheter. Prøv igjen.":"Could not list audio devices. Try again.",
  "Valgt høyttaler er ikke tilgjengelig. Valget beholdes. Koble den til igjen, eller velg standardutgang selv.":"The selected speaker is unavailable. Your choice is retained. Reconnect it or select the default output.",
  "Testlyden er spilt på valgt utgang. Hørte du tonen?":"The test tone was played on the selected output. Did you hear it?",
  "Kunne ikke spille på valgt utgang. Koble til høyttaleren, oppdater listen eller velg standardutgang.":"Could not play on the selected output. Connect the speaker, refresh devices or select the default output.",
  "Høyttalervalget gjelder appens testlyd og dikteringslyder. Det endrer ikke Mac-ens lydruting. Valget beholdes etter omstart.":"The speaker choice applies to test tones and dictation sounds. It does not change the Mac’s audio routing. Your choice persists across restarts.",
"Automatisk innliming":"Automatic pasting",
"Automatisk innliming: klar":"Automatic pasting: ready",
"Automatisk innliming trenger Mac-tillatelse":"Automatic pasting needs Mac permission",
"Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet (Enhetskontroll og datatilgang på macOS 27). Slå på DSSA Tale og start appen på nytt. Er den allerede på, fjern den gamle oppføringen og legg til appen fra Programmer på nytt.":"Open System Settings \u2192 Privacy & Security \u2192 Accessibility (Device Control and Data Access on macOS 27). Enable DSSA Tale and restart the app. If already enabled, remove the old entry and add the app from Applications again.",
"Kontroller innliming":"Check pasting",
"Test i et tomt dokument":"Test pasting in 5 seconds",
"Åpner et eget testdokument i Tekstredigering og kontrollerer innlimingen …":"Click in an empty document now. Test text will be pasted in 5 seconds.",
"Innlimingstesten er sendt. Kontroller teksten i dokumentet.":"Paste test sent. Check the text in your document.",
"Innlimingstesten mislyktes.":"Paste test failed.",

"Modellen er klar":"Model is ready",
"En modell lastes allerede ned. Vent til den er ferdig.":"A model is already downloading. Wait for it to finish.",
"Ikke nok ledig lagringsplass. Frigjør plass og prøv igjen.":"Not enough storage. Free up space and try again.",
"Nedlastingen ble avbrutt. Du kan prøve igjen.":"Download cancelled. You can try again.",
"Velg en språkmodell fra listen først.":"Select a language model from the list first.",
"Nedlastingen mislyktes. Kontroller internettforbindelsen og prøv igjen.":"Download failed. Check your internet connection and try again.",
"Modellserveren svarte med en feil. Prøv igjen senere.":"The model server returned an error. Try again later.",
"Modellfilen er ufullstendig eller skadet. Last den ned på nytt.":"The model file is incomplete or damaged. Download it again.",
"Nedlastingen mislyktes. Prøv igjen.":"Download failed. Try again.",

 "Ingen tale ble registrert. Kontroller valgt mikrofon og at den mottar lyd.":"No speech was detected. Check the selected microphone and whether it receives audio.",
 "BlackHole er en virtuell lydinngang. Den hører bare lyd som sendes til den.":"BlackHole is a virtual audio input. It only receives audio routed to it.",
 "App og modellmotorer (RSS)":"App and model engines (RSS)",
 "Tale og mikrofon":"Speech and microphone",
 "Hurtigtaster":"Keyboard shortcuts",
 "Opptak og innliming":"Recording and pasting",
 "Utseende og språk":"Appearance and language",
 "Velg en innstillingsside i menyen eller nedenfor.":"Choose a settings page in the menu or below.",
 "Alt behandles lokalt. Valgene lagres automatisk.":"Everything is processed locally. Settings are saved automatically.",
 "Last ned én gang. Deretter behandles teksten lokalt.":"Download once. Text is then processed locally.",
 "Resultat av mikrofontest":"Microphone test result",

 "Lydfiler":"Audio files",
 "Assistent":"Assistant",
 "Innstillinger":"Settings",
 "Tekst og eksport":"Text and export",
 "Tekst eller spørsmål":"Text or question",
 "Tilbake til hovedvinduet":"Back to main window",
 "Tale, modell og mikrofon":"Speech, model and microphone",
 "Slik dikterer du":"How to dictate",
 "Møteopptak pågår":"Meeting recording in progress",
 "Møtet transkriberes …":"Transcribing the meeting …",
 "Stopp møteopptaket":"Stop meeting recording",
 "Vis møtenotatet":"Show meeting note",
  "Tilbake til DSSA Tale": "Back to DSSA Tale",
  "Lokalt profilbilde": "Local profile picture",
  "· Lokal profil fra Mac-en": "· Local Mac profile",
  "Lokal diktering på norsk": "Local Norwegian dictation",
  "· Ingen konto eller abonnement": "· No account or subscription",
  "Plasser markøren i et tekstfelt i en annen app. Trykk": "Place the cursor in a text field in another app. Press",
  "Teksten limes inn automatisk. Første opptak kan ta litt ekstra tid mens modellen lastes.": "Text is pasted automatically. The first recording may take a little longer while the model loads.",
  "Hold inne mens du snakker, og slipp for å avslutte.": "Hold while speaking, then release to finish.",
  "Snakk, og trykk igjen for å avslutte.": "Speak, then press again to finish.",
  "Minne:": "Memory:",
  "GB totalt ·": "GB total ·",
  "GB målt prosessminne for appen og modellmotorene.": "GB measured process memory for the app and model engines.",
  "RSS kan telle delt minne flere ganger. Større språkmodeller og lange tekster krever mer minne enn modellfilen alene.": "RSS may count shared memory more than once. Larger language models and longer texts need more memory than the model file alone.",
  "Målform": "Written language",
  "Bokmål": "Norwegian Bokmål",
  "Nynorsk": "Norwegian Nynorsk",
  "Modell": "Speech model",
  "NB-Whisper Large – kvantisert q5_0 (mindre minne)": "NB-Whisper Large – quantized q5_0 (less memory)",
  "NB-Whisper Large – full presisjon (standard)": "NB-Whisper Large – full precision (default)",
  "Akselerasjon for talegjenkjenning": "Speech recognition acceleration",
  "Metal – Apple Silicon (standard)": "Metal – Apple Silicon (default)",
  "CPU – uten grafikkakselerasjon": "CPU – no GPU acceleration",
  "Mikrofon": "Microphone",
  "Følg Mac-ens standardmikrofon": "Use the Mac's default microphone",
  "Begge modeller følger med appen. Full presisjon krever mer minne. Valg av mikrofon her endrer ikke Mac-ens lydruting.": "Both models are included. Full precision requires more memory. Selecting a microphone here does not change the Mac's audio routing.",
  "Test valgt mikrofon i 5 sekunder": "Test selected microphone for 5 seconds",
  "Hurtigtaster og visning": "Shortcuts and appearance",
  "Utseende": "Appearance",
  "Følg Mac-en": "Follow system",
  "Lyst": "Light",
  "Mørkt": "Dark",
  "Aksentfarge": "Accent color",
  "Blå": "Blue",
  "Grønn": "Green",
  "Lilla": "Purple",
  "Rav": "Amber",
  "Rød": "Red",
  "Grå": "Gray",
  "Menyspråk": "Interface language",
  "Norsk bokmål": "Norwegian Bokmål",
  "Diktering – klikk på feltet og trykk ønsket tastekombinasjon.": "Dictation – click the field and press your preferred key combination.",
  "Opptaksmåte": "Recording control",
  "Trykk for å starte og stoppe": "Press to start and stop",
  "Hold inne for å snakke": "Hold to talk",
  "Maksimal dikteringstid": "Maximum dictation duration",
  "5 minutter": "5 minutes",
  "10 minutter": "10 minutes",
  "30 minutter": "30 minutes",
  "Stopp manuelt": "Stop manually",
  "Lim inn teksten automatisk i aktiv app": "Automatically paste into the active app",
  "Behold teksten i utklippstavlen": "Keep text in the clipboard",
  "Møtesnarvei – åpner møteopptak i den komplette arbeidsflaten.": "Meeting shortcut – opens meeting recording in the full workspace.",
  "Lyd ved start og stopp av diktering": "Play sounds when dictation starts and stops",
  "Skjul dikteringsikonet automatisk når det er inaktivt": "Automatically hide the dictation icon when idle",
  "Møtebehandling": "Meeting processing",
  "Ta opp først, transkriber etterpå (standard)": "Record first, transcribe afterwards (default)",
  "Transkriber under møtet": "Transcribe during the meeting",
  "Start automatisk når Teams bruker mikrofonen (utprøving)": "Start automatically when Teams uses the microphone (experimental)",
  "Åpne møter, notater og komplett arbeidsflate": "Open meetings, notes and full workspace",
  "Lokal språkmodell og tekstopprydding": "Local language model and cleanup",
  "En valgfri liten språkmodell kan rydde diktering, formatere notater og svare på spørsmål. Modellen lastes ned én gang og kjører deretter på Mac-en.": "An optional small language model can clean up dictation, format notes and answer questions. Download it once, then run it locally on the Mac.",
  "Lokal språkmodell": "Local language model",
  "Velg språkmodell": "Select a language model",
  "Last ned valgt modell": "Download selected model",
  "Rydd diktering automatisk (av som standard)": "Automatically clean up dictation (off by default)",
  "Praktisk minneanslag for språkmodellen alene: 1,5–2B omtrent 3–5 GB, 4B omtrent 5–7 GB, 8B omtrent 7–10 GB. NB-Whisper, macOS og andre apper kommer i tillegg. Dette er anslag, ikke garantier.": "Estimated memory for the language model alone: 1.5–2B about 3–5 GB, 4B about 5–7 GB, 8B about 7–10 GB. NB-Whisper, macOS and other apps need additional memory. These are estimates, not guarantees.",
  "På denne Mac-en anbefales den minste språkmodellen, særlig sammen med NB-Whisper Large full presisjon.": "The smallest language model is recommended on this Mac, especially together with full precision NB-Whisper Large.",
  "Apple Silicon bruker Metal-akselerasjon. Språkmodellen er et eget valg, uavhengig av NB-Whisper og talergjenkjenning.": "Apple Silicon uses Metal acceleration. The language model is selected separately from NB-Whisper and speaker separation.",
  "Ordliste og tekstsnutter": "Dictionary and snippets",
  "Legg inn navn og fagord, ett per linje. Ordlisten hjelper talegjenkjenningen.": "Add names and technical terms, one per line. The dictionary helps speech recognition.",
  "Ordliste": "Dictionary",
  "Lagre ordliste": "Save dictionary",
  "En tekstsnutt erstatter en uttalt frase med en fast tekst.": "A snippet replaces a spoken phrase with predefined text.",
  "Uttalt frase": "Spoken phrase",
  "Tekst som settes inn": "Replacement text",
  "Lagre tekstsnutt": "Save snippet",
  "Fjern": "Remove",
  "Prøv en lydfil": "Transcribe an audio file",
  "Åpne Apple Taleopptak": "Open Apple Voice Memos",
  "Velg dokumentmappe": "Choose document folder",
  "Dokumentmappe:": "Document folder:",
  "Dokumenter på denne Mac-en": "Documents on this Mac",
  ". Velg en iCloud Drive-mappe for synkronisering. Lyd lagres bare når du velger «Lagre lydfil».": ". Choose an iCloud Drive folder for synchronization. Audio is exported only when you choose Save audio file.",
  "Fra Taleopptak: dra opptaket til Finder, og velg M4A-filen her. Opptak synkronisert fra iPhone kan brukes på samme måte.": "From Voice Memos: drag the recording to Finder, then select the M4A file here. Recordings synchronized from iPhone work the same way.",
  "Velg en lokal WAV-, MP3-, M4A- eller WebM-fil. Filen behandles på Mac-en.": "Select a local WAV, MP3, M4A or WebM file. It is processed on the Mac.",
  "Skill talere med lokal talermodell": "Separate speakers using a local speaker model",
  "Talernumre er forslag. Du kan endre dem til navn i teksten etterpå. Overlappende tale kan gi feil.": "Speaker numbers are suggestions. You can replace them with names afterwards. Overlapping speech may cause errors.",
  "Velg lokal lydfil": "Select a local audio file",
  "Transkribert tekst": "Transcribed text",
  "Lagre lydfil": "Save audio file",
  "Kopier teksten": "Copy text",
  "Lagre som Word-dokument": "Save as Word document",
  "Lagre som PDF": "Save as PDF",
  "Lagre som tekstfil": "Save as text file",
  "Ta med tidsstempler": "Include timestamps",
  "Ta med talernavn eller talernummer": "Include speaker names or numbers",
  "Disse valgene gjelder bare eksporten. Teksten ovenfor beholdes uendret.": "These options affect only the export. The text above is kept unchanged.",
  "Velg ønsket mappe i lagringsvinduet, også Google Drive, OneDrive eller synkroniserte Teams-mapper i Finder.": "Choose a folder in the save dialog, including Google Drive, OneDrive or synchronized Teams folders in Finder.",
  "Siste dikteringer": "Recent dictations",
  "Dikteringer vises her etter bruk. Tekst lagres lokalt på denne Mac-en.": "Dictations appear here after use. Text is stored locally on this Mac.",
  "Automatisk tekstopprydding:": "Automatic text cleanup:",
  ". Automatiske oppdateringer:": ". Automatic updates:",
  "deaktivert": "disabled",
  "Mikrofontillatelse": "Microphone permission",
  "Tilgjengelighet og innliming": "Accessibility and pasting",
  "Uavhengig NB-utgave av OpenWhispr 1.9.2. Modeller: Nasjonalbiblioteket. Kun Apple Silicon. Teknisk minstekrav macOS 26.0; funksjonstestet på macOS 27.0.1. Lisensopplysninger følger med i appens Resources/legal-mappe.": "Independent NB edition of OpenWhispr 1.9.2. Speech models: National Library of Norway. Apple Silicon only. Minimum macOS 26.0; tested on macOS 27.0.1. License information is included in the app's Resources/legal folder.",
  "Hurtigtasten kunne ikke registreres. Velg en annen kombinasjon.": "Could not register the shortcut. Choose a different combination.",
  "Arbeider med lokal språkmodell …": "Running the local language model …",
  "Ferdig. Kontroller teksten før bruk.": "Done. Check the text before using it.",
  "Dokumentet er lagret på valgt sted.": "The document was saved to the selected location.",
  "Transkriberer lokalt …": "Transcribing locally …",
  "Ferdig. Ingen lyd er lastet opp.": "Done. No audio was uploaded.",
  "Ingen tale ble funnet.": "No speech was found.",
  "Tar opp 5 sekunder fra valgt mikrofon. Snakk nå …": "Recording 5 seconds from the selected microphone. Speak now …",
  "Akselerasjonen endres når appen startes på nytt.": "Acceleration will change when the app restarts.",
  "Laster ned språkmodellen …": "Downloading the language model …",
  "Språkmodellen er klar.": "The language model is ready.",
  "Ordlisten er lagret.": "Dictionary saved.",
  "Tekstsnutten er lagret.": "Snippet saved.",
  "Analyserer talere og transkriberer lokalt …": "Analyzing speakers and transcribing locally …",
  "Ferdig. Kontroller talerfordelingen og skriv inn navn ved behov.": "Done. Check the speaker assignments and enter names if needed.",
  "Lydfilen er lagret på valgt sted.": "The audio file was saved to the selected location.",
  "Rydd teksten": "Clean up text",
  "Formater notat": "Format note",
  "Spør lokal assistent": "Ask local assistant",
  "på": "on",
  "av": "off"
};
