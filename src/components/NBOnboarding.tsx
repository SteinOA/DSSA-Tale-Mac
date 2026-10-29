import React, { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

export default function NBOnboarding({ onComplete }: { onComplete: () => void }) {
  const [microphone, setMicrophone] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [error, setError] = useState("");
  const settings = useSettingsStore();
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
    <h1>Velkommen til DSSA Tale</h1>
    <p>Snakk norsk – få teksten der markøren står. Talegjenkjenningen kjører på denne Mac-en. Du trenger ingen konto, nøkkel eller abonnement.</p>
    </header><section className="nb-setup-card"><h2>Velg hvordan du vil skrive</h2><p>Begge NB-Whisper Large-modellene følger med.</p>
    <label>Målform <select value={settings.preferredLanguage} onChange={(e) => settings.setPreferredLanguage(e.target.value)}><option value="no">Bokmål</option><option value="nn">Nynorsk</option></select></label>
    <br/><label>Modell <select value={settings.whisperModel} onChange={(e) => {settings.setWhisperModel(e.target.value);settings.setMeetingWhisperModel(e.target.value);settings.setUploadWhisperModel(e.target.value);}}><option value="nb-large">Kvantisert q5_0 – mindre minne</option><option value="nb-large-full">Full presisjon – standard</option></select></label>
    </section><div className="nb-permission-grid"><section className="nb-setup-card"><h2>1. Mikrofon</h2>
    <p>Velg «Tillat» når Mac-en spør. Mikrofon, også BlackHole 2ch, kan velges senere i innstillingene.</p>
    <button onClick={async () => {const ok=await api.requestMicrophoneAccess();setMicrophone(Boolean(ok));if(!ok) await api.openMicrophoneSettings();}}> {microphone ? "✓ Mikrofon tillatt" : "Gi tilgang til mikrofon"}</button>
    </section><section className="nb-setup-card"><h2>2. Innliming i andre apper</h2>
    <p>Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet. På nyere macOS heter valget «Enhetskontroll og datatilgang». Legg til DSSA Tale fra Programmer og slå på tilgangen. Dette lar appen lime inn teksten i tekstfeltet du bruker.</p>
    {!accessibility && <p className="nb-setup-hint">Allerede slått på? Fjern den gamle DSSA Tale-oppføringen, legg til appen fra Programmer igjen og start på nytt.</p>}
    <button onClick={() => api.openAccessibilitySettings()}>{accessibility ? "✓ Tilgjengelighet tillatt" : "Åpne Tilgjengelighet"}</button>
    </section></div><footer><p>Start og stopp med <kbd className="nb-shortcut">{settings.dictationKey || "⌘ ⇧ mellomrom"}</kbd>. Tekstopprydding er av som standard.</p>
    {error && <p role="alert">{error}</p>}
    <button className="nb-primary-pill" onClick={async () => {
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
    }}>Åpne DSSA Tale</button>
    <p style={{fontSize:12,marginTop:18}}>Uavhengig tilpasning av OpenWhispr 1.9.2. Ikke et offisielt produkt fra OpenWhispr eller Nasjonalbiblioteket. Lisensene ligger i appens Resources/legal-mappe.</p>
  </footer></div></main>;
}
