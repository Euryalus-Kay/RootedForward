/* ------------------------------------------------------------------ */
/*  Typed accessor over data/exhibit/models.json, the derivation       */
/*  contract for the Two Buyers simulator. Every constant traces to    */
/*  the fact registry ids in basisFactRefs; the component imports ALL  */
/*  of its math from here and holds no figure literals of its own.     */
/*  The dev-only console.asserts recompute the contract's invariants   */
/*  on module load, mirroring the audit script.                        */
/* ------------------------------------------------------------------ */
import modelsJson from "../../../data/exhibit/models.json";

interface RossExampleJson {
  contractPriceUsd: number;
  speculatorPaidUsd: number;
  priceRatio: number;
  priceRatioFormula?: string;
  note?: string;
}

interface TwoBuyersModelJson {
  basisFactRefs: string[];
  monthlyExtraUsd2019: number;
  avgTotalOverpaymentUsd2019: number;
  monthsToAverageOverpayment: number;
  monthsToAverageFormula?: string;
  markupAvgPct: number;
  rossExample: RossExampleJson;
  equityRule: string;
  evictionRule: string;
}

const model = (modelsJson as unknown as { twoBuyers: TwoBuyersModelJson }).twoBuyers;

/* Rendering convention only: the conventional column's equity bar fills
   over a 240-month (twenty-year) term so the share fraction has a
   denominator to draw. It is a display convention for the fraction,
   NOT a claimed historical mortgage rate, price, or payment schedule;
   the study's own units (2019 dollars) carry every dollar figure. */
const CONVENTIONAL_TERM_MONTHS = 240;

export const TWO_BUYERS = {
  /** fact registry ids every constant below traces to */
  basisFactRefs: model.basisFactRefs,
  /** the study's average monthly overpayment, 2019 dollars (contracts.extra_monthly_587) */
  monthlyExtraUsd: model.monthlyExtraUsd2019,
  /** the study's average total overpayment per family (contracts.avg_overpayment_71000) */
  avgTotalOverpaymentUsd: model.avgTotalOverpaymentUsd2019,
  /** months of average extra payments to reach the average total, round(71000 / 587) */
  monthsToAverage: model.monthsToAverageOverpayment,
  /** the study's average markup percent (contracts.markup_84pct) */
  markupAvgPct: model.markupAvgPct,
  /** Clyde Ross's documented North Lawndale contract */
  ross: {
    contractPriceUsd: model.rossExample.contractPriceUsd,
    speculatorPaidUsd: model.rossExample.speculatorPaidUsd,
    priceRatio: model.rossExample.priceRatio,
  },
  conventionalTermMonths: CONVENTIONAL_TERM_MONTHS,

  /** dollars paid beyond a fair price after `months` of contract payments */
  extraPaid(months: number): number {
    const m = Math.max(0, Math.round(months));
    return m * model.monthlyExtraUsd2019;
  },

  /** conventional buyer's owned share of the house, percent, clamped at 100 */
  conventionalSharePct(months: number): number {
    const m = Math.max(0, Math.round(months));
    return Math.min(100, (m / CONVENTIONAL_TERM_MONTHS) * 100);
  },
};

/* dev-only invariant checks, recomputed from the JSON itself */
if (process.env.NODE_ENV !== "production") {
  console.assert(
    Math.round(TWO_BUYERS.avgTotalOverpaymentUsd / TWO_BUYERS.monthlyExtraUsd) ===
      TWO_BUYERS.monthsToAverage,
    "models.json invariant broken, round(avgTotalOverpayment / monthlyExtra) must equal monthsToAverageOverpayment"
  );
  console.assert(
    TWO_BUYERS.extraPaid(TWO_BUYERS.monthsToAverage) ===
      TWO_BUYERS.monthsToAverage * TWO_BUYERS.monthlyExtraUsd,
    "extraPaid at monthsToAverage must be exactly months times the monthly extra"
  );
  console.assert(
    Math.round((TWO_BUYERS.ross.contractPriceUsd / TWO_BUYERS.ross.speculatorPaidUsd) * 100) /
      100 ===
      TWO_BUYERS.ross.priceRatio,
    "models.json invariant broken, Ross priceRatio must equal contractPrice / speculatorPaid to 2 decimals"
  );
  console.assert(
    TWO_BUYERS.conventionalSharePct(CONVENTIONAL_TERM_MONTHS) === 100 &&
      TWO_BUYERS.conventionalSharePct(0) === 0,
    "conventionalSharePct must run 0 to 100 across the rendering term"
  );
}

export default TWO_BUYERS;
