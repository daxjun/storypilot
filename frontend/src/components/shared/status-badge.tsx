
import {
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  Loader2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CandidateStatus } from "@/types/candidate";
import type { EpisodeProcessingStatus } from "@/types/episode";
import type { EvaluationStatus } from "@/types/evaluation";

// --------------------------------------------------
// Candidate status
// --------------------------------------------------

const CANDIDATE: Record<
  CandidateStatus,
  {
    label: string;
    variant: "success" | "default" | "danger" | "neutral";
    icon: typeof Circle;
    hint: string;
  }
> = {
  evaluated: {
    label: "Evaluated",
    variant: "success",
    icon: CheckCircle2,
    hint: "AI editorial evaluation completed",
  },
  shortlisted: {
    label: "Shortlisted",
    variant: "default",
    icon: ListChecks,
    hint: "Selected for AI evaluation; result not available yet",
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
    hint: "AI evaluation was attempted and failed",
  },
  pending: {
    label: "Pending",
    variant: "neutral",
    icon: Clock,
    hint: "Kept after deduplication; not selected for evaluation",
  },
};

export const CANDIDATE_STATUS_OPTIONS = (
  Object.keys(CANDIDATE) as CandidateStatus[]
).map((k) => ({
  value: k,
  label: CANDIDATE[k].label,
  hint: CANDIDATE[k].hint,
}));

export function CandidateStatusBadge({
  status,
}: {
  status: CandidateStatus;
}) {
  const s = CANDIDATE[status] ?? CANDIDATE.pending;
  const Icon = s.icon;

  return (
    <Badge variant={s.variant} title={s.hint}>
      <Icon aria-hidden />
      {s.label}
    </Badge>
  );
}

// --------------------------------------------------
// Episode processing status
// --------------------------------------------------

const EPISODE: Record<
  EpisodeProcessingStatus,
  {
    label: string;
    variant: "success" | "default" | "danger" | "neutral";
    icon: typeof Circle;
  }
> = {
  completed: {
    label: "Completed",
    variant: "success",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    variant: "default",
    icon: Loader2,
  },
  pending: {
    label: "Pending",
    variant: "neutral",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
  },
};

export const EPISODE_STATUS_OPTIONS = (
  Object.keys(EPISODE) as EpisodeProcessingStatus[]
).map((k) => ({
  value: k,
  label: EPISODE[k].label,
}));

export function EpisodeStatusBadge({
  status,
}: {
  status: EpisodeProcessingStatus;
}) {
  const s = EPISODE[status] ?? EPISODE.pending;
  const Icon = s.icon;

  return (
    <Badge variant={s.variant}>
      <Icon aria-hidden />
      {s.label}
    </Badge>
  );
}

// --------------------------------------------------
// Editorial evaluation status
// --------------------------------------------------

const EVALUATION: Record<
  string,
  {
    label: string;
    variant: "success" | "default" | "danger";
    icon: typeof Circle;
  }
> = {
  completed: {
    label: "Evaluated",
    variant: "success",
    icon: CheckCircle2,
  }, 
   evaluated: {
    label: "Evaluated",
    variant: "success",
    icon: CheckCircle2,
  },
  success: {
    label: "Evaluated",
    variant: "success",
    icon: CheckCircle2,
  },
  pending: {
    label: "Awaiting",
    variant: "default",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    variant: "danger",
    icon: XCircle,
  },
};

export function EvaluationStatusBadge({
  status,
}: {
  status: EvaluationStatus;
}) {
  const s = EVALUATION[status] ?? {
    label: String(status || "Unknown"),
    variant: "default" as const,
    icon: Circle,
  };

  const Icon = s.icon;

  return (
    <Badge variant={s.variant}>
      <Icon aria-hidden />
      {s.label}
    </Badge>
  );
}
