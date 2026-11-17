/**
 * DEMO DATA — fictional microdrama "Crimson Vows".
 * Used only when NEXT_PUBLIC_DATA_MODE is "mock" (the default).
 */
import type {
  Episode,
  EpisodeProcessingStatus,
  ScreenplaySegment,
  SegmentType,
} from "@/types/episode";

export const MOCK_SHOW_ID = "show_crimson_vows";

type Row = [seconds: number, type: SegmentType, speaker: string | null, text: string];

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function toTimestamp(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

/** Expands compact rows into full ScreenplaySegment objects. */
function buildSegments(episodeId: string, rows: Row[], episodeEnd: number): ScreenplaySegment[] {
  let sceneIndex = 0;
  return rows.map(([seconds, type, speaker, text], i) => {
    if (type === "scene_heading") sceneIndex += 1;
    const next = rows[i + 1]?.[0] ?? episodeEnd;
    return {
      segment_id: `${episodeId.replace("_", "")}_s${pad(i + 1)}`,
      episode_id: episodeId,
      scene_id: `${episodeId}_sc${pad(sceneIndex)}`,
      segment_type: type,
      speaker,
      text,
      start_seconds: seconds,
      end_seconds: next,
      timestamp: toTimestamp(seconds),
      line_number: 4 + i * 3,
    };
  });
}

function scenesFrom(segments: ScreenplaySegment[]) {
  const scenes = new Map<string, ScreenplaySegment[]>();
  for (const s of segments) {
    const id = s.scene_id ?? "unknown";
    scenes.set(id, [...(scenes.get(id) ?? []), s]);
  }
  return [...scenes.entries()].map(([scene_id, segs]) => ({
    scene_id,
    heading: segs.find((s) => s.segment_type === "scene_heading")?.text ?? "Untitled scene",
    start_seconds: segs[0].start_seconds,
    end_seconds: segs[segs.length - 1].end_seconds ?? null,
    segment_ids: segs.map((s) => s.segment_id),
  }));
}

const EP1: Row[] = [
  [0, "scene_heading", null, "INT. GRAND ORCHID HOTEL – BALLROOM – NIGHT"],
  [3, "action", null, "Crystal chandeliers. A string quartet. MIRA SEN (24), in a housekeeping uniform, balances a tray of champagne flutes along the edge of the crowd."],
  [9, "camera", null, "CLOSE ON the banner: “KABIR & TANYA — FOREVER BEGINS TONIGHT.”"],
  [13, "action", null, "Mira freezes. Across the room, KABIR MEHRA (28) slides a ring onto TANYA RAO's (25) finger. Applause."],
  [18, "dialogue", "TANYA", "Look who's serving drinks at my engagement. Kabir, isn't that your ex?"],
  [23, "dialogue", "KABIR", "(avoiding Mira's eyes) Tanya, leave it."],
  [27, "action", null, "Tanya plucks a flute from Mira's tray and tips it slowly down the front of Mira's uniform. Guests laugh."],
  [33, "dialogue", "TANYA", "Clean that up. That's what you're paid for."],
  [38, "camera", null, "SLOW PUSH IN on Mira — trembling, silent, eyes fixed on Kabir."],
  [44, "dialogue", "MIRA", "Three years, Kabir. You said you'd never leave."],
  [50, "transition", null, "CUT TO:"],
  [51, "scene_heading", null, "INT. HOTEL – SERVICE CORRIDOR – CONTINUOUS"],
  [54, "action", null, "Mira scrubs at the stain, alone. A well-dressed woman, DEVIKA NAIR (45), steps out of the shadows holding a sealed envelope."],
  [62, "dialogue", "DEVIKA", "Miss Sen. I represent the estate of Arjun Rao. He died on Tuesday."],
  [69, "dialogue", "MIRA", "The hotel owner? Why would that concern me?"],
  [74, "action", null, "Devika hands her the envelope. Mira breaks the wax seal stamped with the Rao crest."],
  [80, "camera", null, "INSERT — the document: “SOLE HEIR: MIRA SEN, DAUGHTER OF ARJUN RAO.”"],
  [86, "dialogue", "DEVIKA", "Because, Miss Sen, you own this hotel. And everything Tanya Rao thinks is hers."],
  [94, "camera", null, "HOLD on Mira's face as the ballroom laughter echoes behind the door."],
  [100, "transition", null, "SMASH CUT TO BLACK."],
];

const EP2: Row[] = [
  [0, "scene_heading", null, "EXT. RAO MANSION – GATES – DAY"],
  [3, "action", null, "Mira, in plain clothes, stands before towering iron gates. Devika waits in a car across the road."],
  [8, "dialogue", "DEVIKA (V.O.)", "The will is read in thirty days. Until then, no one can know who you are."],
  [14, "scene_heading", null, "INT. RAO MANSION – KITCHEN – DAY"],
  [17, "action", null, "SHALINI RAO (52), Tanya's mother, inspects a line of new maids. She stops at Mira."],
  [23, "dialogue", "SHALINI", "Name?"],
  [25, "dialogue", "MIRA", "Meera. Just Meera."],
  [29, "dialogue", "SHALINI", "You'll serve my daughter. Don't speak unless she speaks to you."],
  [35, "scene_heading", null, "INT. RAO MANSION – TANYA'S BEDROOM – LATER"],
  [38, "action", null, "Mira lays out Tanya's dress. Tanya enters and stops dead."],
  [43, "dialogue", "TANYA", "You. The hotel girl. Who let you into my house?"],
  [49, "dialogue", "MIRA", "(calm) Your mother did. I work here now."],
  [55, "camera", null, "CLOSE ON Tanya's eyes narrowing."],
  [60, "action", null, "Tanya notices a silver locket around Mira's neck — engraved with the Rao crest."],
  [66, "dialogue", "TANYA", "Where did a maid get that?"],
  [71, "action", null, "Mira tucks it beneath her collar and walks out. Tanya grabs her phone."],
  [78, "dialogue", "TANYA", "(into phone) Mom. Find out everything about the new maid. Tonight."],
  [86, "scene_heading", null, "INT. RAO MANSION – STUDY – NIGHT"],
  [89, "action", null, "Shalini opens a safe behind a portrait of ARJUN RAO and removes a second, unsigned will."],
  [97, "camera", null, "SLOW PUSH IN on the signature line — blank."],
  [103, "transition", null, "CUT TO BLACK."],
];

const EP3: Row[] = [
  [0, "scene_heading", null, "INT. RAO MANSION – DINING ROOM – NIGHT"],
  [3, "action", null, "The Rao family at a long table. Mira pours water. Kabir sits beside Tanya, distracted."],
  [9, "action", null, "Shalini taps her glass and slides a folder to the head of the table."],
  [14, "dialogue", "SHALINI", "A lab report. Someone in this house has been claiming to be Arjun's child."],
  [21, "camera", null, "CLOSE ON Mira's hand — the water jug trembles."],
  [26, "dialogue", "SHALINI", "The results are conclusive. No relation. A fraud."],
  [32, "dialogue", "TANYA", "(staring at Mira) Some people will do anything to climb."],
  [38, "action", null, "Kabir glances at the lab's letterhead. The date printed on it is tomorrow's."],
  [45, "dialogue", "KABIR", "(quietly) This report is dated tomorrow."],
  [50, "action", null, "Silence. Shalini snatches the folder back."],
  [55, "scene_heading", null, "INT. RAO MANSION – HALLWAY – LATER"],
  [58, "action", null, "Kabir catches Mira's wrist."],
  [62, "dialogue", "KABIR", "Mira. Tell me the truth. Who are you to this family?"],
  [69, "dialogue", "MIRA", "You lost the right to ask me that."],
  [75, "action", null, "She pulls free. Kabir picks up a photo from the floor: a young Arjun Rao holding a baby — wearing Mira's locket."],
  [84, "camera", null, "INSERT — the back of the photo: “Mira, one week old.”"],
  [91, "transition", null, "CUT TO BLACK."],
];

const EP4: Row[] = [
  [0, "scene_heading", null, "INT. RAO GROUP TOWER – BOARDROOM – DAY"],
  [3, "action", null, "Board members in dark suits. Shalini at the head of the table. Tanya beside her, smug."],
  [9, "dialogue", "SHALINI", "With Arjun gone, the board will confirm Tanya as acting chair."],
  [16, "action", null, "The doors open. Mira enters — no uniform, a tailored black suit. Devika follows."],
  [22, "camera", null, "LOW ANGLE — Mira walks the length of the table."],
  [27, "dialogue", "TANYA", "Security! The maid has lost her mind."],
  [32, "dialogue", "MIRA", "The maid owns fifty-one percent of this company."],
  [38, "action", null, "Devika lays the sealed will on the table. Board members exchange looks."],
  [44, "dialogue", "DEVIKA", "Arjun Rao's last will. Witnessed and registered."],
  [50, "camera", null, "CLOSE ON Shalini — her composure cracking."],
  [56, "scene_heading", null, "INT. RAO GROUP TOWER – CORRIDOR – CONTINUOUS"],
  [59, "action", null, "DADI (78), the Rao matriarch, arrives in a wheelchair, pushed by a nurse."],
  [65, "dialogue", "DADI", "(to Mira) Those eyes… you have Arjun's eyes."],
  [72, "action", null, "Dadi reaches for Mira's hand — and her body goes rigid. She slumps forward."],
  [78, "dialogue", "NURSE", "She's not breathing! Call an ambulance!"],
  [84, "action", null, "Shalini kneels beside Dadi and, unseen by the others, pockets the old woman's medicine bottle."],
  [92, "camera", null, "CLOSE ON Mira — she saw it."],
  [98, "transition", null, "CUT TO BLACK."],
];

const EP5: Row[] = [
  [0, "scene_heading", null, "INT. CITY HOSPITAL – ICU – NIGHT"],
  [3, "action", null, "Dadi on a ventilator. Mira at her bedside."],
  [8, "dialogue", "DOCTOR", "Her medication was switched. Someone wanted this to look natural."],
  [15, "scene_heading", null, "INT. RAO MANSION – STUDY – NIGHT"],
  [18, "action", null, "Mira slips inside with a flashlight. The safe behind Arjun's portrait hangs open."],
  [25, "action", null, "Inside: the empty medicine bottle and an old voice recorder."],
  [31, "action", null, "She presses play."],
  [34, "dialogue", "ARJUN (V.O.)", "Shalini, if anything happens to me, Mira gets everything. I've made sure of it."],
  [42, "dialogue", "SHALINI (V.O.)", "Then you've left me no choice, Arjun."],
  [49, "camera", null, "CLOSE ON the recorder — red light blinking."],
  [54, "action", null, "The study light snaps on. Shalini stands in the doorway."],
  [59, "dialogue", "SHALINI", "Looking for something, Meera?"],
  [65, "transition", null, "CUT TO BLACK."],
];

function episode(
  n: number,
  logline: string,
  continuity_notes: string[],
  rows: Row[] | null,
  end: number,
): Episode {
  const episode_id = `ep_${pad(n, 3)}`;
  const segments = rows ? buildSegments(episode_id, rows, end) : [];
  return {
    episode_id,
    show_id: MOCK_SHOW_ID,
    episode_number: n,
    filename: `crimson_vows_ep${pad(n)}.fountain`,
    logline,
    continuity_notes,
    segments,
    scenes: scenesFrom(segments),
  };
}

export const mockEpisodes: Episode[] = [
  episode(
    1,
    "At her ex-fiancé's engagement party, a hotel maid is humiliated — until a lawyer's envelope names her the secret Rao heir.",
    [
      "Mira and Kabir were engaged for three years before he left her for Tanya.",
      "Arjun Rao died the Tuesday before the party; his death is not yet public.",
      "The Rao crest (a lotus over a key) appears on the wax seal.",
    ],
    EP1,
    105,
  ),
  episode(
    2,
    "Under a borrowed name, Mira takes a maid's job inside the Rao mansion while Tanya grows suspicious.",
    [
      "Mira uses the alias “Meera” inside the mansion.",
      "The silver locket with the Rao crest was left to Mira by her mother.",
      "The second will found by Shalini is unsigned.",
    ],
    EP2,
    106,
  ),
  episode(
    3,
    "A forged DNA report surfaces at a family dinner, and Kabir starts to doubt the woman he left.",
    [
      "The fake lab report is dated one day in the future.",
      "The baby photo shows the same locket Mira wears.",
    ],
    EP3,
    94,
  ),
  episode(
    4,
    "At the Rao Group board meeting, Mira reveals who she is — and the family matriarch collapses.",
    [
      "Mira's controlling stake is 51%.",
      "Dadi recognises Mira's eyes as Arjun's before collapsing.",
      "Shalini pockets Dadi's medicine bottle — only Mira sees it.",
    ],
    EP4,
    101,
  ),
  episode(
    5,
    "Mira searches Shalini's study and finds a recording of her father's last call.",
    [
      "Doctor confirms Dadi's medication was switched.",
      "Voice recorder belonged to Arjun Rao.",
    ],
    EP5,
    68,
  ),
  episode(
    6,
    "Shalini is questioned by police while Tanya turns on her own mother.",
    [],
    null,
    0,
  ),
];

/** Demo-only processing state per episode (would come from the backend). */
export const mockEpisodeProcessing: Record<
  string,
  { status: EpisodeProcessingStatus; raw_candidates: number; error?: string; processed_at: string }
> = {
  ep_001: { status: "completed", raw_candidates: 7, processed_at: "2026-11-16T09:12:00Z" },
  ep_002: { status: "completed", raw_candidates: 5, processed_at: "2026-11-16T09:14:00Z" },
  ep_003: { status: "completed", raw_candidates: 6, processed_at: "2026-11-16T09:15:00Z" },
  ep_004: { status: "completed", raw_candidates: 8, processed_at: "2026-11-16T09:17:00Z" },
  ep_005: { status: "processing", raw_candidates: 4, processed_at: "2026-11-16T10:02:00Z" },
  ep_006: {
    status: "failed",
    raw_candidates: 0,
    error:
      "Screenplay parse failed: no timestamp markers found on lines 1–48. Expected a [MM:SS] marker before each scene.",
    processed_at: "2026-11-16T10:05:00Z",
  },
};
