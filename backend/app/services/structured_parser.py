
import re

from app.models.episode import Episode
from app.models.scene import Scene
from app.models.segment import Segment


# ---------------------------------------------------------
# REGEX PATTERNS
# ---------------------------------------------------------

SCENE_PATTERN = re.compile(
    r"^SCENE\s+(\d+)\s*$",
    re.IGNORECASE,
)

# Supports:
# CAMERA:
# ACTION:
# MATRIARCH (Cold, Commanding):
# MATRIARCH (O.S.) (Firm):
# LADY JULIANA (Heartbroken):
# SOUND FX:

ELEMENT_PATTERN = re.compile(
    r"^([A-Z][A-Z0-9 _'-]*?)"
    r"(?:\s+((?:\([^()]*\)\s*)+))?:$"
)

# Supports:
# Start: (00:11.30) | End: (00:13.10)
# Start: 00:11.30 | End: 00:13.10
# Start: (01:02:03.50) | End: (01:02:05.50)

TIMING_PATTERN = re.compile(
    r"^Start:\s*"
    r"\(?(\d{2}:\d{2}(?::\d{2})?\.\d+)\)?"
    r"\s*\|\s*End:\s*"
    r"\(?(\d{2}:\d{2}(?::\d{2})?\.\d+)\)?$"
)

EPISODE_PATTERN = re.compile(
    r"^EPISODE NUMBER:\s*Episode\s+(\d+)\s*$",
    re.IGNORECASE,
)


# ---------------------------------------------------------
# TIMESTAMP UTILITIES
# ---------------------------------------------------------

def parse_timestamp(timestamp: str) -> float:
    """
    Convert screenplay timestamps into seconds.

    Supported formats:
        MM:SS.xx
        HH:MM:SS.xx

    Examples:
        00:11.30    -> 11.30
        02:18.00    -> 138.00
        01:02:03.50 -> 3723.50
    """

    parts = timestamp.strip().split(":")

    if len(parts) == 2:
        minutes = int(parts[0])
        seconds = float(parts[1])

        if minutes < 0 or not 0 <= seconds < 60:
            raise ValueError(
                f"Invalid timestamp value: {timestamp}"
            )

        return minutes * 60 + seconds

    if len(parts) == 3:
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = float(parts[2])

        if (
            hours < 0
            or not 0 <= minutes < 60
            or not 0 <= seconds < 60
        ):
            raise ValueError(
                f"Invalid timestamp value: {timestamp}"
            )

        return hours * 3600 + minutes * 60 + seconds

    raise ValueError(
        f"Unsupported timestamp format: {timestamp}"
    )


# ---------------------------------------------------------
# TEXT UTILITIES
# ---------------------------------------------------------

def clean_label(line: str) -> str:
    """Remove Markdown bold markers and surrounding whitespace."""

    return line.replace("**", "").strip()


def parse_element_header_details(line: str):
    """
    Parse screenplay element headers.

    Returns:
        (label, speaker_direction, delivery)

    Examples:

        CAMERA:
        -> ("CAMERA", None, None)

        MATRIARCH (Cold, Commanding):
        -> ("MATRIARCH", None, "Cold, Commanding")

        MATRIARCH (O.S.) (Firm):
        -> ("MATRIARCH", "O.S.", "Firm")

        SOUND FX:
        -> ("SOUND FX", None, None)
    """

    cleaned = clean_label(line)

    match = ELEMENT_PATTERN.fullmatch(cleaned)

    if not match:
        return None

    label, annotations_text = match.groups()

    annotations = (
        re.findall(r"\(([^()]*)\)", annotations_text)
        if annotations_text
        else []
    )

    speaker_direction = None
    delivery_parts = []

    for annotation in annotations:
        value = annotation.strip()

        if not value:
            continue

        if value.upper() in {"O.S.", "V.O.", "O.C."}:
            speaker_direction = value
        else:
            delivery_parts.append(value)

    delivery = (
        ", ".join(delivery_parts)
        if delivery_parts
        else None
    )

    return (
        label.strip(),
        speaker_direction,
        delivery,
    )


def parse_element_header(line: str):
    """
    Backward-compatible header parser.

    Returns:
        (label, delivery)

    Existing tests and code using this function
    can continue using the original two-value result.
    """

    details = parse_element_header_details(line)

    if details is None:
        return None

    label, speaker_direction, delivery = details

    return label, delivery


def classify_element(label: str) -> tuple[str, str | None]:
    """
    Map screenplay labels to canonical segment types.

    Known types:
        camera_direction
        action
        scene_description
        sound_effect
        dialogue
    """

    normalized = label.upper().strip()

    if normalized == "CAMERA":
        return "camera_direction", None

    if normalized == "ACTION":
        return "action", None

    if normalized in {"SCENE", "SCENE DESCRIPTION"}:
        return "scene_description", None

    if normalized in {
        "SOUND FX",
        "SOUND EFFECT",
        "SOUND EFFECTS",
    }:
        return "sound_effect", None

    # Any other recognized label represents dialogue.
    return "dialogue", label.title()


# ---------------------------------------------------------
# MAIN STRUCTURED SCREENPLAY PARSER
# ---------------------------------------------------------

def parse_structured_episode_text(
    text: str,
    episode_id: str,
    show_id: str = "unknown",
    filename: str = "unknown.txt",
) -> Episode:
    """
    Parse the structured production screenplay format.

    Extracts:
        - Episode number
        - Episode logline
        - Continuity notes
        - Scene metadata
        - Camera directions
        - Action descriptions
        - Sound effects
        - Character dialogue
        - Speaker direction
        - Dialogue delivery
        - Fractional timestamps
        - Original source line references
    """

    lines = text.splitlines()

    episode_number = 1
    logline = ""
    continuity_notes = ""

    scene_records = []
    segment_records = []

    current_scene = None

    i = 0

    while i < len(lines):

        raw_line = lines[i]
        line = raw_line.strip()

        # Skip empty lines.
        if not line:
            i += 1
            continue

        # -------------------------------------------------
        # EPISODE METADATA
        # -------------------------------------------------

        episode_match = EPISODE_PATTERN.match(line)

        if episode_match:
            episode_number = int(
                episode_match.group(1)
            )

            i += 1
            continue

        if line.upper().startswith("EPISODE LOGLINE:"):
            logline = line.split(":", 1)[1].strip()

            i += 1
            continue

        if line.upper().startswith("CONTINUITY NOTES:"):
            continuity_notes = line.split(":", 1)[1].strip()

            i += 1
            continue

        # -------------------------------------------------
        # SCRIPT BOUNDARIES
        # -------------------------------------------------

        if line.upper() in {
            "--- SCRIPT START ---",
            "--- SCRIPT END ---",
        }:
            i += 1
            continue

        # -------------------------------------------------
        # SCENE START
        # -------------------------------------------------

        scene_match = SCENE_PATTERN.match(line)

        if scene_match:

            scene_number = int(
                scene_match.group(1)
            )

            current_scene = {
                "scene_id": (
                    f"{episode_id}_scene_{scene_number:02d}"
                ),
                "episode_id": episode_id,
                "scene_number": scene_number,
                "scene_heading": "",
                "start_time": None,
                "end_time": None,
                "start_seconds": None,
                "end_seconds": None,
                "segment_ids": [],
            }

            scene_records.append(current_scene)

            i += 1
            continue

        # -------------------------------------------------
        # SCENE METADATA
        # -------------------------------------------------

        if current_scene is not None:

            if line.startswith("Scene heading:"):

                current_scene["scene_heading"] = (
                    line.split(":", 1)[1].strip()
                )

                i += 1
                continue

            if line.startswith("Scene start:"):

                timestamp = line.split(":", 1)[1].strip()

                current_scene["start_time"] = timestamp

                current_scene["start_seconds"] = (
                    parse_timestamp(timestamp)
                )

                i += 1
                continue

            if line.startswith("Scene end:"):

                timestamp = line.split(":", 1)[1].strip()

                current_scene["end_time"] = timestamp

                current_scene["end_seconds"] = (
                    parse_timestamp(timestamp)
                )

                i += 1
                continue

        # -------------------------------------------------
        # SCREENPLAY ELEMENT HEADER
        # -------------------------------------------------

        header_details = parse_element_header_details(line)

        if header_details is None:
            i += 1
            continue

        label, speaker_direction, delivery = header_details

        # -------------------------------------------------
        # FIND TIMING LINE
        # -------------------------------------------------

        timing_index = i + 1

        # Allow blank lines between header and timing.
        while (
            timing_index < len(lines)
            and not lines[timing_index].strip()
        ):
            timing_index += 1

        if timing_index >= len(lines):
            i += 1
            continue

        timing_line = lines[timing_index].strip()

        timing_match = TIMING_PATTERN.fullmatch(
            timing_line
        )

        if timing_match is None:
            i += 1
            continue

        start_time, end_time = timing_match.groups()

        start_seconds = parse_timestamp(start_time)
        end_seconds = parse_timestamp(end_time)

        if end_seconds < start_seconds:
            raise ValueError(
                f"Invalid timing in episode {episode_id}, "
                f"source line {timing_index + 1}: "
                f"{start_time} - {end_time}"
            )

        # -------------------------------------------------
        # COLLECT ELEMENT CONTENT
        # -------------------------------------------------

        content_lines = []

        content_index = timing_index + 1

        content_end_line = timing_index + 1

        while content_index < len(lines):

            content_line = lines[content_index].strip()

            if not content_line:
                content_index += 1
                continue

            # Stop at the next scene.
            if SCENE_PATTERN.match(content_line):
                break

            # Stop at the next screenplay element.
            if parse_element_header_details(content_line) is not None:
                break

            # Stop at script end.
            if content_line.upper() == "--- SCRIPT END ---":
                break

            # Stop at episode metadata boundaries.
            if (
                content_line.upper().startswith("EPISODE NUMBER:")
                or content_line.upper().startswith("EPISODE LOGLINE:")
                or content_line.upper().startswith("CONTINUITY NOTES:")
            ):
                break

            content_lines.append(content_line)

            content_end_line = content_index + 1

            content_index += 1

        content = "\n".join(content_lines).strip()

        # Remove surrounding quotation marks from dialogue.
        if (
            len(content) >= 2
            and content.startswith('"')
            and content.endswith('"')
        ):
            content = content[1:-1].strip()

        segment_type, speaker = classify_element(label)

        segment_id = (
            f"{episode_id}_seg_{len(segment_records) + 1:03d}"
        )

        scene_id = (
            current_scene["scene_id"]
            if current_scene is not None
            else None
        )

        # -------------------------------------------------
        # CREATE SEGMENT
        # -------------------------------------------------

        segment = Segment(
            segment_id=segment_id,
            episode_id=episode_id,
            scene_id=scene_id,

            start_time=start_time,
            end_time=end_time,

            start_seconds=start_seconds,
            end_seconds=end_seconds,

            segment_type=segment_type,

            speaker=speaker,
            delivery=delivery,
            speaker_direction=speaker_direction,

            content=content,

            source_line_start=i + 1,
            source_line_end=max(
                i + 1,
                content_end_line,
            ),
        )

        segment_records.append(segment)

        # Add the segment reference to its scene.
        if current_scene is not None:
            current_scene["segment_ids"].append(
                segment_id
            )

        # Continue from the next unprocessed line.
        i = content_index

    # -----------------------------------------------------
    # BUILD SCENE MODELS
    # -----------------------------------------------------

    scenes = [
        Scene(**scene_record)
        for scene_record in scene_records
    ]

    # -----------------------------------------------------
    # BUILD EPISODE MODEL
    # -----------------------------------------------------

    episode = Episode(
        episode_id=episode_id,
        show_id=show_id,
        episode_number=episode_number,
        filename=filename,

        logline=logline,
        continuity_notes=continuity_notes,

        scenes=scenes,
        segments=segment_records,

        metadata={
            "parser_version": "structured_v2",
            "source_format": "production_screenplay",
            "scene_count": len(scenes),
            "segment_count": len(segment_records),
        },
    )

    return episode
