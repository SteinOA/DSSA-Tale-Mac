import { NBCloudBrand } from "./NBCloudBrand";
import { nbInterfaceText } from "../utils/nbInterfaceText";
import React, { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

export default function NBIntegrations() {
  const api = (window as any).electronAPI;
  const language = useSettingsStore((s) => s.uiLanguage);
  const tr = (nb: string, en: string) => nbInterfaceText(language,nb,en);
  type CloudFolder = {id: "google" | "onedrive" | "icloud";path: string | null;status: "none" | "available" | "missing" | "denied"};
  const [folders,setFolders] = useState<CloudFolder[]>([]);
  const [folderBusy,setFolderBusy] = useState(false);
  const refreshFolders = async () => {
    try { const result=await api.nbCloudFoldersGet();setFolders(result.providers || []); }
    catch {setMessage(tr("Kunne ikke kontrollere mappene.","Could not check folders."));}
  };
  const folderAction = async (id:CloudFolder["id"],action:"choose"|"open"|"remove") => {
    setFolderBusy(true);setMessage("");
    try {
      const result=await (action === "choose" ? api.nbCloudFolderChoose(id) : action === "open" ? api.nbCloudFolderOpen(id) : api.nbCloudFolderRemove(id));
      if(result?.success === false)throw new Error("folder-unavailable");
      await refreshFolders();
    } catch {setMessage(tr("Mappen kunne ikke åpnes. Kontroller at den er tilgjengelig i Finder, eller velg en annen mappe.","Could not open the folder. Check that it is available in Finder, or choose another folder."));}
    finally {setFolderBusy(false);}
  };
  useEffect(()=>{void refreshFolders();},[]);
  const [page,setPage] = useState<"calendar"|"files"|"meetings"|"email">("calendar");
  const [calendarProvider,setCalendarProvider] = useState<"apple"|"outlook"|"google">("apple");
  const [calendarSources,setCalendarSources] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const refresh = () => {void api.acalGetConnectionStatus().then((r: any) => {setConnected(!!r?.connected);setCalendarSources(r?.sourceNames || []);}).catch(() => {});};
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
        setConnected(false);setCalendarSources([]);
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
        const status = await api.acalGetConnectionStatus(); setConnected(!!status?.connected);setCalendarSources(status?.sourceNames || []);
        if(!status?.connected){setMessage(tr("Ingen kalendere ble funnet. Legg til en kalender i Apple Kalender og prøv igjen.","No calendars were found. Add a calendar in Apple Calendar and try again."));return;}
      }
      setMessage(tr("Kalenderstatus oppdatert.", "Calendar status updated."));
    } catch (error) { setMessage(String(error)); } finally { setBusy(false); }
  };
  return <section style={{ padding: 32, lineHeight: 1.7 }}>
    <h1>{tr("Integrasjoner", "Integrations")}</h1>
    <nav className="nb-calendar-choices" aria-label={tr("Integrasjonssider","Integration pages")}>{([["calendar","Kalender","Calendar"],["files","Skymapper","Cloud folders"],["meetings","Møter","Meetings"],["email","E-post","Email"]] as const).map(([id,nb,en])=><button key={id} aria-pressed={page===id} data-active={page===id} onClick={()=>setPage(id)}>{tr(nb,en)}</button>)}</nav>
    <p role="status">{message}</p>
    {page === "calendar" && <section>
    <h2>{tr("Velg kalendertjeneste", "Choose calendar service")}</h2>
    <p>{tr("Apple/iCloud, Outlook og Google Kalender kan leses gjennom Kalender-appen på Mac-en. Dette valget viser veiledning for tjenesten din. Det logger deg ikke inn og endrer ikke hvilke kontoer Mac-en deler med appen.","Apple/iCloud, Outlook and Google Calendar can be read through Calendar on your Mac. This choice shows instructions for your service. It does not sign you in or change which accounts macOS shares with the app.")}</p>
    <div className="nb-calendar-choices">{([["apple",tr("Apple Kalender og FaceTime","Apple Calendar and FaceTime")],["outlook",tr("Microsoft-kalender og Teams","Microsoft calendar and Teams")],["google",tr("Google Kalender og Google Meet","Google Calendar and Google Meet")]] as const).map(([id,label])=><button key={id} className="nb-provider-choice" data-provider={id==="outlook"?"onedrive":id==="apple"?"icloud":"google"} aria-pressed={calendarProvider===id} data-active={calendarProvider===id} onClick={()=>setCalendarProvider(id)}><NBCloudBrand provider={id==="outlook"?"onedrive":id==="apple"?"icloud":"google"}/><span>{label}</span><span className="nb-provider-check" aria-hidden="true">{calendarProvider===id?"✓":""}</span></button>)}</div>
    <p>{calendarProvider === "apple" ? tr("Apple/iCloud: Åpne Kalender og kontroller at iCloud-kalenderen vises. Hvis den mangler, legg til Apple-kontoen under Kalender → Legg til konto.","Apple/iCloud: Open Calendar and check that your iCloud calendar appears. If missing, add your Apple account under Calendar → Add Account.") : calendarProvider === "google" ? tr("Google/Gmail: Åpne Kalender → Legg til konto → Google. Logg inn selv og slå på Kalendere. Gmail er e-posttjenesten; det er Google Kalender som leverer avtalene.","Google/Gmail: Open Calendar → Add Account → Google. Sign in yourself and enable Calendars. Gmail is the email service; Google Calendar supplies the events.") : tr("Outlook/Microsoft 365: Åpne Kalender → Legg til konto og velg Microsoft Exchange når det passer kontoen din. Enkelte arbeidskontoer krever godkjenning fra organisasjonen.","Outlook/Microsoft 365: Open Calendar → Add Account and choose Microsoft Exchange when appropriate for your account. Some work accounts require your organization's approval.")}</p>
    <p>{tr("Dette er vanlige kombinasjoner. En avtale kan også ha en møtelenke fra en annen tjeneste. DSSA Tale følger lenken i avtalen. Valget ovenfor oppretter ikke møter og starter ikke opptak eller samtaler automatisk.","These are common combinations. An event may also contain a meeting link from another service. DSSA Tale follows the event's link. The choice above does not create meetings or automatically start recording or calls.")}</p>
    <button data-emphasis="primary" onClick={async()=>{try{const result=await api.nbOpenCalendarApp();if(!result.success)setMessage(tr("Kunne ikke åpne Kalender.","Could not open Calendar."));}catch{setMessage(tr("Kunne ikke åpne Kalender.","Could not open Calendar."));}}}>{tr("Åpne Kalender for å administrere kontoer","Open Calendar to manage accounts")}</button>
    <p>{tr("Når kalenderne er synlige i Kalender, kan du tillate at DSSA Tale leser dem. Tilgangen gjelder kalenderne macOS gjør tilgjengelige, og kan omfatte flere kontoer. Ingen kalendertilgang gis bare ved å velge tjeneste ovenfor.","When your calendars appear in Calendar, you can allow DSSA Tale to read them. Access covers the calendars macOS exposes and may include multiple accounts. Choosing a service above does not grant calendar access.")}</p>
    <button onClick={toggleCalendar} disabled={busy}>{connected ? tr("Koble fra kalenderlesing", "Disconnect calendar reading") : tr("Tillat lesing av Mac-ens kalendere", "Allow reading Mac calendars")}</button>
    <p role="status">{connected ? tr("Kalenderlesing er tilkoblet.","Calendar reading is connected.") : tr("Kalenderlesing er ikke tilkoblet.","Calendar reading is not connected.")}{calendarSources.length>0 ? " "+calendarSources.join(", ") : ""}</p>
    </section>}
    {page === "meetings" && <section>
    <h2>{tr("Teams og andre møteapper", "Teams and other meeting apps")}</h2>
    <p>{tr("Bruk møtemodus under Notater. DSSA Tale tar opp lokalt fra systemlyden og valgt mikrofon. Appen blir ikke med som en bot i møtet og trenger ikke Teams-kontoen din. Automatisk Teams-start er et eget valgfritt forsøksvalg i innstillingene.", "Use meeting mode in Notes. DSSA Tale records system audio and your selected microphone locally. It does not join the meeting as a bot and does not need your Teams account. Automatic Teams start is a separate optional experimental setting.")}</p>
    </section>}
    {page === "files" && <section>
    <h2>{tr("Dokumenter og skylagring", "Documents and cloud storage")}</h2>
    <p>{tr("Velg en fast mappe for hver tjeneste. Appen husker valgene. Bruk den vanlige Lagre-dialogen når du eksporterer et dokument.","Choose a fixed folder for each service. The app remembers your choices. Use the normal Save dialog when exporting a document.")}</p>
    {([ ["google","Google Disk"], ["onedrive","OneDrive / SharePoint"], ["icloud","iCloud Drive"] ] as const).map(([id,label])=>{
      const folder=folders.find(f=>f.id===id);
      return <article key={id} className="nb-cloud-card" data-provider={id} style={{border:"1px solid var(--color-border)",borderRadius:14,padding:20,marginBottom:16}}>
        <h3 style={{marginTop:0}}>{label}</h3>
        <p style={{overflowWrap:"anywhere"}}>{folder?.path || tr("Ingen fast mappe valgt","No fixed folder selected")}</p>
        {folder?.path && <p>{folder.status === "available" ? tr("Mappen er tilgjengelig lokalt. Synkronisering kontrolleres av leverandøren.","The folder is available locally. Synchronization is managed by the provider.") : tr("Mappen er ikke tilgjengelig nå. Kontroller den i Finder.","The folder is currently unavailable. Check it in Finder.")}</p>}
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button data-provider={id} data-emphasis="primary" disabled={folderBusy} onClick={()=>void folderAction(id,"choose")}><NBCloudBrand provider={id}/>{tr("Velg fast mappe","Choose fixed folder")}</button>
          <button data-provider={id} disabled={folderBusy || folder?.status!=="available"} onClick={()=>void folderAction(id,"open")}>{tr("Åpne mappe","Open folder")}</button>
          {folder?.path && <button data-action="destructive" disabled={folderBusy} onClick={()=>void folderAction(id,"remove")}>{tr("Fjern mappevalg","Remove folder choice")}</button>}
        </div>
      </article>;
    })}
    <button disabled={folderBusy} onClick={()=>void refreshFolders()}>{tr("Kontroller tilgangen på nytt","Check access again")}</button>
    <p>{tr("Å fjerne mappevalget sletter ingen filer og logger deg ikke ut. En tilgjengelig mappe bekrefter ikke at nettsynkroniseringen er ferdig.","Removing the folder choice does not delete files or sign you out. An available folder does not confirm that cloud synchronization has finished.")}</p>

    <p>{tr("Velg Google Drive, OneDrive, iCloud Drive eller synkroniserte Teams-mapper i Åpne- og Lagre-vinduene. Tjenesten må allerede være tilgjengelig i Finder. DSSA Tale behandler lyden lokalt; en synkroniseringstjeneste kan laste opp filer du lagrer i dens mappe.", "Choose Google Drive, OneDrive, iCloud Drive or synchronized Teams folders in the Open and Save dialogs. The service must already be available in Finder. DSSA Tale processes audio locally; a synchronization service may upload files saved in its folder.")}</p>
    </section>}
    {page === "email" && <section>
    <h2>{tr("E-post og andre tekstfelt", "Email and other text fields")}</h2>
    <p>{tr("Bruk dikteringssnarveien i Mail, Outlook, Word, Teams og andre tekstfelt. Du sender selv teksten. Lesing av innboksen og synkronisering av e-post er ikke koblet til i denne utgaven.", "Use the dictation shortcut in Mail, Outlook, Word, Teams and other text fields. You send the text yourself. Inbox reading and email synchronization are not connected in this edition.")}</p>
    </section>}
    <p>{tr("Alt nødvendig for talegjenkjenning kjører lokalt, uten konto eller API-nøkkel.", "Everything needed for speech recognition runs locally, without an account or API key.")}</p>
  </section>;
}
