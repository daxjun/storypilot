
import pytest

from app.services.structured_parser import (
    parse_structured_episode_text,
    parse_timestamp,
)


SAMPLE_SCREENPLAY = """
EPISODE NUMBER: Episode 1
EPISODE LOGLINE: Lady Juliana discovers her betrayal at the altar.
CONTINUITY NOTES: Establishes Juliana's abandonment by Gerald.

--- SCRIPT START ---

SCENE 01
Scene heading: INT. CATHEDRAL – DAY
Scene start: 00:00.00
Scene end: 02:18.00

Actions and dialogue:

**CAMERA:**
Start: (00:00.00) | End: (00:04.80)
Symmetrical framing on the heavy church doors as they slowly part.

**ACTION:**
Start: (00:01.00) | End: (00:04.80)
Juliana pauses at the threshold, wearing her mother's gown.

**MATRIARCH (Cold, Commanding):**
Start: (00:11.30) | End: (00:13.10)
"You should turn around, Juliana."

**LADY JULIANA (Confused, Breathless):**
Start: (00:13.50) | End: (00:14.30)
"Why?"

--- SCRIPT END ---
"""


def test_parse_timestamp_mm_ss():
    assert parse_timestamp("00:11.30") == pytest.approx(11.30)
    assert parse_timestamp("02:18.00") == pytest.approx(138.00)


def test_parse_timestamp_hh_mm_ss():
    assert parse_timestamp("01:02:03.50") == pytest.approx(3723.50)


def test_unsupported_timestamp_is_rejected():
    with pytest.raises(ValueError):
        parse_timestamp("11")


def test_episode_metadata_is_extracted():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
        show_id="show_001",
        filename="episode-001.txt",
    )

    assert episode.episode_number == 1
    assert episode.logline.startswith("Lady Juliana")
    assert "Gerald" in episode.continuity_notes


def test_scene_metadata_is_extracted():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    assert len(episode.scenes) == 1

    scene = episode.scenes[0]

    assert scene.scene_number == 1
    assert scene.scene_heading == "INT. CATHEDRAL – DAY"
    assert scene.start_seconds == pytest.approx(0.0)
    assert scene.end_seconds == pytest.approx(138.0)


def test_all_element_types_are_parsed():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    types = [
        segment.segment_type
        for segment in episode.segments
    ]

    assert types == [
        "camera_direction",
        "action",
        "dialogue",
        "dialogue",
    ]


def test_dialogue_speaker_and_delivery_are_preserved():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    matriarch = episode.segments[2]

    assert matriarch.speaker == "Matriarch"
    assert matriarch.delivery == "Cold, Commanding"
    assert matriarch.content == "You should turn around, Juliana."


def test_fractional_segment_timestamps_are_preserved():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    dialogue = episode.segments[2]

    assert dialogue.start_time == "00:11.30"
    assert dialogue.end_time == "00:13.10"

    assert dialogue.start_seconds == pytest.approx(11.30)
    assert dialogue.end_seconds == pytest.approx(13.10)


def test_segment_is_linked_to_scene():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    scene = episode.scenes[0]

    for segment in episode.segments:
        assert segment.scene_id == scene.scene_id
        assert segment.segment_id in scene.segment_ids


def test_original_source_line_references_are_preserved():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    for segment in episode.segments:
        assert segment.source_line_start >= 1
        assert (
            segment.source_line_end
            >= segment.source_line_start
        )


def test_parser_metadata_is_populated():
    episode = parse_structured_episode_text(
        SAMPLE_SCREENPLAY,
        episode_id="ep_001",
    )

    assert episode.metadata["parser_version"] == "structured_v2"
    assert episode.metadata["source_format"] == "production_screenplay"
    assert episode.metadata["scene_count"] == 1
    assert episode.metadata["segment_count"] == 4
