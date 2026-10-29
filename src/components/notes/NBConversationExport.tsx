import { useState } from "react";
import { useSettingsStore } from "../../stores/settingsStore";

export default function NBConversationExport({noteId}:{noteId:number}) {
  const english = useSettingsStore(s=>s.uiLanguage) === "en";
  const [timestamps,setTimestamps] = useState(false);
  const [speakers,setSpeakers] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const api = (window as any).electronAPI;
  const run = async (format?:string) => {
    setBusy(true);setMessage("");
    try {
      const result = await api.nbConversationFile(noteId,format ? "text" : "reveal",{includeTimestamps:timestamps,includeSpeakers:speakers});
      if (!result.success) throw new Error(result.error || "Kunne ikke åpne samtalen.");
      if(format) {
        // Structured source has already been rendered with the requested options.
        const saved = await api.nbSaveDocument(result.text,format,{preformatted:true});
        if(saved.success)setMessage(english ? "Document saved." : "Dokumentet er lagret.");
      }
    } catch(e) {setMessage(String(e));} finally {setBusy(false);}
  };
  return <section className="mx-5 my-2 rounded-md border border-border p-3 text-xs" aria-label={english ? "Conversation files" : "Samtalefiler"}>
    <p>{english ? "A local text file is updated as this conversation is transcribed." : "En lokal tekstfil oppdateres etter hvert som denne samtalen transkriberes."}</p>
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <button disabled={busy} onClick={()=>void run()}>{english ? "Show text file in Finder" : "Vis tekstfil i Finder"}</button>
      <label><input type="checkbox" checked={timestamps} onChange={e=>setTimestamps(e.target.checked)}/> {english ? "Timestamps in export" : "Tidsstempler i eksport"}</label>
      <label><input type="checkbox" checked={speakers} onChange={e=>setSpeakers(e.target.checked)}/> {english ? "Speaker names in export" : "Talernavn i eksport"}</label>
      {([['docx','Word'],['pdf','PDF'],['txt','TXT']] as const).map(([format,label])=><button key={format} disabled={busy} onClick={()=>void run(format)}>{english ? "Save " : "Lagre "}{label}</button>)}
    </div>
    {message && <p role="status" className="mt-2">{message}</p>}
  </section>;
}
