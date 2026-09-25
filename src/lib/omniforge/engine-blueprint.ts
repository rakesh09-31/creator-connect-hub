import {
  OmniForgeProject,
  ProjectPhase,
  ProjectRole,
  ParallelWorkstream,
  ProjectDeliverable,
  ProjectDomain,
  ProjectTask,
} from "./types";
import { detectProjectDomain } from "./engine";

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

function makeRole(
  id: string,
  roleName: string,
  requiredSkills: string[],
  description: string,
  category: "Creative" | "Technical" | "Business" | "Communication" | "Custom" = "Creative",
  isEssential: boolean = true
): ProjectRole {
  return {
    id,
    roleName,
    category,
    description,
    requiredCapabilities: [roleName, ...requiredSkills.slice(0, 2)],
    requiredSkills,
    estimatedHeadcount: 1,
    isFilled: false,
    isEssential,
  };
}

function makeTask(
  phaseId: string,
  title: string,
  description: string,
  requiredRole: string,
  requiredSkills: string[] = [],
  priority: "low" | "medium" | "high" | "urgent" = "high",
  estimatedDuration: string = "3 days",
  order: number = 1,
  dependencies: string[] = []
): ProjectTask {
  return {
    id: genId("task"),
    phaseId,
    title,
    description,
    requiredRole,
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : [requiredRole],
    dependencies,
    parallelWith: [],
    estimatedDuration,
    priority,
    status: "to_do",
    order,
  };
}

export function generateStructuredBlueprint(
  prompt: string,
  userType: "creator" | "client" = "creator",
  creatorId: string = "anon"
): OmniForgeProject {
  const lower = prompt.toLowerCase();
  const domainInfo = detectProjectDomain(prompt);
  const primaryDomain = domainInfo.primary;

  // Check for specific scenario matches
  const isMixedCraftDocuAI =
    (lower.includes("craft") || lower.includes("artisan") || lower.includes("traditional")) &&
    (lower.includes("documentary") || lower.includes("film")) &&
    (lower.includes("ai") || lower.includes("preserve") || lower.includes("knowledge"));

  const isCollegeEvent =
    (lower.includes("festival") || lower.includes("fest") || lower.includes("cultural") || lower.includes("500 students")) &&
    !lower.includes("website") &&
    !lower.includes("app");

  const isSongLyrics =
    (lower.includes("lyrics") || lower.includes("song") || lower.includes("track")) &&
    (lower.includes("compose") || lower.includes("professional song") || lower.includes("turn them into"));

  const isThrillerMissingStudent =
    (lower.includes("missing student") || lower.includes("suspense") || lower.includes("thriller")) &&
    (lower.includes("film") || lower.includes("movie") || lower.includes("short film") || lower.includes("script") || lower.includes("story") || lower.includes("actor") || lower.includes("production") || lower.includes("plan"));

  const isVillageSingerFilm =
    (lower.includes("village girl") || lower.includes("village singer") || (lower.includes("singer") && lower.includes("village")));

  const isEcommerceWeb =
    (lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("online store") || lower.includes("shopping")) &&
    (lower.includes("website") || lower.includes("web app") || lower.includes("platform") || lower.includes("store") || lower.includes("develop"));

  const isClubWebsite =
    (lower.includes("website") || lower.includes("web app") || lower.includes("portal")) &&
    (lower.includes("college") || lower.includes("club") || lower.includes("events") || lower.includes("register"));

  let title = "Custom Project";
  let description = prompt;
  let domain: ProjectDomain = primaryDomain;
  let phases: ProjectPhase[] = [];
  let roles: ProjectRole[] = [];
  let deliverables: ProjectDeliverable[] = [];
  let requirements: string[] = [];
  let workflowStages: string[] = [];
  let goal = "";

  // 1. MIXED DOMAIN: CRAFT DOCUMENTARY + AI PRESERVATION
  if (isMixedCraftDocuAI) {
    domain = "Film";
    title = "Traditional Indian Crafts Documentary & AI Knowledge Archive";
    goal = "Create a high-quality cultural documentary celebrating Indian artisans while building an AI-powered archival platform to preserve endangered craft methodologies.";
    requirements = [
      "Documentary storytelling and cinematic field production across artisan clusters",
      "Interviews and audio-visual recordings with master craftspeople",
      "AI/ML pipeline for knowledge extraction, pattern classification, and digital archiving",
      "Interactive preservation repository / showcase platform",
      "Post-production color grading, bilingual subtitles, and cultural release",
    ];
    workflowStages = [
      "Research & Field Planning",
      "Cinematic Filming & Craft Documentation",
      "AI Knowledge Pipeline & Data Ingestion",
      "Documentary Post-Production",
      "Multi-Channel Premiere & Digital Archive Launch",
    ];

    roles = [
      makeRole("role-dir", "Documentary Director", ["Documentary Directing", "Field Production", "Storytelling"], "Leads artistic vision, narrative pacing, and cultural sensitivity.", "Creative"),
      makeRole("role-cine", "Cinematographer", ["Cinema Cameras", "Natural Lighting", "Field Filming"], "Captures detailed craft techniques and cinematic visual portraits.", "Creative"),
      makeRole("role-ai", "AI / ML Engineer", ["NLP", "Computer Vision", "Knowledge Graphs", "Python"], "Develops classification models and searchable knowledge archive.", "Technical"),
      makeRole("role-craft", "Cultural Craft Specialist", ["Indigenous Crafts", "Artisan Networking", "Ethnography"], "Guides authentic context, artisan liaison, and archival accuracy.", "Creative"),
      makeRole("role-edit", "Video Editor", ["Premiere Pro", "DaVinci Resolve", "Documentary Editing"], "Edits visual story, soundscape, and multilingual subtitles.", "Creative"),
    ];

    const p1Id = "phase-1";
    const p2Id = "phase-2";
    const p3Id = "phase-3";

    phases = [
      {
        id: p1Id,
        name: "Research & Field Planning",
        description: "Identify artisan clusters, conduct pre-interviews, and structure documentary arc with archival schema.",
        purpose: "Establish cultural foundation and shoot roadmap.",
        sourceReason: "Cultural documentation requires community alignment before filming.",
        order: 1,
        workstreams: ["Field Research", "Archival Planning"],
        tasks: [
          makeTask(p1Id, "Curate Artisan Clusters & Archival Taxonomy", "Map craft styles and data structure.", "Cultural Craft Specialist", ["Indigenous Crafts"], "high", "5 days", 1),
          makeTask(p1Id, "Storyboard & Production Schedule", "Plan shots, travel logistics, and interview guides.", "Documentary Director", ["Documentary Directing"], "high", "4 days", 2),
        ],
      },
      {
        id: p2Id,
        name: "Cinematic Filming & Data Ingestion",
        description: "Capture 4K artisan footage and record craft instructions.",
        purpose: "Gather primary film footage and raw AI training material.",
        sourceReason: "Both the film and AI archive depend on high-fidelity field capture.",
        order: 2,
        workstreams: ["Cinematography", "AI Modeling"],
        tasks: [
          makeTask(p2Id, "On-Location Documentary Shoot", "Film artisans in workshop settings.", "Cinematographer", ["Cinema Cameras"], "high", "8 days", 1),
          makeTask(p2Id, "Build Digital Preservation Model", "Train vision/NLP models to categorize craft techniques.", "AI / ML Engineer", ["Computer Vision", "Python"], "high", "10 days", 2),
        ],
      },
      {
        id: p3Id,
        name: "Post-Production & Archive Deployment",
        description: "Edit final documentary cut and deploy public AI preservation repository.",
        purpose: "Deliver polished film and live archival platform.",
        sourceReason: "Final deliverables for public release and preservation.",
        order: 3,
        workstreams: ["Post-Production", "Web Deployment"],
        tasks: [
          makeTask(p3Id, "Assembly & Color Grade Documentary", "Complete documentary cut with sound design.", "Video Editor", ["Premiere Pro", "Color Grading"], "high", "7 days", 1),
        ],
      },
    ];
  }
  // 2. SUSPENSE THRILLER SHORT FILM (MISSING STUDENT)
  else if (isThrillerMissingStudent) {
    domain = "Film";
    title = "Short Film: Vanished Echoes (Suspense Thriller)";
    goal = "Produce a high-tension 15-minute suspense thriller short film about a missing student, executing script lock, character casting, location filming, and atmospheric post-production.";
    requirements = [
      "Completed 15-page screenplay with suspense pacing, scene headings, and twist climax",
      "Casting for lead investigator, missing student, and key faculty/security suspect",
      "Atmospheric location permits (university library archives, dorm room, quadrangle)",
      "Low-key cinematic lighting package, cinema camera, and boom audio recording",
      "Picture lock, DaVinci cold teal color grading, original tension score, and 5.1 sound mix",
      "Festival submission screener and YouTube 4K premiere packaging",
    ];
    workflowStages = [
      "Script Polish & Scene Breakdown",
      "Casting & Location Scouting",
      "Principal Photography (2-Day Shoot)",
      "Editing, Color Grading & Sound Mix",
      "Festival & Digital Premiere",
    ];

    roles = [
      makeRole("role-write", "Screenwriter", ["Screenwriting", "Dialogue", "Suspense Pacing"], "Drafts and locks shooting script with tight thriller pacing.", "Creative"),
      makeRole("role-dir", "Film Director", ["Film Directing", "Actor Guidance", "Visual Suspense"], "Guides performances, blocking, and dramatic tension.", "Creative"),
      makeRole("role-cine", "Cinematographer", ["Low-Key Lighting", "Camera Operation", "Chiaroscuro"], "Operates cinema camera and designs moody, high-contrast thriller lighting.", "Creative"),
      makeRole("role-act-lead", "Lead Actor", ["Screen Acting", "Emotional Stakes", "Method Acting"], "Portrays the student investigator searching for the missing friend.", "Creative"),
      makeRole("role-act-supp", "Supporting Actor", ["Character Acting", "Screen Presence", "Dramatic Voice"], "Portrays the security officer / faculty member holding the secret.", "Creative"),
      makeRole("role-edit", "Video Editor", ["Premiere Pro", "DaVinci Resolve", "Thriller Pacing"], "Cuts footage for maximum suspense and applies cold, atmospheric grade.", "Creative"),
      makeRole("role-sound", "Sound Designer", ["Foley", "Atmospheric Tension Score", "5.1 Audio Mix"], "Composes dark ambient score and cleans dialogue tracks.", "Creative"),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";

    phases = [
      {
        id: p1,
        name: "Script Lock & Pre-Production Planning",
        description: "Finalize shooting script, generate scene breakdown, storyboard camera angles, and build prop list.",
        purpose: "Establish narrative blueprint and technical shoot requirements.",
        sourceReason: "Tight thrillers require precise shot planning to sustain suspense.",
        order: 1,
        workstreams: ["Screenplay", "Shot Listing"],
        tasks: [
          makeTask(p1, "Lock 15-Page Thriller Script", "Complete dialogue, suspense pacing, and climax revelation.", "Screenwriter", ["Screenwriting"], "high", "3 days", 1),
          makeTask(p1, "Storyboard & Lighting Design", "Plan low-key lighting ratios and claustrophobic framing with DoP.", "Cinematographer", ["Low-Key Lighting"], "high", "3 days", 2),
        ],
      },
      {
        id: p2,
        name: "Casting & Location Scouting",
        description: "Cast lead investigator and suspect, scout university library/basement, secure filming permits.",
        purpose: "Assemble talent and secure physical locations.",
        sourceReason: "Authentic locations and believable actors define thriller immersion.",
        order: 2,
        workstreams: ["Casting", "Location Permits"],
        tasks: [
          makeTask(p2, "Audition & Cast Lead & Antagonist Roles", "Select verified actors on OmniCraft matching character profiles.", "Film Director", ["Actor Guidance"], "high", "4 days", 1),
          makeTask(p2, "Scout & Secure Campus Basement Archive", "Obtain administrative filming permissions and verify power access.", "Film Director", ["Film Directing"], "high", "3 days", 2),
        ],
      },
      {
        id: p3,
        name: "Principal Photography (Weekend Shoot)",
        description: "Film all exterior night scenes and interior library basement confrontation over a 2-day production window.",
        purpose: "Capture all primary footage, B-roll, and live audio.",
        sourceReason: "Core production execution phase.",
        order: 3,
        workstreams: ["Principal Photography", "Sound Recording"],
        tasks: [
          makeTask(p3, "Shoot Scene 1: Campus Quad Exterior (Night)", "Film chase and phone call sequences under rain/fog lighting.", "Film Director", ["Film Directing"], "urgent", "1 day", 1),
          makeTask(p3, "Shoot Scene 2 & 3: Library Archive Climax", "Film basement investigation, flashlight reveal, and police climax.", "Film Director", ["Film Directing"], "urgent", "1 day", 2),
        ],
      },
      {
        id: p4,
        name: "Post-Production, Color Grading & Audio Mix",
        description: "Edit rough and fine cuts, compose original suspense score, apply DaVinci color grade, and export master.",
        purpose: "Craft polished, suspenseful audio-visual master.",
        sourceReason: "Sound design and color grading are critical to thriller atmosphere.",
        order: 4,
        workstreams: ["Picture Edit", "Color Grading", "Sound Mix"],
        tasks: [
          makeTask(p4, "Assembly & Fine Picture Cut", "Edit for suspenseful timing and tension release in Premiere Pro.", "Video Editor", ["Premiere Pro"], "high", "5 days", 1),
          makeTask(p4, "DaVinci Color Grade & 5.1 Sound Design", "Grade shadows cold teal and layer ambient suspense score.", "Sound Designer", ["5.1 Audio Mix"], "high", "4 days", 2),
        ],
      },
    ];
  }
  // 3. VILLAGE SINGER / DRAMA FILM
  else if (isVillageSingerFilm || (primaryDomain === "Film" && !isEcommerceWeb)) {
    domain = "Film";
    title = prompt.length > 50 ? "Short Film: A Village Singer's Dream" : prompt;
    goal = "Produce and release a compelling narrative short film about an aspiring village singer overcoming obstacles to achieve her dream.";
    requirements = [
      "Completed screenplay with structured scene beats and authentic dialogue",
      "Casting authentic lead performers and hiring core production crew",
      "Location scouting for village and music studio settings",
      "Cinematic multi-day principal photography with cinema lighting and sound capture",
      "Post-production editing, original music score, audio mixing, and color grading",
      "Festival submission and online release strategy",
    ];
    workflowStages = [
      "Develop the Story",
      "Write the Script",
      "Prepare for Production",
      "Shoot",
      "Edit & Finish",
      "Release",
    ];

    roles = [
      makeRole("role-write", "Screenwriter", ["Screenwriting", "Dialogue", "Character Development"], "Drafts the screenplay, scene descriptions, and dialogue.", "Creative"),
      makeRole("role-dir", "Film Director", ["Film Directing", "Actor Guidance", "Visual Storytelling"], "Shapes overall creative vision, performance tone, and shot execution.", "Creative"),
      makeRole("role-cine", "Cinematographer", ["Camera Operation", "Lighting Design", "Color Palette"], "Operates camera, frames scenes, and designs dramatic lighting.", "Creative"),
      makeRole("role-act", "Lead Actor", ["Screen Acting", "Singing / Vocal Expressiveness"], "Portrays the village girl with emotional depth and vocal believability.", "Creative"),
      makeRole("role-edit", "Video Editor", ["Premiere Pro", "DaVinci Resolve", "Pacing"], "Assembles scenes, trims narrative rhythm, and applies color grade.", "Creative"),
      makeRole("role-sound", "Sound Designer", ["Audio Post-Production", "Foley", "Dialogue Clean-up"], "Cleans dialogue, adds atmospheric ambiance, and mixes the final audio.", "Creative"),
      makeRole("role-music", "Music Producer", ["Film Scoring", "Vocal Composition", "Audio Track"], "Produces the girl's featured singing songs and background score.", "Creative"),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";

    phases = [
      {
        id: p1,
        name: "Develop the Story & Write the Script",
        description: "Flesh out character journeys, write screenplay drafts, and finalize the shooting script.",
        purpose: "Establish the narrative foundation.",
        sourceReason: "Every film production requires an approved script before budgeting and casting.",
        order: 1,
        workstreams: ["Story Development"],
        tasks: [
          makeTask(p1, "Draft Story Treatment & Beat Outline", "Outline the 3-act structure of the village singer's journey.", "Screenwriter", ["Screenwriting"], "high", "3 days", 1),
          makeTask(p1, "Write Final Shooting Script", "Complete dialogue, scene headings, and character cues.", "Screenwriter", ["Screenwriting"], "high", "5 days", 2),
        ],
      },
      {
        id: p2,
        name: "Prepare for Production (Pre-Production)",
        description: "Cast actors, scout village locations, storyboard scenes, and prepare camera gear.",
        purpose: "Lock in all logistical and creative assets prior to shooting.",
        sourceReason: "Pre-production minimizes costly shoot delays on location.",
        order: 2,
        workstreams: ["Casting", "Shot Planning", "Vocal Playback"],
        tasks: [
          makeTask(p2, "Audition & Cast Lead Village Singer", "Cast actress with singing ability and emotional range.", "Film Director", ["Film Directing"], "high", "4 days", 1),
          makeTask(p2, "Storyboard & Shot List Creation", "Design visual style and camera angles with cinematographer.", "Cinematographer", ["Camera Operation"], "high", "3 days", 2),
          makeTask(p2, "Record Feature Vocal Track for Playback", "Pre-record song to use for on-set lip sync filming.", "Music Producer", ["Film Scoring"], "high", "3 days", 3),
        ],
      },
      {
        id: p3,
        name: "Shoot (Principal Photography)",
        description: "Execute multi-day production on location, capturing all visual scenes and live audio.",
        purpose: "Capture all footage required for the story.",
        sourceReason: "Core production phase.",
        order: 3,
        workstreams: ["Principal Photography"],
        tasks: [
          makeTask(p3, "Principal Photography: Village Scenes", "Film village dialogue, dramatic turning points, and musical moments.", "Film Director", ["Film Directing"], "high", "4 days", 1),
        ],
      },
      {
        id: p4,
        name: "Edit, Finish & Release",
        description: "Assembly cut, fine cut, sound design, original score, color grading, and festival delivery.",
        purpose: "Polish raw footage into a finished film.",
        sourceReason: "Prepares film for public screening and distribution.",
        order: 4,
        workstreams: ["Post-Production", "Audio Finishing"],
        tasks: [
          makeTask(p4, "Picture Lock & Color Grading", "Cut visual scenes and apply cinematic color grade in DaVinci.", "Video Editor", ["Premiere Pro"], "high", "6 days", 1),
          makeTask(p4, "Sound Design & 5.1 Surround Mix", "Balance dialogue, foley, and musical score.", "Sound Designer", ["Audio Post-Production"], "high", "4 days", 2),
        ],
      },
    ];
  }
  // 3. SONG & MUSIC PRODUCTION
  else if (isSongLyrics || primaryDomain === "Music") {
    domain = "Music";
    title = "Professional Song Production & Release";
    goal = "Transform original lyrics into a professionally recorded, mixed, mastered, and distributed music track.";
    requirements = [
      "Original melody composition and harmonic chord progression",
      "Instrumental arrangement and beat/track production",
      "Studio vocal and acoustic recording sessions",
      "Audio mixing and spatial stereo balancing",
      "Mastering to streaming platform standards (LUFS compliance)",
      "Cover artwork and digital distribution strategy",
    ];
    workflowStages = [
      "Lyrics & Melody Composition",
      "Music Production & Arrangement",
      "Studio Vocal Recording",
      "Audio Mixing",
      "Audio Mastering",
      "Artwork & Digital Release",
    ];

    roles = [
      makeRole("role-comp", "Music Composer", ["Melody Writing", "Harmonics", "Piano / Guitar"], "Composes top-line melody and vocal harmonies from lyrics.", "Creative"),
      makeRole("role-prod", "Music Producer", ["Logic Pro / Ableton", "Arrangement", "Beats / Synthesis"], "Builds full instrumental production and backing tracks.", "Creative"),
      makeRole("role-sing", "Playback Singer", ["Lead Vocals", "Pitch Accuracy", "Emotion"], "Performs expressive lead and backing vocals.", "Creative"),
      makeRole("role-mix", "Mixing Engineer", ["EQ", "Compression", "Reverb / Delay", "Pro Tools"], "Blends vocal and instrumental tracks into a cohesive soundscape.", "Creative"),
      makeRole("role-mast", "Mastering Engineer", ["LUFS Loudness", "Mastering Chain", "Stereo Imaging"], "Optimizes track dynamics and commercial loudness for Spotify/Apple Music.", "Creative"),
      makeRole("role-art", "Cover Art Designer", ["Photoshop", "Album Artwork", "Visual Identity"], "Designs release artwork and promotional banners.", "Creative", false),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";

    phases = [
      {
        id: p1,
        name: "Composition & Arrangement",
        description: "Establish tempo, chords, melodic hooks, and produce instrumental backing track.",
        purpose: "Create the musical spine for the lyrics.",
        sourceReason: "Vocals cannot be recorded without an instrumental guide track.",
        order: 1,
        workstreams: ["Composition", "Arrangement"],
        tasks: [
          makeTask(p1, "Compose Vocal Melody & Chords", "Set lyrics to melody with piano/guitar scratch.", "Music Composer", ["Melody Writing"], "high", "3 days", 1),
          makeTask(p1, "Produce Full Instrumental Arrangement", "Program rhythm, bass, synths, and acoustic layers.", "Music Producer", ["Logic Pro / Ableton"], "high", "5 days", 2),
        ],
      },
      {
        id: p2,
        name: "Vocal Recording & Editing",
        description: "Record lead and backing vocal takes in studio and tune pitch/timing.",
        purpose: "Capture pristine vocal performance.",
        sourceReason: "Vocals are the focal point of the lyrical piece.",
        order: 2,
        workstreams: ["Studio Recording"],
        tasks: [
          makeTask(p2, "Studio Vocal Tracking Session", "Record lead vocal takes, doubles, and ad-libs.", "Playback Singer", ["Lead Vocals"], "high", "2 days", 1),
        ],
      },
      {
        id: p3,
        name: "Mixing, Mastering & Release",
        description: "Mix multitrack stems, master for streaming platforms, and prepare artwork.",
        purpose: "Deliver broadcast-ready audio and launch asset package.",
        sourceReason: "Essential for commercial clarity and streaming compliance.",
        order: 3,
        workstreams: ["Mixing", "Mastering"],
        tasks: [
          makeTask(p3, "Multitrack Audio Mixing", "Balance stems, apply EQ, dynamic processing and space.", "Mixing Engineer", ["EQ", "Compression"], "high", "3 days", 1),
          makeTask(p3, "Audio Mastering & Distribution Asset Delivery", "Master to -14 LUFS and export lossless WAVs.", "Mastering Engineer", ["LUFS Loudness"], "high", "2 days", 2),
        ],
      },
    ];
  }
  // 4. EVENT: COLLEGE CULTURAL FESTIVAL
  else if (isCollegeEvent || primaryDomain === "Events") {
    domain = "Events";
    title = "College Cultural Festival (500 Students)";
    goal = "Plan, coordinate, promote, and execute a vibrant college cultural festival for 500 attendees with live performances, food stalls, and student competitions.";
    requirements = [
      "Event schedule, activity lineup, and stage timings",
      "Venue booking, safety clearance, and physical space layout",
      "Stage, audio/sound reinforcement, lighting, and power backup",
      "Student registration, ticketing/pass system, and helpdesk",
      "Promotion across campus clubs, social media, and banners",
      "Live event photography, videography, and security coordination",
    ];
    workflowStages = [
      "Event Concept & Budgeting",
      "Venue, Permits & Logistics",
      "Performer & Competition Lineup",
      "Campus Promotion & Registration",
      "Stage Setup & Sound Check",
      "Live Event Execution & Wrap-up",
    ];

    roles = [
      makeRole("role-coord", "Event Coordinator", ["Event Planning", "Team Leadership", "Budgeting"], "Oversees timeline, department heads, and overall festival delivery.", "Business"),
      makeRole("role-log", "Logistics Manager", ["Venue Management", "Vendor Coordination", "Crowd Control"], "Handles venue permits, seating, food stalls, and safety protocols.", "Business"),
      makeRole("role-av", "Stage & AV Engineer", ["Live Sound", "PA Systems", "Stage Lighting"], "Sets up microphones, speakers, stage lights, and oversees sound checks.", "Technical"),
      makeRole("role-promo", "Promotion & PR Lead", ["Social Media", "Poster Design", "Student Outreach"], "Drives festival registrations, passes, and campus buzz.", "Communication"),
      makeRole("role-photo", "Event Photographer / Videographer", ["Live Event Capture", "Photo Editing", "Aftermovie"], "Captures high-energy moments and edits the official festival aftermovie.", "Creative", false),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";

    phases = [
      {
        id: p1,
        name: "Festival Planning & Logistics",
        description: "Finalize schedule, book campus venue, contract AV equipment, and establish registration flow.",
        purpose: "Lay operational groundwork.",
        sourceReason: "Event logistics and approvals require early execution.",
        order: 1,
        workstreams: ["Venue & Permits", "Equipment Procurement"],
        tasks: [
          makeTask(p1, "Finalize Schedule & Venue Layout", "Lock auditorium/ground space and obtain college administration clearance.", "Event Coordinator", ["Event Planning"], "high", "4 days", 1),
          makeTask(p1, "Contract Stage, Lighting & Sound Vendors", "Procure PA system, microphones, and stage lighting for 500 audience.", "Stage & AV Engineer", ["Live Sound"], "high", "3 days", 2),
        ],
      },
      {
        id: p2,
        name: "Promotion, Registration & Talent Lineup",
        description: "Open participant registration, conduct talent tryouts, and roll out marketing campaigns.",
        purpose: "Ensure maximum student participation.",
        sourceReason: "Attendees need timely registration and passes.",
        order: 2,
        workstreams: ["Campus PR", "Participant Tryouts"],
        tasks: [
          makeTask(p2, "Campus Social & Poster Campaign", "Distribute flyers, launch Instagram countdown, and open ticketing.", "Promotion & PR Lead", ["Social Media"], "high", "7 days", 1),
        ],
      },
      {
        id: p3,
        name: "Live Execution & Wrap-up",
        description: "Run festival day schedule, coordinate performances, manage crowd flow, and capture aftermovie.",
        purpose: "Deliver memorable event experience.",
        sourceReason: "Culmination of festival planning.",
        order: 3,
        workstreams: ["Day-of Coordination"],
        tasks: [
          makeTask(p3, "Live Event Coordination & Stage Flow", "Manage emcees, live performers, and safety compliance.", "Event Coordinator", ["Event Planning"], "high", "1 day", 1),
        ],
      },
    ];
  }
  // 5. WEB APPLICATION: COLLEGE CLUB WEBSITE
  else if (isClubWebsite || primaryDomain === "Web App") {
    domain = "Web App";
    title = "College Club Events & Registration Website";
    goal = "Design and build a responsive website for the college club where students can browse upcoming events, RSVP/register, view past galleries, and club admins can manage submissions.";
    requirements = [
      "Responsive user interface for mobile and desktop browsing",
      "Interactive event listing with date filters, tags, and detail view",
      "Student registration / RSVP form with validation and confirmation emails",
      "Admin dashboard for event creation, editing, and attendee export",
      "Database schema for events, user profiles, and RSVP records",
      "Fast cloud hosting, secure authentication, and domain configuration",
    ];
    workflowStages = [
      "Discovery & Wireframing",
      "Frontend UI Development",
      "Backend & Database Setup",
      "Testing & Quality Assurance",
      "Deployment & Club Handover",
    ];

    roles = [
      makeRole("role-ui", "UI/UX Designer", ["Figma", "Wireframing", "Responsive Design"], "Designs intuitive layouts, event cards, and mobile-friendly registration flows.", "Creative"),
      makeRole("role-fe", "Frontend Web Developer", ["React / Next.js", "TypeScript", "Tailwind CSS"], "Implements dynamic client views, event filters, and responsive components.", "Technical"),
      makeRole("role-be", "Backend Developer", ["Node.js / Supabase", "PostgreSQL", "REST APIs"], "Builds event management APIs, database tables, and registration handlers.", "Technical"),
      makeRole("role-qa", "QA Tester", ["Cross-browser Testing", "Form Validation", "Bug Reporting"], "Validates responsive behavior, registration edge cases, and loading speed.", "Technical", false),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";

    phases = [
      {
        id: p1,
        name: "Discovery, Information Architecture & UI Design",
        description: "Define club feature requirements, map user journeys, and create Figma wireframes and high-fidelity UI mockups.",
        purpose: "Establish visual identity and approved user experience.",
        sourceReason: "Clear UI designs prevent rework during frontend coding.",
        order: 1,
        workstreams: ["UI/UX Design"],
        tasks: [
          makeTask(p1, "Figma UI/UX Mockups & Event Flow", "Design homepage, event list, RSVP modal, and admin portal.", "UI/UX Designer", ["Figma", "Wireframing"], "high", "4 days", 1),
        ],
      },
      {
        id: p2,
        name: "Frontend Components & Backend Database Build",
        description: "Develop interactive React/Next.js pages, configure Supabase database, and integrate registration endpoints.",
        purpose: "Construct core interactive platform.",
        sourceReason: "Connects user interface to real event database.",
        order: 2,
        workstreams: ["Frontend Development", "Database Engineering"],
        tasks: [
          makeTask(p2, "Build Frontend Event & Registration Pages", "Implement responsive event listing, search, and RSVP forms in React.", "Frontend Web Developer", ["React / Next.js"], "high", "6 days", 1),
          makeTask(p2, "Setup Database & Registration API", "Create Supabase tables for events, RSVPs, and authentication.", "Backend Developer", ["Node.js / Supabase"], "high", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "Testing, Deployment & Club Handover",
        description: "Conduct mobile responsiveness and form testing, deploy to Vercel, and onboard club coordinators.",
        purpose: "Ensure stable live launch.",
        sourceReason: "Prepares system for real student traffic.",
        order: 3,
        workstreams: ["Deployment & Handover"],
        tasks: [
          makeTask(p3, "End-to-End Registration Testing & Deployment", "Verify form submissions, mobile layout, and deploy to custom domain.", "Frontend Web Developer", ["Cross-browser Testing"], "high", "2 days", 1),
        ],
      },
    ];
  }
  // 6. DEFAULT / DYNAMIC DOMAIN-ADAPTIVE DECOMPOSITION
  else {
    domain = primaryDomain || "Custom Project";
    title = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;
    goal = `Deliver a structured plan to execute "${prompt}" efficiently.`;
    requirements = [
      "Requirements gathering and project scope specification",
      "Core execution and deliverable development",
      "Quality review and feedback integration",
      "Final delivery and launch handoff",
    ];
    workflowStages = [
      "Discovery & Planning",
      "Development & Production",
      "Review & Quality Assurance",
      "Final Delivery & Launch",
    ];

    roles = [
      makeRole("role-lead", "Project Lead", ["Project Management", "Coordination"], "Guides project milestones and team alignment.", "Business"),
      makeRole("role-spec", "Domain Specialist", ["Domain Expertise", "Execution"], "Executes core domain work items.", "Creative"),
    ];

    const p1 = "phase-1";
    const p2 = "phase-2";

    phases = [
      {
        id: p1,
        name: "Discovery & Planning",
        description: "Clarify project objectives, allocate resources, and outline deliverables.",
        purpose: "Establish clear project boundaries.",
        sourceReason: "Essential for starting any organized workstream.",
        order: 1,
        workstreams: ["Discovery"],
        tasks: [
          makeTask(p1, "Scope & Requirement Finalization", "Document goals, timeline, and deliverables.", "Project Lead", ["Project Management"], "high", "2 days", 1),
        ],
      },
      {
        id: p2,
        name: "Execution & Delivery",
        description: "Implement planned deliverables and review final output.",
        purpose: "Produce core results.",
        sourceReason: "Achieves user project outcome.",
        order: 2,
        workstreams: ["Core Delivery"],
        tasks: [
          makeTask(p2, "Execute Primary Project Deliverables", "Complete agreed work packages.", "Domain Specialist", ["Domain Expertise"], "high", "5 days", 1),
        ],
      },
    ];
  }

  // Generate workstreams
  const workstreams: ParallelWorkstream[] = phases.map((p, idx) => ({
    id: `ws-${idx + 1}`,
    phaseName: p.name,
    streamName: p.name,
    taskIds: p.tasks.map((t) => t.id),
    simultaneousWith: [],
    efficiencyNote: "Structured milestone delivery stream",
  }));

  // Generate deliverables
  deliverables = phases.map((p, idx) => ({
    id: `del-${idx + 1}`,
    title: `Stage ${idx + 1} Deliverable Package: ${p.name}`,
    description: `Complete deliverables for ${p.name}`,
    isKey: idx === phases.length - 1,
    completed: false,
  }));

  const project: OmniForgeProject = {
    id: genId("proj"),
    ownerId: creatorId,
    title,
    description,
    domain,
    goal,
    userType,
    stage: "planning",
    targetAudience: "Target audience / Community",
    expectedFinalOutcome: goal,
    complexity: "Moderate",
    estimatedTotalDuration: "4 to 6 Weeks",
    requirements,
    workflowStages,
    phases,
    roles,
    recommendations: [],
    parallelWorkstreams: workstreams,
    deliverables,
    coverage: {
      totalRequired: roles.length,
      totalCovered: 0,
      percentage: 0,
      coveredCapabilities: [],
      missingCapabilities: roles.map((r) => ({
        roleId: r.id,
        roleName: r.roleName,
        category: r.category || "Creative",
        requiredSkills: r.requiredSkills,
        reason: r.description,
        suggestedActions: [
          { type: "skill_swap", label: "Skill Swap", description: `Trade skills for ${r.roleName}` },
        ],
      })),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return project;
}

export function modifyBlueprintFromInstruction(
  project: OmniForgeProject,
  instruction: string
): { updatedProject: OmniForgeProject; replyMessage: string } {
  const lower = instruction.toLowerCase();
  const updated = JSON.parse(JSON.stringify(project)) as OmniForgeProject;
  let replyMessage = "";

  // 1. Student short film / 5-minute scope reduction
  if (lower.includes("5-minute") || lower.includes("5 minute") || lower.includes("short film") || lower.includes("student budget") || lower.includes("student short")) {
    updated.title = updated.title.replace(/Short Film.*$/i, "").trim() + " (5-Min Student Short)";
    // Reduce roles to essentials
    updated.roles = updated.roles.filter(
      (r) =>
        r.roleName.includes("Director") ||
        r.roleName.includes("Screenwriter") ||
        r.roleName.includes("Cinematographer") ||
        r.roleName.includes("Actor") ||
        r.roleName.includes("Editor")
    );
    // Adjust phases timeline
    updated.phases.forEach((p) => {
      p.tasks.forEach((t) => {
        if (t.estimatedDuration.includes("days")) {
          const days = parseInt(t.estimatedDuration, 10);
          if (days > 2) t.estimatedDuration = `${Math.max(1, Math.floor(days / 2))} days`;
        }
      });
    });
    replyMessage = `✓ **Scope Adjusted for 5-Minute Student Short Film:**\n• Trimmed crew to essential core roles (Director, Screenwriter, Cinematographer, Lead Actor, Editor).\n• Reduced production timeline and streamlined task estimates.\n• Lowered production overhead for student budget.`;
  }
  // 2. Budget constraints / student budget
  else if (lower.includes("budget") || lower.includes("small budget") || lower.includes("cheap")) {
    replyMessage = `✓ **Budget Optimization Strategy Applied:**\n1. **Combine Roles:** Have the Director handle Screenwriting, or have the Editor handle basic sound cleanup.\n2. **Skill Swap:** Offer complementary creative skills on OmniCraft Skill Swap instead of direct cash outlay.\n3. **Practical Locations:** Limit filming locations to free/accessible student venues.`;
  }
  // 3. Remove music person / exclude specific role
  else if (lower.includes("don't include another music") || lower.includes("already have someone handling the music") || lower.includes("no music person") || lower.includes("dont include another music person")) {
    updated.roles = updated.roles.filter((r) => !r.roleName.toLowerCase().includes("music"));
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes("music"));
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("music")
    );
    replyMessage = `✓ Removed Music role from required searches. I will only find creators for the remaining roles (Director, Cinematographer, Lead Actor, Editor).`;
  }
  // 4. General modification
  else {
    replyMessage = `✓ Project plan updated based on your instruction: "${instruction}".`;
  }

  updated.updatedAt = new Date().toISOString();
  return { updatedProject: updated, replyMessage };
}
