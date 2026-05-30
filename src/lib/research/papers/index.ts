import type { ResearchEntry } from "@/lib/types/database";

import { entry as paper01 } from "./holc-redlining-present-day-outcomes-chicago";
import { entry as paper02 } from "./chicago-2013-school-closures-geography";
import { entry as paper03 } from "./cook-county-property-tax-appeal-disparity";
import { entry as paper04 } from "./chicago-traffic-stop-racial-disparity";
import { entry as paper05 } from "./chicago-tif-spending-distribution";
import { entry as paper06 } from "./chicago-mortgage-lending-disparity-hmda";
import { entry as paper07 } from "./chicago-eviction-filing-geography";
import { entry as paper08 } from "./chicago-gentrification-rent-burden";
import { entry as paper09 } from "./chicago-lead-service-lines-water";
import { entry as paper10 } from "./cook-county-vacant-land-land-bank";
import { entry as paper11 } from "./chicago-affordable-requirements-ordinance";
import { entry as paper12 } from "./the-606-trail-displacement";
import { entry as paper13 } from "./chicago-transit-access-income";
import { entry as paper14 } from "./chicago-divvy-bikeshare-equity";
import { entry as paper15 } from "./redlining-urban-heat-tree-canopy";
import { entry as paper16 } from "./comparative-urban-renewal-displacement";

/* Ordered newest first to match the catalog default sort. */
export const RESEARCH_PAPERS: ResearchEntry[] = [
  paper01,
  paper02,
  paper03,
  paper04,
  paper05,
  paper06,
  paper07,
  paper08,
  paper09,
  paper10,
  paper11,
  paper12,
  paper13,
  paper14,
  paper15,
  paper16,
];
