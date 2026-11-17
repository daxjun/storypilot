import type { Metadata } from "next";
import { CandidatesView } from "@/components/candidates/candidates-view";

export const metadata: Metadata = { title: "Clip Candidates" };

export default async function CandidatesPage({ searchParams }: PageProps<"/candidates">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const episode = typeof sp.episode === "string" ? sp.episode : "all";
  // Re-mount when the URL query changes (e.g. a search from the top bar).
  return <CandidatesView key={`${q}|${episode}`} initialQuery={q} initialEpisode={episode} />;
}
