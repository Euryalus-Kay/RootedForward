/* ------------------------------------------------------------------ */
/*  Server-only screening for exhibit visitor submissions. The API    */
/*  route calls screen() before inserting; the verdict only decides   */
/*  which review-queue lane a submission lands in ('pending' vs       */
/*  'flagged'). NOTHING is published without an admin approving it    */
/*  at /admin/exhibit, so a false positive here costs a reviewer a    */
/*  glance and a false negative costs nothing but triage order. That  */
/*  is why the matcher is deliberately conservative: it squeezes      */
/*  repeats, undoes leet substitutions, strips separators, and would  */
/*  rather flag "push it" than publish a slur.                        */
/*                                                                     */
/*  This module carries the blocklist, so it must never reach the     */
/*  client bundle. The runtime guard below enforces that without a    */
/*  dependency on the server-only package.                             */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  throw new Error(
    "exhibit moderation is server-only; import it from API routes, never from client components"
  );
}

export interface ScreenResult {
  verdict: "pending" | "flagged";
  /** short internal reason for logs; never shown to visitors */
  reason?: string;
}

/* ---------------- normalization ---------------- */

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "i",
};

/** lowercase, strip diacritics, undo common leet substitutions */
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0134578@$!|]/g, (c) => LEET[c] ?? c);
}

/** collapse runs of the same character ("fuuuck" reads "fuck") */
function squeeze(s: string): string {
  return s.replace(/(.)\1+/g, "$1");
}

/** drop everything but letters ("f u c k" reads "fuck") */
function condense(s: string): string {
  return s.replace(/[^a-z]/g, "");
}

/* ---------------- the wordlist ---------------- */
/* Two lists with two match rules.                                     */
/*                                                                     */
/* SUBSTRING_TERMS match anywhere, including inside words and across   */
/* stripped separators, because they almost never occur in benign      */
/* English. WORD_TERMS are shorter or double-meaning terms (coon in    */
/* raccoon, spic in conspicuous, anal in analysis) matched only as     */
/* whole tokens. Both lists are checked against squeezed forms too,    */
/* so stretched spellings still hit.                                   */

const SUBSTRING_TERMS: string[] = [
  // racial and ethnic slurs
  "nigger",
  "nigga",
  "niglet",
  "jigaboo",
  "jigabo",
  "pickaninny",
  "picaninny",
  "porchmonkey",
  "wetback",
  "kike",
  "raghead",
  "towelhead",
  "zipperhead",
  "golliwog",
  "halfbreed",
  "whitepower",
  "heilhitler",
  // homophobic and transphobic slurs
  "faggot",
  "tranny",
  "shemale",
  // ableist slur
  "retard",
  // profanity and sexual content
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "whore",
  "slut",
  "cocksucker",
  "asshole",
  "arsehole",
  "dickhead",
  "blowjob",
  "handjob",
  "rimjob",
  "dildo",
  "jizz",
  "porn",
  "penis",
  "vagina",
  "twat",
];

const WORD_TERMS: string[] = [
  // slurs that hide inside benign words, matched as whole tokens only
  "coon",
  "coons",
  "chink",
  "chinks",
  "gook",
  "gooks",
  "kaffir",
  "kafir",
  "beaner",
  "beaners",
  "darkie",
  "darkies",
  "darky",
  "injun",
  "injuns",
  "squaw",
  "squaws",
  "redskin",
  "redskins",
  "paki",
  "pakis",
  "spic",
  "spics",
  "spick",
  "spicks",
  "homo",
  "homos",
  "fag",
  "fags",
  "dyke",
  "dykes",
  // dated racial terms and hate signifiers, queued for a human call
  "negro",
  "negros",
  "negroes",
  "kkk",
  "nazi",
  "nazis",
  // violence and sexual content
  "rape",
  "raped",
  "rapist",
  "rapists",
  "ass",
  "asses",
  "arse",
  "jackass",
  "dick",
  "dicks",
  "cock",
  "cocks",
  "pussy",
  "pussies",
  "tit",
  "tits",
  "titties",
  "cum",
  "cums",
  "anal",
  "wank",
  "wanker",
  "wankers",
  "piss",
  "pissed",
];

const WORD_SET = new Set(WORD_TERMS);

/* ---------------- contact-info patterns (run on the RAW text) ------ */

const URL_RE =
  /(https?:\/\/|www\.)|\b[a-z0-9][a-z0-9-]*\.(com|net|org|edu|gov|io|co|us|uk|info|biz|xyz|site|online|ly|gg|tv|me|app|dev)\b/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
/* nine or more digits in one run of digit-and-separator characters;
   a year range like 1955-1962 (eight digits) stays clean */
const PHONE_RE = /(?:\d[\s\-.()/]*){8}\d/;

/* ---------------- the screen ---------------- */

export function screen(body: string): ScreenResult {
  const raw = body ?? "";
  if (!raw.trim()) return { verdict: "pending" };

  if (URL_RE.test(raw)) return { verdict: "flagged", reason: "contains a link" };
  if (EMAIL_RE.test(raw)) return { verdict: "flagged", reason: "contains an email address" };
  if (PHONE_RE.test(raw)) return { verdict: "flagged", reason: "contains a phone number" };

  const norm = normalize(raw);
  const squeezed = squeeze(norm);
  const condensed = condense(norm);
  const condensedSqueezed = squeeze(condensed);

  for (const term of SUBSTRING_TERMS) {
    const sq = squeeze(term);
    if (
      norm.includes(term) ||
      condensed.includes(term) ||
      squeezed.includes(sq) ||
      condensedSqueezed.includes(sq)
    ) {
      return { verdict: "flagged", reason: "matched the blocklist" };
    }
  }

  const tokens = norm.split(/[^a-z]+/).filter(Boolean);
  for (const tok of tokens) {
    if (WORD_SET.has(tok) || WORD_SET.has(squeeze(tok))) {
      return { verdict: "flagged", reason: "matched the blocklist" };
    }
  }

  return { verdict: "pending" };
}
