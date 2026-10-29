import React, { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

export default function NBIntegrations() {
  const api = (window as any).electronAPI;
  const english = useSettingsStore((s) => s.uiLanguage === "en");
  const tr = (nb: string, en: string) => english ? en : nb;
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const refresh = () => {void api.acalGetConnectionStatus().then((r: any) => setConnected(!!r?.connected)).catch(() => {});};
    refresh();
    window.addEventListener("focus", refresh);
    const unsubscribe=api.onAcalConnectionChanged?.(refresh);
    return ()=>{window.removeEventListener("focus",refresh);unsubscribe?.();};
  }, []);
  const toggleCalendar = async () => {
    setBusy(true);
    try {
      if (connected) {
        const result=await api.acalDisconnect();
        if(result?.success === false)throw new Error(result.error || tr("Kunne ikke koble fra kalenderen.","Could not disconnect the calendar."));
        setConnected(false);
      } else {
        const result = await api.acalConnect();
        if (result?.success === false) {
          const reasons: Record<string,string>={
            "helper-missing":tr("Kalenderkomponenten mangler i appen. Installer appen på nytt.","The app's calendar component is missing. Reinstall the app."),
            "unsupported":tr("Apple Kalender støttes bare på Mac.","Apple Calendar is only supported on Mac."),
            "snapshot-failed":tr("Kalenderne kunne ikke leses. Prøv igjen.","Could not read calendars. Try again."),
            "denied":tr("Gi DSSA Tale kalendertilgang i Systeminnstillinger → Personvern og sikkerhet → Kalendere.","Allow DSSA Tale access in System Settings → Privacy & Security → Calendars."),
          };
          throw new Error(result.error || reasons[result.reason] || tr("Kalendertilgang ble ikke gitt.", "Calendar access was not granted."));
        }
        const status = await api.acalGetConnectionStatus(); setConnected(!!status?.connected);
        if(!status?.connected){setMessage(tr("Ingen kalendere ble funnet. Legg til en kalender i Apple Kalender og prøv igjen.","No calendars were found. Add a calendar in Apple Calendar and try again."));return;}
      }
      setMessage(tr("Kalenderstatus oppdatert.", "Calendar status updated."));
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  };
  return <section style={{ padding: 32, lineHeight: 1.7 }}>
    <h1>{tr("Integrasjoner", "Integrations")}</h1>
    <h2>{tr("Apple Kalender på denne Mac-en", "Apple Calendar on this Mac")}</h2>
    <p>{tr("Valgfritt. Vis møtene fra Kalender-appen. Dette kan også omfatte Google- eller Outlook-kalendere du allerede har lagt til i macOS. Tilkoblingen krever kalendertilgang.", "Optional. Show meetings from Calendar. This can include Google or Outlook calendars already added to macOS. Connecting requires calendar permission.")}</p>
    <button onClick={toggleCalendar} disabled={busy}>{connected ? tr("Koble fra kalender", "Disconnect calendar") : tr("Koble til Apple Kalender", "Connect Apple Calendar")}</button>
    <p role="status">{message}</p>
    <h2>{tr("Teams og andre møteapper", "Teams and other meeting apps")}</h2>
    <p>{tr("Bruk møtemodus under Notater. DSSA Tale tar opp lokalt fra systemlyden og valgt mikrofon. Appen blir ikke med som en bot i møtet og trenger ikke Teams-kontoen din. Automatisk Teams-start er et eget valgfritt forsøksvalg i innstillingene.", "Use meeting mode in Notes. DSSA Tale records system audio and your selected microphone locally. It does not join the meeting as a bot and does not need your Teams account. Automatic Teams start is a separate optional experimental setting.")}</p>
    <h2>{tr("Dokumenter og skylagring", "Documents and cloud storage")}</h2>
    <p>{tr("Velg Google Drive, OneDrive, iCloud Drive eller synkroniserte Teams-mapper i Åpne- og Lagre-vinduene. Tjenesten må allerede være tilgjengelig i Finder. DSSA Tale behandler lyden lokalt; en synkroniseringstjeneste kan laste opp filer du lagrer i dens mappe.", "Choose Google Drive, OneDrive, iCloud Drive or synchronized Teams folders in the Open and Save dialogs. The service must already be available in Finder. DSSA Tale processes audio locally; a synchronization service may upload files saved in its folder.")}</p>
    <h2>{tr("E-post og andre tekstfelt", "Email and other text fields")}</h2>
    <p>{tr("Bruk dikteringssnarveien i Mail, Outlook, Word, Teams og andre tekstfelt. Du sender selv teksten. Lesing av innboksen og synkronisering av e-post er ikke koblet til i denne utgaven.", "Use the dictation shortcut in Mail, Outlook, Word, Teams and other text fields. You send the text yourself. Inbox reading and email synchronization are not connected in this edition.")}</p>
    <p>{tr("Alt nødvendig for talegjenkjenning kjører lokalt, uten konto eller API-nøkkel.", "Everything needed for speech recognition runs locally, without an account or API key.")}</p>
  </section>;
}
