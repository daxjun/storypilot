# StoryPilot — Frontend

StoryPilot helps content editors find, evaluate, shortlist and rank promotional clips from timestamped microdrama screenplays. This repo is the **frontend only**. The backend (Python · FastAPI · Gemini) is built separately.

The app runs on **demo data by default**, so you can use every screen before the backend is ready. When it does, a **“Demo data”** badge shows in the top bar.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000. You'll be sent to `/dashboard`.

Requires Node.js 20.9 or newer.

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start the dev server                        |
| `npm run build`     | Build for production (includes type checks) |
| `npm start`         | Serve the production build                  |
| `npm run lint`      | ESLint                                      |
| `npm run typecheck` | Generate route types, then run `tsc`        |

## Mock mode vs API mode

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_DATA_MODE=mock          # "mock" (default) or "api"
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=false
```

Restart `npm run dev` after any change. The **Settings** page shows the active mode and base URL, and has a **Check backend connection** button that calls `GET /health`.

Never put API keys here. Anything prefixed `NEXT_PUBLIC_` is sent to the browser. Gemini credentials belong on the backend.

## Pages

| Route                        | Purpose                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/dashboard`                 | KPIs, pipeline status, three overview charts, recent activity                                               |
| `/episodes`                  | Episode table with search, status filter, sorting and pagination                                            |
| `/episodes/[episodeId]`      | Logline, continuity notes, processing stats and the episode's candidates                                    |
| `/candidates`                | Candidate workspace: search, filters, sorting, table/card view                                              |
| `/candidates/[candidateId]`  | Full editorial evaluation: hook, cliffhanger, five scored dimensions, strengths/weaknesses/risks, evidence timeline and screenplay segments |
| `/rankings`                  | Evaluated clips ranked by the backend's final score, with filters and the ranking method explained          |
| `/evaluations`               | Evaluator progress and per-candidate status, with error messages                                            |
| `/settings`                  | Read-only configuration, scoring weights and the endpoint map                                               |

## Project structure

```
src/
  app/                 Routes (App Router). Pages are thin wrappers around views.
  components/
    layout/            App shell, sidebar, top bar, mobile drawer
    dashboard/         KPI, pipeline, charts, activity
    episodes/          Episode list and detail views
    candidates/        Candidate table/cards, list view
      detail/          Candidate evaluation screen sections
    rankings/          Rankings view and methodology
    evaluations/       Evaluation status view
    settings/          Settings view
    shared/            Status badges, states (loading/empty/error), page header, pagination…
    ui/                shadcn/ui-style primitives (button, card, badge, table, sheet…)
  services/
    api.ts             ENDPOINTS map + fetch client (the single place URLs live)
    *-service.ts       getDashboardStats, getEpisodes, getEpisodeById, getCandidates,
                       getCandidateById, getEditorialRankings, getEvaluationStatus
    mock-handlers.ts   Mock backend built from src/data (joins and counts only)
  data/                Demo data (fictional show “Crimson Vows”)
  types/               episode.ts, candidate.ts, evaluation.ts, api.ts
  hooks/               useAsync (loading / error / reload)
  lib/                 config, formatting, scoring labels/weights, filters, cn()
```

The UI components ship as source files (the same approach as shadcn/ui), so there's no extra install step.

## Connecting the backend

1. **Agree on endpoints and response shapes** with the backend developer. The paths in `src/services/api.ts` (`/api/episodes`, `/api/candidates/:id`, …) are proposals, not confirmed names.
2. **Check the data contracts.**
   - `src/types/episode.ts`, `candidate.ts` and `evaluation.ts` mirror the current backend models.
   - `src/types/api.ts` holds the proposed view models the pages consume, for example `EpisodeListItem.stats`, `CandidateListItem.status` and `CandidateDetail`.
   - If the backend returns different shapes, adapt them inside the service functions. Components only depend on these types.
3. Set `NEXT_PUBLIC_DATA_MODE=api`.
4. Once everything is wired up, you can delete `src/data/` and `src/services/mock-handlers.ts`.

### Things the frontend assumes

- **Candidate status** is one of `pending` (kept after dedup, not shortlisted), `shortlisted` (sent for evaluation, no result yet), `evaluated` or `failed`.
- **`final_editorial_score`** always comes from the backend. The UI never recomputes it. The 25/20/20/20/15 weights are only shown as labels and as the explanation of the method.
- **Rankings** include only candidates with `evaluation_status = "completed"`. Excluded candidates are listed separately, never ranked.
- **Preliminary score** is shown as returned (two decimals). The UI assumes no particular scale.
- **Evidence roles**: hook evidence comes from `hook_strength.evidence_segment_ids` and cliffhanger evidence from `cliffhanger_evidence_segment_ids`. Every other segment cited by any dimension is marked “cited”.
- **Timestamps** are screenplay timestamps, and the UI labels them that way. There's no video playback.
- **Retry for failed evaluations** stays hidden unless `NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=true` and API mode is on. It calls `POST /api/evaluations/:id/retry` (proposed).

## Notes

- Fonts use the `geist` package, so they're self-hosted and nothing is requested from Google Fonts.
- `AGENTS.md` is generated by Next.js 16 for AI coding tools. It's safe to keep or ignore.
