from app.models.segment import Segment
from app.models.episode import Episode


def test_segment_creation():

    segment = Segment(
        segment_id="seg_001",
        episode_id="ep_001",
        start_time="00:00:10",
        start_seconds=10,
        segment_type="dialogue",
        speaker="RAHUL",
        content="You promised me the truth.",
        source_line_start=1,
        source_line_end=1
    )

    assert segment.speaker == "RAHUL"
    assert segment.start_seconds == 10


def test_episode_creation():

    episode = Episode(
        episode_id="ep_001",
        show_id="show_001",
        episode_number=1,
        filename="episode-001.txt"
    )

    assert episode.episode_number == 1
    assert len(episode.segments) == 0