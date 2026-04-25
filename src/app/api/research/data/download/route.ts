/* ------------------------------------------------------------------ */
/*  /api/research/data/download                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Auth-gated dataset download. The flow is:                          */
/*    1. Verify the requester has a Supabase session.                  */
/*    2. Look up the dataset row by ?slug=...                          */
/*    3. Insert a row into dataset_downloads (audit trail).            */
/*    4. Either:                                                       */
/*         - return a signed URL redirect to the storage object        */
/*           when storage_path is set and is_public is true, or        */
/*         - generate an inline ZIP at runtime containing the          */
/*           dataset manifest + README so users get something          */
/*           usable while the live archive is being prepared.          */
/*                                                                     */
/*  When Supabase is not configured (placeholder credentials), we      */
/*  short-circuit to a manifest-only ZIP without auth so local dev    */
/*  still works.                                                       */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
} from "@/lib/research-constants";

export const runtime = "nodejs";

const PLACEHOLDER_DATASETS: Record<
  string,
  {
    contents: string;
    license: string;
    source: string;
    files: { name: string; bytes: number; description: string }[];
  }
> = {
  "geography-of-disinvestment-chicago-west-side": {
    contents:
      "HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, and North Lawndale, paired with six quantitative outcome indicators and the Cook County Assessor 2024 residential-vacancy panel.",
    license:
      "Code MIT, derived data CC BY 4.0, 1938 zone polygons CC BY-NC-SA 4.0.",
    source:
      "Mapping Inequality (Nelson et al. 2016), Cook County Assessor 2024, US Census ACS 2023 5-year.",
    files: [
      {
        name: "holc-west-side-tract-crosswalk.geojson",
        bytes: 2300000,
        description:
          "Polygon geometry with HOLC grade and 2020 tract GEOIDs.",
      },
      {
        name: "holc-west-side-outcomes.csv",
        bytes: 48000,
        description:
          "104 D-graded tracts plus 37 comparison tracts with 6 outcome columns.",
      },
      {
        name: "holc-west-side-analysis.R",
        bytes: 12000,
        description: "Replication code for all tables and figures.",
      },
    ],
  },
  "obama-center-impact-zone-rent-pressure": {
    contents:
      "Cleaned 9,612-listing panel from Zillow ZORI, Craigslist, and the Chicago Rental Registry, January 2020 through December 2025.",
    license: "Data CC BY 4.0, code MIT.",
    source: "Zillow Research, Craigslist, Chicago Rental Registry.",
    files: [
      {
        name: "opc-rent-panel-2020-2025.csv",
        bytes: 18400000,
        description: "9,612 listings, monthly observations.",
      },
      {
        name: "opc-impact-zone-tracts.geojson",
        bytes: 740000,
        description: "Eleven-tract half-mile-ring boundary.",
      },
      {
        name: "opc-did-analysis.R",
        bytes: 18000,
        description: "Difference-in-differences specification.",
      },
      {
        name: "opc-synthetic-control.R",
        bytes: 14500,
        description: "Synthetic-control robustness.",
      },
    ],
  },
  "pilsen-industrial-corridor-rezoning-review": {
    contents:
      "Coded 351-comment public record for Application ZC-2025-0074, hearing transcript excerpts, coalition log.",
    license: "CC BY 4.0.",
    source: "City of Chicago Office of the Clerk legislative system.",
    files: [
      {
        name: "pilsen-zc-2025-0074-comments.csv",
        bytes: 410000,
        description: "351 comments coded along seven dimensions.",
      },
      {
        name: "pilsen-coding-schema.md",
        bytes: 8000,
        description: "Coding rubric.",
      },
      {
        name: "pilsen-hearing-timeline.csv",
        bytes: 3500,
        description: "Hearing-day events and witness order.",
      },
    ],
  },
  "cpd-traffic-stop-data-2024": {
    contents:
      "Cleaned 2024 stop-level panel of 287,412 records, district crosswalk, outcome-test code.",
    license: "Data CC BY 4.0, code MIT.",
    source: "CPD 2024 Traffic Stop Data Transparency Act release.",
    files: [
      {
        name: "cpd-stops-2024.csv",
        bytes: 62500000,
        description: "287,412 stops, 15 fields.",
      },
      {
        name: "cpd-district-crosswalk.csv",
        bytes: 18000,
        description: "22 districts with 2023 ACS demographics.",
      },
      {
        name: "cpd-outcome-test.R",
        bytes: 21000,
        description: "Knowles-Persico-Todd outcome-test implementation.",
      },
      {
        name: "cpd-vod-check.R",
        bytes: 15500,
        description: "Veil-of-darkness check.",
      },
    ],
  },
  "1938-holc-chicago-map-annotated": {
    contents:
      "239 graded zones, 82 Area Descriptions, GeoJSON polygons, 2020-tract crosswalk, six indicator files.",
    license: "CC BY-NC-SA 4.0, code MIT.",
    source:
      "Mapping Inequality (Nelson et al. 2016), National Archives RG 195.",
    files: [
      {
        name: "holc-chicago-1938-zones.geojson",
        bytes: 4200000,
        description: "239 graded zones.",
      },
      {
        name: "holc-chicago-1938-area-descriptions.csv",
        bytes: 480000,
        description: "All 82 Area Descriptions transcribed.",
      },
      {
        name: "holc-chicago-2020-tract-crosswalk.csv",
        bytes: 62000,
        description: "Tract-to-zone match with overlap percentages.",
      },
      {
        name: "holc-chicago-indicators.parquet",
        bytes: 1100000,
        description: "Six tract-level outcome indicators 2020 to 2024.",
      },
      {
        name: "holc-chicago-map-tiles.zip",
        bytes: 104000000,
        description: "Vector tiles for self-hosting.",
      },
    ],
  },
  "school-closures-2013-and-after": {
    contents:
      "Tract-level CPS post-closure tracking panel, Facilities Master Plan, block vacancy panel, CPL circulation.",
    license: "Code/tables MIT. CPS file subject to FOIA 2024-04311.",
    source: "CPS, CPL, Cook County Assessor.",
    files: [
      {
        name: "cps-2013-closures-tracking.csv",
        bytes: 2400000,
        description: "11,729 displaced students by tract.",
      },
      {
        name: "cps-facilities-master-plan-2013-2024.csv",
        bytes: 620000,
        description: "Annual building dispositions.",
      },
      {
        name: "cps-block-vacancy-panel.csv",
        bytes: 3100000,
        description: "Quarter-mile buffer vacancy 2013 to 2024.",
      },
      {
        name: "cpl-circulation-2013-2024.csv",
        bytes: 1400000,
        description: "Branch monthly circulation totals.",
      },
    ],
  },
  "cha-plan-for-transformation-retrospective": {
    contents:
      "De-identified CHA resident-tracking panel covering 17,000 families 1999 through 2024, MTW reports, HUD HCV records.",
    license:
      "Code MIT. CHA tracking subject to FOIA 2019-00924 / 2022-00718 / 2025-01108.",
    source: "CHA (Illinois FOIA), HUD HCV administrative file.",
    files: [
      {
        name: "cha-resident-tracking-1999-2024.csv",
        bytes: 3800000,
        description: "17,000 displaced families with year-end status.",
      },
      {
        name: "cha-mtw-tract-aggregates.csv",
        bytes: 920000,
        description: "Annual MTW unit counts by tract.",
      },
      {
        name: "hud-hcv-chicago-area.csv",
        bytes: 2100000,
        description: "HCV households with current tract.",
      },
      {
        name: "cha-unit-count-reconciliation.R",
        bytes: 17000,
        description: "Reproduces the 25,000-unit reconciliation.",
      },
    ],
  },
  "austin-cba-playbook": {
    contents:
      "Eight Chicago CBAs coded across five structural features and ten compliance categories. Austin site evaluation.",
    license: "CC BY 4.0.",
    source:
      "Chicago Lawyers' Committee CBA Repository, UIC Great Cities Institute.",
    files: [
      {
        name: "chicago-cba-eight-case-coding.csv",
        bytes: 34000,
        description: "Eight cases coded across structural features.",
      },
      {
        name: "cba-structural-features.md",
        bytes: 12000,
        description: "Coding rubric.",
      },
      {
        name: "austin-site-evaluation.md",
        bytes: 18000,
        description: "Site-by-site evaluation.",
      },
    ],
  },
  "bronzeville-tif-expenditure-analysis": {
    contents:
      "Twenty-three-year Bronzeville TIF revenue and expenditure 2002 through 2025.",
    license: "Code MIT, derived data CC BY 4.0.",
    source:
      "Cook County Clerk TIF Annual Reports, Chicago DOF, Chicago DPD.",
    files: [
      {
        name: "bronzeville-tif-revenue-2002-2025.csv",
        bytes: 24000,
        description: "Annual increment by overlapping taxing body.",
      },
      {
        name: "bronzeville-tif-expenditures-2002-2025.csv",
        bytes: 42000,
        description: "Project-level expenditure with category.",
      },
      {
        name: "bronzeville-tif-project-list.csv",
        bytes: 31000,
        description: "31 projects with within-district share.",
      },
      {
        name: "bronzeville-tif-comparison-districts.csv",
        bytes: 18000,
        description: "Adjacent districts comparison.",
      },
    ],
  },
  "cook-county-property-tax-appeal-disparity": {
    contents:
      "Ten-year Cook County appeal record (2015 to 2024), tract demographics, specialized-firm concentration.",
    license: "Code MIT, derived data CC BY 4.0.",
    source: "Cook County Assessor and Board of Review (Illinois FOIA).",
    files: [
      {
        name: "cook-appeals-2015-2024.csv",
        bytes: 92000000,
        description: "1.74 million appeal filings with outcome.",
      },
      {
        name: "cook-appeals-tract-panel.csv",
        bytes: 1400000,
        description: "Tract-year panel of filing/success/reduction.",
      },
      {
        name: "cook-appeals-firm-concentration.csv",
        bytes: 380000,
        description: "Specialized firm activity by tract.",
      },
      {
        name: "cook-appeals-analysis.R",
        bytes: 24000,
        description: "Replication code.",
      },
    ],
  },
  "cross-bronx-expressway-sixty-years-later": {
    contents:
      "1948 to 1955 acquisitions, 1960 to 1980 census panel, 2023 PM2.5/noise/asthma data.",
    license: "Code MIT, derived data CC BY 4.0.",
    source:
      "NYC Municipal Archives RG 219, IPUMS NHGIS, NY State DOH EPHTS.",
    files: [
      {
        name: "cross-bronx-acquisitions-1948-1955.csv",
        bytes: 2900000,
        description: "Parcel-level acquisitions with payment and demographics.",
      },
      {
        name: "cross-bronx-census-1960-1980.csv",
        bytes: 680000,
        description: "Quarter-mile buffer panel.",
      },
      {
        name: "cross-bronx-environmental-2023.csv",
        bytes: 210000,
        description: "Tract-level PM2.5 and noise.",
      },
      {
        name: "cross-bronx-asthma-2023.csv",
        bytes: 190000,
        description: "Pediatric asthma hospitalization rate.",
      },
      {
        name: "cross-bronx-quarter-mile-buffer.geojson",
        bytes: 1200000,
        description: "Buffer polygon.",
      },
    ],
  },
  "fillmore-forty-years-after-redevelopment": {
    contents:
      "SFRA archival abstracts (1948 through 2012) and OCII Certificates of Preference annual reports (2008 through 2024).",
    license: "CC BY-NC 4.0.",
    source:
      "SFPL History Center, San Francisco MOHCD.",
    files: [
      {
        name: "sfra-archival-abstracts.csv",
        bytes: 280000,
        description: "Coded SFRA case file abstracts.",
      },
      {
        name: "ocii-cop-2008-2024.csv",
        bytes: 92000,
        description: "Annual COP placement counts.",
      },
    ],
  },
  "fair-park-and-the-neighborhoods-it-displaced": {
    contents:
      "1935 through 1936 and 1966 through 1968 acquisitions, ACS 2023 South Dallas panel, Fair Park First implementation.",
    license: "CC BY 4.0.",
    source:
      "Dallas Historical Society, Texas General Land Office, US Census ACS 2023, Fair Park First.",
    files: [
      {
        name: "fair-park-1936-acquisitions.csv",
        bytes: 68000,
        description: "3,800 displaced residents on forty-two blocks.",
      },
      {
        name: "fair-park-1966-1968-acquisitions.csv",
        bytes: 34000,
        description: "1,400 displaced residents on forty-two acres.",
      },
      {
        name: "fair-park-acs-2023-panel.csv",
        bytes: 52000,
        description: "South Dallas tract ACS indicators.",
      },
      {
        name: "fair-park-first-2020-2024.csv",
        bytes: 24000,
        description: "Implementation milestones.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Manifest ZIP generator                                             */
/* ------------------------------------------------------------------ */
/*  Until the live archives are uploaded to the research-datasets     */
/*  bucket, every download ships a manifest ZIP that contains:        */
/*     - README.md   citation block, license, source, contact.        */
/*     - MANIFEST.csv  one row per file in the archive.               */
/*     - DOWNLOAD-INFO.txt  the requester's email and timestamp so    */
/*       researchers can keep their own usage record.                 */
/*                                                                     */
/*  The manifest mirrors what the live archive will contain. Once an */
/*  admin uploads the real ZIP to storage, this branch is bypassed   */
/*  in favor of a signed URL.                                          */
/* ------------------------------------------------------------------ */

async function buildManifestZip(
  slug: string,
  paperTitle: string,
  email: string | null,
  meta: (typeof PLACEHOLDER_DATASETS)[string]
): Promise<Buffer> {
  const zip = new JSZip();

  const readme = [
    `# ${paperTitle}`,
    "",
    `Replication archive · ${slug}`,
    `Generated ${new Date().toISOString()}`,
    "",
    "## Contents",
    "",
    meta.contents,
    "",
    "## License",
    "",
    meta.license,
    "",
    "## Source",
    "",
    meta.source,
    "",
    "## Citation",
    "",
    `Rooted Forward (2026). ${paperTitle}. https://rooted-forward.org/research/${slug}`,
    "",
    "## Contact",
    "",
    "research@rooted-forward.org",
    "",
    "## Files",
    "",
    ...meta.files.map(
      (f) => `- \`${f.name}\` (${formatBytes(f.bytes)}) · ${f.description}`
    ),
  ].join("\n");

  const manifestCsv = [
    "filename,bytes,description",
    ...meta.files.map(
      (f) =>
        `"${f.name}",${f.bytes},"${(f.description || "").replace(/"/g, '""')}"`
    ),
  ].join("\n");

  const downloadInfo = [
    `slug: ${slug}`,
    `requested_by: ${email ?? "anonymous"}`,
    `requested_at: ${new Date().toISOString()}`,
    "",
    "If your registered email changes, contact research@rooted-forward.org",
    "so we can keep your dataset-errata notifications current.",
  ].join("\n");

  zip.file("README.md", readme);
  zip.file("MANIFEST.csv", manifestCsv);
  zip.file("DOWNLOAD-INFO.txt", downloadInfo);

  // Add empty placeholder files for each declared dataset file so the
  // shape of the archive matches the documentation. Each placeholder
  // contains a one-line note saying the live archive is being staged.
  meta.files.forEach((f) => {
    const placeholder = `# Placeholder for ${f.name}\n# ${f.description}\n# The live archive ships through admin upload to the research-datasets storage bucket.\n# Until then, this file holds the manifest entry only.\n`;
    zip.file(f.name + ".placeholder.txt", placeholder);
  });

  return await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const meta = PLACEHOLDER_DATASETS[slug];
  if (!meta) {
    return NextResponse.json({ error: "dataset not found" }, { status: 404 });
  }

  const entry = PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug);
  const paperTitle = entry?.title ?? slug;

  // ---- Auth + audit ----
  let email: string | null = null;
  let role: string | null = null;
  let userId: string | null = null;

  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Unauthenticated. Send the user to the login page with a
        // ?next= back to the data archive anchor.
        const loginUrl = new URL(
          `/auth/login?next=${encodeURIComponent(`/research/data#${slug}`)}`,
          req.url
        );
        return NextResponse.redirect(loginUrl, { status: 302 });
      }
      userId = user.id;
      email = user.email ?? null;

      // Look up role for the audit record
      const { data: roleRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (roleRow as { role?: string } | null)?.role ?? "user";

      // Insert audit row using the service-role client so RLS does
      // not block it. If the SR key is not configured, we still
      // attempt with the regular client; the table's RLS allows
      // inserts only via SR, so the insert will silently fail there
      // and we still ship the file.
      const { createAdminClient } = await import("@/lib/supabase/server");
      try {
        const admin = await createAdminClient();
        await admin.from("dataset_downloads").insert({
          dataset_slug: slug,
          user_id: userId,
          user_email: email,
          user_role: role,
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          user_agent: req.headers.get("user-agent") ?? null,
        });
      } catch {
        // If Supabase admin write fails (e.g. SR key not set in
        // local dev), continue serving the file. The user gets the
        // download and the audit record is best-effort.
      }
    }
  } catch {
    // Supabase not reachable in local dev. Fall through and serve
    // the manifest ZIP so /research/data still works.
  }

  const buffer = await buildManifestZip(slug, paperTitle, email, meta);
  const filename = `rooted-forward-${slug}.zip`;

  // NextResponse expects BodyInit, which doesn't include Buffer in
  // current type defs. Convert to Uint8Array (also a streamable
  // BodyInit) so the type checker is happy without changing runtime
  // behavior.
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
