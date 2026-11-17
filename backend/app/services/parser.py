
import re

from app.models.segment import Segment


# Matches timestamps such as [00:00:04]
TIMESTAMP_PATTERN = re.compile(
    r"^\[(\d{2}):([0-5]\d):([0-5]\d)\]\s*(.*)$"
)

# Matches uppercase speaker labels such as RAHUL: or PRIYA:
SPEAKER_PATTERN = re.compile(
    r"^([A-Z][A-Z0-9 _'-]{0,39}):\s*(.+)$"
)


def timestamp_to_seconds(hours: str, minutes: str, seconds: str) -> int:
    """Convert HH:MM:SS into total seconds."""
    return (
        int(hours) * 3600
        + int(minutes) * 60
        + int(seconds)
    )


def parse_episode_text(text: str, episode_id: str) -> list[Segment]:
    """
    Convert timestamped screenplay lines into Segment objects.

    Untimestamped and empty lines are skipped.
    Each parsed segment retains its original source line number.
    """

    segments = []

    for line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()

        # Ignore empty lines.
        if not line:
            continue

        timestamp_match = TIMESTAMP_PATTERN.match(line)

        # Ignore lines that do not begin with a valid timestamp.
        if not timestamp_match:
            continue

        hours, minutes, seconds, content = timestamp_match.groups()
        content = content.strip()

        # Ignore timestamp-only lines.
        if not content:
            continue

        start_seconds = timestamp_to_seconds(
            hours, minutes, seconds
        )

        speaker = None

        # Classify the screenplay segment.
        if content.upper().startswith("SCENE:"):
            segment_type = "scene_description"
            content = content[6:].strip()

        elif content.upper().startswith(("INT.", "EXT.")):
            segment_type = "scene_description"

        elif content.upper().startswith("ACTION:"):
            segment_type = "action"
            content = content[7:].strip()

        else:
            speaker_match = SPEAKER_PATTERN.match(content)

            if speaker_match:
                segment_type = "dialogue"
                speaker, content = speaker_match.groups()
                content = content.strip()
            else:
                segment_type = "action"

        segment = Segment(
            segment_id=f"{episode_id}_seg_{len(segments) + 1:03d}",
            episode_id=episode_id,
            start_time=f"{hours}:{minutes}:{seconds}",
            start_seconds=start_seconds,
            segment_type=segment_type,
            speaker=speaker,
            content=content,
            source_line_start=line_number,
            source_line_end=line_number,
        )

        segments.append(segment)

    return segments
