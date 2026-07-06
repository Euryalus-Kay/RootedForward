#!/usr/bin/env python3
"""Force-align the exhibit narration captions to the actual spoken VO.

Adapted from scripts/hp-align-cues.py for The Ground Keeps Moving. The TTS
read does not pace exactly by word count, so the proportional cues that
CaptionBar derives client-side drift from the voice. This transcribes each
narration block's vo-ex-<blockId>.mp3 with Whisper word timestamps, anchors
every script sentence to the real word it starts on, chunks long sentences
at clause boundaries into <=~15-word caption cards, and writes one file at

    public/exhibit-data/narration_cues.json
    { "version": 1, "generated": "<iso>", "blocks": { "<blockId>": [
        { "startSec": n, "endSec": n, "text": "..." }, ... ] } }

Guarantees per block: cue starts strictly increase, cues never overlap
(each endSec equals the next startSec), and the last endSec equals the
block's duration from durations.json, so coverage always audits clean.
Whisper drift (gap between the last transcribed word and the file end)
is measured and reported but never shipped; the last card simply holds
through any trailing silence.

Usage:
    set -a; source .env.local; set +a
    python3 scripts/exhibit-align-cues.py [--only ch0,ch1] [--force]

Blocks already present in the output file are kept as-is unless --force.
Exit 1 if any targeted block fails to align (succeeded blocks still write).
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public/media/hyde-park/vo/exhibit")
NARRATION_PATH = os.path.join(ROOT, "data/exhibit/narration.json")
DURATIONS_PATH = os.path.join(VO, "durations.json")
OUT_PATH = os.path.join(ROOT, "public/exhibit-data/narration_cues.json")
KEY = os.environ.get("OPENAI_API_KEY")


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def transcribe_words(mp3):
    boundary = "----exalign"
    data = open(mp3, "rb").read()
    body = b""
    for k, v in [("model", "whisper-1"), ("response_format", "verbose_json"),
                 ("timestamp_granularities[]", "word")]:
        body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
             f"filename=\"a.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions", data=body,
        headers={"Authorization": f"Bearer {KEY}",
                 "Content-Type": f"multipart/form-data; boundary={boundary}"})
    last_err = None
    for attempt in range(2):
        try:
            out = json.loads(urllib.request.urlopen(req, timeout=180).read())
            return out.get("words", [])
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.read().decode(errors='replace')[:300]}"
        except Exception as e:  # timeouts, connection resets
            last_err = repr(e)[:300]
        if attempt == 0:
            time.sleep(3)
    raise RuntimeError(f"whisper transcription failed: {last_err}")


def sentences(vo):
    return [s.strip() for s in re.split(
        r"(?<=[.?!])(?<![A-Z][.?!])(?<!St\.)(?<!Mr\.)(?<!Mt\.)(?<!No\.)(?<!Dr\.)(?<!Ms\.)(?<!Mrs\.)\s+",
        vo.strip()) if s.strip()]


def chunk_sentence(s, maxw=15):
    """Break a long sentence into <=~2-line caption chunks at clause boundaries
    (commas, semicolons, colons), so a caption never overflows its card."""
    if len(s.split()) <= maxw:
        return [s]
    clauses = re.split(r"(?<=[,;:])\s+", s)
    chunks, cur = [], ""
    for cl in clauses:
        cand = (cur + " " + cl).strip()
        if cur and len(cand.split()) > maxw:
            chunks.append(cur.strip())
            cur = cl
        else:
            cur = cand
    if cur.strip():
        chunks.append(cur.strip())
    # a single clause longer than the limit hard-wraps by word count as a last resort
    out = []
    for c in chunks:
        cw = c.split()
        if len(cw) <= maxw + 3:
            out.append(c)
        else:
            for k in range(0, len(cw), maxw):
                out.append(" ".join(cw[k:k + maxw]))
    return out


def align(sents, words, dur):
    """Anchor each sentence (and each clause chunk inside it) to the spoken
    word it starts on. Returns (cues, unanchored_chunk_count).

    Unlike hp-align-cues.py this walks a whisper cursor token by token
    instead of advancing it by script word count. Whisper normalizes spoken
    numbers ("two hundred eighty-five thousand dollars" becomes "$285,000"),
    which makes the transcript shorter or longer than the script; a matched
    token snaps the cursor to its word, an unmatched token leaves the cursor
    alone, so the walk self-corrects within a few words either way."""
    W = len(words)
    cur = 0  # index of the next unconsumed whisper word
    cues = []
    misses = 0
    for s in sents:
        toks = [norm(t) for t in s.split() if norm(t)]
        if not toks:
            continue
        chunks = chunk_sentence(s)
        # token index where each chunk starts, under the same tokenization
        bounds, ti = [], 0
        for ch in chunks:
            bounds.append(ti)
            ti += len([t for t in ch.split() if norm(t)])
        # map script tokens to whisper words with a short forward lookahead
        tok2word = {}
        for k, t in enumerate(toks):
            for j in range(cur, min(W, cur + 6)):
                if norm(words[j].get("word", "")) == t:
                    tok2word[k] = j
                    cur = j + 1
                    break
        # each chunk is timed to the first spoken word mapped at or after
        # its start token, so no caption card waits on an unmatched number
        for idx, ch in zip(bounds, chunks):
            wj = next((tok2word[k] for k in range(idx, len(toks)) if k in tok2word), None)
            if wj is None:
                misses += 1
                st = (cues[-1]["startSec"] + 1.2) if cues else 0.0
            else:
                st = float(words[wj]["start"])
            cues.append({"startSec": round(st, 2), "text": ch})
    return sanitize(cues, dur), misses


def sanitize(cues, dur):
    """Clamp starts into the block, force strict monotonicity, derive ends
    from the next start, and pin the last end to the block duration."""
    limit = round(max(dur - 0.2, 0.0), 2)
    cleaned = []
    for c in cues:
        st = round(min(max(c["startSec"], 0.0), limit), 2)
        if cleaned and st <= cleaned[-1]["startSec"]:
            st = round(cleaned[-1]["startSec"] + 0.01, 2)
        if cleaned and st > limit:
            # no room left before the audio ends; fold into the previous card
            cleaned[-1]["text"] = (cleaned[-1]["text"] + " " + c["text"]).strip()
            continue
        cleaned.append({"startSec": st, "text": c["text"]})
    for i in range(len(cleaned) - 1):
        cleaned[i]["endSec"] = cleaned[i + 1]["startSec"]
    if cleaned:
        cleaned[-1]["endSec"] = round(dur, 2)
    return cleaned


def verify(block_id, cues, dur):
    """The same invariants scripts/exhibit-audio-audit.mjs checks."""
    assert cues, f"{block_id}: no cues"
    for i, c in enumerate(cues):
        assert c["endSec"] > c["startSec"], f"{block_id}[{i}] not forward"
        if i:
            assert c["startSec"] >= cues[i - 1]["endSec"], f"{block_id}[{i}] overlaps"
    assert abs(cues[-1]["endSec"] - dur) <= 1.5, f"{block_id}: coverage gap"


def main():
    ap = argparse.ArgumentParser(description="Whisper-align exhibit caption cues")
    ap.add_argument("--only", help="comma-separated chapter ids (e.g. ch0,ch1) to (re)align")
    ap.add_argument("--force", action="store_true", help="realign blocks already in the output file")
    ap.add_argument("--transcripts", help="optional dir caching whisper words per block, so realigning does not re-bill")
    args = ap.parse_args()

    if not KEY:
        sys.exit("OPENAI_API_KEY is not set (set -a; source .env.local; set +a)")

    narration = json.load(open(NARRATION_PATH))
    durations = json.load(open(DURATIONS_PATH))
    chapter_ids = [c["id"] for c in narration["chapters"]]

    only = None
    if args.only:
        only = [c.strip() for c in args.only.split(",") if c.strip()]
        unknown = [c for c in only if c not in chapter_ids]
        if unknown:
            sys.exit(f"unknown chapter id(s) {unknown}; valid: {chapter_ids}")

    existing = {}
    if os.path.exists(OUT_PATH):
        try:
            existing = json.load(open(OUT_PATH)).get("blocks", {})
        except Exception as e:
            print(f"note: could not read existing {OUT_PATH} ({e}); starting fresh")

    blocks_out = {}
    failures = []
    drifted = []
    per_chapter = {}

    for ch in narration["chapters"]:
        targeted = only is None or ch["id"] in only
        for b in ch["blocks"]:
            bid = b["id"]
            per_chapter.setdefault(ch["id"], 0)
            if not targeted:
                if bid in existing:
                    blocks_out[bid] = existing[bid]
                    per_chapter[ch["id"]] += len(existing[bid])
                continue
            if bid in existing and not args.force:
                blocks_out[bid] = existing[bid]
                per_chapter[ch["id"]] += len(existing[bid])
                print(f"{bid}: skip (cached, {len(existing[bid])} cues); use --force to realign")
                continue
            mp3 = os.path.join(VO, f"vo-ex-{bid}.mp3")
            dur = durations.get(f"ex-{bid}")
            if not os.path.exists(mp3):
                print(f"{bid}: skip (no vo file)")
                continue
            if not isinstance(dur, (int, float)) or dur <= 0:
                failures.append(f"{bid}: no duration in durations.json")
                print(f"{bid}: FAILED (no duration)")
                continue
            words = None
            tpath = os.path.join(args.transcripts, f"{bid}.json") if args.transcripts else None
            if tpath and os.path.exists(tpath):
                cached = json.load(open(tpath))
                if cached.get("size") == os.path.getsize(mp3):
                    words = cached["words"]
            if words is None:
                try:
                    words = transcribe_words(mp3)
                except RuntimeError as e:
                    failures.append(f"{bid}: {e}")
                    print(f"{bid}: FAILED ({e})")
                    continue
                if tpath:
                    os.makedirs(args.transcripts, exist_ok=True)
                    json.dump({"size": os.path.getsize(mp3), "words": words}, open(tpath, "w"))
            cues, misses = align(sentences(b["text"]), words, float(dur))
            if not cues:
                failures.append(f"{bid}: produced no cues")
                print(f"{bid}: FAILED (no cues)")
                continue
            verify(bid, cues, float(dur))
            vo_end = float(words[-1]["end"]) if words else 0.0
            drift = float(dur) - vo_end
            note = f", {misses} unanchored chunk(s)" if misses else ""
            if abs(drift) > 1.5:
                drifted.append((bid, drift))
                note += f"  WARN drift {drift:+.2f}s (last card extended to block end)"
            blocks_out[bid] = cues
            per_chapter[ch["id"]] += len(cues)
            print(f"{bid}: {len(cues)} cues, {len(words)} words, dur {dur:.2f}s, vo end {vo_end:.2f}s, drift {drift:+.2f}s{note}")

    dropped = [bid for bid in existing if bid not in blocks_out]
    if dropped:
        print(f"note: dropped {len(dropped)} orphan block(s) no longer in narration.json: {dropped}")

    doc = {
        "version": 1,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "blocks": blocks_out,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(doc, f, indent=2)
        f.write("\n")

    total = sum(per_chapter.values())
    print("\nper-chapter cue counts:")
    for cid in chapter_ids:
        print(f"  {cid}: {per_chapter.get(cid, 0)}")
    print(f"total: {total} cues across {len(blocks_out)} block(s) -> {os.path.relpath(OUT_PATH, ROOT)}")
    if drifted:
        print("drift over 1.5s (handled by pinning the last card to block end):")
        for bid, d in drifted:
            print(f"  {bid}: {d:+.2f}s")
    if failures:
        print(f"\n{len(failures)} block(s) FAILED:")
        for f_ in failures:
            print(f"  {f_}")
        sys.exit(1)


if __name__ == "__main__":
    main()
