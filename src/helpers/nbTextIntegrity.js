// Conservative, synchronous checks. Never replace the source on failed validation.
const reject = (original, reason) => ({ accepted: false, reason, text: original });
const normalize = value => value.normalize("NFC").toLocaleLowerCase("und");

function groupedNumbers(text) {
  // Only unambiguous space-separated thousands, never decimal/date separators.
  return text.replace(/(?<![\p{L}\p{N}])[0-9]{1,3}(?:[ \u00a0\u202f][0-9]{3})+(?![\p{L}\p{N}])/gu,
    value => value.replace(/[ \u00a0\u202f]/g, ""));
}
function words(text) {
  return normalize(groupedNumbers(text)).match(/[\p{L}\p{M}\p{N}_]+/gu) || [];
}
function numbers(text) {
  // Retain signs and separators: -2 != 2, 2,5 != 25, 1/2 != 1.2.
  return groupedNumbers(text).match(/[+\-−]?\s*\d+(?:[.,:/\-−]\d+)*/gu)?.map(x => x.replace(/\s/g, "")) || [];
}
function codeSpans(text) {
  return text.match(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g) || [];
}
const equal = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

function validateCleanup(original, candidate, { language } = {}) {
  if (typeof original !== "string") throw new TypeError("Original text must be a string");
  if (typeof candidate !== "string" || (!candidate.trim() && original.trim())) return reject(original, "empty_or_invalid_output");
  if (!equal(codeSpans(original), codeSpans(candidate))) return reject(original, "code_changed");
  // An unfinished fence is not safely transformable, even if its words agree.
  if ((original.match(/```|~~~/g) || []).length % 2 || (candidate.match(/```|~~~/g) || []).length % 2) {
    if (candidate !== original) return reject(original, "unclosed_code_fence");
  }
  if (!equal(numbers(original), numbers(candidate))) return reject(original, "numbers_changed");
  if (!equal(original.match(/[%‰°$€£¥<>≤≥=]/gu) || [], candidate.match(/[%‰°$€£¥<>≤≥=]/gu) || [])) return reject(original, "fact_symbols_changed");
  if (!equal(words(original), words(candidate))) return reject(original, "words_changed");
  return { accepted: true, reason: "unchanged_words", text: candidate };
}

// Deliberately narrow explicit cues; ambiguous prose stays a source quote/note.
const decisionCue = /\b(?:vedtok|vedteke|vedtatt|vedtok vi|besluttet|beslutta|decided|resolved|approved)\b|\b(?:vi|møtet|styret|utvalet|utvalget)\s+(?:har\s+)?(?:vedteke|vedtatt|beslutta|besluttet)\b/iu;
const uncertainCue = /\b(?:meiner|mener|bør|burde|foreslår|føreslår|forslag|propose|suggest|should|might|ikkje|ikke|not|aldri|never)\b/iu;
const assignmentCue = /\b(?:skal|will|must)\s+(?:sende|senda|levere|levera|lage|laga|skrive|skriva|følgje|følge|kontakte|send|deliver|write|prepare|contact)\b|\b(?:har fått|fekk|fikk)\s+(?:ansvar|oppdrag)\b/iu;

function validateQuotedMinutes(source, items, { language } = {}) {
  if (typeof source !== "string") throw new TypeError("Source must be a string");
  if (!Array.isArray(items) || !items.length || items.length > 100) return reject(source, "invalid_items");
  const checked = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        !["note", "decision", "task"].includes(item.type) || typeof item.quote !== "string" || !item.quote.trim() ||
        !source.includes(item.quote)) return reject(source, "quote_not_in_source");
    // No generated titles, owners, summaries, dates or other unverified metadata.
    if (Object.keys(item).some(key => !["type", "quote"].includes(key))) return reject(source, "unverified_fields");
    // A cropped quote must not hide a negation/proposal elsewhere in its sentence.
    let uncertainContext = false;
    let offset = source.indexOf(item.quote);
    while (offset !== -1) {
      const before = source.slice(0, offset).split(/[.!?\n]/).pop();
      const after = /[.!?\n]\s*$/.test(item.quote) ? "" : source.slice(offset + item.quote.length).split(/[.!?\n]/)[0];
      if (uncertainCue.test(before + item.quote + after)) uncertainContext = true;
      offset = source.indexOf(item.quote, offset + 1);
    }
    let type = item.type;
    if (type === "decision" && (!decisionCue.test(item.quote) || uncertainContext)) type = "note";
    if (type === "task" && (!assignmentCue.test(item.quote) || !/^[\p{L}][\p{L}\p{M} \-]{0,60}\s+(?:skal|will|must|har fått|fekk|fikk)\b/u.test(item.quote) || uncertainContext)) type = "note";
    checked.push({ type, quote: item.quote });
  }
  // Render only verified source substrings. Consumers should use the sanitized items.
  return { accepted: true, reason: checked.some((item, i) => item.type !== items[i].type) ? "downgraded_to_note" : "verified_quotes",
    text: checked.map(item => item.quote).join("\n\n"), items: checked };
}

module.exports = { validateCleanup, validateQuotedMinutes };
