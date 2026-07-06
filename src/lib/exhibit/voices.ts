/* ------------------------------------------------------------------ */
/*  Voice registry accessor. The nine collectible medallions live in   */
/*  data/exhibit/voices.json; components resolve people through here   */
/*  so the quoteStatus rendering rule (quotation marks only when the   */
/*  status begins with "verbatim") has a single source of truth. The   */
/*  json carries a factRef field the shared VoiceDef contract does     */
/*  not; VoiceRecord widens the type additively rather than touching   */
/*  the contract file.                                                 */
/* ------------------------------------------------------------------ */
import voicesJson from "../../../data/exhibit/voices.json";
import type { VoiceDef } from "./types";

/** VoiceDef plus the citation hook present in voices.json */
export interface VoiceRecord extends VoiceDef {
  factRef?: string | null;
}

const doc = voicesJson as unknown as { voices: VoiceRecord[] };

const REGISTRY = new Map<string, VoiceRecord>(doc.voices.map((v) => [v.personId, v]));

export function voiceOf(personId: string): VoiceRecord | undefined {
  return REGISTRY.get(personId);
}

export function allVoices(): VoiceRecord[] {
  return doc.voices;
}

/** true when the renderer may put quotation marks on screen */
export function isVerbatim(v: VoiceRecord): boolean {
  return v.quoteStatus.startsWith("verbatim");
}
