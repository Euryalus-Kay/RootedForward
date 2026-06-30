export const meta = {
  name: 'hp-panel',
  description: 'Self-review panel for one Hyde Park film: every frame watched, watchability/content/creativity led, then a chairman verdict + punch-list',
  phases: [
    { title: 'Review', detail: 'one lens per agent, full runtime' },
    { title: 'Chair', detail: 'consolidate + verdict' },
  ],
}

// args = { id, file, kind }  e.g. { id:'land', file:'deepdive-land.mp4', kind:'the land before Hyde Park...' }
const ROOT = '/Users/zainzaidi/Desktop/Rooted Forward'
const SCRATCH = '/private/tmp/claude-501/-Users-zainzaidi-Desktop-Rooted-Forward/9de4bd74-68b1-4411-842a-986fd76874dd/scratchpad'
const id = (args && args.id) || 'land'
const file = (args && args.file) || `deepdive-${id}.mp4`
const kind = (args && args.kind) || `the ${id} deep-dive`
const PATH = `${ROOT}/public/media/hyde-park/video/${file}`

const COVERAGE = `Watch the WHOLE film, every frame, no sampling. Get the duration (ffprobe). Extract frames covering 100% of the runtime with NO gaps into ${SCRATCH}/panel-${id}-<lens>/ (at least one frame every 2s for broad lenses, denser, every 0.5-1s, around your concern), tile into contact sheets, and READ every sheet end to end. Then extract and ZOOM IN at full resolution on every element your lens cares about. Judge the burned picture + captions only (no audio).`

const FIND = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'pass', 'findings', 'advice'],
  properties: {
    lens: { type: 'string' },
    pass: { type: 'boolean', description: 'does the film pass this lens with no blocking problem' },
    findings: { type: 'string', description: 'every problem with a timecode + the specific fix, or "none"' },
    advice: { type: 'string', description: 'concrete advice to make it better on this lens (esp. for watchability/content/creativity)' },
  },
}

// the watchability/content/creativity lenses LEAD; the technical lenses keep it clean
const LENSES = [
  { key: 'watchability', brief: `WATCHABILITY. Is it gripping start to finish? Pacing and rhythm, any dull, draggy, slow, or repetitive stretch; does momentum build; would a real viewer keep watching or click away? Name the weakest stretches by timecode and give concrete ideas to make it more engaging (a tighter cut, a stronger open, a better beat order, more variety).` },
  { key: 'content', brief: `CONTENT / STORYTELLING. Is the story substantive, well-structured, and resonant; the argument clear and compelling; the through-line strong? What's thin, confusing, or buried, and what would deepen or sharpen it?` },
  { key: 'creativity', brief: `CREATIVITY. Is the presentation fresh, surprising, and bold, or a generic slideshow of stills with lower-thirds? Propose braver visual/edit ideas and devices (how a beat could be staged better, a stronger motif, a more cinematic move).` },
  { key: 'legibility', brief: `LEGIBILITY. Full-res check EVERY lower-third title and EVERY burned caption, especially over bright/light/map shots. Flag any wash-out, low contrast, overrun off-frame, collision, or truncation.` },
  { key: 'reuse', brief: `REUSE / CONTINUITY. Track every image across the whole film. Flag any image that appears more than once, the same shot recurring, or two near-identical images. List each repeat with both timecodes.` },
  { key: 'maps', brief: `MAPS. For every map beat: is there an animated highlight (pulsing point / drawn-on route / outlined region), does it land on the CORRECT place/route for what's being narrated, is the label legible, does the focus move read? Flag any map shown as a dead still or highlighted in the wrong spot.` },
  { key: 'motion', brief: `MOTION / PACING. Every shot: is there visible, continuous motion or does anything sit dead-static; any shot held awkwardly long; clean transitions with no black flash or ghosting.` },
  { key: 'script', brief: `SCRIPT / VOICE (captions only). Active voice; clarity; does each burned caption match the picture on screen; any truncated/garbled caption; is it easy to follow?` },
  { key: 'fact', brief: `FACT-CHECK. Every on-screen claim, stat, date, and name plausible/consistent; does each image match the era and subject it sits under (no anachronism, no wrong-subject image, no faux-archival modern photo in a historical run)?` },
]

log(`Self-review panel on ${file}: every frame, ${LENSES.length} lenses, watchability/content/creativity leading.`)

const reviews = await parallel(LENSES.map((L) => () => agent(
  `You are one lens of a self-review panel judging a Hyde Park documentary deep-dive to a festival / Academy bar. Working dir: ${ROOT}. Film: ${PATH} (${kind}; final OpenAI "ash" narration).

${COVERAGE}

YOUR LENS: ${L.brief}

Be exhaustive and strict but do not invent problems. Return the structured result: pass (true only if no blocking problem on your lens), every finding with a timecode + the specific fix, and concrete advice to make the film better on your lens. Do not edit anything.`,
  { label: `lens:${L.key}`, phase: 'Review', model: 'opus', effort: 'high', schema: FIND }
)))

const ok = reviews.filter(Boolean)
const CHAIR = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'pass', 'p1Count', 'punchList', 'strongestImprovement'],
  properties: {
    verdict: { type: 'string', description: 'overall, against the bar (watchable, substantive, creative, legible, no reuse, maps highlighted, motion, active voice, fact-clean)' },
    pass: { type: 'boolean', description: 'true only if every lens passes with zero blocking defect' },
    p1Count: { type: 'number', description: 'count of must-fix defects' },
    punchList: { type: 'string', description: 'every defect worth fixing, grouped, ordered, each with timecode + exact fix, de-duplicated' },
    strongestImprovement: { type: 'string', description: 'the single highest-impact change to make this round to raise watchability/content/creativity' },
  },
}
const chair = await agent(
  `You are the chairman of the self-review panel for the Hyde Park "${id}" deep-dive. Consolidate the lens reports into one verdict and an actionable punch-list. Lenses:
${ok.map((r) => `### ${r.lens} — pass=${r.pass}\nFINDINGS: ${r.findings}\nADVICE: ${r.advice}`).join('\n\n')}

Produce: a crisp verdict against the bar; pass true ONLY if every lens is clean; the count of must-fix defects; one de-duplicated, prioritized punch-list (each item timecode + exact fix); and the single strongest improvement to raise watchability/content/creativity this round. Be decisive.`,
  { label: 'chair', phase: 'Chair', model: 'opus', effort: 'high', schema: CHAIR }
)
return { film: file, lenses: ok.map((r) => ({ lens: r.lens, pass: r.pass })), chair }
