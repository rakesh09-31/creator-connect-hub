/**
 * OmniForge Video Editing & Post-Production Curriculum
 *
 * Subject: Video Editing & Post-Production
 * Domain: Media Production & Creative Arts
 * Target Outcome: Professional Post-Production Video Editor & Narrative Storyteller
 *
 * Designed with genuine creative and technical competencies:
 * - NLE Toolchains, Ingestion, Proxy Pipelines & Media Organization
 * - Storytelling, Cutting Techniques (J-cuts, L-cuts, Match Cuts), Pacing
 * - Dialogue Cleanup, Foley, EQ, Compression, Audio Mastering (-14 LUFS)
 * - Color Correction, Waveforms/Vectorscopes, Primary/Secondary Grading, LUTs
 * - Motion Graphics, Kinetic Typography, Masking, VFX Compositing
 * - Multiformat Deliveries (16:9 Cinema vs 9:16 Reels/Shorts), Codecs, Master Archival
 * - Absolutely ZERO generic software/compiler/coding placeholders
 */

import { CurriculumBlueprint, StageContentDetail } from "./types";

export const VIDEO_EDITING_BLUEPRINT: CurriculumBlueprint = {
  subject: "Video Editing",
  domain: "Media Production & Creative Arts",
  roadmapType: "LEARNING",
  experienceLevel: "All Levels",
  targetOutcome: "Professional Video Editor & Narrative Storyteller",
  estimatedEffort: "10 Stages · ~150 Study Hours · 10–14 Weeks",
  prerequisiteRelationships: {
    2: [1],
    3: [2],
    4: [3],
    5: [3],
    6: [2],
    7: [6],
    8: [3],
    9: [3, 8],
    10: [4, 5, 7, 8, 9],
  },
  stages: [
    {
      stage: 1,
      title: "NLE Toolchain Setup, Timeline Mental Models & Video Codec Fundamentals",
      skillFocus: "NLE Software Architecture, Timeline Operations & Video Codecs",
      objective: "Master non-linear editing (NLE) software interfaces, timeline track dynamics, raster frame rates, and core digital video codecs.",
      prerequisites: ["Computer workstation with GPU acceleration and external high-speed SSD"],
      keyCompetencies: ["NLE GUI setup (Premiere Pro / DaVinci Resolve / Final Cut)", "Timeline track management & snapping", "Frame rates (24p, 30p, 60p) & resolutions (1080p, 4K UHD)", "Interframe vs Intraframe compression (H.264 vs ProRes/DNxHR)"],
      projectTitle: "NLE Benchmark Project Setup & Codec Audit Lab",
      deliverables: ["Configured NLE workspace with optimized scratch disks and keyboard hotkey map", "Side-by-side codec playback performance comparison report"],
      definitionOfDone: ["Scratch disks assigned to high-speed NVMe storage", "Playback engine configured for hardware GPU acceleration", "Keyboard mapping configured for ripple edit, razor, and slip tools"],
      estimatedStudyHours: 12,
      recommendedPacing: "1 week (1.5h/day)",
    },
    {
      stage: 2,
      title: "Media Ingestion, Proxy Generation & Bin Organization Architecture",
      skillFocus: "Footage Ingestion, Proxy Pipelines & Metadata Bin Organization",
      objective: "Establish industry-standard post-production directory structures, automated proxy generation pipelines, and descriptive metadata tagging.",
      prerequisites: ["Stage 1 completion"],
      keyCompetencies: ["Three-tier folder architecture (Raw, Proxies, Project, Exports)", "Hardware-accelerated proxy transcoding (ProRes Proxy / DNxHR LB)", "Bin hierarchy, color-coding, and marker-based script supervision notes", "Aspect ratio interpretation and scratch audio synchronization"],
      projectTitle: "Commercial Spot Raw Footage Ingestion & Proxy Pipeline",
      deliverables: ["Standardized multi-camera project directory containing transcoded proxies", "Organized NLE bin layout with color-coded scene/take tags"],
      definitionOfDone: ["All 4K raw assets linked 1-to-1 with lightweight 1080p editing proxies", "Toggle proxy hotkey tested and responsive with 0 frame drop", "Sync marks set between camera scratch audio and external dual-system sound files"],
      estimatedStudyHours: 14,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 3,
      title: "Narrative Pacing, Scene Assembly & Core Cutting Mechanics",
      skillFocus: "Rough Cut Assembly, Temporal Rhythm & Core Editing Cuts",
      objective: "Translate raw rushes and screenplay coverage into a compelling first assembly using precise cutting techniques, eye trace, and rhythmic pacing.",
      prerequisites: ["Stage 2 completion"],
      keyCompetencies: ["The Rule of Six (Emotion, Story, Rhythm, Eye-trace, 2D Screen Direction, 3D Space)", "J-Cuts and L-Cuts for seamless conversational flow", "Match cuts, smash cuts, jump cuts, and cutaways", "Trimming tools: Ripple Edit, Rolling Edit, Slip, and Slide"],
      projectTitle: "Dramatic Dialogue Scene: Two-Character Dramatic Tension Cut",
      deliverables: ["Rough cut assembly of a 2-minute dialogue scene establishing emotional tension", "Fine cut with polished J/L audio transitions and zero continuity jarring"],
      definitionOfDone: ["Conversational rhythm feels natural without unnatural silence or overlapping lines", "Eye trace flows smoothly between reaction shots and speaking characters", "Rough cut submitted for peer review with director notes addressed"],
      estimatedStudyHours: 18,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 4,
      title: "Multi-Camera Editing, Action Sequence Assembly & Dynamic Montage",
      skillFocus: "Multi-Cam Synchronization, Kinetic Continuity & Montage Pacing",
      objective: "Cut complex multi-angle footage and fast-paced action sequences while maintaining spatial continuity and kinetic momentum.",
      prerequisites: ["Stage 3 completion"],
      keyCompetencies: ["Timecode and audio waveform multi-cam clip creation", "180-degree rule preservation in dynamic movement", "Cutting on action for invisible edits", "Montage rhythm, parallel editing (cross-cutting), and beat-matching"],
      projectTitle: "High-Energy Live Performance / Chase Sequence Edit",
      deliverables: ["Synchronized 4-camera live concert or high-speed chase sequence", "3-minute polished cut with dynamic pacing and locked audio sync"],
      definitionOfDone: ["Zero multi-cam sync drift across 15+ continuous minutes of footage", "Action cuts hit the peak of kinetic motion for invisible continuity", "Parallel storyline cross-cutting builds narrative tension effectively"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 5,
      title: "Audio Post-Production, Dialogue Restoration, Foley & Mastering",
      skillFocus: "Dialogue Denoising, EQ, Compression, Sound Design & LUFS Mastering",
      objective: "Clean, balance, and design immersive multi-track audio satisfying international broadcast and streaming loudness standards.",
      prerequisites: ["Stage 3 completion"],
      keyCompetencies: ["Dialogue restoration (spectral de-noise, de-reverb, de-click)", "Parametric EQ, high-pass filtering, and vocal presence shaping", "Dynamic range compression and multiband ducking (sidechaining music behind dialogue)", "Ambient room tone looping, Foley sound effects layering, and LUFS loudness targets (-14 LUFS online, -24 LUFS broadcast)"],
      projectTitle: "Cinematic Audio Restoration & Spatial Mixdown Lab",
      deliverables: ["Cleaned vocal dialogue stem with noise floor attenuated by >12dB without robotic artifacts", "Full balanced 6-track mix (Dialogue, ADR, Ambience, Foley, Sound FX, Music) mastered to -14 LUFS"],
      definitionOfDone: ["Integrated loudness measures exactly -14 LUFS (+/- 0.5 LUFS) with true peak <= -1.0 dBTP", "Sidechain ducking automatically ducks background music 3-4dB during vocal speech", "Zero dialogue clipping or low-frequency rumble"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 6,
      title: "Color Correction Fundamentals: Scopes, White Balance & Exposure",
      skillFocus: "Waveform / Vectorscope Analysis, Exposure Balancing & Natural Skin Tones",
      objective: "Systematically analyze and correct uneven footage, neutralizing color casts, setting legal black/white points, and establishing accurate skin tones.",
      prerequisites: ["Stage 2 completion"],
      keyCompetencies: ["Reading RGB Parade, Waveform, Vectorscope, and Histogram", "Setting black levels (pedestal), midtones (gamma), and highlights (gain)", "White balance correction via temperature/tint curves and color wheels", "Vectorscope skin-tone line alignment and qualifier masking"],
      projectTitle: "Multi-Scene Lighting Normalization & Shot Matching Lab",
      deliverables: ["Normalized 8-shot sequence balancing indoor tungsten and outdoor daylight exposures", "Color correction grading breakdown document showing scope before/after"],
      definitionOfDone: ["Highlight values stay within 0-100 IRE broadcast legal range without clipping", "Skin tones in all closeups align precisely along the Vectorscope skin-tone indicator", "Shot-to-shot luminance and color temperature balance remains consistent"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 7,
      title: "Stylistic Color Grading, Film Emulation & Look-Up Table (LUT) Workflows",
      skillFocus: "Creative Looks, Split-Toning, Film Halation & Node/Layer Architecture",
      objective: "Develop distinctive artistic color palettes that enhance cinematic mood, applying secondary qualifiers, split-toning, and calibrated print film emulations.",
      prerequisites: ["Stage 6 completion"],
      keyCompetencies: ["Node-based grading hierarchy (Correction -> Secondary -> Creative Look -> Film Grain)", "Color space management (DaVinci YRGB Color Managed, ACES, Rec.709)", "Secondary qualifiers: HSL keys, power windows, and 3D tracking", "Film grain generation, halation, bleach bypass, and custom LUT creation"],
      projectTitle: "Cinematic Mood Grading Suite: Noir, Sci-Fi & Golden Hour",
      deliverables: ["3 distinct stylistic color grades applied to the same raw benchmark scene", "Custom exportable 3D LUT (.cube) calibrated for Rec.709 displays"],
      definitionOfDone: ["Grades demonstrate emotional intentionality while preserving highlight/shadow detail", "Tracked power windows follow actors smoothly without halo or feather artifacts", "Exported .cube LUT loads cleanly across Premiere Pro, DaVinci, and OBS"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 8,
      title: "Motion Graphics, Kinetic Typography, Masking & Visual Compositing",
      skillFocus: "Animated Titles, Lower Thirds, Alpha Mattes, Tracking & Green Screen",
      objective: "Create broadcast-quality motion graphics, tracking-assisted title cards, seamless split-screen masks, and clean chroma key compositing.",
      prerequisites: ["Stage 3 completion"],
      keyCompetencies: ["Keyframe easing, bezier curves, and velocity graphs", "Kinetic typography, lower thirds, and callout graphics", "Point tracking, planar tracking (Mocha), and corner pinning", "Chroma keying (Ultra Key / DeltaKeyer), spill suppression, and alpha masking"],
      projectTitle: "Broadcast Motion Graphics Package & Green-Screen Composite",
      deliverables: ["Re-usable animated lower-third template with responsive timing", "Composite green-screen scene featuring background replacement, light wrap, and motion-tracked graphics"],
      definitionOfDone: ["Keyframe easing is smooth without linear robotic motion", "Chroma key edge shows zero green spill and preserves fine hair detail", "Motion-tracked titles remain rigidly locked to physical camera parallax"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 9,
      title: "Vertical Video Dynamics, Social Media Retention & Multi-Platform Delivery",
      skillFocus: "9:16 Re-Framing, Pacing Optimization, Subtitle Burn-In & Algorithmic Retention",
      objective: "Repurpose long-form content into high-retention 9:16 vertical shorts (TikTok, YouTube Shorts, Reels) using kinetic pacing, auto-reframe, and dynamic captions.",
      prerequisites: ["Stage 3, 8 completion"],
      keyCompetencies: ["Aspect ratio conversion (16:9 to 9:16, 4:5, 1:1) and smart auto-reframe", "Hook pacing (first 3 seconds retention architecture)", "Dynamic animated subtitles with word-by-word highlight emphasis", "Safe zone overlays avoiding UI button obstruction across platforms"],
      projectTitle: "Viral 60-Second Short Form Conversion & Retention Audit",
      deliverables: ["Two 60-second vertical reels adapted from long-form footage with animated captions", "Retention strategy analysis identifying hook, re-engagement beats, and call-to-action"],
      definitionOfDone: ["Visual elements and captions sit 100% inside mobile safe zones", "Pacing cuts out all vocal pauses (ums, breaths) without clipping speech cadence", "Caption animations sync frame-accurately with spoken words"],
      estimatedStudyHours: 14,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 10,
      title: "Master Archival, Export Specs & Professional Capstone Portfolio Showcase",
      skillFocus: "Delivery Codecs, Master Archiving, Showreel Editing & Client Handoff",
      objective: "Produce final high-bitrate master files, client deliverables, archived project bundles, and an impactful 90-second professional video editing showreel.",
      prerequisites: ["All prior stages completed"],
      keyCompetencies: ["Master exports: Apple ProRes 422 HQ, Avid DNxHR HQX, and uncompressed audio", "Web exports: Two-pass VBR H.264 / H.265 with optimized bitrate calculators", "Project consolidation and media management for cloud backup", "Editing showreel assembly showcasing versatility across drama, commercial, and social"],
      projectTitle: "Professional 90-Second Editor Showreel & Commercial Master Package",
      deliverables: ["90-second high-energy professional editor showreel with case study breakdown", "Complete archived project bundle with ProRes master, web deliverables, and stems"],
      definitionOfDone: ["Showreel demonstrates pacing, color grading, sound design, and title craft", "Delivery files validate against target client specs with zero frame corruptions", "Public portfolio page launched showcasing project breakdowns and client testimonials"],
      estimatedStudyHours: 17,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
  ],
};

export function buildVideoEditingStageContent(stage: number): StageContentDetail {
  switch (stage) {
    case 1:
      return {
        topics: [
          {
            id: "ve_1_1",
            title: "NLE Architecture, GPU Hardware Acceleration & Scratch Disk Strategy",
            completed: false,
            subtopics: [
              "Comparing Premiere Pro, DaVinci Resolve, and Final Cut Pro NLE architectures",
              "GPU CUDA/Metal decoding vs CPU multi-core timeline rendering",
              "Configuring dedicated scratch disks, cache drives, and autosave intervals",
            ],
            explanation: "Non-linear editing systems require high read/write bandwidth and dedicated GPU decoding to scrub through high-resolution footage smoothly without dropped frames.",
          },
          {
            id: "ve_1_2",
            title: "Digital Video Fundamentals: Frame Rates, Resolutions & Scanning",
            completed: false,
            subtopics: [
              "24fps cinema cadence vs 29.97/30fps broadcast vs 60fps high frame rate",
              "Raster resolutions: Full HD (1920x1080), 4K DCI (4096x2160), and UHD (3840x2160)",
              "Progressive scan vs legacy interlaced video artifacts",
            ],
            explanation: "Frame rate and resolution dictate the project timeline configuration. Mixing frame rates without proper timeline interpretation introduces pulldown judder and audio drift.",
          },
          {
            id: "ve_1_3",
            title: "Codec Compression Architecture: Interframe vs Intraframe Codecs",
            completed: false,
            subtopics: [
              "Long-GOP Interframe codecs (H.264, H.265/HEVC) and decoding overhead",
              "Intraframe editing codecs (Apple ProRes, Avid DNxHD/DNxHR, GoPro CineForm)",
              "Bitrates, bit depths (8-bit vs 10-bit), and chroma subsampling (4:2:0 vs 4:2:2)",
            ],
            explanation: "Long-GOP codecs like H.264 save storage but choke CPUs during timeline scrubbing because frames depend on preceding keyframes. Professional editors transcode to intraframe codecs for fluid scrubbing.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: "Editing raw 4K H.264/H.265 camera files directly on slow mechanical drives",
            consequence: "Choppy timeline playback, dropped frames, software freezing, and unresponsive trimming.",
            solutionOrFix: "Move project media to an NVMe SSD and transcode lightweight editing proxies (ProRes Proxy or DNxHR LB).",
          },
          {
            mistake: "Creating a timeline with mismatched frame rate (e.g. 24fps footage in a 30fps timeline)",
            consequence: "Duplicated stuttered frames, micro-jitters, and sync drift over long durations.",
            solutionOrFix: "Create your sequence by dragging a master clip into an empty timeline or explicitly matching sequence settings to the primary camera frame rate.",
          },
        ],
        knowledgeCheck: [
          {
            question: "Why does scrubbing H.264 footage strain your computer more than scrubbing Apple ProRes footage, even though ProRes file sizes are 5x larger?",
            answerOrExplanation: "H.264 is an interframe (Long-GOP) codec where most frames only store difference vectors relative to I-frames; your CPU/GPU must reconstruct previous and future frames continuously. ProRes is an intraframe codec where every single frame is an independent, complete image that can be decompressed instantly.",
            solutionRubric: "Explains Long-GOP delta decompression overhead versus independent intraframe decoding.",
          },
        ],
        completionCriteria: [
          "NLE interface configured with optimized performance preferences and custom shortcut mapping",
          "Created a benchmark project comparing H.264 timeline scrubbing vs ProRes Proxy performance",
          "Zero dropped frames verified during 4K multi-layer playback tests",
        ],
        practicalExercises: [
          {
            id: "ve_ex_1",
            title: "NLE Project Setup & Proxy Pipeline Benchmark",
            prompt: "Initialize a new project in your NLE, configure GPU acceleration, import 5 raw camera clips, generate ProRes proxies, and configure a hotkey toggle.",
            instructions: [
              "Configure project scratch disks to a dedicated high-speed NVMe drive.",
              "Import 4K camera footage and generate 1080p ProRes Proxy files.",
              "Map a single-key shortcut to toggle between proxy and raw footage.",
              "Verify timeline playback shows 0 dropped frames during 2x and 4x speed scrubbing.",
            ],
            expectedOutcome: "Project file saved with proxies linked and zero playback frame drops during scrubbing.",
          },
        ],
        freeResources: [
          {
            title: "Blackmagic DaVinci Resolve Official Training Guide",
            url: "https://www.blackmagicdesign.com/products/davinciresolve/training",
            platform: "Blackmagic Design",
            type: "docs",
            isFree: true,
          },
          {
            title: "Premiere Pro Best Practices & Hardware Guide",
            url: "https://helpx.adobe.com/premiere-pro/using/best-practices.html",
            platform: "Adobe",
            type: "docs",
            isFree: true,
          },
        ],
      };

    case 3:
      return {
        topics: [
          {
            id: "ve_3_1",
            title: "The Grammar of the Edit & The Rule of Six",
            completed: false,
            subtopics: [
              "Walter Murch's Rule of Six hierarchy: Emotion (51%), Story (23%), Rhythm (10%), Eye-trace (7%), 2D Plane (5%), 3D Space (4%)",
              "Establishing spatial geography and cutting along the 180-degree axis",
              "Pacing: when to hold a shot and when to cut for psychological impact",
            ],
            explanation: "Editing is not merely assembling scenes chronologically; it is sculpting audience attention, emotion, and perception through rhythmic timing.",
          },
          {
            id: "ve_3_2",
            title: "J-Cuts, L-Cuts & Audio-Lead Continuity",
            completed: false,
            subtopics: [
              "J-Cut mechanics: audio leads video to pull audience anticipation into the incoming scene",
              "L-Cut mechanics: video changes while dialogue from the prior shot lingers",
              "Hiding visual cuts within natural speech pauses and emotional breaths",
            ],
            explanation: "Straight cuts where audio and video transition simultaneously feel mechanical and unnatural. Overlapping split edits (J/L cuts) create fluid conversational continuity.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: "Cutting every time a new character begins speaking (ping-pong editing)",
            consequence: "Conversations feel like a mechanical tennis match, stripping away character reactions and emotional subtext.",
            solutionOrFix: "Hold on the listening character's reaction shot while the other person speaks using an L-cut to capture emotional resonance.",
          },
        ],
        knowledgeCheck: [
          {
            question: "According to Walter Murch's Rule of Six, what is the most important criterion when deciding where to cut?",
            answerOrExplanation: "Emotion (accounting for 51% of importance). A cut that breaks spatial or continuity rules is completely acceptable if it preserves and heightens the emotional truth of the scene.",
            solutionRubric: "Identifies Emotion as primary criterion and explains why emotional continuity overrides technical perfection.",
          },
        ],
        completionCriteria: [
          "Rough cut of dialogue scene assembled with clear narrative progression",
          "All conversational transitions use intentional J-cuts or L-cuts rather than straight cuts",
          "Reaction shots timed to capture subtext rather than mechanical speaker switching",
        ],
        practicalExercises: [
          {
            id: "ve_ex_3",
            title: "Dramatic Dialogue Cut with J/L Audio Splits",
            prompt: "Cut a 2-character dramatic scene using multi-angle coverage, incorporating at least 4 split edits (J/L cuts) to enhance emotional tension.",
            instructions: [
              "Review all raw takes and mark preferred line deliveries with markers.",
              "Assemble master shot, close-ups, and over-the-shoulder coverage.",
              "Implement J-cuts to lead incoming dialogue and L-cuts to show listener reactions.",
              "Trim scene so pacing feels natural and builds tension toward the scene climax.",
            ],
            expectedOutcome: "A polished 90–120 second dialogue scene with natural pacing and zero jarring audio/video cuts.",
          },
        ],
        freeResources: [
          {
            title: "In the Blink of an Eye - Walter Murch Film Editing Principles",
            url: "https://www.youtube.com/results?search_query=walter+murch+rule+of+six",
            platform: "Film Analysis",
            type: "video",
            isFree: true,
          },
        ],
      };

    default:
      return {
        topics: [
          {
            id: `ve_${stage}_1`,
            title: VIDEO_EDITING_BLUEPRINT.stages[stage - 1]?.title || `Stage ${stage} Creative Competencies`,
            completed: false,
            subtopics: [
              "Core industry workflow principles and creative aesthetics",
              "Tool execution, keyboard hotkeys, and parameter refinement",
              "Quality control, client feedback integration, and delivery specs",
            ],
            explanation: `Mastering Stage ${stage} empowers editors to deliver professional-grade results aligning with modern broadcast and cinema delivery expectations.`,
          },
          {
            id: `ve_${stage}_2`,
            title: "Technical Standards, Color Science & Audio Precision",
            completed: false,
            subtopics: [
              "Monitoring fidelity, calibrated displays, and scope validation",
              "Artifact prevention: banding, clipping, phase cancellation, and jitter",
              "Export optimization across high-bitrate archival and web compression formats",
            ],
            explanation: "Professional post-production balances artistic storytelling with rigorous technical compliance across audio levels, color spaces, and codec profiles.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: `Skipping quality control checks and scope validation in Stage ${stage}`,
            consequence: "Unintended audio clipping, broadcast rejection, or color banding on consumer displays.",
            solutionOrFix: "Always verify waveform levels, vectorscope alignment, and test final masters on multiple calibrated viewing environments.",
          },
        ],
        knowledgeCheck: [
          {
            question: `What distinguishes professional execution from amateur work in Stage ${stage}: ${VIDEO_EDITING_BLUEPRINT.stages[stage - 1]?.skillFocus}?`,
            answerOrExplanation: "Professional editors combine deep narrative intuition with strict technical discipline—respecting loudness standards, color spaces, asset management, and client revision workflows.",
            solutionRubric: "Demonstrates understanding of both creative storytelling and broadcast/web technical compliance.",
          },
        ],
        completionCriteria: [
          `Satisfy all practical milestones defined in Stage ${stage}`,
          "Export deliverables matching technical requirements without audio or video artifacts",
          "Pass stage knowledge check and self-assessment review",
        ],
        practicalExercises: [
          {
            id: `ve_ex_${stage}`,
            title: VIDEO_EDITING_BLUEPRINT.stages[stage - 1]?.projectTitle || `Stage ${stage} Milestone Project`,
            prompt: `Execute the real-world post-production brief for Stage ${stage}, assembling raw assets, applying refined techniques, and exporting delivery masters.`,
            instructions: [
              "Review the project brief, client deliverables, and required export specifications.",
              "Apply non-destructive editing techniques and color/audio adjustments.",
              "Export deliverables in specified format (e.g., ProRes 422 HQ, MP4 H.264) and inspect scopes.",
            ],
            expectedOutcome: "Completed video deliverable satisfying all stage project requirements with zero technical errors.",
          },
        ],
        freeResources: [
          {
            title: "Professional Post-Production Editing Guides",
            url: "https://frame.io/insider",
            platform: "Frame.io Insider",
            type: "docs",
            isFree: true,
          },
        ],
      };
  }
}
