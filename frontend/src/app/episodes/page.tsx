import type { Metadata } from "next";
import { EpisodesView } from "@/components/episodes/episodes-view";

export const metadata: Metadata = { title: "Episodes" };

export default function EpisodesPage() {
  return <EpisodesView />;
}
