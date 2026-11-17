import type { Metadata } from "next";
import { EvaluationsView } from "@/components/evaluations/evaluations-view";

export const metadata: Metadata = { title: "Evaluations" };

export default function EvaluationsPage() {
  return <EvaluationsView />;
}
