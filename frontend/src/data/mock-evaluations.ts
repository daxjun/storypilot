/**
 * DEMO DATA — editorial evaluations as the backend would return them.
 *
 * final_editorial_score values are part of the simulated backend response
 * (weighted 25/20/20/20/15). The UI never recomputes them.
 */
import type { EditorialEvaluation } from "@/types/evaluation";

export const mockEvaluations: EditorialEvaluation[] = [
  {
    candidate_id: "cand_001_01",
    episode_id: "ep_001",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T09:41:00Z",
    hook: "“Look who's serving drinks at my engagement.” — the bride-to-be spots her fiancé's ex holding a tray.",
    cliffhanger: "Soaked in champagne, Mira finally speaks: “Three years, Kabir. You said you'd never leave.” He says nothing.",
    why_it_works:
      "A clear villain, a public humiliation and a betrayed heroine in under 40 seconds. Viewers understand the power imbalance instantly and want to see it reversed.",
    cliffhanger_evidence_segment_ids: ["ep001_s09", "ep001_s10"],
    hook_strength: {
      score: 9,
      rationale: "Opens on a direct, cruel line of dialogue that establishes conflict without setup.",
      evidence_segment_ids: ["ep001_s05", "ep001_s07"],
    },
    emotional_intensity: {
      score: 9,
      rationale: "Public humiliation escalates physically (champagne poured) and ends on a quiet, wounded line.",
      evidence_segment_ids: ["ep001_s07", "ep001_s09", "ep001_s10"],
    },
    curiosity_gap: {
      score: 7,
      rationale: "Raises “why did he leave her?” but does not yet hint at the inheritance twist.",
      evidence_segment_ids: ["ep001_s10"],
    },
    standalone_readability: {
      score: 8,
      rationale: "Engagement ring and banner make the relationships readable without prior context.",
      evidence_segment_ids: ["ep001_s04", "ep001_s05"],
    },
    spoiler_safety: {
      score: 9,
      rationale: "Covers only the premise; the heir reveal stays hidden.",
      evidence_segment_ids: ["ep001_s04"],
    },
    strengths: [
      "Instantly legible villain–victim dynamic",
      "Physical humiliation beat is easy to caption",
      "Ends on a line of dialogue rather than silence",
    ],
    weaknesses: ["No hint of the larger twist", "Kabir's role is passive in this window"],
    risks: ["Humiliation framing may read as mean-spirited without the payoff"],
    final_editorial_score: 8.4,
  },
  {
    candidate_id: "cand_001_02",
    episode_id: "ep_001",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T09:43:00Z",
    hook: "A stranger steps out of the shadows: “I represent the estate of Arjun Rao. He died on Tuesday.”",
    cliffhanger: "“You own this hotel. And everything Tanya Rao thinks is hers.” — laughter from the party echoes behind the door.",
    why_it_works:
      "The classic rags-to-riches reversal lands in one scene. The sealed envelope gives a concrete visual payoff and the final line sets up revenge.",
    cliffhanger_evidence_segment_ids: ["ep001_s18", "ep001_s19"],
    hook_strength: {
      score: 8,
      rationale: "A mysterious stranger and a death announcement create immediate intrigue.",
      evidence_segment_ids: ["ep001_s13", "ep001_s14"],
    },
    emotional_intensity: {
      score: 8,
      rationale: "Shift from defeat to shock is strong, though carried mostly by the reveal itself.",
      evidence_segment_ids: ["ep001_s16", "ep001_s19"],
    },
    curiosity_gap: {
      score: 10,
      rationale: "Leaves the viewer asking how Mira will use her new power against Tanya.",
      evidence_segment_ids: ["ep001_s17", "ep001_s18"],
    },
    standalone_readability: {
      score: 8,
      rationale: "The document insert states the stakes plainly; only Tanya's name needs prior context.",
      evidence_segment_ids: ["ep001_s14", "ep001_s15"],
    },
    spoiler_safety: {
      score: 7,
      rationale: "Reveals the series premise (Mira is the heir), which is acceptable for an episode-1 promo.",
      evidence_segment_ids: ["ep001_s17"],
    },
    strengths: [
      "Strongest curiosity gap in the batch",
      "Clear visual reveal via the document insert",
      "Final line names the antagonist and the stakes",
    ],
    weaknesses: ["First 8 seconds are quiet set-up", "Relies on viewer knowing who Tanya is"],
    risks: ["Gives away the central premise if used after episode 1 promotion"],
    final_editorial_score: 8.25,
  },
  {
    candidate_id: "cand_002_01",
    episode_id: "ep_002",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T09:48:00Z",
    hook: "Tanya walks into her bedroom and finds the girl she humiliated laying out her dress.",
    cliffhanger: "Mira stays calm — “I work here now.” Tanya's eyes narrow.",
    why_it_works:
      "A confident reversal of the episode 1 dynamic: the heroine is now composed and the villain is rattled. Good for viewers already following the story.",
    cliffhanger_evidence_segment_ids: ["ep002_s13"],
    hook_strength: {
      score: 7,
      rationale: "Confrontation starts quickly but the opening action line is low-energy.",
      evidence_segment_ids: ["ep002_s10", "ep002_s11"],
    },
    emotional_intensity: {
      score: 7,
      rationale: "Tension is clear but restrained; no physical escalation.",
      evidence_segment_ids: ["ep002_s11", "ep002_s12"],
    },
    curiosity_gap: {
      score: 8,
      rationale: "Tanya's narrowed eyes promise retaliation.",
      evidence_segment_ids: ["ep002_s13"],
    },
    standalone_readability: {
      score: 7,
      rationale: "“The hotel girl” references a past event but is understandable on its own.",
      evidence_segment_ids: ["ep002_s11"],
    },
    spoiler_safety: {
      score: 8,
      rationale: "Does not reveal Mira's identity or the second will.",
      evidence_segment_ids: ["ep002_s12"],
    },
    strengths: ["Satisfying power reversal", "Short and tightly scoped"],
    weaknesses: ["Ending is a reaction shot rather than a line or reveal"],
    risks: ["Less effective for cold audiences who missed episode 1"],
    final_editorial_score: 7.35,
  },
  {
    candidate_id: "cand_002_02",
    episode_id: "ep_002",
    evaluation_status: "failed",
    evaluated_at: "2026-11-16T09:50:00Z",
    error_message:
      "Evaluator response failed schema validation: missing field 'curiosity_gap.evidence_segment_ids' (attempt 3 of 3).",
  },
  {
    candidate_id: "cand_003_01",
    episode_id: "ep_003",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T09:55:00Z",
    hook: "At a family dinner, Shalini slides a folder across the table: “Someone in this house has been claiming to be Arjun's child.”",
    cliffhanger: "Kabir, quietly: “This report is dated tomorrow.” Shalini snatches the folder back.",
    why_it_works:
      "A public accusation turns into a quiet counter-reveal. The forged-date detail gives viewers a satisfying “gotcha” and makes Kabir an unexpected ally.",
    cliffhanger_evidence_segment_ids: ["ep003_s09", "ep003_s10"],
    hook_strength: {
      score: 8,
      rationale: "The accusation line is direct and high-stakes.",
      evidence_segment_ids: ["ep003_s04"],
    },
    emotional_intensity: {
      score: 8,
      rationale: "Mira's trembling hand and Tanya's jab build pressure before the turn.",
      evidence_segment_ids: ["ep003_s05", "ep003_s07"],
    },
    curiosity_gap: {
      score: 9,
      rationale: "The forged date raises who faked it and why Kabir is defending Mira.",
      evidence_segment_ids: ["ep003_s08", "ep003_s09"],
    },
    standalone_readability: {
      score: 6,
      rationale: "Requires knowing Mira is secretly Arjun's daughter to feel the stakes.",
      evidence_segment_ids: ["ep003_s04", "ep003_s06"],
    },
    spoiler_safety: {
      score: 7,
      rationale: "Implies Mira's claim but does not confirm it.",
      evidence_segment_ids: ["ep003_s06"],
    },
    strengths: ["Clever, specific twist detail", "Ensemble scene with clear sides"],
    weaknesses: ["Context-dependent for new viewers", "Runs close to 46 seconds"],
    risks: ["Forged-date detail may be missed on small screens without captions"],
    final_editorial_score: 7.65,
  },
  {
    candidate_id: "cand_004_01",
    episode_id: "ep_004",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T10:01:00Z",
    hook: "The boardroom doors open — the maid walks in wearing a tailored black suit.",
    cliffhanger: "“The maid owns fifty-one percent of this company.” Shalini's composure cracks.",
    why_it_works:
      "The payoff the whole series builds toward. The entrance, the line and the will on the table make this the most shareable beat so far.",
    cliffhanger_evidence_segment_ids: ["ep004_s10"],
    hook_strength: {
      score: 10,
      rationale: "Visual transformation plus a confident entrance is an instant hook.",
      evidence_segment_ids: ["ep004_s04", "ep004_s05"],
    },
    emotional_intensity: {
      score: 9,
      rationale: "Triumphant reversal with a clear emotional release.",
      evidence_segment_ids: ["ep004_s07", "ep004_s10"],
    },
    curiosity_gap: {
      score: 8,
      rationale: "Leaves Shalini's response open, but the main question is answered.",
      evidence_segment_ids: ["ep004_s09", "ep004_s10"],
    },
    standalone_readability: {
      score: 9,
      rationale: "“The maid owns fifty-one percent” explains the premise in one line.",
      evidence_segment_ids: ["ep004_s06", "ep004_s07"],
    },
    spoiler_safety: {
      score: 4,
      rationale: "Reveals the central secret of episodes 1–3.",
      evidence_segment_ids: ["ep004_s07", "ep004_s09"],
    },
    strengths: [
      "Highest hook strength in the batch",
      "Self-explanatory headline line",
      "Strong thumbnail moment (entrance)",
    ],
    weaknesses: ["Low spoiler safety"],
    risks: [
      "Publishing early would spoil episodes 1–3 for new viewers",
      "Best used after episode 4 release",
    ],
    final_editorial_score: 8.3,
  },
  {
    candidate_id: "cand_004_02",
    episode_id: "ep_004",
    evaluation_status: "completed",
    evaluated_at: "2026-11-16T10:03:00Z",
    hook: "The matriarch looks at Mira: “Those eyes… you have Arjun's eyes.”",
    cliffhanger: "Shalini pockets the dying woman's medicine bottle — and Mira sees it.",
    why_it_works:
      "Turns the corporate drama into a thriller. The secret gesture gives viewers knowledge the other characters lack.",
    cliffhanger_evidence_segment_ids: ["ep004_s16", "ep004_s17"],
    hook_strength: {
      score: 7,
      rationale: "Emotional line, but the wheelchair entrance is a slow opening.",
      evidence_segment_ids: ["ep004_s12", "ep004_s13"],
    },
    emotional_intensity: {
      score: 9,
      rationale: "Sudden collapse and a panicked call for help.",
      evidence_segment_ids: ["ep004_s14", "ep004_s15"],
    },
    curiosity_gap: {
      score: 9,
      rationale: "Did Shalini poison her? Will Mira speak up?",
      evidence_segment_ids: ["ep004_s16", "ep004_s17"],
    },
    standalone_readability: {
      score: 5,
      rationale: "New viewers won't know who Dadi or Shalini are.",
      evidence_segment_ids: ["ep004_s13"],
    },
    spoiler_safety: {
      score: 6,
      rationale: "Hints at Shalini's guilt, an ongoing mystery.",
      evidence_segment_ids: ["ep004_s16"],
    },
    strengths: ["Strong thriller cliffhanger", "Secret gesture creates dramatic irony"],
    weaknesses: ["Slow first 6 seconds", "Character-dependent"],
    risks: ["Medical emergency content may need a sensitivity check on some platforms"],
    final_editorial_score: 7.25,
  },
  {
    candidate_id: "cand_003_02",
    episode_id: "ep_003",
    evaluation_status: "pending",
  },
  {
    candidate_id: "cand_005_01",
    episode_id: "ep_005",
    evaluation_status: "pending",
  },
];
