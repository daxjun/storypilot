"""StoryPilot read-only API. Loads the already processed local dataset; never calls Gemini."""
from __future__ import annotations

import asyncio
import json
import os
import re
from pathlib import Path
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
USING_VERCEL_BLOB = bool(os.getenv("BLOB_READ_WRITE_TOKEN"))
DATA = Path("/tmp/storypilot-data") if USING_VERCEL_BLOB else ROOT / "data"
BATCH = DATA / "evaluation" / "batch"
REAL = DATA / "real"

app = FastAPI(title="StoryPilot API", version="1.0.0", description="Read-only API for screenplay promo candidates and editorial evaluations")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def load_private_blob_metadata():
    """Load processed JSON metadata from private Blob into the writable /tmp directory."""
    if not USING_VERCEL_BLOB:
        return
    if not os.getenv("BLOB_READ_WRITE_TOKEN"):
        raise RuntimeError("BLOB_READ_WRITE_TOKEN is missing in the Vercel environment")

    from vercel.blob import get_blob

    BATCH.mkdir(parents=True, exist_ok=True)
    filenames = [
        "dataset-summary.json",
        "all-shortlisted-candidates.json",
        "top-50-candidates.json",
        "editorial-evaluations.json",
    ]
    results = await asyncio.gather(*[
        get_blob(f"storypilot/evaluation/batch/{name}", access="private")
        for name in filenames
    ])
    for name, result in zip(filenames, results):
        (BATCH / name).write_bytes(result.body)


def read_json(name: str, default: Any):
    path = BATCH / name
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return default


def index_by(items, key):
    return {item.get(key): item for item in items if isinstance(item, dict) and item.get(key)}


@lru_cache(maxsize=1)
def dataset():
    return read_json("dataset-summary.json", {})


@lru_cache(maxsize=1)
def all_candidates():
    return read_json("all-shortlisted-candidates.json", [])


@lru_cache(maxsize=1)
def top_candidates():
    return read_json("top-50-candidates.json", [])


@lru_cache(maxsize=1)
def evaluation_records():
    return read_json("editorial-evaluations.json", [])


@lru_cache(maxsize=1)
def eval_maps():
    completed, failed = {}, {}
    for rec in evaluation_records():
        if not isinstance(rec, dict):
            continue
        cand = rec.get("candidate") if isinstance(rec.get("candidate"), dict) else {}
        cid = cand.get("candidate_id") or rec.get("candidate_id")
        if not cid:
            continue
        status = rec.get("evaluation_status", "pending")
        if status in ("completed", "success", "evaluated") and isinstance(rec.get("evaluation"), dict):
            completed[cid] = rec
        elif status == "failed" or rec.get("error"):
            failed[cid] = rec
    return completed, failed


@lru_cache(maxsize=1)
def ep_metadata():
    summary = dataset()
    return index_by(summary.get("episodes", []), "episode_id")


def episode_number(episode_id: str) -> int:
    meta = ep_metadata().get(episode_id, {})
    if meta.get("episode_number") is not None:
        return int(meta["episode_number"])
    match = re.search(r"(\d+)", episode_id)
    return int(match.group(1)) if match else 0


def to_candidate(raw: dict, status: str | None = None, rec: dict | None = None):
    result = dict(raw)
    result["episode_number"] = episode_number(raw.get("episode_id", ""))
    result["status"] = status or "pending"
    if rec and rec.get("final_editorial_score") is not None:
        result["final_editorial_score"] = rec["final_editorial_score"]
    elif rec and isinstance(rec.get("evaluation"), dict):
        score = rec.get("final_editorial_score")
        if score is not None:
            result["final_editorial_score"] = score
    return result


@lru_cache(maxsize=1)
def candidate_state():
    all_done, all_failed = eval_maps()

    selected = {
        c.get("candidate_id")
        for c in top_candidates()
        if c.get("candidate_id")
    }

    # Only count evaluations belonging to the current top 50.
    done = {
        cid: rec for cid, rec in all_done.items()
        if cid in selected
    }
    failed = {
        cid: rec for cid, rec in all_failed.items()
        if cid in selected
    }

    rows = []
    for raw in all_candidates():
        cid = raw.get("candidate_id")

        if cid in done:
            status = "evaluated"
        elif cid in failed:
            status = "failed"
        elif cid in selected:
            status = "shortlisted"
        else:
            status = "pending"

        rows.append(to_candidate(raw, status, done.get(cid)))

    return rows, done, failed


async def parse_episode_file(episode_id: str):
    meta = ep_metadata().get(episode_id)
    if not meta:
        raise HTTPException(404, "Episode not found")
    filename = str(meta.get("filename", ""))
    try:
        if USING_VERCEL_BLOB:
            from vercel.blob import get_blob
            result = await get_blob(f"storypilot/real/{filename}", access="private")
            screenplay_text = result.body.decode("utf-8-sig")
        else:
            path = REAL / filename
            if not path.exists():
                raise HTTPException(404, f"Screenplay file is missing: {filename}")
            screenplay_text = path.read_text(encoding="utf-8-sig")

        from app.services.structured_parser import parse_structured_episode_text
        parsed = parse_structured_episode_text(screenplay_text, episode_id, "storypilot", filename)
        return parsed.model_dump(mode="json")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Could not parse screenplay {filename}: {exc}")


def frontend_segment(seg: dict):
    start = seg.get("start_seconds") or 0
    mins, secs = divmod(int(start), 60)
    return {
        "segment_id": seg.get("segment_id"), "episode_id": seg.get("episode_id"),
        "scene_id": seg.get("scene_id"),
        "segment_type": {"camera_direction": "camera", "scene_description": "action", "sound_effect": "action", "unknown": "action"}.get(seg.get("segment_type"), seg.get("segment_type", "action")),
        "speaker": seg.get("speaker"), "text": seg.get("content", ""),
        "start_seconds": start, "end_seconds": seg.get("end_seconds"),
        "timestamp": f"{mins:02d}:{secs:02d}", "line_number": seg.get("source_line_start"),
    }


def frontend_episode(raw: dict):
    scenes = []
    for s in raw.get("scenes", []):
        scenes.append({"scene_id": s.get("scene_id"), "heading": s.get("scene_heading", ""), "start_seconds": s.get("start_seconds"), "end_seconds": s.get("end_seconds"), "segment_ids": s.get("segment_ids", [])})
    return {
        "episode_id": raw["episode_id"], "show_id": raw.get("show_id", "storypilot"),
        "episode_number": raw.get("episode_number", episode_number(raw["episode_id"])),
        "filename": raw.get("filename", ""), "logline": raw.get("logline") or "",
        "continuity_notes": [raw.get("continuity_notes")] if isinstance(raw.get("continuity_notes"), str) and raw.get("continuity_notes") else [],
        "scenes": scenes, "segments": [frontend_segment(s) for s in raw.get("segments", [])],
    }


def frontend_evaluation(rec: dict | None):
    if not rec:
        return None
    evaluation = dict(rec.get("evaluation") or {})
    evaluation["evaluation_status"] = "completed"
    evaluation["final_editorial_score"] = rec.get("final_editorial_score")
    return evaluation


def stats_for_episode(epid: str, rows: list, meta: dict, done: dict, failed: dict):
    local = [r for r in rows if r.get("episode_id") == epid]
    selected = [r for r in local if r.get("status") in ("shortlisted", "evaluated", "failed")]
    return {
        "segment_count": int(meta.get("segment_count", 0)), "scene_count": int(meta.get("scene_count", 0)),
        "raw_candidate_count": int(meta.get("raw_candidate_count", 0)),
        "shortlisted_count": int(meta.get("shortlisted_candidate_count", 0)),
        "evaluated_count": sum(1 for r in local if r.get("status") == "evaluated"),
        "failed_count": sum(1 for r in local if r.get("status") == "failed"),
        "processing_status": "completed" if meta.get("status", "success") == "success" else "failed",
    }


@app.get("/health")
def health():
    return {"ok": True, "service": "storypilot-api", "data_available": (BATCH / "dataset-summary.json").exists(), "blob_mode": USING_VERCEL_BLOB, "data_directory": str(DATA)}


@app.get("/api/episodes")
def get_episodes():
    rows, done, failed = candidate_state()
    output = []
    for epid, meta in sorted(ep_metadata().items(), key=lambda kv: int(kv[1].get("episode_number", 0))):
        output.append({"episode_id": epid, "show_id": "storypilot", "episode_number": meta.get("episode_number", episode_number(epid)), "filename": meta.get("filename", ""), "logline": "", "continuity_notes": [], "stats": stats_for_episode(epid, rows, meta, done, failed)})
    return output


@app.get("/api/episodes/{episode_id}")
async def get_episode(episode_id: str):
    raw = frontend_episode(await parse_episode_file(episode_id))
    rows, done, failed = candidate_state()
    meta = ep_metadata().get(episode_id, {})
    raw["stats"] = stats_for_episode(episode_id, rows, meta, done, failed)
    raw["candidates"] = [r for r in rows if r.get("episode_id") == episode_id]
    return raw


@app.get("/api/candidates")
def get_candidates(episode_id: str | None = Query(default=None), status: str | None = Query(default=None)):
    rows, _, _ = candidate_state()
    if episode_id:
        rows = [r for r in rows if r.get("episode_id") == episode_id]
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return rows


@app.get("/api/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    rows, done, failed = candidate_state()
    candidate = next((r for r in rows if r.get("candidate_id") == candidate_id), None)
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    episode = frontend_episode(await parse_episode_file(candidate["episode_id"]))
    wanted = set(candidate.get("segment_ids", []))
    segments = [s for s in episode.get("segments", []) if s.get("segment_id") in wanted]
    rec = done.get(candidate_id)
    evaluation = frontend_evaluation(rec)
    if candidate_id in failed:
        evaluation = {"candidate_id": candidate_id, "episode_id": candidate["episode_id"], "evaluation_status": "failed", "error_message": str(failed[candidate_id].get("error", "Evaluation failed"))}
    return {"candidate": candidate, "episode": {k: episode.get(k) for k in ("episode_id", "episode_number", "logline", "show_id")}, "segments": segments, "evaluation": evaluation}


@app.get("/api/rankings")
def get_rankings():
    rows, done, failed = candidate_state()
    ranked = []
    for cid, rec in done.items():
        candidate = next((r for r in rows if r.get("candidate_id") == cid), None)
        if not candidate:
            continue
        ev = rec.get("evaluation") or {}
        score = rec.get("final_editorial_score")
        if score is None:
            continue
        ranked.append({"candidate": candidate, "hook": ev.get("hook"), "cliffhanger": ev.get("cliffhanger"), "final_editorial_score": score})
    ranked.sort(key=lambda x: x["final_editorial_score"], reverse=True)
    for i, row in enumerate(ranked, 1):
        row["rank"] = i
    excluded = [r for r in rows if r.get("status") in ("shortlisted", "failed", "pending")]
    return {"ranked": ranked, "excluded": excluded}


@app.get("/api/evaluations/status")
def get_evaluation_status():
    rows, done, failed = candidate_state()
    selected = [r for r in rows if r.get("status") in ("shortlisted", "evaluated", "failed")]
    output = []
    for r in selected:
        cid = r["candidate_id"]
        rec = done.get(cid)
        err = failed.get(cid)
        output.append({"candidate_id": cid, "episode_id": r["episode_id"], "episode_number": r["episode_number"], "status": r["status"], "final_editorial_score": rec.get("final_editorial_score") if rec else None, "error_message": str(err.get("error", "Evaluation failed")) if err else None, "updated_at": None})
    return {"total_selected": len(output), "completed": len(done), "failed": len(failed), "pending": sum(1 for x in output if x["status"] == "shortlisted"), "rows": output}


@app.get("/api/dashboard")
def get_dashboard():
    summary = dataset()
    rows, done, failed = candidate_state()
    episodes = list(ep_metadata().values())
    selected = [r for r in rows if r.get("status") in ("shortlisted", "evaluated", "failed")]
    scores = [float(rec["final_editorial_score"]) for rec in done.values() if rec.get("final_editorial_score") is not None]
    per_ep = [{"episode_id": m.get("episode_id"), "episode_number": m.get("episode_number", 0), "candidates": m.get("shortlisted_candidate_count", 0)} for m in episodes]
    return {
        "episodes_processed": int(summary.get("successful_episodes", len(episodes))), "episodes_total": int(summary.get("total_files", len(episodes))),
        "total_segments": int(summary.get("total_segments", 0)), "candidates_generated": int(summary.get("total_raw_candidates", 0)),
        "shortlisted_candidates": int(summary.get("total_shortlisted_candidates", len(rows))),
        "evaluations_completed": len(done), "evaluation_failures": len(failed),
        "pipeline": [
            {"key": "ingestion", "label": "Screenplay ingestion", "status": "completed", "detail": f"{len(episodes)} episodes"},
            {"key": "generation", "label": "Candidate generation", "status": "completed", "detail": f"{summary.get('total_raw_candidates', 0)} raw candidates"},
            {"key": "deduplication", "label": "Deduplication", "status": "completed", "detail": f"{summary.get('total_shortlisted_candidates', 0)} shortlisted"},
            {"key": "evaluation", "label": "Editorial evaluation", "status": "completed" if not failed else "failed", "detail": f"{len(done)} completed, {len(failed)} failed"},
            {"key": "ranking", "label": "Editorial ranking", "status": "completed" if done else "pending", "detail": f"{len(scores)} ranked"},
        ],
        "candidates_per_episode": per_ep, "final_scores": scores, "recent_activity": [],
    }
