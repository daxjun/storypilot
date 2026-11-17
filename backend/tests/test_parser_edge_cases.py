
from app.services.structured_parser import (
    parse_element_header_details,
    classify_element,
)


def test_sound_fx_classification():
    assert classify_element("SOUND FX") == (
        "sound_effect",
        None,
    )


def test_camera_classification():
    assert classify_element("CAMERA") == (
        "camera_direction",
        None,
    )


def test_multiple_parenthetical_annotations():
    result = parse_element_header_details(
        "**MATRIARCH (O.S.) (Firm):**"
    )

    assert result == (
        "MATRIARCH",
        "O.S.",
        "Firm",
    )


def test_multiple_delivery_annotations():
    result = parse_element_header_details(
        "**MATRIARCH (Cold) (Commanding):**"
    )

    assert result == (
        "MATRIARCH",
        None,
        "Cold, Commanding",
    )


def test_regular_dialogue_header():
    result = parse_element_header_details(
        "**LADY JULIANA (Heartbroken):**"
    )

    assert result == (
        "LADY JULIANA",
        None,
        "Heartbroken",
    )
