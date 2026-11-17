"use client";

import { useState } from "react";
import { Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/demo-badge";
import { PageHeader } from "@/components/shared/page-header";
import { API_BASE_URL, DATA_MODE, FEATURES } from "@/lib/config";
import { EDITORIAL_DIMENSIONS, formatWeight } from "@/lib/scoring";
import { ENDPOINTS } from "@/services/api";
import { checkBackendHealth } from "@/services/dashboard-service";

const ENDPOINT_ROWS: { fn: string; path: string }[] = [
  { fn: "getDashboardStats()", path: ENDPOINTS.dashboard() },
  { fn: "getEpisodes()", path: ENDPOINTS.episodes() },
  { fn: "getEpisodeById(id)", path: ENDPOINTS.episode(":episodeId") },
  { fn: "getCandidates()", path: ENDPOINTS.candidates() },
  { fn: "getCandidateById(id)", path: ENDPOINTS.candidate(":candidateId") },
  { fn: "getEditorialRankings()", path: ENDPOINTS.rankings() },
  { fn: "getEvaluationStatus()", path: ENDPOINTS.evaluationStatus() },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-6">
      <dt className="w-44 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export function SettingsView() {
  const [checking, setChecking] = useState(false);

  async function onCheck() {
    setChecking(true);
    const result = await checkBackendHealth();
    setChecking(false);
    if (result.ok) toast.success(result.message);
    else toast.error("Backend not reachable", { description: result.message });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Read-only configuration for this frontend. Values are set through environment variables."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data source</CardTitle>
            <CardDescription>Switch modes with NEXT_PUBLIC_DATA_MODE in .env.local, then restart the dev server.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Mode">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{DATA_MODE === "mock" ? "Mock" : "API"}</span>
                  <DemoBadge />
                </span>
              </Row>
              <Row label="Backend base URL">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{API_BASE_URL}</code>
              </Row>
              <Row label="Retry evaluations">
                {FEATURES.retryEvaluation ? "Enabled" : "Not available yet"}
              </Row>
            </dl>
            <Button variant="outline" size="sm" className="mt-4" onClick={onCheck} disabled={checking}>
              {checking ? <Loader2 className="animate-spin" /> : <PlugZap />}
              Check backend connection
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Sends a GET to <code className="font-mono">{ENDPOINTS.health()}</code>. Works in either mode.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editorial scoring weights</CardTitle>
            <CardDescription>Defined by the backend evaluator. Shown here for reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {EDITORIAL_DIMENSIONS.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </div>
                  <span className="text-sm tabular-nums">{formatWeight(d.weight)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>API endpoints</CardTitle>
            <CardDescription>
              Proposed paths from <code className="font-mono">src/services/api.ts</code>. Confirm names and
              response shapes with the backend before switching to API mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Service function</th>
                    <th className="px-3 py-2 font-medium">GET path</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ENDPOINT_ROWS.map((r) => (
                    <tr key={r.fn}>
                      <td className="px-3 py-2 font-mono">{r.fn}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{r.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
