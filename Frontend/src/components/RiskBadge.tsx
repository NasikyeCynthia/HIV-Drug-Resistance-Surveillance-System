import type { Risk } from "../api/patients";
const STYLE: Record<Risk, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-900", high: "bg-red-100 text-red-800",
};
// The word is always shown, so meaning never depends on colour alone.
export function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLE[risk]}`}>{risk}</span>;
}
