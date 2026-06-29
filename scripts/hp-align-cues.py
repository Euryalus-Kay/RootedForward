#!/usr/bin/env python3
"""Force-align each deep-dive section's captions to the actual spoken narration.

The OpenAI TTS read does not pace exactly by word count, so the proportional
cues (make_cues) drift 3-10s from the voice, which also throws off the shot
timing. This transcribes each section's vo-<id>.mp3 with word timestamps and
anchors every script sentence to the real word it starts on, producing accurate
cues at data/hp-deepdive/cues/<id>.json. The renderer reads these so captions and
shots land on the spoken line.

Usage: OPENAI_API_KEY=... python3 scripts/hp-align-cues.py [chapter ...]
"""
import json, os, re, sys, subprocess, urllib.request, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(ROOT, "public/media/hyde-park/vo")
CUES = os.path.join(ROOT, "data/hp-deepdive/cues")
KEY = os.environ.get("OPENAI_API_KEY")
os.makedirs(CUES, exist_ok=True)

def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())

def transcribe_words(mp3):
    boundary = "----hpalign"
    data = open(mp3, "rb").read(); body = b""
    for k, v in [("model", "whisper-1"), ("response_format", "verbose_json"),
                 ("timestamp_granularities[]", "word")]:
        body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
             f"filename=\"a.mp3\"\r\nContent-Type: audio/mpeg\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request("https://api.openai.com/v1/audio/transcriptions", data=body,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": f"multipart/form-data; boundary={boundary}"})
    out = json.loads(urllib.request.urlopen(req, timeout=180).read())
    return out.get("words", [])

def sentences(vo):
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+", vo.strip()) if s.strip()]

def align(sents, words, dur):
    W = len(words); wi = 0; cues = []
    for s in sents:
        toks = [norm(t) for t in s.split() if norm(t)]
        if not toks:
            continue
        # find the spoken word that starts this sentence, scanning forward a bit
        start_wi = wi
        for j in range(wi, min(W, wi + 8)):
            if norm(words[j].get("word", "")) == toks[0]:
                start_wi = j; break
        start = words[start_wi]["start"] if start_wi < W else (cues[-1]["startSec"] + 1.5 if cues else 0.0)
        wi = min(W, start_wi + len(toks))
        cues.append({"startSec": round(start, 2), "text": s})
    for i in range(len(cues) - 1):
        cues[i]["endSec"] = cues[i + 1]["startSec"]
    if cues:
        cues[-1]["endSec"] = round(words[-1]["end"] if words else cues[-1]["startSec"] + 2, 2)
    return cues

chapters = sys.argv[1:] or [os.path.basename(f).replace(".sections.json", "")
                            for f in glob.glob(os.path.join(ROOT, "data/hp-deepdive/*.sections.json"))]
for cid in chapters:
    dd = json.load(open(os.path.join(ROOT, "data/hp-deepdive", f"{cid}.sections.json")))
    for s in dd["sections"]:
        fsid = f"{cid}__{s['id']}"
        mp3 = os.path.join(VO, f"vo-{fsid}.mp3")
        if not os.path.exists(mp3):
            print("skip (no vo):", fsid); continue
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nk=1:nw=1", mp3], capture_output=True, text=True).stdout or 0)
        words = transcribe_words(mp3)
        cues = align(sentences(s["voiceover"]), words, dur)
        json.dump(cues, open(os.path.join(CUES, f"{fsid}.json"), "w"))
        print(f"{fsid}: {len(cues)} cues, {len(words)} words, {dur:.0f}s")
print("done")
