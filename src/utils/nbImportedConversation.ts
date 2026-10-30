import type { TranscriptSegment } from "../stores/meetingRecordingStore";

type ImportedPart = { text?: string; start?: number; end?: number; speaker?: string; speakerAssignment?: string };
export function importedConversation(fileName: string, text: string, parts?: ImportedPart[],language="no") {
  const title = fileName.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "").trim() || "Importert lydopptak";
  const speakers = new Map<string,string>();
  const segments: (TranscriptSegment & {end?: number})[] = parts
    ? parts.filter(part=>typeof part.text === "string" && part.text.trim()).map((part,index)=>{
      const segment: TranscriptSegment & {end?:number} = {id:`import-${index}`,text:part.text!.trim(),source:"system"};
      if(typeof part.start === "number" && Number.isFinite(part.start) && part.start >= 0)segment.timestamp=part.start;
      if(typeof part.end === "number" && Number.isFinite(part.end) && part.end >= 0)segment.end=part.end;
      if(part.speaker){
        if(!speakers.has(part.speaker))speakers.set(part.speaker,`${language==="nn"?"Talar":"Taler"} ${speakers.size+1}`);
        segment.speaker=part.speaker;segment.speakerName=speakers.get(part.speaker);
        segment.speakerIsPlaceholder=true;segment.speakerStatus="provisional";
      }
      if(!part.speaker)segment.speakerName=language==="nn"?"Ukjend talar":"Ukjent taler";
      return segment;
    }) : text.trim() ? [{id:"import-0",text:text.trim(),source:"system"}] : [];
  // Some engines return usable plain text with an empty/blank segments array.
  // Preserve that result instead of silently treating the import as empty.
  if (!segments.length && text.trim()) segments.push({id:"import-0",text:text.trim(),source:"system"});
  return {title,segments,content:segments.map(part=>part.text).join("\n\n"),transcript:JSON.stringify(segments)};
}

// Save readable content first: even if the follow-up transcript update fails,
// the imported words remain recoverable in one note, never an empty orphan.
export async function saveImportedConversation(api:any, fileName:string, text:string, parts?:ImportedPart[],language="no") {
  const conversation=importedConversation(fileName,text,parts,language);
  if(!conversation.segments.length)return null;
  const result=await api.saveNote(conversation.title,conversation.content,"meeting",fileName,null,null,null);
  if(!result?.success || !result.note?.id)throw new Error(result?.error || "Samtalen kunne ikke lagres. Teksten er fortsatt tilgjengelig her.");
  try {
    const updated=await api.updateNote(result.note.id,{transcript:conversation.transcript});
    if(!updated?.success)throw new Error(updated?.error || "Transkripsjonen kunne ikke lagres");
    return {noteId:result.note.id,title:conversation.title,complete:true};
  }catch {
    return {noteId:result.note.id,title:conversation.title,complete:false};
  }
}
