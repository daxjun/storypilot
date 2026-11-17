import { EpisodeDetailView } from "@/components/episodes/episode-detail-view";

export default async function EpisodeDetailPage({ params }: PageProps<"/episodes/[episodeId]">) {
  const { episodeId } = await params;
  return <EpisodeDetailView episodeId={decodeURIComponent(episodeId)} />;
}
