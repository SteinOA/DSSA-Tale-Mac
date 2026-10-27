import React, { useEffect, useState } from "react";
import { HotkeyListInput } from "./ui/HotkeyListInput";
import ControlPanel from "./ControlPanel";
import { useMeetingRecordingStore, stopRecording as stopMeetingRecording } from "../stores/meetingRecordingStore";
import { useSettingsStore } from "../stores/settingsStore";

export default function NBControlPanel() {
  const s = useSettingsStore();
  const meetingRecording = useMeetingRecordingStore(state=>state.isRecording);
  const meetingTranscribing = useMeetingRecordingStore(state=>state.isTranscribing);
  const api = (window as any).electronAPI;
  const [pasteStatus,setPasteStatus] = useState<any>(null);
  const refreshPasteStatus=async()=>{try{if(api.nbPasteStatus)setPasteStatus(await api.nbPasteStatus());}catch{setPasteStatus(null);}};
  const [includeTimestamps,setIncludeTimestamps] = useState(false);
  const [includeSpeakers,setIncludeSpeakers] = useState(false);
  const ui=(value:string)=>s.uiLanguage === "en" ? (NB_ENGLISH[value] || value) : value;
  const [memory,setMemory] = useState<any>(null);
  const [preferences,setPreferences] = useState<any>({});
  const [sourceAudio,setSourceAudio] = useState<{bytes:ArrayBuffer,name:string}|null>(null);
  const [limit,setLimit] = useState(()=>localStorage.getItem("nbDictationMinutes") || "10");
  const [profile,setProfile] = useState<any>(null);
  const [accent,setAccent] = useState(()=>localStorage.getItem("nbAccent") || "#2563eb");
  const [acceleration,setAcceleration] = useState("metal");
  const [separateSpeakers, setSeparateSpeakers] = useState(false);
  const [advanced, setAdvanced] = useState(true);
  const [panelFocus,setPanelFocus] = useState("settings");
  const openNBPanel=(section="settings")=>{setPanelFocus(["settings","files","assistant","speech","shortcuts","recording","appearance"].includes(section) ? section : "settings");setAdvanced(false);};
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
  useEffect(()=>api.onModelDownloadProgress?.((event:any)=>{
    if(event.type==="complete"||event.type==="error"){
      setDownloadStatus((current:any)=>current?.modelId===event.modelId?null:current);
      void refreshModels();
      if(event.type==="error")setMessage(downloadError(event));
    }else setDownloadStatus(event);
  }),[]);
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
      const result=await api.processLocalReasoning(text,s.cleanupModel,null,{temperature:0.2,systemPrompt:instruction+" Skriv på "+(s.preferredLanguage==="nn"?"nynorsk.":"bokmål.")});
      if(!result.success) throw new Error(result.error);setText(result.text);setMessage("Ferdig. Kontroller teksten før bruk.");
    }catch(e){setMessage(String(e));}finally{setBusy(false);}
  };
  const saveText = async (format="docx") => {
    try{const result=await api.nbSaveDocument(text,format,{includeTimestamps,includeSpeakers});if(result.success)setMessage("Dokumentet er lagret på valgt sted.");}catch(error){setMessage(String(error));}
  };
  useEffect(()=>{document.documentElement.style.setProperty("--nb-accent",accent);localStorage.setItem("nbAccent",accent);},[accent]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
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
    if(!localStorage.getItem("nbUiLanguageInitialized")){s.setUiLanguage("nb");localStorage.setItem("nbUiLanguageInitialized","true");}
    void refreshPasteStatus();
    void api.nbGetPreferences().then(setPreferences);
    const refreshMemory=()=>{void api.nbMemory().then(setMemory);};refreshMemory();const memoryTimer=setInterval(refreshMemory,5000);
    void api.nbLocalProfile().then(setProfile);
    void api.nbGetAcceleration().then(setAcceleration);
    void refreshModels();
    const refresh = async () => {
      setDevices((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput"));
    };
    void refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    const openNBSettings=()=>openNBPanel();window.addEventListener("nb-open-settings",openNBSettings);
    const meetingPending = api.onMeetingNoteNavigationPending?.(()=>setAdvanced(true));
    const onFocus = () => { void refresh(); void refreshPasteStatus(); };
    window.addEventListener("focus", onFocus);
    return () => {window.removeEventListener("nb-open-settings",openNBSettings);clearInterval(memoryTimer);meetingPending?.();navigator.mediaDevices.removeEventListener("devicechange", refresh);window.removeEventListener("focus", onFocus);};
  }, []);
  const transcribe = async (buffer: ArrayBuffer) => {
    setBusy(true); setMessage("Transkriberer lokalt …");
    try {
      const result = await api.transcribeLocalWhisper(buffer, {model:s.whisperModel,language:s.preferredLanguage});
      if(!result.success) {
        if(result.message === "No audio detected" || result.error === "No audio detected") {setMessage("Ingen tale ble registrert. Kontroller valgt mikrofon og at den mottar lyd.");return;}
        throw new Error(result.error || result.message || "Talegjenkjenningen mislyktes.");
      }
      setText(result.text || ""); setMessage(result.text?.trim() ? "Ferdig. Ingen lyd er lastet opp." : "Ingen tale ble funnet.");
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
  const pageTitles: Record<string,string> = {settings:"Innstillinger",files:"Lydfiler",assistant:"Assistent",speech:"Tale og mikrofon",shortcuts:"Hurtigtaster",recording:"Opptak og innliming",appearance:"Utseende og språk"};
  const content = <div className="nb-control-panel" style={{padding:"12px 20px 24px",maxWidth:720,margin:"auto",fontFamily:"system-ui",fontSize:13,lineHeight:1.45}}>
    <style>{`.nb-control-panel button{border:1px solid color-mix(in srgb,var(--nb-accent) 45%,transparent);border-radius:6px;padding:5px 9px;margin:3px 4px 3px 0}.nb-control-panel button:hover:not(:disabled){background:color-mix(in srgb,var(--nb-accent) 14%,transparent)}.nb-control-panel button:disabled{opacity:.5}.nb-control-panel select,.nb-control-panel input,.nb-control-panel textarea{border:1px solid #8885;border-radius:5px;padding:4px;margin:3px;max-width:100%}.nb-control-panel input[type=checkbox]{accent-color:var(--nb-accent)}.nb-control-panel h1{color:var(--nb-accent);margin-bottom:12px}.nb-control-panel h2{font-weight:650;font-size:14px;margin:8px 0}.nb-control-panel section{margin-top:8px}.nb-control-panel section>label{display:inline-block;margin:4px 0}.nb-control-panel textarea{resize:none;overflow-y:auto}.nb-control-panel p{margin:7px 0}.nb-control-panel select option{background:Canvas;color:CanvasText}`}</style>
    <h1 style={{fontSize:22,fontWeight:700}}>{ui(pageTitles[panelFocus])}</h1>
    {(meetingRecording || meetingTranscribing) && <aside role="status" style={{padding:12,border:"1px solid var(--nb-accent)",borderRadius:8}}>{ui(meetingRecording ? "Møteopptak pågår" : "Møtet transkriberes …")}{" "}{meetingRecording && <button onClick={()=>void stopMeetingRecording()}>{ui("Stopp møteopptaket")}</button>}</aside>}
    {(panelFocus === "speech" || panelFocus === "assistant") && memory && <p><small>{ui("Minne:")} {(memory.rss/2**30).toFixed(1)} / {(memory.total/2**30).toFixed(0)} GB · {ui("App og modellmotorer (RSS)")}</small></p>}
    {message && <p role="status">{ui(message)}</p>}
    {panelFocus === "settings" && <section>
      <p>{ui("Velg en innstillingsside i menyen eller nedenfor.")}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:16}}>{(["speech","shortcuts","recording","appearance"]).map(id=><button key={id} style={{padding:20,textAlign:"left"}} onClick={()=>openNBPanel(id)}>{ui(pageTitles[id])}</button>)}</div>
      <p>{ui("Alt behandles lokalt. Valgene lagres automatisk.")}</p>
    </section>}
    {panelFocus === "speech" && <section>
      <label>{ui("Målform") + " "}<select aria-label={ui("Målform")} value={s.preferredLanguage} onChange={(e)=>s.setPreferredLanguage(e.target.value)}><option value="no">{ui("Bokmål")}</option><option value="nn">{ui("Nynorsk")}</option></select></label><br/>
      <label>{ui("Modell") + " "}<select aria-label={ui("Modell")} value={s.whisperModel} onChange={(e)=>{s.setWhisperModel(e.target.value);s.setMeetingWhisperModel(e.target.value);s.setUploadWhisperModel(e.target.value);}}><option value="nb-large">{ui("NB-Whisper Large – kvantisert q5_0 (mindre minne)")}</option><option value="nb-large-full">{ui("NB-Whisper Large – full presisjon (standard)")}</option></select></label><br/>
      <label>{ui("Akselerasjon for talegjenkjenning") + " "}<select value={acceleration} disabled={busy} onChange={async e=>{const value=e.target.value;try{await api.nbSetAcceleration(value);setAcceleration(value);setMessage("Akselerasjonen endres når appen startes på nytt.");}catch(error){setMessage(String(error));}}}><option value="metal">{ui("Metal – Apple Silicon (standard)")}</option><option value="cpu">{ui("CPU – uten grafikkakselerasjon")}</option></select></label><br/>
      <label>{ui("Mikrofon") + " "}<select aria-label={ui("Mikrofon")} value={s.microphoneSelectionMode === "specific" ? s.selectedMicDeviceId : "system"} onChange={(e)=>{const d=devices.find((d)=>d.deviceId===e.target.value);if(d){s.setSelectedMicDevice(d.deviceId,d.label);s.setMicrophoneSelectionMode("specific");}else{s.setMicrophoneSelectionMode("system");}}}><option value="system">{ui("Følg Mac-ens standardmikrofon")}</option>{devices.filter(d=>d.deviceId!=="default").map(d=><option key={d.deviceId} value={d.deviceId}>{d.label || "Mikrofon"}</option>)}</select></label>
      <p style={{fontSize:13}}>{ui("Begge modeller følger med appen. Full presisjon krever mer minne. Valg av mikrofon her endrer ikke Mac-ens lydruting.")}</p>
      <p><small>{ui("BlackHole er en virtuell lydinngang. Den hører bare lyd som sendes til den.")}</small></p>
      <button disabled={busy} onClick={testMic}>{ui("Test valgt mikrofon i 5 sekunder")}</button>
      <p><button onClick={()=>api.openMicrophoneSettings()}>{ui("Mikrofontillatelse")}</button><button onClick={()=>api.openAccessibilitySettings()}>{ui("Tilgjengelighet og innliming")}</button></p>
      <section aria-label={ui("Automatisk innliming")}>
        <h2>{ui(pasteStatus?.trusted && pasteStatus?.canPost && pasteStatus?.nativeAvailable ? "Automatisk innliming: klar" : "Automatisk innliming trenger Mac-tillatelse")}</h2>
        {!(pasteStatus?.trusted && pasteStatus?.canPost && pasteStatus?.nativeAvailable) && <p>{ui("Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet (Enhetskontroll og datatilgang på macOS 27). Slå på DSSA Tale og start appen på nytt. Er den allerede på, fjern den gamle oppføringen og legg til appen fra Programmer på nytt.")}</p>}
        <button onClick={()=>void refreshPasteStatus()}>{ui("Kontroller innliming")}</button>
        <button disabled={busy||!pasteStatus?.trusted||!pasteStatus?.canPost||!pasteStatus?.nativeAvailable} onClick={async()=>{setBusy(true);setMessage("Klikk i et tomt dokument nå. Testteksten settes inn om 5 sekunder.");try{const result=await api.nbTestPaste();setMessage(result.success ? "Innlimingstesten er sendt. Kontroller teksten i dokumentet." : (result.error || "Innlimingstesten mislyktes."));}catch(error){setMessage(String(error));}finally{setBusy(false);void refreshPasteStatus();}}}>{ui("Test innliming om 5 sekunder")}</button>
      </section>
      {text && <textarea aria-label={ui("Resultat av mikrofontest")} readOnly value={text} style={{width:"100%",height:70}}/>}
    </section>}
    {panelFocus === "shortcuts" && <section>
      <p>{ui("Diktering – klikk på feltet og trykk ønsket tastekombinasjon.")}</p>
      <HotkeyListInput value={s.dictationKey} required onChange={(v)=>register(v)}/>
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
      <label>{ui("Menyspråk") + " "}<select value={s.uiLanguage} onChange={e=>s.setUiLanguage(e.target.value)}><option value="nb">{ui("Norsk bokmål")}</option><option value="en">English</option></select></label>
    </section>}
    {panelFocus === "assistant" && <section id="nb-ai">
      <h2>{ui("Lokal språkmodell og tekstopprydding")}</h2>
      <p>{ui("Last ned én gang. Deretter behandles teksten lokalt.")}</p>
      <select aria-label={ui("Lokal språkmodell")} disabled={busy||!!downloadStatus} value={selectedModel ? s.cleanupModel : ""} onChange={e=>{s.setCleanupModel(e.target.value);s.setCleanupProvider("qwen");s.setNoteFormattingMode("local");s.setNoteFormattingProvider("qwen");s.setNoteFormattingModel(e.target.value);s.setChatAgentMode("local");s.setChatAgentProvider("qwen");s.setChatAgentModel(e.target.value);s.setUseCleanupModel(false);}}><option value="">{ui("Velg språkmodell")}</option>{models.map(m=><option key={m.id} value={m.id}>{m.name} ({m.size}){m.isDownloaded?" – klar":""}</option>)}</select>
      <button disabled={busy||!!downloadStatus||!selectedModel||selectedModel.isDownloaded} onClick={downloadSelectedModel}>{ui(selectedModel?.isDownloaded ? "Modellen er klar" : "Last ned valgt modell")}</button><br/>
      {downloadStatus && <div role="status"><label>{ui("Laster ned språkmodellen …")} {Math.floor(downloadStatus.progress || 0)} %<progress style={{width:"100%"}} max={100} value={downloadStatus.progress || 0}/></label><small>{((downloadStatus.downloadedSize||0)/1e9).toFixed(2)} / {((downloadStatus.totalSize||0)/1e9).toFixed(2)} GB</small></div>}

      <label><input type="checkbox" disabled={!models.some(m=>m.id===s.cleanupModel&&m.isDownloaded)} checked={s.useCleanupModel} onChange={e=>s.setUseCleanupModel(e.target.checked)}/>{" " + ui("Rydd diktering automatisk (av som standard)")}</label>
    </section>
    }
    {panelFocus === "files" && <section id="nb-files">
      <h2>{ui("Prøv en lydfil")}</h2>
      <button onClick={()=>api.nbOpenVoiceMemos()}>{ui("Åpne Apple Taleopptak")}</button><button onClick={async()=>{const result=await api.nbStorageFolder();if(result.path)setPreferences({...preferences,documentFolder:result.path});}}>{ui("Velg dokumentmappe")}</button>
      <p>{ui("Velg en lokal WAV-, MP3-, M4A- eller WebM-fil. Filen behandles på Mac-en.")}</p>
      <label><input type="checkbox" checked={separateSpeakers} onChange={e=>setSeparateSpeakers(e.target.checked)}/>{" " + ui("Skill talere med lokal talermodell")}</label>
      <input aria-label={ui("Velg lokal lydfil")} type="file" accept="audio/*,.webm" disabled={busy} onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;setSourceAudio({bytes:await f.arrayBuffer(),name:f.name});if(!separateSpeakers){await transcribe(await f.arrayBuffer());return;}
        setBusy(true);setMessage("Analyserer talere og transkriberer lokalt …");
        try{const path=api.getPathForFile(f);const result=await api.diarizeAudioFile(path,{nbTranscribe:true,model:s.whisperModel,language:s.preferredLanguage});if(!result.success)throw new Error(result.error);const names=new Map<string,string>();setText(result.segments.map((part:any)=>{if(!names.has(part.speaker))names.set(part.speaker,"Taler "+(names.size+1));return "["+Math.floor(part.start/60)+":"+String(Math.floor(part.start%60)).padStart(2,"0")+"] "+names.get(part.speaker)+": "+part.text;}).join("\n\n"));setMessage("Ferdig. Kontroller talerfordelingen og skriv inn navn ved behov.");}catch(e){setMessage(String(e));}finally{setBusy(false);}}}/>
    </section>}
    {(panelFocus === "files" || panelFocus === "assistant") && <section aria-label={ui("Tekst og eksport")}>
      <textarea aria-label={ui(panelFocus === "assistant" ? "Tekst eller spørsmål" : "Transkribert tekst")} style={{width:"100%",height:120,padding:12,border:"1px solid #8885",borderRadius:8}} value={text} onChange={(e)=>setText(e.target.value)}/>
      {panelFocus === "files" && <button disabled={!sourceAudio||busy} onClick={async()=>{if(sourceAudio){const result=await api.nbSaveAudio(sourceAudio.bytes,sourceAudio.name);if(result.success)setMessage("Lydfilen er lagret på valgt sted.");}}}>{ui("Lagre lydfil")}</button>}
      <p><label><input type="checkbox" checked={includeTimestamps} onChange={e=>setIncludeTimestamps(e.target.checked)}/>{" " + ui("Ta med tidsstempler")}</label>{" "}<label><input type="checkbox" checked={includeSpeakers} onChange={e=>setIncludeSpeakers(e.target.checked)}/>{" " + ui("Ta med talernavn eller talernummer")}</label></p>
      <button onClick={()=>api.writeClipboard(text)} disabled={!text}>{ui("Kopier teksten")}</button>{" "}<button disabled={!text} onClick={()=>saveText("docx")}>{ui("Lagre som Word-dokument")}</button>
      <button disabled={!text} onClick={()=>saveText("pdf")}>{ui("Lagre som PDF")}</button>
      <button disabled={!text} onClick={()=>saveText("txt")}>{ui("Lagre som tekstfil")}</button>
      <p>{(["cleanup","notes","assistant"] as const).map((task,i)=><button key={task} disabled={busy||!text||!models.some(m=>m.id===s.cleanupModel&&m.isDownloaded)} onClick={()=>runAI(task)}>{ui(["Rydd teksten","Formater notat","Spør lokal assistent"][i])}</button>)}</p>
    </section>}
  </div>;
  return <ControlPanel nbSettings={openNBPanel} nbProfile={profile} nbContent={advanced ? undefined : content} nbSection={advanced ? undefined : panelFocus} nbOnNavigate={()=>setAdvanced(true)}/>;
}

const NB_ENGLISH: Record<string,string> = {
"Automatisk innliming":"Automatic pasting",
"Automatisk innliming: klar":"Automatic pasting: ready",
"Automatisk innliming trenger Mac-tillatelse":"Automatic pasting needs Mac permission",
"Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet (Enhetskontroll og datatilgang på macOS 27). Slå på DSSA Tale og start appen på nytt. Er den allerede på, fjern den gamle oppføringen og legg til appen fra Programmer på nytt.":"Open System Settings \u2192 Privacy & Security \u2192 Accessibility (Device Control and Data Access on macOS 27). Enable DSSA Tale and restart the app. If already enabled, remove the old entry and add the app from Applications again.",
"Kontroller innliming":"Check pasting",
"Test innliming om 5 sekunder":"Test pasting in 5 seconds",
"Klikk i et tomt dokument nå. Testteksten settes inn om 5 sekunder.":"Click in an empty document now. Test text will be pasted in 5 seconds.",
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
