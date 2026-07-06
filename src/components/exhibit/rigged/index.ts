/* ------------------------------------------------------------------ */
/*  The Rigged Instrument stations for the Machine Rooms. These are    */
/*  room stations, not tour pause points, so they are NOT in the       */
/*  interactive registry; the rooms mount them from here inside an     */
/*  InteractiveContext provider.                                       */
/* ------------------------------------------------------------------ */
export { default as GradeYourBlock } from "./configs/GradeYourBlock";
export { default as EthicsExam } from "./configs/EthicsExam";
export { default as YouAreTheCommission } from "./configs/YouAreTheCommission";
export { default as TestTheLaw } from "./configs/TestTheLaw";

export { default as RiggedInstrument, RiggedDebriefDrawer, RiggedRecordPanel } from "./RiggedInstrument";
export type {
  RiggedAnswers,
  RiggedDebrief,
  RiggedField,
  RiggedInstrumentProps,
  RiggedSelectField,
  RiggedSelectOption,
  RiggedShellConfig,
  RiggedVerdict,
} from "./RiggedInstrument";
