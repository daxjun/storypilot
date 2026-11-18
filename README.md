# StoryPilot

An AI-powered prototype that helps content editors shortlist promotional clips from timestamped microdrama screenplays.

## Live Demo

[**Open StoryPilot Dashboard**](https://storypilotv1.vercel.app/dashboard)

## Features

- Browse episodes and screenplay segments.
- Generate and explore promotional clip candidates.
- Review hooks, cliffhangers, and editorial scores.
- View candidate rankings and evaluation status.
- Identify clip-boundary issues for editorial review.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **LLM evaluation:** Google Gemini (backend only)
- **Storage:** Private Vercel Blob
- **Deployment:** Vercel (frontend and backend services)

## Dataset

| Metric | Count |
|---|---:|
| Episodes processed | 50 |
| Screenplay segments | 3,727 |
| Raw candidates generated | 11,972 |
| Shortlisted candidates | 894 |

Screenplay files and private dataset exports are intentionally excluded from this repository. The deployed backend loads processed JSON metadata and screenplay text from private Vercel Blob storage.

---

## Installation and Local Development

### Prerequisites

Install:

- Git
- Node.js 20 or later and npm
- Python 3.11 or later
- A Google Gemini API key only if you intend to run evaluation scripts
- Access to the private StoryPilot dataset exports if you want to run the full backend locally

Verify installations:

```bash
git --version
node --version
npm --version
python --version
```

### 1. Clone the repository

```bash
git clone https://github.com/daxjun/storypilot.git
cd storypilot
```

Repository structure:

```text
storypilot/
├── frontend/          # Next.js application
├── backend/           # FastAPI application and Python services
├── vercel.json        # Vercel multi-service routing
└── README.md
```

### 2. Configure and start the backend

Open a terminal in the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### Backend environment variables

Create a `.env` file inside `backend/` only if you need to run Gemini evaluation scripts:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

Keep this file private. Never commit API keys or put them in frontend `NEXT_PUBLIC_*` variables.

#### Local dataset

For local data mode, place the private dataset under:

```text
backend/
└── data/
    ├── real/
    │   └── <episode screenplay .txt files>
    └── evaluation/
        └── batch/
            ├── dataset-summary.json
            ├── all-shortlisted-candidates.json
            ├── top-50-candidates.json
            └── editorial-evaluations.json
```

These private files are not included in the public Git repository. Obtain them from the project owner or another authorized dataset source. The backend expects processed JSON files under `backend/data/evaluation/batch/` and screenplay text files under `backend/data/real/`.

Start the API from the `backend/` directory:

```bash
uvicorn main:app --reload --port 8000
```

Local API endpoints:

- Health: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs
- Dashboard data: http://127.0.0.1:8000/api/dashboard

The read-only API serves already processed data. Loading the dashboard and browsing candidates does not invoke Gemini.

### 3. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create the local environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux:**

```bash
cp .env.example .env.local
```

For local development without Vercel CLI, set `frontend/.env.local` to:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=false
```

Start Next.js:

```bash
npm run dev
```

Open http://localhost:3000.

> Restart `npm run dev` after changing any `NEXT_PUBLIC_*` environment variable. The frontend uses mock data when `NEXT_PUBLIC_DATA_MODE` is unset or set to `mock`.

### 4. Verify the local setup

With both terminals running, check:

1. http://127.0.0.1:8000/health returns an `ok: true` response.
2. http://127.0.0.1:8000/api/dashboard returns dataset metrics.
3. http://localhost:3000 loads StoryPilot and shows the backend-connected state.

If the API reports that data is unavailable, verify that the private JSON files are in `backend/data/evaluation/batch/`. If episode detail requests fail, also verify that screenplay files are in `backend/data/real/`.

---

## Deployment on Vercel

The production project is configured as a Vercel multi-service application:

- `frontend/` is the Next.js service.
- `backend/` is the FastAPI service, with `backend/main.py` exposing `app`.
- Root `vercel.json` routes `/api/*` and `/health` to the backend service and other paths to the frontend.

### 1. Import the repository

1. Sign in to Vercel.
2. Import `https://github.com/daxjun/storypilot`.
3. Keep the repository root as the project root so Vercel can read the root `vercel.json`.
4. Deploy using the repository's Vercel configuration.

### 2. Configure private dataset storage

The deployed backend uses private Vercel Blob storage. Configure a private Blob store in the Vercel project and upload the authorized dataset files using these object paths:

```text
storypilot/
├── evaluation/
│   └── batch/
│       ├── dataset-summary.json
│       ├── all-shortlisted-candidates.json
│       ├── top-50-candidates.json
│       └── editorial-evaluations.json
└── real/
    └── <episode screenplay .txt files>
```

Add the Blob read/write token to the **backend service's** Vercel environment variables:

```text
BLOB_READ_WRITE_TOKEN=<private Vercel Blob token>
```

The token is a secret. Do not expose it in frontend variables, source code, screenshots, or commits. The backend downloads the four processed metadata JSON files at startup and retrieves relevant screenplay text from private Blob storage for episode and candidate detail requests.

### 3. Configure frontend production environment

Set these environment variables for the frontend service:

```env
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=false
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty in production. This makes browser requests same-origin (for example, `/api/dashboard`) so the root Vercel rewrites route them to the backend service. Do not set it to `localhost` or `127.0.0.1` in a deployed browser.

### 4. Deploy and verify

After configuring environment variables and Blob storage, redeploy the Vercel project. Verify:

- `https://storypilotv1.vercel.app/health`
- `https://storypilotv1.vercel.app/api/dashboard`
- `https://storypilotv1.vercel.app/api/episodes`
- `https://storypilotv1.vercel.app/api/candidates`
- `https://storypilotv1.vercel.app/api/rankings`
- `https://storypilotv1.vercel.app/api/evaluations/status`

The frontend dashboard is available at https://storypilotv1.vercel.app/dashboard.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health and data availability |
| GET | `/api/dashboard` | Dataset and pipeline summary |
| GET | `/api/episodes` | List processed episodes |
| GET | `/api/episodes/{episode_id}` | Episode details and screenplay segments |
| GET | `/api/candidates` | Shortlisted candidates; supports `episode_id` and `status` filters |
| GET | `/api/candidates/{candidate_id}` | Candidate details, source segments and evaluation |
| GET | `/api/rankings` | Successfully evaluated candidates ordered by editorial score |
| GET | `/api/evaluations/status` | Completed, failed and pending evaluation states |

The API is read-only. Candidate generation and Gemini evaluation are separate processing steps; opening the deployed dashboard does not trigger them.

## Editorial Scoring

Candidates are evaluated across five dimensions:

| Dimension | Weight |
|---|---:|
| Hook strength | 25% |
| Emotional intensity | 20% |
| Curiosity gap | 20% |
| Standalone readability | 20% |
| Spoiler safety | 15% |

Only successfully evaluated candidates receive a final editorial ranking. Failed or pending evaluations are not treated as zero-score clips.

## Notes and Limitations

- Candidate timestamps are screenplay-derived windows, not verified video edit points. Editorial review is required before publishing.
- Hook and cliffhanger suggestions are based on screenplay evidence; the prototype does not analyze finished video, acting, music, or editing.
- Gemini evaluation can fail because of transient provider availability or rate limits. Failed evaluations remain explicitly marked as failed rather than being assigned fabricated scores.
- The retry-evaluation UI is disabled unless a matching backend endpoint is enabled.
- Private screenplay files, Blob credentials, Gemini keys, and private evaluation exports must not be committed to Git.

## License

No open-source license is currently specified. All rights reserved unless the repository owner adds a license.
