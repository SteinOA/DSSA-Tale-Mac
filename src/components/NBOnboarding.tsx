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
  return <main style={{height:"100vh",overflowY:"auto",padding:24,maxWidth:650,margin:"auto",fontFamily:"system-ui",lineHeight:1.5}}>
    <h1 style={{fontSize:28,fontWeight:700}}>Velkommen til DSSA Tale</h1>
    <p>Snakk norsk – få teksten der markøren står. Talegjenkjenningen kjører på denne Mac-en. Du trenger ingen konto, nøkkel eller abonnement.</p>
    <p>Begge NB-Whisper Large-modellene fra Nasjonalbiblioteket følger med. Ingen modellnedlasting er nødvendig.</p>
    <label>Målform <select value={settings.preferredLanguage} onChange={(e) => settings.setPreferredLanguage(e.target.value)}><option value="no">Bokmål</option><option value="nn">Nynorsk</option></select></label>
    <br/><label>Modell <select value={settings.whisperModel} onChange={(e) => settings.setWhisperModel(e.target.value)}><option value="nb-large">Kvantisert q5_0 – mindre minne</option><option value="nb-large-full">Full presisjon – standard</option></select></label>
    <h2 style={{fontSize:20,marginTop:20}}>1. Tillat mikrofon</h2>
    <p>Mac-en må gi appen lov til å høre mikrofonen. Velg «Tillat» når macOS spør. Du kan senere velge mikrofon, også BlackHole 2ch, i appens mikrofonvalg.</p>
    <button onClick={async () => {const ok=await api.requestMicrophoneAccess();setMicrophone(Boolean(ok));if(!ok) await api.openMicrophoneSettings();}}> {microphone ? "✓ Mikrofon tillatt" : "Gi tilgang til mikrofon"}</button>
    <h2 style={{fontSize:20,marginTop:20}}>2. Tillat innliming i andre apper</h2>
    <p>Åpne Systeminnstillinger → Personvern og sikkerhet → Tilgjengelighet. Slå på «DSSA Tale», og gå tilbake hit. Dette lar appen lime inn teksten i tekstfeltet du bruker.</p>
    <button onClick={() => api.openAccessibilitySettings()}>{accessibility ? "✓ Tilgjengelighet tillatt" : "Åpne Tilgjengelighet"}</button>
    <p style={{marginTop:20}}>Trykk <strong>⌘ ⇧ mellomrom</strong> for å starte opptak. Snakk, og trykk igjen for å stoppe. Tekstopprydding og stemmeassistent er slått av. Denne utgaven oppdateres manuelt.</p>
    {error && <p role="alert">{error}</p>}
    <button style={{marginTop:12,padding:"10px 24px",background:"#176448",color:"white",borderRadius:8}} onClick={async () => {
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
    }}>Start diktering</button>
    <p style={{fontSize:12,marginTop:18}}>Uavhengig tilpasning av OpenWhispr 1.9.2. Ikke et offisielt produkt fra OpenWhispr eller Nasjonalbiblioteket. Lisensene ligger i appens Resources/legal-mappe.</p>
  </main>;
}
