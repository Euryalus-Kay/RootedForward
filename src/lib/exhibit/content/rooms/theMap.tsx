"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M1, THE MAP (redlining). Entered through the door at  */
/*  the tail of chapter six. The instrument station is a document      */
/*  panel: the real 1939 Area Description form's printed fields,       */
/*  transcribed from the form schema, beside one real area sheet.      */
/*  Every figure rides a registered fact id, the D74 excerpt is        */
/*  verbatim from the digitized survey record carried in data/exhibit/ */
/*  holc_descriptions.json (areaId 1488), and the Mapping Inequality   */
/*  attribution ships with the record as its license requires.         */
/* ------------------------------------------------------------------ */
import gybJson from "../../../../../data/exhibit/grade_your_block.json";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import SourceSup from "@/components/exhibit/shared/SourceSup";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import {
  AttributionCard,
  CardGrid,
  FactCard,
  RecordCard,
  STATION_EYEBROWS,
  type RoomStation,
} from "./shared";

/* Verbatim from holc_descriptions.json areaId 1488 (sheet D74, South
 * Chicago), field 8, Description and Characteristics of Area. The
 * digitized transcription runs on past this point mid-sentence; the
 * cut lands on the record's own period. */
const D74_EXCERPT =
  "Located between 35th and 67th, west of Cottage Grove to State, a blighted area, 100 per cent negro, predominantly apartment buildings; 3's, 6's and up, few 2's. Single homes are of the 6-10 room type, average age 40 years.";

const MAPPING_INEQUALITY_ATTRIBUTION =
  "Polygons and area descriptions from Mapping Inequality (Robert K. Nelson, LaDale Winling, et al., University of Richmond Digital Scholarship Lab), CC BY-NC 4.0. Underlying HOLC records are public domain.";

interface GybField {
  fieldId: string;
  formItem: string;
  section: string;
  historicalLabel: string;
  type: string;
}

const GYB = gybJson as unknown as {
  source: { title: string; url?: string };
  fields: GybField[];
};

/* The real form, as a document. The printed field list from the HOLC
 * Area Description form schema; note where race sits in the order. */
function TheForm1939() {
  const sections = new Map<string, GybField[]>();
  for (const f of GYB.fields) {
    if (!sections.has(f.section)) sections.set(f.section, []);
    sections.get(f.section)!.push(f);
  }
  return (
    <PaperCard tone="deep" data-testid="room-form-1939" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
        {GYB.source.title}
        <SourceSup source={{ title: GYB.source.title, url: GYB.source.url }} />
      </p>
      <span className="exh-plat mt-1.5 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
        period document; contains the era&rsquo;s racist language
      </span>
      <div className="mt-3 space-y-4">
        {[...sections.entries()].map(([section, fields]) => (
          <div key={section}>
            <p className="exh-mono text-[10px] text-exh-ink-soft">{section}</p>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-l border-exh-ink/15 pl-3">
              {fields.map((f) => (
                <div key={f.fieldId} className="contents">
                  <dt className="exh-mono text-xs leading-5 text-exh-ink-soft">{f.formItem}</dt>
                  <dd className="exh-serif text-sm italic leading-5 text-exh-ink">
                    {f.historicalLabel}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-exh-ink/15 pt-3 text-xs leading-relaxed text-exh-ink-soft">
        The race and nationality of an area&rsquo;s residents are printed fields in section one,
        before the form asks a single question about the buildings. The grade followed the form.
      </p>
    </PaperCard>
  );
}

export const THE_MAP_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "The surveyors worked from a printed form. This is the form, and one sheet filed on it.",
    body: (
      <div className="space-y-4">
        <TheForm1939 />
        <RecordCard
          eyebrow="From the survey record. Sheet D74, South Chicago"
          fields={[
            { label: "Security grade", value: "D" },
            { label: "Location", value: "South Chicago" },
            { label: "Date", value: "January 1, 1940" },
            { label: "Occupation or type", value: "Laborer, relief, etc." },
            { label: "Infiltration of", value: "Negro" },
            { label: "Mortgage funds", value: "None" },
          ]}
          fieldLabel="8. Description and Characteristics of Area"
          quote={D74_EXCERPT}
          quoteNote="transcription excerpt; the digitized sheet continues"
          factId="redlining.holc_survey_chicago"
        />
      </div>
    ),
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "The manual that scored race as risk, and the archive that holds the rest of the sheets.",
    body: (
      <div className="space-y-4">
        <FactCard id="redlining.babcock_manual" label="The manual">
          It told appraisers to study whether what it called incompatible racial groups were
          present, and it praised the barriers that kept them out.
        </FactCard>
        <AttributionCard label="The archive" text={MAPPING_INEQUALITY_ATTRIBUTION} />
      </div>
    ),
  },
  {
    id: "people",
    eyebrow: STATION_EYEBROWS.people,
    lead: "The economist who wrote the hierarchy, and the realtor who counted what it did.",
    body: (
      <div className="space-y-6">
        <div className="flex justify-center">
          <VoiceCard personId="dempsey-travis" />
        </div>
        <CardGrid>
          <FactCard id="redlining.hoyt_hierarchy" label="The hierarchy">
            Homer Hoyt&rsquo;s Chicago land-value study ranked races and nationalities by their
            supposed effect on prices.
          </FactCard>
          <FactCard id="redlining.hoyt_fha" label="The hire">
            Washington then hired the author. The ranking went to work inside federal credit.
          </FactCard>
        </CardGrid>
      </div>
    ),
  },
  {
    id: "fight",
    eyebrow: STATION_EYEBROWS.fight,
    lead: "The Fair Housing Act of 1968 outlawed lending discrimination. Enforcement, not the statute alone, did the work.",
    body: (
      <div className="space-y-6">
        <div className="flex justify-center">
          <VoiceCard personId="martin-luther-king" />
        </div>
        <FactCard id="cbl.founded_1968" label="The same year">
          While the act moved through Washington, contract buyers in North Lawndale were already
          organized against the trade the map made possible.
        </FactCard>
      </div>
    ),
  },
  {
    id: "still-running",
    eyebrow: STATION_EYEBROWS["still-running"],
    lead: "The lamp on this machine reads off. The ground reads otherwise.",
    body: (
      <div className="space-y-4">
        <FactCard id="redlining.black_loans_under_2pct" label="While it ran" dated>
          The subsidy that built the postwar white middle class flowed one way.
        </FactCard>
        <CardGrid>
          <FactCard id="present.holc_footprint_86pct" label="The footprint" dated />
          <FactCard id="present.holc_subsidy_siting" label="Where the city intervenes now" dated />
        </CardGrid>
        <FactCard id="redlining.illinois_removal_2022" label="The paper trail" dated>
          The dead covenant language the map era leaned on sat in the record for decades before
          Illinois built a formal way to strike it.
        </FactCard>
      </div>
    ),
  },
];
