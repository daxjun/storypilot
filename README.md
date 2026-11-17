# StoryPilot

**Turn screenplay episodes into an editorially ranked shortlist of promotional clips.**

StoryPilot is a prototype for content editors working with timestamped microdrama screenplays. It ingests screenplay text, creates candidate clip windows, removes duplicate or overlapping recommendations, and presents candidates for editorial review.

## Live Demo

[**Open the StoryPilot dashboard**](https://storypilotv1.vercel.app/dashboard)

> The hosted demo uses a private dataset stored in Vercel Blob. The screenplay files and processed dataset are not included in this public repository.

## What it does

- **Episode exploration** — browse processed episodes and their timestamped screenplay segments.
- **Candidate discovery** — inspect suggested promo windows, their start/end timestamps, and supporting screenplay content.
- **Editorial evaluation** — review hook, cliffhanger, rationale, scores, and evaluation status where available.
- **Ranking** — compare evaluated candidates and see which promos are ready for editorial consideration.
- **Boundary checks** — flag candidates whose start or end cuts through a dialogue or action segment.
- **Failure visibility** — distinguish completed evaluations, failed evaluations, and candidates still awaiting review.

## Current dataset snapshot

The deployed prototype currently reports:

| Metric | Count |
|---|---:|
| Episodes processed | 50 |
| Timestamped segments | 3,727 |
| Raw candidates generated | 11,972 |
| Shortlisted candidates | 894 |
| Editorial evaluations completed | 4 |
| Editorial evaluation failures | 7 |
| Ranked evaluated candidates | 4 |

These are the current prototype results, not a claim that every shortlisted candidate has been manually approved. Failed evaluations are kept distinct from successful evaluations rather than being assigned an artificial score.

## How candidate evaluation is framed

The editorial rubric considers five dimensions:

| Dimension | Weight |
|---|---:|
| Hook | 25% |
| Emotional impact | 20% |
| Curiosity | 20% |
| Standalone readability | 20% |
| Promo potential | 15% |

The rubric is intended to support editorial judgment, not replace it. Ranking is based on available completed evaluations; candidates without successful evaluations should not be interpreted as low-quality clips.

## Architecture

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **Data processing:** screenplay parsing, candidate generation, deduplication, boundary validation, editorial evaluation and ranking
- **Storage in production:** private Vercel Blob objects for processed JSON data and screenplay text
- **Hosting:** Vercel

### High-level flow

1. Timestamped screenplay files are parsed into structured episode segments.
2. Candidate windows are generated from the screenplay.
3. Duplicate candidates are removed and a shortlist is prepared.
4. Selected candidates are evaluated against the editorial rubric.
5. The API exposes episodes, candidates, evaluation status, and rankings to the dashboard.
6. Boundary warnings help editors identify clips that may cut through dialogue or action.

## Repository layout

```text
storypilot/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   └── services/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── vercel.json
└── README.md
```

## Run locally

### Requirements

- Python 3.12+
- Node.js and npm

### 1. Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=false
```

Then start the frontend:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local data

The processed dataset and screenplay files are intentionally excluded from Git. To run the backend with the real local dataset, place the authorized files in the expected backend data directories:

- `backend/data/evaluation/batch/`
- `backend/data/real/`

The batch directory needs the processed JSON files used by the API:

- `dataset-summary.json`
- `all-shortlisted-candidates.json`
- `top-50-candidates.json`
- `editorial-evaluations.json`

Do not commit screenplay source files, private dataset exports, Blob tokens, or environment files to this repository.

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Backend health and data availability |
| `GET /api/dashboard` | Dataset and pipeline summary |
| `GET /api/episodes` | List processed episodes |
| `GET /api/episodes/{episode_id}` | Retrieve an episode and parsed screenplay |
| `GET /api/candidates` | List shortlisted candidates |
| `GET /api/candidates/{candidate_id}` | Retrieve candidate details |
| `GET /api/rankings` | Ranked evaluated candidates |
| `GET /api/evaluations/status` | Evaluation progress and statuses |

## Important limitations

- A screenplay timestamp window is not independently verified against the final video or audio. Video-level synchronization and quality control remain necessary before publishing a clip.
- Boundary validation identifies dialogue/action segments that cross candidate boundaries; a warning is a prompt for human review, not an automatic rejection.
- Only candidates with successful editorial evaluations can contribute to the current evaluated ranking. The current dataset includes failed and pending evaluations.
- Automated scores are decision support. Editors should review context, pacing, visual continuity, spoilers, and platform suitability before selecting a promo.
- The hosted dataset is private and is not distributed through this repository.

## Privacy

The production deployment retrieves screenplay and processed data from a **private Vercel Blob store**. Sensitive source files and storage credentials are excluded from Git. Do not publish private screenplay material or access tokens in issues, commits, screenshots, or logs.

## Status

StoryPilot is a working prototype. The live dashboard demonstrates the current ingestion outputs, candidate shortlist, evaluation records, and ranking workflow.

---

Built as an AI-assisted editorial workflow prototype.
