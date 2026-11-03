// Clinical thresholds live here, in one place, so they can follow guideline updates.
// VERIFY against the current Uganda Consolidated HIV Guidelines before real use.
export const VL_FAILURE_THRESHOLD = 1000; // copies/mL: at or above = not suppressed
export const PSYCHOSOCIAL_OPTIONS = [
  "Economic challenges/poverty", "Stigma & discrimination", "Non-disclosure",
  "Dysfunctional family/client support", "Harmful habits (alcohol & substance use)",
];
export const REGIMENS = ["TDF/3TC/DTG", "AZT/3TC/DTG", "ABC/3TC/DTG", "AZT/3TC/LPV/r", "TDF/3TC/ATV/r", "Other"];
export const ADHERENCE = ["Good", "Fair", "Poor"];
