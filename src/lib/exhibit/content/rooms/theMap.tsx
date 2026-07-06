"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M1, THE MAP (redlining). Entered through the door at  */
/*  the tail of chapter six. Station copy lives here; every figure     */
/*  rides a registered fact id, the D74 excerpt is verbatim from the   */
/*  digitized survey record carried in data/exhibit/                   */
/*  holc_descriptions.json (areaId 1488), and the Mapping Inequality   */
/*  attribution ships with the record as its license requires.         */
/* ------------------------------------------------------------------ */
import { GradeYourBlock } from "@/components/exhibit/rigged";
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

export const THE_MAP_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "The surveyors worked from a form. This is the form, rigged the way the manual rigged it. Grade a block yourself.",
    body: <GradeYourBlock />,
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "Three documents. The manual that scored race as risk, one surveyor's sheet, and the archive that holds the rest.",
    body: (
      <div className="space-y-4">
        <FactCard id="redlining.babcock_manual" label="The manual">
          It told appraisers to study whether what it called incompatible racial groups were
          present, and it praised the barriers that kept them out.
        </FactCard>
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
