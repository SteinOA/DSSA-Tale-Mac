import NBWhisperDownloads from "./NBWhisperDownloads";
import { nbInterfaceText } from "../utils/nbInterfaceText";
import React, { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

export default function NBOnboarding({ onComplete }: { onComplete: () => void }) {
  const [modelReady,setModelReady] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [error, setError] = useState("");
  const settings = useSettingsStore();
  const ui=(nb:string,en:string=nb)=>nbInterfaceText(settings.uiLanguage,nb,en);
  const api = (window as any).electronAPI;
  useEffect(() => {
    const check = async () => {
      setAccessibility(Boolean(await api.checkAccessibilityTrusted()));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (stream) { stream.getTracks().forEach((t) => t.stop()); setMicrophone(true); }
    };
    void check();
    const onFocus = () => { void check(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  return <main className="nb-app-shell nb-onboarding"><div className="nb-onboarding-inner"><header><span className="nb-brand-mark">DSSA Tale</span>
    <label>{ui("Menyspråk", "Interface language")} <select value={settings.uiLanguage} onChange={e=>settings.setUiLanguage(e.target.value)}><option value="nb">Norsk bokmål</option><option value="nn">Norsk nynorsk</option><option value="en">English</option></select></label>
    <h1>{ui('Velkommen til DSSA Tale')}</h1>
    <p>{ui('Snakk norsk – få teksten der markøren står. Talegjenkjenningen kjører på denne Mac-en. Du trenger ingen konto, nøkkel eller abonnement.')}</p>
    </header><section className="nb-setup-card"><h2>{ui('Velg hvordan du vil skrive')}</h2>
    <label>{ui('Målform ')}<select value={settings.preferredLanguage} onChange={(e) => settings.setPreferredLanguage(e.target.value)}><option value="no">Bokmål</option><option value="nn">Nynorsk</option></select></label>
    <br/><label>{ui('Modell ')}<select value={settings.whisperModel} onChange={(e) => {settings.setWhisperModel(e.target.value);settings.setMeetingWhisperModel(e.target.value);settings.setUploadWhisperModel(e.target.value);}}><option value="nb-large">{ui('Kvantisert q5_0 – mindre minne')}</option><option value="nb-large-full">{ui('Full presisjon – standard')}</option></select></label>
    <NBWhisperDownloads language={settings.uiLanguage} selected={settings.whisperModel} onReady={setModelReady}/></section><div className="nb-permission-grid"><section className="nb-setup-card"><h2>{ui('1. Mikrofon')}</h2>
    <p>{ui('Velg «Tillat» når Mac-en spør. Mikrofon, også BlackHole 2ch, kan velges senere i innstillingene.')}</p>
    <button onClick={async () => {const ok=await api.requestMicrophoneAccess();setMicrophone(Boolean(ok));if(!ok) await api.openMicrophoneSettings();}}> {microphone ? ui("✓ Mikrofon tillatt") : ui("Gi tilgang til mikrofon")}</button>
    </section><section className="nb-setup-card"><h2>{ui('2. Innliming i andre apper')}</h2>
    <p>{ui('Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet. På nyere macOS heter valget «Enhetskontroll og datatilgang». Legg til DSSA Tale fra Programmer og slå på tilgangen. Dette lar appen lime inn teksten i tekstfeltet du bruker.')}</p>
    {!accessibility && <p className="nb-setup-hint">{ui('Allerede slått på? Fjern den gamle DSSA Tale-oppføringen, legg til appen fra Programmer igjen og start på nytt.')}</p>}
    <button onClick={() => api.openAccessibilitySettings()}>{accessibility ? ui("✓ Tilgjengelighet tillatt") : ui("Åpne Tilgjengelighet")}</button>
    </section></div><footer><p>{ui('Start og stopp med ')}<kbd className="nb-shortcut">{settings.dictationKey || "⌘ ⇧ mellomrom"}</kbd>{ui('. Tekstopprydding er av som standard.')}</p>
    {error && <p role="alert">{ui(error)}</p>}
    <button className="nb-primary-pill" disabled={!modelReady} onClick={async () => {
      if(!modelReady)return;
      try {
        const modelStatus=await api.checkModelStatus(settings.whisperModel);
        if(!modelStatus?.downloaded || modelStatus?.isDownloading){setModelReady(false);return;}
      } catch {setModelReady(false);return;}
      const trusted=await api.checkAccessibilityTrusted();
      if(!microphone || !trusted) {setError("Gi begge tillatelsene før du fortsetter. Hvis macOS ber deg avslutte appen, åpner du den igjen fra Programmer.");return;}
      await api.updateHotkey(settings.dictationKey || "Command+Shift+Space");
      settings.setUseLocalWhisper(true);
      settings.setTranscriptionMode("local");
      settings.setUseCleanupModel(false);
      settings.setUseDictationAgent(false);
      localStorage.setItem("authenticationSkipped","true");
      localStorage.setItem("skipAuth","true");
      onComplete();
    }}>{ui('Åpne DSSA Tale')}</button>
    <p style={{fontSize:12,marginTop:18}}>{ui('Uavhengig tilpasning av OpenWhispr 1.9.2. Ikke et offisielt produkt fra OpenWhispr eller Nasjonalbiblioteket. Lisensene ligger i appens Resources/legal-mappe.')}</p>
  </footer></div></main>;
}
