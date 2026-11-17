
from pathlib import Path

from app.services.parser import parse_episode_text


def test_parse_complete_episode():
    file_path = (
        Path(__file__).parent.parent
        / "data"
        / "synthetic"
        / "episode-001.txt"
    )

    screenplay = file_path.read_text(encoding="utf-8")

    segments = parse_episode_text(
        screenplay,
        episode_id="ep_001"
    )

    assert len(segments) == 14

    assert segments[0].segment_type == "scene_description"
    assert segments[1].speaker == "RAHUL"
    assert segments[1].start_seconds == 4

    assert segments[-1].speaker == "UNKNOWN WOMAN"
    assert segments[-1].start_seconds == 79

    # Every segment must belong to this episode.
    assert all(s.episode_id == "ep_001" for s in segments)

    # Segment IDs must be unique.
    ids = [s.segment_id for s in segments]
    assert len(ids) == len(set(ids))

    # Timestamps should be in chronological order.
    timestamps = [s.start_seconds for s in segments]
    assert timestamps == sorted(timestamps)
