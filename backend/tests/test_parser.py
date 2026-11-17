
from app.services.parser import (
    parse_episode_text,
    timestamp_to_seconds,
)


def test_timestamp_conversion():
    assert timestamp_to_seconds("00", "01", "15") == 75
    assert timestamp_to_seconds("01", "00", "00") == 3600


def test_parse_dialogue():
    screenplay = "[00:00:04] RAHUL: Tell me the truth."

    segments = parse_episode_text(screenplay, "ep_001")

    assert len(segments) == 1
    assert segments[0].speaker == "RAHUL"
    assert segments[0].content == "Tell me the truth."
    assert segments[0].segment_type == "dialogue"
    assert segments[0].start_seconds == 4


def test_parse_scene_description():
    screenplay = "[00:00:16] SCENE: THE DOOR OPENS."

    segments = parse_episode_text(screenplay, "ep_001")

    assert len(segments) == 1
    assert segments[0].segment_type == "scene_description"
    assert segments[0].content == "THE DOOR OPENS."


def test_source_line_tracking():
    screenplay = (
        "[00:00:04] RAHUL: Hello.\n"
        "\n"
        "[00:00:10] PRIYA: Hi."
    )

    segments = parse_episode_text(screenplay, "ep_001")

    assert segments[0].source_line_start == 1
    assert segments[1].source_line_start == 3


def test_untimestamped_lines_are_skipped():
    screenplay = (
        "This is an untimestamped heading.\n"
        "[00:00:04] RAHUL: Hello."
    )

    segments = parse_episode_text(screenplay, "ep_001")

    assert len(segments) == 1
    assert segments[0].source_line_start == 2
