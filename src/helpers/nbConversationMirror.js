const fs = require("fs");
const path = require("path");

function text(note, mappings = {}, options = {}) {
  let segments;
  try { segments = JSON.parse(note.transcript || "[]"); }
  catch { throw new Error("Samtalens transkripsjon kunne ikke leses."); }
  if (!Array.isArray(segments)) throw new Error("Ugyldig samtaletranskripsjon.");
  const times = segments.map(s=>s.timestamp).filter(n=>typeof n === "number" && Number.isFinite(n));
  const first = times.length ? Math.min(...times) : 0;
  const speakerLabels = new Map();
  for (const segment of segments) {
    if (segment.speaker && !speakerLabels.has(segment.speaker)) speakerLabels.set(segment.speaker, `Taler ${speakerLabels.size + 1}`);
  }
  const stamp = value => {
    const seconds = Math.max(0, Math.floor(first > 1e9 ? (value-first)/1000 : value));
    return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,"0")).join(":");
  };
  return segments.map(s=>{
    if (typeof s.text !== "string") throw new Error("Ugyldig tekst i samtalen.");
    let prefix = "";
    if (options.includeTimestamps && typeof s.timestamp === "number" && Number.isFinite(s.timestamp)) prefix += `[${stamp(s.timestamp)}] `;
    if (options.includeSpeakers) {
      const number = /^speaker_(\d+)$/.exec(s.speaker || "");
      const name = (s.speakerName && !s.speakerIsPlaceholder ? s.speakerName : null) || mappings[s.speaker] || (number ? `Taler ${Number(number[1])+1}` : speakerLabels.get(s.speaker) || (s.source === "mic" ? "Du" : "Ukjent taler"));
      prefix += String(name).replace(/[\r\n]/g," ") + ": ";
    }
    return prefix + s.text;
  }).join("\n\n");
}

class ConversationMirror {
  constructor(root) { this.root = root; }
  file(id) {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("Ugyldig samtale-ID.");
    return path.join(this.root, `samtale-${id}.txt`);
  }
  write(note, mappings = {}) {
    const target = this.file(note.id);
    if (!note.transcript) return null;
    const body = text(note,mappings,{includeTimestamps:true,includeSpeakers:true});
    if (!JSON.parse(note.transcript).some(s=>typeof s.text === "string" && s.text.trim())) return null;
    fs.mkdirSync(this.root,{recursive:true,mode:0o700});
    const temporary = target + ".tmp";
    // Synchronous writes + atomic rename prevent older async snapshots winning.
    fs.writeFileSync(temporary,body,{mode:0o600,flag:"w"});
    fs.renameSync(temporary,target);
    return target;
  }
  remove(id) { fs.rmSync(this.file(id),{force:true}); }
}
function createDefault() {
  return new ConversationMirror(path.join(require("electron").app.getPath("userData"),"conversations"));
}
module.exports = { ConversationMirror, createDefault, text };
