STORYPILOT BACKEND API PATCH

This patch adds app/main.py. It does NOT call Gemini and does NOT alter your parser, candidate generator, deduplicator, evaluator, or data.

Expected existing layout:
backend/
  app/main.py
  app/services/structured_parser.py
  data/real/*.txt
  data/evaluation/batch/dataset-summary.json
  data/evaluation/batch/all-shortlisted-candidates.json
  data/evaluation/batch/top-50-candidates.json
  data/evaluation/batch/editorial-evaluations.json

Install dependencies if needed:
  pip install fastapi uvicorn pydantic

Run from C:\projects\storypilot\backend with the venv activated:
  uvicorn app.main:app --reload --port 8000

Check:
  http://localhost:8000/health
  http://localhost:8000/docs

The frontend must use:
  NEXT_PUBLIC_DATA_MODE=api
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
  NEXT_PUBLIC_FEATURE_RETRY_EVALUATION=false

Important: evaluation retry is intentionally not implemented. Failed Gemini requests stay failed and are not silently converted to zero. Screenplay timestamps are source timestamps, not verified video timestamps.
