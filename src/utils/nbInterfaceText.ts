import enText from "../locales/en/nbPanel.json";
import nnText from "../locales/nn/nbPanel.json";

/** Only static interface copy. Never use this function on document or transcript text. */
export function nbInterfaceText(language: string, bokmal: string, english = bokmal): string {
  if (language === "en") return english !== bokmal ? english : ((enText as Record<string,string>)[bokmal] ?? english);
  if (language === "nn") return (nnText as Record<string,string>)[bokmal] ?? bokmal;
  return bokmal;
}
