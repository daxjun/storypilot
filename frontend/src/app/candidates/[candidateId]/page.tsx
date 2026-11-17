import { CandidateDetailView } from "@/components/candidates/detail/candidate-detail-view";

export default async function CandidateDetailPage({
  params,
}: PageProps<"/candidates/[candidateId]">) {
  const { candidateId } = await params;
  return <CandidateDetailView candidateId={decodeURIComponent(candidateId)} />;
}
