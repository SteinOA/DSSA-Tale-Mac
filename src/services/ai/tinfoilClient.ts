// Offline NB edition: cloud SDK is deliberately not bundled.
import type { LanguageModel } from "ai";
import type { TinfoilAI } from "tinfoil";
export async function getTinfoilChatClient(_apiKey: string): Promise<TinfoilAI> {
  throw new Error("Skybaserte tjenester er ikke tilgjengelige i NB-utgaven.");
}
export async function getTinfoilLanguageModel(_apiKey: string, _model: string): Promise<LanguageModel> {
  throw new Error("Skybaserte tjenester er ikke tilgjengelige i NB-utgaven.");
}
export function clearTinfoilClientCache(): void {}
