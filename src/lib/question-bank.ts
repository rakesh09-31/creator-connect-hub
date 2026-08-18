/**
 * OmniCraft – Deep Technical Question Bank & Mock Skill Assessment Engine (v3)
 *
 * Implements strict Technical Skill Examiner rules:
 * - ZERO generic HR questions ("Tell me about yourself", "Greatest project", "What is your opinion" are STRICTLY PROHIBITED)
 * - Evaluation Principle: KNOW -> CHOOSE -> EXPLAIN -> APPLY -> TROUBLESHOOT -> DECIDE -> PERFORM
 * - Dedicated Mock Tasks & Simulated Real-world Projects
 * - Software-specific practical examination (Premiere Pro, DaVinci Resolve, Photoshop, Snapseed, React, Figma, etc.)
 * - 8 question formats: multiple_choice, true_false, fill_blank, matching, short_answer, scenario, practical_reasoning, voice
 * - Multi-competency scoring: theory, technical, scenario, practical, software, troubleshooting, decision_making, communication
 */

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "short_answer"
  | "scenario"
  | "practical_reasoning"
  | "voice";

export type QuestionDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export type CompetencyTag =
  | "theory"
  | "technical_skill"
  | "software_knowledge"
  | "scenario_reasoning"
  | "practical_execution"
  | "troubleshooting"
  | "decision_making"
  | "communication";

export interface MatchingPair {
  left: string;
  right: string;
}

export interface BankQuestion {
  id: string;
  role: string;
  skill: string;
  subSkill?: string;
  specialty?: string;
  software?: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  competency: CompetencyTag;
  question: string;
  scenarioContext?: string;
  options?: string[]; // for multiple_choice
  correctAnswer?: string; // for multiple_choice, true_false, fill_blank
  acceptableAnswers?: string[]; // for fill_blank
  matchingPairs?: MatchingPair[]; // for matching
  expectedConcepts: string[]; // key technical concepts expected in a strong answer
  rubric: {
    excellent: string; // 5 pts
    good: string;      // 3-4 pts
    partial: string;   // 2 pts
    weak: string;      // 1 pt
    insufficient: string; // 0 pts ("I don't know" / irrelevant)
  };
}

export const QUESTION_BANK: BankQuestion[] = [
  // ==========================================================================
  // 1. VIDEO EDITING – REAL MOCK TASKS & SCENARIOS
  // ==========================================================================
  {
    id: "ve-mock-reel-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Editing Techniques",
    type: "scenario",
    difficulty: "Intermediate",
    competency: "practical_execution",
    question: `MOCK TASK: You receive a 10-minute raw horizontal interview.
The client wants: A 45-second high-energy Instagram Reel (9:16).
Requirements:
1. Extract the strongest hook and core value statements
2. Layer supporting B-roll over speech pauses
3. Add synchronized dynamic subtitles
4. Add background music ducked under dialogue
5. Ensure dialogue is balanced and clear (-14 LUFS)
6. Export as 1080x1920 MP4 (H.264).

Explain the exact step-by-step workflow you would follow from ingestion to delivery.`,
    expectedConcepts: [
      "Select strong 3-second hook first, trim filler words and pauses with Ripple Edit / J-cuts",
      "Set 9:16 sequence (1080x1920) and reframe subject using Auto-Reframe or manual keyframing",
      "Layer B-roll on V2/V3 matching the narrative cadence",
      "Auto-generate or format animated captions with high readability",
      "Apply High-Pass Filter (80Hz), EQ, dialogue compression, and auto-duck background music by 12-15dB",
      "Export H.264 with Rec.709 color tag and high-bitrate target (15-20 Mbps)"
    ],
    rubric: {
      excellent: "Details complete workflow: hook selection, 9:16 reframing, B-roll layering, captioning, sidechain audio ducking, and 1080x1920 H.264 export.",
      good: "Covers clip selection, vertical reframing, music ducking, and export settings.",
      partial: "Outlines basic cuts but misses audio leveling or vertical sequence setup.",
      weak: "Superficial answer without professional timeline steps.",
      insufficient: "No evidence provided or 'I don't know'."
    }
  },
  {
    id: "ve-mock-perf-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Fundamentals",
    type: "scenario",
    difficulty: "Intermediate",
    competency: "troubleshooting",
    question: `MOCK TROUBLESHOOTING: Your timeline contains multiple 4K 10-bit H.265 clips on a system with limited GPU/CPU power. Playback is stuttering and dropping frames heavily, but the client requires the final edit today.
What exact steps do you take to achieve smooth real-time editing performance without reducing the visual quality of the final export?`,
    expectedConcepts: [
      "Generate intra-frame editing Proxies (ProRes Proxy or DNxHR LB at 720p/1080p)",
      "Toggle Proxy mode ON in timeline playback viewport",
      "Lower playback resolution to 1/2 or 1/4 without affecting source files",
      "Render timeline in-to-out cache for complex effect sections",
      "Export directly from original full-resolution 4K source files, NOT the proxy files"
    ],
    rubric: {
      excellent: "Details proxy creation (ProRes/DNxHR), playback resolution toggle, timeline caching, and verifying export uses full-res media.",
      good: "Mentions proxy creation and lowering playback resolution without degrading final render.",
      partial: "Only suggests lowering playback resolution or restarting software.",
      weak: "Suggests permanently downscaling source files.",
      insufficient: "Unable to solve playback bottlenecks."
    }
  },
  {
    id: "ve-mock-client-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Editing Techniques",
    type: "scenario",
    difficulty: "Advanced",
    competency: "decision_making",
    question: `MOCK CLIENT BRIEF: A corporate client tells you:
"I want this video to feel dynamic, fast-paced, and modern, but strictly professional with NO cheesy zoom transitions or flashy glow effects."
What specific editing decisions and techniques do you use to create dynamic energy while maintaining a clean corporate aesthetic?`,
    expectedConcepts: [
      "Use J-cuts and L-cuts to create seamless dialogue momentum and natural audio lead-ins",
      "Match cuts and action cuts (cutting on subject movement) to propel viewer engagement",
      "Rhythmic cutting synced to subtle downbeats of an elegant, modern soundtrack",
      "Punch-in framing (subtle 10-15% crop scale on key sentences) from a 4K single-camera source",
      "Fast, purposeful B-roll pacing (1.5 - 2.5s per shot) with micro sound design (foley/whooshes)"
    ],
    rubric: {
      excellent: "Replaces gimmicky transitions with professional pacing: J/L cuts, cutting on action, rhythmic music timing, 4K punch-in reframes, and subtle sound design.",
      good: "Focuses on clean cuts, pacing, music alignment, and punch-ins.",
      partial: "Mentions cutting faster without specific narrative or framing techniques.",
      weak: "Suggests using standard fades.",
      insufficient: "Fails to grasp corporate video aesthetics."
    }
  },
  {
    id: "ve-mock-premiere-01",
    role: "Video Editor",
    skill: "Video Editing",
    software: "Adobe Premiere Pro",
    type: "practical_reasoning",
    difficulty: "Intermediate",
    competency: "software_knowledge",
    question: `PREMIERE PRO MOCK: You are handed a project with 500 raw video clips, 40 audio stems, and 30 graphics files.
1. How do you structure your Project Panel bins and search bins for rapid asset location?
2. How do you apply a consistent global color correction across 40 different clips in a scene without modifying each clip individually?`,
    expectedConcepts: [
      "1. Bin hierarchy: 01_FOOTAGE (A-Roll, B-Roll, Drone), 02_AUDIO (Dialogue, Music, SFX), 03_GRAPHICS, 04_SEQUENCES, 05_EXPORTS",
      "Use metadata color labels and Search Bins filtering by framerate or camera angle",
      "2. Apply an Adjustment Layer spanning the entire scene on a higher video track with Lumetri Color, OR use Source Clip Lumetri adjustments"
    ],
    rubric: {
      excellent: "Outlines a professional numbered bin taxonomy, metadata search bins, and uses Adjustment Layers or Source Clip Lumetri for global grading.",
      good: "Describes bin structure and Adjustment Layer for global color changes.",
      partial: "Mentions folders and copying/pasting attributes clip by clip.",
      weak: "Disorganized approach.",
      insufficient: "Unfamiliar with Premiere Pro project organization."
    }
  },
  {
    id: "ve-mock-audio-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Audio Post-Production",
    type: "practical_reasoning",
    difficulty: "Advanced",
    competency: "technical_skill",
    question: `AUDIO MIXING MOCK: You receive a dialogue track where the speaker's voice is quiet and dynamic, the background music is loud, and there is a continuous low-frequency electrical hum and room air conditioner noise.
Detail the sequential chain of audio processing plugins and specific adjustments you apply to produce broadcast-quality dialogue.`,
    expectedConcepts: [
      "1. High-Pass Filter (HPF) at 80-100Hz to eliminate sub-rumble",
      "2. De-Hum / Notch Filter at 50Hz/60Hz and harmonics to remove electrical hum",
      "3. Spectral De-Noise applied conservatively (4-6dB reduction) to eliminate AC noise without robotic artifacts",
      "4. Subtractive Parametric EQ cutting boxy/muddy mid frequencies (300-500Hz) and boosting speech presence (2.5-4kHz)",
      "5. Dynamic Compressor (3:1 ratio, 20ms attack, 100ms release) to smooth volume fluctuations",
      "6. Sidechain Ducking on background music (-12dB when dialogue is present)",
      "7. Master Limiter set to -1.0 dBTP with integrated loudness normalized to -14 LUFS (web) or -24 LKFS (broadcast)"
    ],
    rubric: {
      excellent: "Details the exact ordered signal chain: HPF (80Hz) -> De-hum -> Spectral De-noise -> Subtractive EQ -> Compressor -> Sidechain Ducking -> LUFS Normalization.",
      good: "Covers high-pass filter, noise reduction, EQ, compression, ducking, and volume leveling.",
      partial: "Mentions general noise reduction without order or compressor parameters.",
      weak: "Suggests a simple volume slider adjustment.",
      insufficient: "No technical audio processing knowledge."
    }
  },
  {
    id: "ve-mock-color-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Color Correction & Grading",
    specialty: "Color Grading",
    software: "DaVinci Resolve",
    type: "scenario",
    difficulty: "Advanced",
    competency: "technical_skill",
    question: `COLOR GRADING MOCK: In a multicam interview, a speaker's skin tone appears overly saturated and orange on Camera A, while Camera B has a magenta tint.
1. Which video scopes do you inspect to measure the exact hue angle and saturation?
2. How do you isolate and correct the skin tones in DaVinci Resolve or Premiere Lumetri without altering the background lighting?`,
    expectedConcepts: [
      "1. Vectorscope: Inspect the Skin Tone Indicator line (I-line / 137° angle) to verify natural hue alignment",
      "RGB Parade: Inspect channel balance in highlights and midtones to neutralize magenta/orange tints",
      "2. HSL Secondary Keyer / Hue vs Hue curve in Lumetri, OR dedicated Qualifier / Magic Mask node in DaVinci Resolve",
      "Feather qualifier matte and adjust Hue vs Hue / Hue vs Sat curves to bring skin back to the I-line"
    ],
    rubric: {
      excellent: "References Vectorscope Skin Tone Line, RGB Parade balance, and HSL Secondary / Resolve Qualifier nodes with feathered mattes to protect the background.",
      good: "Mentions Vectorscope skin line, Hue vs Hue curves, and isolating skin with qualifiers.",
      partial: "Suggests shifting global temperature without secondary isolation.",
      weak: "Guesses adjustments by eye on an uncalibrated screen.",
      insufficient: "No knowledge of scopes or secondary color correction."
    }
  },
  {
    id: "ve-mock-matching-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Fundamentals",
    type: "matching",
    difficulty: "Beginner",
    competency: "theory",
    question: "Match each video standard / parameter to its primary technical application:",
    matchingPairs: [
      { left: "24 FPS", right: "Standard cinematic cadence with natural motion blur" },
      { left: "60 FPS / 120 FPS", right: "High-frame-rate capture for slow-motion playback" },
      { left: "9:16 Aspect Ratio", right: "Vertical layout for Instagram Reels, Shorts, and TikTok" },
      { left: "16:9 Aspect Ratio", right: "Standard widescreen layout for YouTube and Television" },
      { left: "ProRes 422 HQ", right: "High-bitrate intra-frame master delivery codec" }
    ],
    expectedConcepts: ["24 FPS cinematic", "60 FPS slow motion", "9:16 vertical", "16:9 widescreen", "ProRes master"],
    rubric: {
      excellent: "Matches all 5 pairs correctly.",
      good: "Matches 4 of 5 pairs correctly.",
      partial: "Matches 2-3 pairs correctly.",
      weak: "Matches 1 or 0 correctly.",
      insufficient: "No match."
    }
  },
  {
    id: "ve-mock-tf-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Fundamentals",
    type: "true_false",
    difficulty: "Beginner",
    competency: "theory",
    question: "Shooting and editing video at 60 FPS always produces higher artistic cinematic quality than 24 FPS for standard dialogue scenes.",
    correctAnswer: "False",
    expectedConcepts: ["60 FPS introduces 'soap opera effect' (hyper-realism) which removes the traditional cinematic 24 FPS motion blur cadence"],
    rubric: {
      excellent: "Identifies 'False' and explains the 180-degree shutter motion blur convention and soap opera effect.",
      good: "Identifies 'False'.",
      partial: "Unsure.",
      weak: "Selects 'True'.",
      insufficient: "No evidence."
    }
  },
  {
    id: "ve-mock-mcq-01",
    role: "Video Editor",
    skill: "Video Editing",
    subSkill: "Fundamentals",
    type: "multiple_choice",
    difficulty: "Intermediate",
    competency: "troubleshooting",
    question: "You are editing 4K footage on a mid-tier computer. Timeline scrubbing is extremely sluggish and dropping frames. What is the most effective immediate non-destructive workflow solution?",
    options: [
      "Permanently resize the original 4K camera files to 720p using a media converter",
      "Generate lightweight ProRes/DNxHR proxies and toggle proxy playback mode on the timeline",
      "Export the incomplete timeline and edit the rendered MP4 file instead",
      "Apply heavy temporal noise reduction to every clip to clean up the signal"
    ],
    correctAnswer: "Generate lightweight ProRes/DNxHR proxies and toggle proxy playback mode on the timeline",
    expectedConcepts: ["proxy workflow", "non-destructive proxy toggle", "render from original full-resolution media"],
    rubric: {
      excellent: "Selects proxy workflow and understands preservation of full-res export.",
      good: "Selects proxy option.",
      partial: "Confuses proxy with destructive downsampling.",
      weak: "Selects export/render workaround.",
      insufficient: "No evidence."
    }
  },

  // ==========================================================================
  // 2. PHOTO EDITING – REAL MOCK TASKS & SCENARIOS
  // ==========================================================================
  {
    id: "pe-mock-portrait-01",
    role: "Photo Editor",
    skill: "Photo Editing",
    subSkill: "Retouching Techniques",
    specialty: "Portrait Retouching",
    software: "Adobe Photoshop",
    type: "scenario",
    difficulty: "Intermediate",
    competency: "practical_execution",
    question: `PORTRAIT RETOUCHING MOCK: You receive a close-up studio RAW portrait with:
- Blown highlights on the forehead
- Uneven skin tone redness
- Small temporary facial blemishes
- Detailed skin pore texture that must be 100% preserved.

Explain your complete Photoshop layer stack and step-by-step retouching workflow.`,
    expectedConcepts: [
      "1. RAW conversion in Camera Raw: Recover highlights, normalize exposure, set neutral white balance",
      "2. Non-destructive Blemish Cleanup on a blank layer using Healing Brush / Clone Stamp set to 'Current & Below'",
      "3. Frequency Separation: Low Frequency (Gaussian Blur ~3-5px for color/tone blending) and High Frequency (Apply Image High Pass for pore texture)",
      "4. Dodge & Burn (Micro/Global): Curves adjustment layers with inverted layer masks to even out blotchiness without blurring texture",
      "5. Color Grading: Selective color/Curves adjustments to balance skin tone redness"
    ],
    rubric: {
      excellent: "Details RAW highlight recovery, non-destructive healing layer, Frequency Separation layer separation, Dodge & Burn for blotchiness, and texture preservation.",
      good: "Covers RAW processing, healing brushes, frequency separation, and Dodge & Burn.",
      partial: "Suggests blurring skin directly on the background layer.",
      weak: "Destructive editing approach.",
      insufficient: "No knowledge of portrait retouching stacks."
    }
  },
  {
    id: "pe-mock-object-01",
    role: "Photo Editor",
    skill: "Photo Editing",
    software: "Adobe Photoshop",
    type: "scenario",
    difficulty: "Advanced",
    competency: "troubleshooting",
    question: `PHOTOSHOP OBJECT REMOVAL MOCK: You need to cleanly remove an unwanted person and a street sign from a photo with a complex repeating cobblestone brick texture.
Standard Content-Aware Fill leaves repeating blurry smudge artifacts. What is your precise multi-step technique to rebuild the texture seamlessly?`,
    expectedConcepts: [
      "1. Use Pen Tool or Lasso to make a tight selection around the object",
      "2. Content-Aware Fill with custom sampling area (excluding unrelated textures)",
      "3. Clone Stamp Tool set to 'Current & Below' with 'Aligned' checked to manually clone clean cobblestone sections along perspective lines",
      "4. Clone Source panel adjustments (rotation/scaling) to align perspective grid",
      "5. High-Pass texture overlay or Frequency Separation high-layer cloning to restore grain and sharpness"
    ],
    rubric: {
      excellent: "Explains custom sampling areas for Content-Aware, precision Clone Stamp following perspective lines, and high-frequency texture restoration.",
      good: "Mentions manual Clone Stamp along perspective lines and custom sampling.",
      partial: "Only suggests re-running automated fill tools.",
      weak: "Smudges pixels together.",
      insufficient: "Cannot handle complex object removal."
    }
  },
  {
    id: "pe-mock-snapseed-01",
    role: "Photo Editor",
    skill: "Photo Editing",
    software: "Snapseed / Mobile",
    type: "practical_reasoning",
    difficulty: "Beginner",
    competency: "software_knowledge",
    question: `SNAPSEED MOBILE MOCK: You have an underexposed mobile portrait where the background is well-lit but the subject's face is in deep shadow with dull colors.
Explain the exact sequence of tools you would use in Snapseed to brighten and enhance the subject without blowing out the background.`,
    expectedConcepts: [
      "1. Tune Image: Lift Shadows and Ambiance slightly without over-lifting global Brightness",
      "2. Selective Tool: Place targeted pins on the subject's face to independently increase Brightness, Contrast, and Structure",
      "3. Curves or Brush tool: Dodge (brighten) specific shadow areas on the subject",
      "4. White Balance: Warm up skin tones selectively if blue shadow cast exists",
      "5. View Edits (Edit Stack): Use brush mask on the Tune Image layer if background gets washed out"
    ],
    rubric: {
      excellent: "Details Tune Image (Shadows/Ambiance), Selective pin tool for facial exposure, Brush/Dodge, and Edit Stack masking.",
      good: "Mentions Selective tool for local face brightening and Tune Image shadows.",
      partial: "Only lifts global brightness which blows out the sky/background.",
      weak: "Suggests applying a generic Instagram filter.",
      insufficient: "Unfamiliar with Snapseed tools."
    }
  },

  // ==========================================================================
  // 3. REACT DEVELOPER – REAL MOCK TASKS & ARCHITECTURE SCENARIOS
  // ==========================================================================
  {
    id: "react-mock-perf-01",
    role: "React Developer",
    skill: "React.js",
    subSkill: "Performance & Rendering Optimization",
    specialty: "State Management",
    type: "scenario",
    difficulty: "Advanced",
    competency: "troubleshooting",
    question: `REACT PERFORMANCE MOCK: You have a live-filtered financial dashboard displaying 15,000 active transactions.
When the user types into the search input, every single keystroke lags by 400ms because the entire list re-evaluates and re-renders synchronously.
How do you diagnose and refactor this component using React 18/19 concurrency primitives and list virtualization?`,
    expectedConcepts: [
      "1. Diagnosis: Use React DevTools Profiler to record render duration and inspect component re-render triggers",
      "2. Concurrency: Use `useDeferredValue(searchQuery)` or `useTransition` to keep the input text state immediate (high priority) while deferring the heavy list filtering (low priority transition)",
      "3. Virtualization: Implement `@tanstack/react-virtual` or `react-window` to render only the 20-30 DOM elements currently in the viewport",
      "4. Web Worker / Memoization: Offload heavy search matching to a Web Worker or memoize with `useMemo`"
    ],
    rubric: {
      excellent: "Details Profiler recording, useTransition/useDeferredValue for priority scheduling, DOM virtualization (TanStack Virtual), and memoization/workers.",
      good: "Explains virtualization and useDeferredValue/useTransition to eliminate keystroke lag.",
      partial: "Only suggests simple debouncing with setTimeout.",
      weak: "Suggests useEffect or pagination without solving the DOM node bottleneck.",
      insufficient: "No understanding of React rendering or virtualization."
    }
  },
  {
    id: "react-mock-state-01",
    role: "React Developer",
    skill: "React.js",
    subSkill: "State Architecture",
    type: "practical_reasoning",
    difficulty: "Intermediate",
    competency: "decision_making",
    question: `REACT ARCHITECTURE MOCK: You are designing a complex 4-step user checkout flow with shipping address, billing info, coupon validation, payment gateway tokenization, and validation errors across all steps.
Would you use ` + "`useState`" + ` per step, ` + "`useReducer`" + `, or a global store (Zustand/Context)? Explain your state architecture design and how you prevent lost form progress on back/forward navigation.`,
    expectedConcepts: [
      "Use `useReducer` with discriminated action types OR a lightweight Zustand store for centralized, predictable multi-step state transitions",
      "Persist form state in memory / sessionStorage / URL query parameters to survive step back/forward navigation",
      "Encapsulate validation with Zod / React Hook Form to isolate field errors from triggering global re-renders",
      "Clear sensitive payment tokens on unmount/completion for security compliance"
    ],
    rubric: {
      excellent: "Architects centralized useReducer / Zustand store with Zod validation, decoupled field re-renders, and session persistence across step navigation.",
      good: "Selects useReducer/Zustand and explains state persistence during step transitions.",
      partial: "Proposes multiple scattered useState calls with prop drilling.",
      weak: "Vague state strategy.",
      insufficient: "No state architecture knowledge."
    }
  }
];

// ============================================================================
// DYNAMIC ADAPTIVE QUESTION GENERATOR (KNOW -> CHOOSE -> APPLY -> TROUBLESHOOT -> PERFORM)
// ============================================================================

export function generateTechnicalQuestionsForProfile(
  roleName: string,
  skillName: string,
  subSkills: string[],
  softwareList: string[],
  specialties: string[],
  declaredLevel: QuestionDifficulty,
  count: number = 6
): BankQuestion[] {
  const normalizedSkill = skillName.toLowerCase().trim();
  const normalizedRole = roleName.toLowerCase().trim();

  // 1. Filter matching bank questions
  const matches = QUESTION_BANK.filter(q => {
    const rMatch = q.role.toLowerCase() === normalizedRole || normalizedRole.includes(q.role.toLowerCase());
    const sMatch = q.skill.toLowerCase() === normalizedSkill || normalizedSkill.includes(q.skill.toLowerCase());
    return rMatch || sMatch;
  });

  if (matches.length >= count) {
    return matches.slice(0, count);
  }

  const primarySoftware = softwareList[0] || "industry standard software";
  const primarySubSkill = subSkills[0] || "core technical workflows";
  const primarySpecialty = specialties[0] || "advanced techniques";

  const generated: BankQuestion[] = [...matches];

  // 2. Multi-Format Adaptive Technical Templates
  const templates: BankQuestion[] = [
    // 1. Real Project Mock Task (Practical Execution)
    {
      id: `mock-task-${skillName}-01`,
      role: roleName,
      skill: skillName,
      subSkill: primarySubSkill,
      software: primarySoftware,
      type: "scenario",
      difficulty: declaredLevel === "Beginner" ? "Beginner" : "Intermediate",
      competency: "practical_execution",
      question: `MOCK PROJECT TASK: A client hands you a high-priority project requiring ${skillName} with strict brand guidelines and a fast 24-hour turnaround.
1. What is your immediate 3-step asset ingestion and setup workflow?
2. How do you execute '${primarySubSkill}' while ensuring non-destructive revisions?
3. What is your final pre-delivery quality inspection checklist?`,
      expectedConcepts: [
        "Structured ingestion, project folder taxonomy, and metadata setup",
        `Non-destructive execution of ${primarySubSkill} using proper layers, nodes, or component architecture`,
        "Quality check against platform technical standards, resolution, color spaces, and error-free output"
      ],
      rubric: {
        excellent: "Provides a thorough, professional 3-stage execution plan: ingestion taxonomy, non-destructive workflow, and quality assurance inspection.",
        good: "Explains structured workflow, execution steps, and final delivery check.",
        partial: "Basic steps without non-destructive safeguards.",
        weak: "Disorganized approach.",
        insufficient: "No evidence provided."
      }
    },
    // 2. Troubleshooting & Diagnostics Task
    {
      id: `mock-tb-${skillName}-02`,
      role: roleName,
      skill: skillName,
      software: primarySoftware,
      type: "scenario",
      difficulty: declaredLevel === "Expert" ? "Expert" : "Intermediate",
      competency: "troubleshooting",
      question: `MOCK TROUBLESHOOTING: While working in ${primarySoftware} on a complex ${skillName} deliverable, you encounter severe performance lag, dropped frames/buffers, or unexpected output artifacts.
Detail your methodical diagnostic procedure to isolate whether the root cause is in the source asset, the processing pipeline, or the export configuration.`,
      expectedConcepts: [
        "Isolate source parameters (codec, resolution, color space, sample rate mismatch)",
        `Inspect ${primarySoftware} cache, memory allocation, hardware acceleration, and intermediate buffers`,
        "Validate export encoding profiles against target specifications"
      ],
      rubric: {
        excellent: "Provides structured diagnostic isolation: source verification, software pipeline/cache inspection, and export profile validation.",
        good: "Provides a logical troubleshooting progression.",
        partial: "Offers trial-and-error fixes without methodical debugging.",
        weak: "Suggests restarting without diagnosing the bottleneck.",
        insufficient: "No troubleshooting knowledge."
      }
    },
    // 3. Client Brief & Decision Making (Decision Making)
    {
      id: `mock-dec-${skillName}-03`,
      role: roleName,
      skill: skillName,
      specialty: primarySpecialty,
      type: "practical_reasoning",
      difficulty: declaredLevel === "Beginner" ? "Intermediate" : "Advanced",
      competency: "decision_making",
      question: `MOCK CLIENT DECISION: A client requests: 'We want our ${skillName} deliverable to feel high-end, premium, and seamless, specifically focusing on ${primarySpecialty}, but we have strict bandwidth/hardware limitations.'
What technical trade-offs and decisions do you make to maximize visual/functional quality within these constraints?`,
      expectedConcepts: [
        `Prioritizing high-impact ${primarySpecialty} parameters while optimizing secondary overhead`,
        "Implementing optimized caching, proxy, or vector assets to maintain performance",
        "Clear client communication regarding technical constraints and milestone reviews"
      ],
      rubric: {
        excellent: "Demonstrates seasoned decision-making, balancing constraint limitations against visual/technical excellence.",
        good: "Thoughtfully analyzes trade-offs and practical adaptations.",
        partial: "Focuses on one aspect without balancing performance constraints.",
        weak: "Unrealistic approach.",
        insufficient: "No technical decision-making evidence."
      }
    },
    // 4. Software Specific Workflow (Software Knowledge)
    {
      id: `mock-sw-${skillName}-04`,
      role: roleName,
      skill: skillName,
      software: primarySoftware,
      type: "practical_reasoning",
      difficulty: declaredLevel,
      competency: "software_knowledge",
      question: `SOFTWARE WORKFLOW IN ${primarySoftware.toUpperCase()}: Explain the exact step-by-step procedure you use in ${primarySoftware} to execute '${primarySubSkill}'. Which specific panels, hotkeys, or settings accelerate your turnaround time?`,
      expectedConcepts: [
        `Accurate tool names, panels, and shortcuts in ${primarySoftware}`,
        "Non-destructive procedural execution",
        "Key parameter configurations for optimal output"
      ],
      rubric: {
        excellent: `Details exact tool paths in ${primarySoftware}, non-destructive practices, and efficiency shortcuts.`,
        good: `Describes actionable workflow in ${primarySoftware} with correct tool names.`,
        partial: `General concept described without software-specific accuracy.`,
        weak: `Vague or destructive approach suggested.`,
        insufficient: `Unfamiliar with ${primarySoftware}.`
      }
    },
    // 5. Technical Multiple Choice (Theory & Applied)
    {
      id: `mock-mcq-${skillName}-05`,
      role: roleName,
      skill: skillName,
      type: "multiple_choice",
      difficulty: declaredLevel === "Beginner" ? "Beginner" : "Intermediate",
      competency: "theory",
      question: `In professional ${skillName}, which principle is considered essential for ensuring consistency and non-destructive workflow across complex revisions?`,
      options: [
        `Maintaining modular, non-destructive layer/node/component structures with versioned backups`,
        `Overwriting original master source files immediately to conserve local drive storage`,
        `Baking in heavy stylistic effects directly onto raw ingested media before editing`,
        `Skipping pre-flight color space and format validation to begin work faster`
      ],
      correctAnswer: `Maintaining modular, non-destructive layer/node/component structures with versioned backups`,
      expectedConcepts: ["non-destructive architecture", "modular workflow", "source file protection"],
      rubric: {
        excellent: "Correctly identifies non-destructive modular architecture.",
        good: "Selects correct option.",
        partial: "Incorrect selection.",
        weak: "Incorrect selection.",
        insufficient: "No evidence."
      }
    },
    // 6. Technical Voice Examination (Voice Technical)
    {
      id: `mock-voice-${skillName}-06`,
      role: roleName,
      skill: skillName,
      type: "voice",
      difficulty: declaredLevel,
      competency: "technical_skill",
      question: `Explain the complete end-to-end technical methodology you use when taking a ${skillName} project from raw client assets to finalized master deliverable.`,
      expectedConcepts: [
        "Structured asset organization and project metadata setup",
        "Iterative non-destructive assembly and refinement stages",
        "Rigorous quality assurance checks against industry benchmarks and scopes",
        "Master delivery and platform-specific encoding optimization"
      ],
      rubric: {
        excellent: "Articulates a structured, professional end-to-end methodology using industry-standard technical terminology.",
        good: "Covers all major production phases logically.",
        partial: "Describes basic steps but skips quality assurance or master delivery.",
        weak: "Superficial process.",
        insufficient: "Unable to describe a professional workflow."
      }
    }
  ];

  for (const t of templates) {
    if (generated.length < count) {
      generated.push(t);
    }
  }

  return generated.slice(0, count);
}
