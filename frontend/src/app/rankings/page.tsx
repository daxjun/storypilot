import type { Metadata } from "next";
import { RankingsView } from "@/components/rankings/rankings-view";

export const metadata: Metadata = { title: "Editorial Rankings" };

export default function RankingsPage() {
  return <RankingsView />;
}
