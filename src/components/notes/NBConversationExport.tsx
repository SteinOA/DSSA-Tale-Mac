import { nbInterfaceText } from "../../utils/nbInterfaceText";
import { useState } from "react";
import { useSettingsStore } from "../../stores/settingsStore";

export default function NBConversationExport({noteId}:{noteId:number}) {
  const language = useSettingsStore(s=>s.uiLanguage);
  const ui=(nb:string,en:string)=>nbInterfaceText(language,nb,en);
  const [timestamps,setTimestamps] = useState(false);
  const [speakers,setSpeakers] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const api = (window as any).electronAPI;
  const run = async (format?:string) => {
    setBusy(true);setMessage("");
    try {
      const result = await api.nbConversationFile(noteId,format ? "text" : "reveal",{includeTimestamps:timestamps,includeSpeakers:speakers});
      if (!result.success) throw new Error(result.error || ui("Kunne ikke åpne samtalen.","Could not open the conversation."));
      if(format) {
        // Structured source has already been rendered with the requested options.
        const saved = await api.nbSaveDocument(result.text,format,{preformatted:true});
        if(saved.success)setMessage(ui("Dokumentet er lagret.","Document saved."));
      }
    } catch(e) {setMessage(String(e));} finally {setBusy(false);}
  };
  return <section className="mx-5 my-2 rounded-md border border-border p-3 text-xs" aria-label={ui("Samtalefiler","Conversation files")}>
    <p>{ui("En lokal tekstfil oppdateres etter hvert som denne samtalen transkriberes.","A local text file is updated as this conversation is transcribed.")}</p>
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <button disabled={busy} onClick={()=>void run()}>{ui("Vis tekstfil i Finder","Show text file in Finder")}</button>
      <label><input type="checkbox" checked={timestamps} onChange={e=>setTimestamps(e.target.checked)}/> {ui("Tidsstempler i eksport","Timestamps in export")}</label>
      <label><input type="checkbox" checked={speakers} onChange={e=>setSpeakers(e.target.checked)}/> {ui("Talernavn i eksport","Speaker names in export")}</label>
      {([['docx','Word'],['pdf','PDF'],['txt','TXT']] as const).map(([format,label])=><button key={format} disabled={busy} onClick={()=>void run(format)}>{ui("Lagre ","Save ")}{label}</button>)}
    </div>
    {message && <p role="status" className="mt-2">{message}</p>}
  </section>;
}
