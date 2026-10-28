import {
  OmniForgeProject,
  ProjectPhase,
  ProjectRole,
  ParallelWorkstream,
  ProjectDeliverable,
  ProjectDomain,
  ProjectTask,
  StructuredRequirements,
  DerivedCapability,
  DerivedRole,
  CapabilityLevel,
} from "./types";
import { detectProjectDomain } from "./engine";

// Helper to generate unique IDs
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * 1. REQUIREMENT EXTRACTION ENGINE
 *
 * Extracts structured requirements:
 * {
 *   projectGoal,
 *   domain,
 *   targetUsers,
 *   problem,
 *   coreFeatures,
 *   technicalRequirements,
 *   domainRequirements,
 *   deploymentRequirements,
 *   operationalRequirements,
 *   constraints,
 *   expectedDeliverables
 * }
 *
 * And derives capabilities classified as:
 * REQUIRED, LIKELY, OPTIONAL
 */
export function extractStructuredRequirements(
  prompt: string,
  context?: {
    domain?: ProjectDomain;
    currentUserRole?: string;
  }
): {
  requirements: StructuredRequirements;
  capabilities: DerivedCapability[];
} {
  const lower = prompt.toLowerCase();
  const domainInfo = detectProjectDomain(prompt);
  let domain: ProjectDomain = context?.domain || domainInfo.primary;

  // Domain signals
  const isCropDiseaseOrAgriAI =
    (lower.includes("crop") || lower.includes("plant") || lower.includes("leaf") || lower.includes("farmer") || lower.includes("farm") || lower.includes("agri")) &&
    (lower.includes("disease") || lower.includes("photo") || lower.includes("detect") || lower.includes("leaf photos") || lower.includes("vision") || lower.includes("ai"));

  const isFoodDelivery =
    (lower.includes("food delivery") || lower.includes("food-delivery") || lower.includes("restaurant") || (lower.includes("food") && lower.includes("delivery"))) ||
    ((lower.includes("delivery") || lower.includes("courier") || lower.includes("order food")) && (lower.includes("app") || lower.includes("platform")));

  const isFilmOrMovie =
    (lower.includes("short film") || lower.includes("film") || lower.includes("movie") || lower.includes("cinema") || lower.includes("documentary")) &&
    !isCropDiseaseOrAgriAI &&
    !lower.includes("festival");

  const isCybersecurity =
    lower.includes("cybersecurity") ||
    lower.includes("cyber security") ||
    lower.includes("infosec") ||
    lower.includes("threat detection") ||
    lower.includes("penetration test") ||
    lower.includes("vulnerability") ||
    lower.includes("siem") ||
    lower.includes("soc ") ||
    lower.includes("firewall") ||
    lower.includes("zero-day");

  const isCollegeFestival =
    (lower.includes("festival") || lower.includes("fest") || lower.includes("cultural") || lower.includes("college cultural festival")) &&
    !lower.includes("film festival") &&
    !lower.includes("ai-powered");

  const isMusicBand =
    (lower.includes("music band") ||
     lower.includes("music team") ||
     lower.includes("music squad") ||
     lower.includes("musicians for my band") ||
     lower.includes("musicians for band") ||
     lower.includes("form a squad for music band") ||
     lower.includes("form a music band") ||
     lower.includes("create a band") ||
     lower.includes("build a music band") ||
     lower.includes("build my complete music band") ||
     lower.includes("build the music squad") ||
     lower.includes("talent musician creators") ||
     lower.includes("creators related to music") ||
     lower.includes("musician creators") ||
     lower.includes("find all music creators") ||
     lower.includes("find musicians") ||
     lower.includes("search musicians") ||
     (lower.includes("band") && (lower.includes("singer") || lower.includes("guitar") || lower.includes("drum") || lower.includes("piano") || lower.includes("bass") || lower.includes("squad") || lower.includes("musician")))) &&
    !isFilmOrMovie;

  // Determine primary domain override if semantic signals are unambiguous
  if (isCropDiseaseOrAgriAI) {
    domain = "AI / ML";
  } else if (isFoodDelivery) {
    domain = "Software";
  } else if (isFilmOrMovie) {
    domain = "Film";
  } else if (isCybersecurity) {
    domain = "Cybersecurity";
  } else if (isCollegeFestival) {
    domain = "Events";
  } else if (isMusicBand) {
    domain = "Music";
  }

  let projectGoal = prompt.trim();
  let targetUsers = "Target End Users";
  let problem = "Addressing user needs with specialized technical and domain execution.";
  let coreFeatures: string[] = [];
  let technicalRequirements: string[] = [];
  let domainRequirements: string[] = [];
  let deploymentRequirements: string[] = [];
  let operationalRequirements: string[] = [];
  let constraints: string[] = [];
  let expectedDeliverables: string[] = [];
  const capabilities: DerivedCapability[] = [];

  // ==========================================
  // ARTIFACT 1: CROP DISEASE & AGRI AI VISION
  // ==========================================
  if (isCropDiseaseOrAgriAI) {
    projectGoal = "AI-powered crop disease detection and real-time diagnosis from leaf photos for farmers.";
    targetUsers = "Farmers, agricultural field workers, agronomy consultants, and extension officers.";
    problem = "Lack of immediate, accessible leaf-level plant pathology diagnostic tools leading to delayed disease treatment, harvest loss, and overuse of ineffective chemicals.";

    coreFeatures = [
      "High-accuracy leaf image capture and real-time disease classification",
      "Actionable agronomic treatment recommendations and severity scoring",
      "Offline inference and local cache for low-connectivity rural farmlands",
      "Multilingual UI localized for regional farming dialects",
      "Historical crop field health logs and disease outbreak telemetry",
    ];

    technicalRequirements = [
      "Deep learning computer vision model (e.g. CNN / Vision Transformer) trained on multi-crop leaf pathologies",
      "Standardized image preprocessing (color calibration, perspective correction, background subtraction)",
      "Low-latency model serving API with GPU-accelerated inference container",
      "Lightweight mobile on-device quantization (TFLite / ONNX) for edge diagnosis",
    ];

    domainRequirements = [
      "Agronomic crop pathology taxonomy and symptom validation by crop specialists",
      "Verification of botanical ground-truth labels across varied cultivars and growth stages",
      "Agronomically sound, pesticide-regulated remediation guidelines",
    ];

    deploymentRequirements = [
      "Mobile application (Android APK & Progressive Web App) optimized for low-end smartphone cameras",
      "Cloud containerized model inference serving with automatic scale-to-zero",
    ];

    operationalRequirements = [
      "Farmer usability field testing under direct sunlight and outdoor field conditions",
      "Low-bandwidth data synchronization and image upload queueing",
      "Model drift monitoring and continuous learning pipeline from verified field reports",
    ];

    constraints = [
      "Variable field lighting, shadow occlusion, and varying smartphone camera sensor resolutions",
      "Intermittent or zero cellular connectivity in rural farming zones",
      "Need for simple, high-contrast, low-text user interfaces for diverse farmer demographics",
    ];

    expectedDeliverables = [
      "Production-ready computer vision disease classification model weights and benchmark report",
      "Curated, balanced, and expert-annotated leaf disease image dataset",
      "Farmer mobile diagnostic application with camera guidance and offline mode",
      "Cloud backend API for model inference, user logs, and telemetry",
      "Field validation assessment with pilot farming communities",
    ];

    // Capabilities (REQUIRED, LIKELY, OPTIONAL)
    capabilities.push(
      {
        id: "cap-cv",
        name: "Computer Vision / Image Classification",
        description: "Architecting, training, and benchmarking deep learning vision models for leaf disease detection.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Core engine for automated disease diagnosis from photos.",
      },
      {
        id: "cap-agri",
        name: "Agriculture / Crop Disease Knowledge",
        description: "Providing domain expertise on plant pathology, leaf symptom stages, and treatment validation.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Ensures diagnostic accuracy, ground truth credibility, and actionable agronomic remedies.",
      },
      {
        id: "cap-data",
        name: "Dataset Preparation & Image Preprocessing",
        description: "Collecting, augmenting, filtering, and balancing leaf photo datasets across cultivars and lighting conditions.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Vision model accuracy heavily depends on high-quality, balanced pathology datasets.",
      },
      {
        id: "cap-backend",
        name: "Backend API & Model Serving",
        description: "Building scalable REST/gRPC endpoints for model inference, image ingest, and user history.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Connects client mobile devices to model compute and syncs diagnostic history.",
      },
      {
        id: "cap-mobile",
        name: "Mobile / Frontend Interface",
        description: "Designing and building intuitive, responsive camera capture screens and diagnosis cards.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Farmers interact with the tool directly through mobile devices in the field.",
      },
      {
        id: "cap-mlops",
        name: "MLOps & Model Deployment",
        description: "Packaging models for edge/cloud deployment, tracking inference latency, and monitoring model drift.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Maintains high uptime, fast inference speed, and continuous model reliability.",
      },
      {
        id: "cap-field",
        name: "Farmer Usability & Field Validation",
        description: "Conducting real-world pilot tests in rural fields and measuring user comprehension and diagnostic utility.",
        type: "field",
        level: "OPTIONAL",
        whyRequired: "Validates real-world farmer usability, lighting resilience, and rural adoption.",
      },
      {
        id: "cap-ux",
        name: "Low-Literacy & Accessibility UI/UX Design",
        description: "Creating visual-first iconography, audio prompts, and color-coded indicators for non-technical users.",
        type: "technical",
        level: "OPTIONAL",
        whyRequired: "Ensures the application is usable by farmers of varying digital literacy.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 2: FOOD DELIVERY APPLICATION
  // ==========================================
  else if (isFoodDelivery) {
    projectGoal = "End-to-end on-demand food delivery platform connecting customers, restaurants, and couriers.";
    targetUsers = "Hungry consumers, restaurant kitchen managers, and on-demand delivery couriers.";
    problem = "Coordinating real-time order dispatch, dynamic kitchen prep times, and live GPS courier routing efficiently.";

    coreFeatures = [
      "Customer discovery, restaurant menu browsing, search, and instant checkout",
      "Real-time order lifecycle tracking (received, preparing, out for delivery, delivered)",
      "Merchant dashboard for real-time kitchen order management and menu availability",
      "Courier mobile application with live GPS navigation, earnings, and order dispatch",
      "Integrated multi-method digital payments, automated rider tips, and commission split",
    ];

    technicalRequirements = [
      "High-throughput transactional backend with WebSocket-based real-time event streaming",
      "Geospatial query engine (e.g. PostGIS) for courier proximity dispatch and geofenced ETA calculation",
      "Cross-platform responsive mobile applications (iOS / Android)",
      "PCI-compliant payment processing gateway with automated escrow and payout distribution",
    ];

    domainRequirements = [
      "Restaurant food safety guidelines, menu allergen disclosures, and kitchen operational timings",
      "Courier labor compliance, route safety, and peak delivery surge algorithms",
    ];

    deploymentRequirements = [
      "Microservices backend deployed on Kubernetes or serverless container cloud",
      "App Store & Google Play distribution for customer and courier apps",
    ];

    operationalRequirements = [
      "Merchant onboarding workflow with menu photography and tablet hardware setup",
      "Courier verification, background checks, and delivery bag onboarding",
      "Customer support ticketing and refund resolution dashboard",
    ];

    constraints = [
      "High concurrent traffic spikes during meal lunch/dinner peak hours",
      "Real-time GPS battery drain and network dropouts in dense urban corridors",
    ];

    expectedDeliverables = [
      "Scalable Food Delivery Backend & Real-Time Dispatch Engine",
      "Customer Mobile Application (iOS & Android)",
      "Courier Mobile Application with Live GPS Routing",
      "Restaurant Merchant Portal & Kitchen Order Display",
      "Payment Gateway & Financial Settlement Pipeline",
    ];

    capabilities.push(
      {
        id: "cap-fd-backend",
        name: "Order Processing & Dispatch Backend",
        description: "Architecting high-concurrency order pipeline, courier matching algorithms, and payment hooks.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Core transaction engine powering orders, dispatches, and state transitions.",
      },
      {
        id: "cap-fd-domain",
        name: "Restaurant & Merchant Operations",
        description: "Structuring restaurant menu schemas, kitchen prep workflows, and merchant commercial terms.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Ensures seamless integration with kitchen workflows and menu management.",
      },
      {
        id: "cap-fd-mobile",
        name: "Customer & Courier Mobile Engineering",
        description: "Developing cross-platform mobile apps with map integrations, push alerts, and checkout flows.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Primary touchpoints for customer ordering and courier navigation.",
      },
      {
        id: "cap-fd-geo",
        name: "Geospatial Routing & Tracking",
        description: "Implementing real-time location streaming, geofencing, and optimal travel time calculations.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Provides live tracking accuracy and reliable customer delivery ETAs.",
      },
      {
        id: "cap-fd-pay",
        name: "Payment Gateway & Settlement",
        description: "Integrating multi-provider checkout, wallet payments, tip splits, and automated bank deposits.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Ensures secure, compliant checkout and timely restaurant/courier compensation.",
      },
      {
        id: "cap-fd-qa",
        name: "QA & Real-Time Systems Reliability",
        description: "Executing stress testing on order queues, failover verification, and network latency resilience.",
        type: "operational",
        level: "LIKELY",
        whyRequired: "Guarantees zero dropped orders during high-volume dinner rushes.",
      },
      {
        id: "cap-fd-ux",
        name: "Consumer & Merchant UX Design",
        description: "Designing frictionless checkout funnel, accessible kitchen display typography, and dark mode maps.",
        type: "technical",
        level: "OPTIONAL",
        whyRequired: "Elevates user conversion and reduces courier distraction while on the road.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 3: SHORT FILM PRODUCTION
  // ==========================================
  else if (isFilmOrMovie) {
    projectGoal = "Produce a compelling, festival-quality cinematic short film with professional visual storytelling.";
    targetUsers = "Film festival juries, cinema audiences, and digital streaming viewers.";
    problem = "Translating dramatic premise and emotional tension into professional visual cinematography and sound.";

    coreFeatures = [
      "Locked shooting screenplay with structured scene beats and character dialogue",
      "Cinematic principal photography with high-end camera packages and lighting design",
      "Authentic dramatic performances from cast members",
      "Precision post-production picture editing, color grading, and dialogue mastering",
      "Custom atmospheric sound design and emotional musical score",
    ];

    technicalRequirements = [
      "Cinema camera recording in RAW / ProRes color space with prime lenses",
      "Multi-channel location audio capture with directional boom and lavalier microphones",
      "Non-linear post-production editorial (DaVinci Resolve / Premiere Pro) with color management",
      "DCI-compliant 4K digital cinema master packaging (DCP)",
    ];

    domainRequirements = [
      "Cinematic narrative pacing, actor blocking, and emotional arc direction",
      "Location scouting, permits, call sheet schedules, and union/talent agreements",
    ];

    deploymentRequirements = [
      "High-bitrate ProRes master for festival submission platforms (FilmFreeway)",
      "Streaming-ready H.264/H.265 web deliverables with multilingual subtitle tracks",
    ];

    operationalRequirements = [
      "Production schedule adherence within planned shoot days and location rental windows",
      "Safe on-set production protocols and equipment logistics",
    ];

    constraints = [
      "Fixed shooting days schedule and location permit curfews",
      "Ambient location sound interference and changing natural sunlight conditions",
    ];

    expectedDeliverables = [
      "Final Locked Shooting Script & Storyboards",
      "Raw Production Footage & Synced Audio Stems",
      "Completed Rough Cut & Final Picture Lock",
      "Color Graded & Sound Mastered Festival DCP / Video File",
      "Press Kit, Promotional Stills & Festival Submissions",
    ];

    capabilities.push(
      {
        id: "cap-film-dir",
        name: "Cinematic Directing & Creative Vision",
        description: "Guiding dramatic performance, visual framing, artistic tone, and narrative pacing.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Ensures unified creative leadership and emotional resonance on screen.",
      },
      {
        id: "cap-film-cine",
        name: "Cinematography & Camera Direction",
        description: "Executing camera movement, lighting setups, shot composition, and visual atmosphere.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Translates script ideas into evocative, cinema-grade visual images.",
      },
      {
        id: "cap-film-act",
        name: "Dramatic Acting & Cast Performances",
        description: "Portraying primary characters with emotional depth and authentic on-camera dialogue.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Core emotional vehicle connecting viewers to the story.",
      },
      {
        id: "cap-film-edit",
        name: "Picture Editing & Pacing",
        description: "Assembling scenes, shaping dramatic rhythm, cutting dialogue, and locking final cut.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Structures scene continuity, dramatic tension, and overall narrative pacing.",
      },
      {
        id: "cap-film-snd",
        name: "Location Audio & Sound Design",
        description: "Capturing clean location dialogue, Foley effects, ambient soundscapes, and audio mix.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "High-quality audio is 50% of the cinematic immersion.",
      },
      {
        id: "cap-film-color",
        name: "Color Grading & Digital Mastering",
        description: "Crafting final cinematic color palettes, skin-tone harmony, and festival export exports.",
        type: "technical",
        level: "OPTIONAL",
        whyRequired: "Gives the project a polished, theatrical visual finish.",
      },
      {
        id: "cap-film-prod",
        name: "Production Management & Logistics",
        description: "Coordinating call sheets, location rentals, craft services, and crew schedule.",
        type: "operational",
        level: "OPTIONAL",
        whyRequired: "Keeps physical shoot days on schedule and within budget.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 4: CYBERSECURITY PLATFORM
  // ==========================================
  else if (isCybersecurity) {
    projectGoal = "Enterprise cybersecurity platform for continuous threat detection, vulnerability scanning, and incident response.";
    targetUsers = "Security operations center (SOC) analysts, CISOs, DevSecOps engineers, and sysadmins.";
    problem = "Proliferating attack vectors and delayed threat detection across hybrid cloud infrastructures leading to security breaches.";

    coreFeatures = [
      "Continuous network telemetry ingestion and real-time endpoint log correlation",
      "Automated threat detection engine with anomaly recognition and signature rules",
      "Vulnerability assessment scanner and automated CVE patch priority ranking",
      "Centralized incident response dashboard with alert triage and playbook automation",
      "Compliance audit reporting and immutable forensic event logging",
    ];

    technicalRequirements = [
      "Distributed telemetry ingestion pipeline (Kafka / Vector) capable of handling millions of EPS",
      "Rule correlation engine supporting Sigma rules, MITRE ATT&CK mapping, and behavioral ML",
      "Zero-trust API architecture with strict RBAC, mTLS, and end-to-end encryption",
      "Real-time event streaming and analytical time-series database (e.g. ClickHouse / Elastic)",
    ];

    domainRequirements = [
      "MITRE ATT&CK framework taxonomy alignment and adversary tactic modeling",
      "Regulatory compliance standards (SOC 2, ISO 27001, GDPR, HIPAA) telemetry mapping",
    ];

    deploymentRequirements = [
      "Hardened cloud infrastructure with immutable infrastructure-as-code deployments",
      "Multi-tenant data isolation with tenant-specific encryption keys (KMS)",
    ];

    operationalRequirements = [
      "Red team penetration testing and automated attack simulation benchmarks",
      "24/7 security alert escalation workflows and automated webhook triggers",
    ];

    constraints = [
      "Near-zero false positive tolerance to avoid SOC analyst alert fatigue",
      "Strict data privacy regulations governing sensitive customer network payload storage",
    ];

    expectedDeliverables = [
      "Core Threat Detection Engine & Correlation Rule Set",
      "High-Throughput Security Telemetry Ingestion Pipeline",
      "SOC Analyst Incident Response Dashboard & Alert Feed",
      "Automated Vulnerability Scanner & Remediation Playbooks",
      "Security Hardening & Penetration Testing Audit Report",
    ];

    capabilities.push(
      {
        id: "cap-sec-eng",
        name: "Cybersecurity & Threat Detection Engineering",
        description: "Designing detection heuristics, Sigma rules, MITRE ATT&CK mapping, and malware telemetry.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Core capability for detecting malicious network activity and intrusion attempts.",
      },
      {
        id: "cap-sec-domain",
        name: "Infosec & Threat Modeling",
        description: "Structuring security architecture, adversary models, zero-trust policies, and attack vectors.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Ensures detection rules accurately reflect realistic adversary techniques.",
      },
      {
        id: "cap-sec-data",
        name: "Distributed Pipeline & Telemetry Backend",
        description: "Building resilient log ingestion, distributed stream processing, and time-series querying.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Enables real-time analysis of high-volume network events without packet drops.",
      },
      {
        id: "cap-sec-dash",
        name: "Security Dashboard & Frontend Architecture",
        description: "Creating high-density SOC triage views, attack graph visualizations, and alert timelines.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Analysts require clear, rapid visualization to investigate and resolve threats.",
      },
      {
        id: "cap-sec-devops",
        name: "Cloud Security & DevSecOps",
        description: "Hardening cloud infrastructure, automated container scanning, and CI/CD security gating.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Maintains platform defense and prevents exploitation of the security platform itself.",
      },
      {
        id: "cap-sec-pen",
        name: "Penetration Testing & Red Teaming",
        description: "Executing simulated adversary attacks to validate detection triggers and platform resilience.",
        type: "domain",
        level: "OPTIONAL",
        whyRequired: "Validates detection efficacy against actual offensive exploitation tools.",
      },
      {
        id: "cap-sec-comp",
        name: "Compliance & Governance Telemetry",
        description: "Mapping alerts to SOC 2, HIPAA, and ISO audit requirements and generating executive reports.",
        type: "operational",
        level: "OPTIONAL",
        whyRequired: "Enables enterprise clients to satisfy regulatory oversight effortlessly.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 5: COLLEGE CULTURAL FESTIVAL
  // ==========================================
  else if (isCollegeFestival) {
    projectGoal = "Organize, program, and execute a high-energy multi-day college cultural festival.";
    targetUsers = "College students, campus faculty, visiting inter-college participants, and corporate sponsors.";
    problem = "Coordinating multi-stage live entertainment, celebrity artist logistics, and campus crowd operations seamlessly.";

    coreFeatures = [
      "Curated multi-stage performance schedule (music concerts, dance battles, drama, fashion show)",
      "Celebrity headline artist and guest performer booking and hospitality riders",
      "Professional stage lighting truss, LED walls, and acoustic sound reinforcement",
      "Campus digital ticketing, QR entry access control, and volunteer team deployment",
      "Corporate brand sponsorships, student bazaar stalls, and promotional outreach",
    ];

    technicalRequirements = [
      "Concert-grade live sound system (line arrays, digital audio mixers, monitor wedges)",
      "DMX lighting control, moving heads, stage strobes, and safety-certified power distribution",
      "Event registration and QR gate scanning mobile web portal",
    ];

    domainRequirements = [
      "Artist liaison, rider specifications, green room management, and stage timekeeping",
      "University administration approvals, campus safety guidelines, and emergency medical protocols",
    ];

    deploymentRequirements = [
      "Live venue physical layout, barricades, backstage credentials, and fire safety compliance",
      "Campus WiFi and cellular signal reinforcement for attendee communication",
    ];

    operationalRequirements = [
      "Student volunteer committee assignments across hospitality, security, and stage management",
      "Corporate sponsor stall setup, banner placement, and proof-of-execution reporting",
    ];

    constraints = [
      "Fixed festival calendar dates, strict campus decibel curfews, and university budget boundaries",
      "Heavy physical footfall and crowd safety management during evening headline concerts",
    ];

    expectedDeliverables = [
      "Master Festival Production Schedule & Multi-Stage Lineup",
      "Corporate Sponsorship Deck & Brand Activation Agreements",
      "Professional Stage, Sound & Lighting Technical Setup",
      "Campus-Wide Ticketing, Registration & Access System",
      "Live Event Execution & Post-Festival Recap Video",
    ];

    capabilities.push(
      {
        id: "cap-fest-coord",
        name: "Live Event Planning & Production Management",
        description: "Master festival timeline coordination, committee leadership, and administrative liaison.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Ensures synchronized execution across university departments, sponsors, and vendors.",
      },
      {
        id: "cap-fest-snd",
        name: "Live Audio Engineering & Acoustic Mixing",
        description: "Operating concert line-array sound systems, stage monitoring, and soundchecks.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "High-quality acoustics are critical for live concert satisfaction.",
      },
      {
        id: "cap-fest-light",
        name: "Stage Lighting & Visual Technical Operations",
        description: "Programming DMX lighting cues, moving head fixtures, LED video walls, and power safety.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Creates professional visual stage ambiance and concert energy.",
      },
      {
        id: "cap-fest-spon",
        name: "Sponsorship & Business Development",
        description: "Pitching corporate sponsors, securing brand funding, and fulfilling brand deliverables.",
        type: "operational",
        level: "LIKELY",
        whyRequired: "Funds festival operations, staging, and celebrity artist acquisition.",
      },
      {
        id: "cap-fest-art",
        name: "Artist Liaison & Hospitality",
        description: "Managing artist hospitality riders, backstage coordination, travel, and stage scheduling.",
        type: "domain",
        level: "LIKELY",
        whyRequired: "Guarantees headline performers arrive on schedule and have optimal stage support.",
      },
      {
        id: "cap-fest-pr",
        name: "Campus Marketing & Social Media PR",
        description: "Promoting ticket sales, social hype campaigns, campus posters, and aftermovie coverage.",
        type: "operational",
        level: "OPTIONAL",
        whyRequired: "Drives maximum student turnout and campus participation.",
      },
      {
        id: "cap-fest-safe",
        name: "Crowd Safety & Access Control",
        description: "Managing entry gates, QR ticket validation, security barricades, and medical standby.",
        type: "operational",
        level: "OPTIONAL",
        whyRequired: "Protects student safety during peak concert hours.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 6: MUSIC BAND SQUAD
  // ==========================================
  else if (isMusicBand) {
    projectGoal = "Form, record, rehearse, and launch a complete collaborative music band with specialized musicians.";
    targetUsers = "Music fans, live venue audiences, streaming listeners, and festival organizers.";
    problem = "Assembling complementary musical creators across vocal, rhythm, lead, and production roles with synchronized repertoire and sound engineering.";

    coreFeatures = [
      "Core band lineup definition (lead vocals, rhythm section, lead melodic instruments, keys)",
      "Original song catalog, chord progressions, lyrics, and rehearsal arrangement",
      "Studio tracking, multi-channel instrument recording, and stem mixing",
      "Live stage performance setlist, soundcheck engineering, and gig bookings",
      "Digital single/album distribution, press kit, and band promotional launch",
    ];

    technicalRequirements = [
      "Multi-track DAW digital audio workstation environment (Pro Tools / Logic Pro / Ableton)",
      "Low-noise microphone setups for live drum kit, guitar amplifiers, and studio vocal tracking",
      "High-fidelity audio mixing, dynamic equalization, compression, and stereo mastering",
    ];

    domainRequirements = [
      "Musical harmony, key transposition, tempo timing, and rhythmic sync between musicians",
      "Song structure arrangement (intro, verse, chorus, bridge, solo, outro)",
      "Stage plot, acoustic monitoring, and live instrument soundcheck balancing",
    ];

    deploymentRequirements = [
      "Lossless master audio stems (24-bit/48kHz WAV) for streaming platform distribution",
      "Band electronic press kit (EPK), high-res promo imagery, and stage rider technical document",
    ];

    operationalRequirements = [
      "Weekly band rehearsal schedules and jam session recordings",
      "Live venue booking coordination, gig contracts, and artist revenue splits",
    ];

    constraints = [
      "Rehearsal space availability, acoustic isolation, and instrument backline transport",
      "Coordinating multi-artist creative schedules and live performance timing",
    ];

    expectedDeliverables = [
      "Band Lineup & Core Instrumental Roster",
      "Original Repertoire & Song Arrangement Chord Sheets",
      "Multi-Track Studio Recordings & Mixed Audio Stems",
      "Mastered Commercial Tracks & Streaming Release Package",
      "Live Performance Setlist, Stage Plot & Technical Rider",
    ];

    const mentionsPiano = lower.includes("piano") || lower.includes("keyboard") || lower.includes("keys");

    capabilities.push(
      {
        id: "cap-music-voc",
        name: "Vocal Performance & Lead Melody",
        description: "Delivering lead playback vocals, harmonies, vocal phrasing, and emotional frontmanship.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Lead vocals provide the central melodic hook and lyrical connection for the band.",
      },
      {
        id: "cap-music-guitar",
        name: "Lead & Acoustic Guitar Arrangement",
        description: "Performing signature riffs, melodic guitar solos, chord textures, and rhythm guitar.",
        type: "domain",
        level: "REQUIRED",
        whyRequired: "Carries melodic themes, harmonic drive, and signature band energy.",
      },
      {
        id: "cap-music-bass",
        name: "Rhythm & Bass Harmony",
        description: "Locking low-end groove, fundamental basslines, and bridge timing with percussion.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Provides essential harmonic foundation and dynamic groove anchoring the band.",
      },
      {
        id: "cap-music-drums",
        name: "Percussion & Rhythm Drive",
        description: "Controlling tempo, rhythmic dynamics, drum kit beats, and fills across song sections.",
        type: "technical",
        level: "REQUIRED",
        whyRequired: "Rhythmic engine maintaining tempo stability and explosive dynamic transitions.",
      },
      {
        id: "cap-music-keys",
        name: "Piano & Keyboard Harmony",
        description: "Arranging synthesizer textures, acoustic piano chords, and melodic fill layers.",
        type: "technical",
        level: mentionsPiano ? "REQUIRED" : "LIKELY",
        whyRequired: "Expands harmonic depth and delivers rich keyboard accompaniments.",
      },
      {
        id: "cap-music-prod",
        name: "Music Production & Track Direction",
        description: "Structuring musical arrangements, supervising recording sessions, and shaping audio aesthetics.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Guides sonic cohesion and balances instrumentation across tracks.",
      },
      {
        id: "cap-music-sound",
        name: "Sound Engineering & Audio Mix",
        description: "Setting up acoustic microphones, managing multi-track recording, EQ, and live sound mixing.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Ensures clean audio fidelity in studio tracking and live gig acoustic reinforcement.",
      },
      {
        id: "cap-music-song",
        name: "Original Songwriting & Composition",
        description: "Writing original lyrical hooks, chord structures, and vocal melody frameworks.",
        type: "domain",
        level: "OPTIONAL",
        whyRequired: "Supplies original creative material distinct from standard cover sets.",
      }
    );
  }

  // ==========================================
  // ARTIFACT 7: GENERAL / ADAPTIVE DOMAIN
  // ==========================================
  else {
    const titleSnippet = prompt.length > 55 ? prompt.substring(0, 52) + "..." : prompt;
    projectGoal = `Execute "${prompt}" through structured technical planning and specialized talent orchestration.`;
    targetUsers = `Intended end users and stakeholders of the ${domain} initiative.`;
    problem = `Executing ${domain.toLowerCase()} milestones requires coordinated multidisciplinary technical and domain competencies.`;

    coreFeatures = [
      `Scope definition and technical requirements specification for ${titleSnippet}`,
      "Core architecture and deliverable execution workstream",
      "Quality assurance, performance evaluation, and user validation",
      "Final production deployment, documentation, and stakeholder launch",
    ];

    technicalRequirements = [
      `Domain-specific technical architecture and tooling for ${domain}`,
      "System integration and automated verification pipelines",
      "Scalable delivery infrastructure and maintainable code/asset structure",
    ];

    domainRequirements = [
      `Industry standards, best practices, and domain compliance for ${domain}`,
      "Target user research and stakeholder alignment criteria",
    ];

    deploymentRequirements = [
      "Staging and production deployment environment configuration",
      "Release pipeline and versioned asset delivery",
    ];

    operationalRequirements = [
      "Milestone review cadences and deliverable verification criteria",
      "Feedback integration and operational handoff protocols",
    ];

    constraints = [
      "Delivery timeline, resource allocation, and quality standards",
    ];

    expectedDeliverables = [
      "Technical Architecture & Requirements Specification Document",
      "Core Production Deliverables & Source Assets",
      "Quality Verification & User Testing Report",
      "Final Production Release & Launch Documentation",
    ];

    capabilities.push(
      {
        id: "cap-gen-tech",
        name: `${domain} Technical Architecture`,
        description: `Architecting and implementing core engineering and technical systems for ${domain}.`,
        type: "technical",
        level: "REQUIRED",
        whyRequired: `Builds the foundational technical deliverables and execution systems.`,
      },
      {
        id: "cap-gen-domain",
        name: `${domain} Specialist Knowledge`,
        description: `Applying industry-specific methodologies, standards, and domain review.`,
        type: "domain",
        level: "REQUIRED",
        whyRequired: `Ensures domain rigor and practical relevance for ${domain} outcomes.`,
      },
      {
        id: "cap-gen-qa",
        name: "Quality Assurance & Systems Testing",
        description: "Validating performance, edge cases, security, and user feedback integration.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Guarantees reliable, defect-free execution across milestones.",
      },
      {
        id: "cap-gen-ui",
        name: "User Interface & Experience Design",
        description: "Designing accessible user journeys, workflows, and visual clarity.",
        type: "technical",
        level: "LIKELY",
        whyRequired: "Optimizes end-user adoption and engagement.",
      },
      {
        id: "cap-gen-ops",
        name: "Deployment & Operations Management",
        description: "Managing rollout schedules, monitoring uptime, and operational handoff.",
        type: "operational",
        level: "OPTIONAL",
        whyRequired: "Maintains operational stability post-delivery.",
      }
    );
  }

  const requirements: StructuredRequirements = {
    projectGoal,
    domain,
    targetUsers,
    problem,
    coreFeatures,
    technicalRequirements,
    domainRequirements,
    deploymentRequirements,
    operationalRequirements,
    constraints,
    expectedDeliverables,
  };

  return { requirements, capabilities };
}

/**
 * 2. ROLE DERIVATION ENGINE
 *
 * Derives roles directly FROM capabilities.
 * Each role has:
 * {
 *   roleName,
 *   capability,
 *   responsibilities,
 *   whyRequired,
 *   requiredOrOptional,
 *   relatedTasks
 * }
 */
export function deriveRolesFromCapabilities(
  capabilities: DerivedCapability[],
  domain: ProjectDomain,
  context?: {
    isUserDirector?: boolean;
    existingProjectTitle?: string;
  }
): DerivedRole[] {
  const derivedRoles: DerivedRole[] = [];

  for (const cap of capabilities) {
    let roleName = "";
    let category: "Technical" | "Creative" | "Business" | "Communication" | "Custom" = "Technical";
    let requiredSkills: string[] = [];
    let responsibilities: string[] = [];
    let relatedTasks: string[] = [];

    // Map each capability to its real professional role
    if (cap.name.includes("Computer Vision") || cap.name.includes("Image Classification")) {
      roleName = "ML / Computer Vision Engineer";
      category = "Technical";
      requiredSkills = ["PyTorch / TensorFlow", "Computer Vision", "CNN / ViT Architectures", "Model Optimization"];
      responsibilities = [
        "Train, fine-tune, and evaluate deep learning vision models on leaf disease datasets",
        "Optimize inference speed and apply quantization for edge/mobile deployment",
        "Benchmark accuracy metrics (mAP, F1-score, confusion matrix) across disease classes",
      ];
      relatedTasks = ["Train & Benchmark Vision Model", "Model Evaluation & Quantization"];
    } else if (cap.name.includes("Crop Disease") || cap.name.includes("Agriculture")) {
      roleName = "Agricultural / Crop Disease Specialist";
      category = "Creative";
      requiredSkills = ["Plant Pathology", "Agronomy", "Crop Diagnostics", "Field Research"];
      responsibilities = [
        "Validate disease taxonomy and ground-truth pathology labels on sample leaf photos",
        "Draft agronomically accurate treatment, pesticide, and remediation protocols",
        "Review visual symptoms across disease progression stages (early vs. advanced)",
      ];
      relatedTasks = ["Validate Ground-Truth Taxonomy", "Draft Agronomic Remediation Guide"];
    } else if (cap.name.includes("Dataset Preparation") || cap.name.includes("Preprocessing")) {
      roleName = "Data / ML Engineer";
      category = "Technical";
      requiredSkills = ["Data Pipeline", "OpenCV", "Data Augmentation", "Python", "Data Cleaning"];
      responsibilities = [
        "Clean, normalize, and label multi-class agricultural image datasets",
        "Apply synthetic augmentations (lighting variations, rotation, blur) to simulate field photos",
        "Balance dataset distribution to prevent classification bias toward common crops",
      ];
      relatedTasks = ["Leaf Dataset Collection & Labeling", "Image Preprocessing Pipeline"];
    } else if (cap.name.includes("Backend API") || cap.name.includes("Model Serving")) {
      roleName = "Backend Engineer";
      category = "Technical";
      requiredSkills = ["Node.js / Python FastAPI", "REST / gRPC APIs", "Docker", "Database Architecture"];
      responsibilities = [
        "Build low-latency API endpoints for model inference and diagnostic reporting",
        "Implement asynchronous image processing queues and user history databases",
        "Ensure security, rate-limiting, and resilient cloud integration",
      ];
      relatedTasks = ["Build Model Serving API", "Database Setup & Auth Integration"];
    } else if (cap.name.includes("Mobile / Frontend") || cap.name.includes("Mobile Engineering")) {
      roleName = "Mobile / Frontend Developer";
      category = "Technical";
      requiredSkills = ["React Native / Flutter / Android", "Camera API Integration", "Offline Caching", "Tailwind CSS"];
      responsibilities = [
        "Implement high-performance mobile camera preview and photo capture interface",
        "Build responsive diagnostic report screens with offline SQLite caching",
        "Optimize bundle size and battery usage for outdoor field use",
      ];
      relatedTasks = ["Build Mobile Camera & Diagnosis UI", "Offline Mode & Local Storage"];
    } else if (cap.name.includes("MLOps") || cap.name.includes("Deployment & Drift")) {
      roleName = "MLOps / Deployment Engineer";
      category = "Technical";
      requiredSkills = ["Docker / Kubernetes", "CI/CD Pipelines", "Model Registry", "Prometheus / Grafana"];
      responsibilities = [
        "Deploy containerized model microservices to cloud GPU infrastructure",
        "Set up telemetry to detect accuracy drift and track inference latency",
        "Automate redeployment workflows as new training data is validated",
      ];
      relatedTasks = ["Containerize & Deploy Inference Engine", "Setup Telemetry & Drift Monitoring"];
    } else if (cap.name.includes("Farmer Usability") || cap.name.includes("Field Validation")) {
      roleName = "Farmer / User Researcher";
      category = "Communication";
      requiredSkills = ["Field Interviews", "Usability Testing", "Agronomic Liaison", "Survey Analysis"];
      responsibilities = [
        "Conduct on-site user testing with farmers across diverse field lighting and phone types",
        "Gather actionable feedback on diagnostic clarity and user interface friction",
        "Evaluate farmer comprehension of disease treatment instructions",
      ];
      relatedTasks = ["Field Pilot Testing with Farmers", "Usability Feedback Report"];
    } else if (cap.name.includes("Accessibility") || cap.name.includes("Low-Literacy") || cap.name.includes("UI/UX Design")) {
      roleName = "UI/UX Designer";
      category = "Creative";
      requiredSkills = ["Figma", "Design Systems", "Accessibility Standards", "Iconography"];
      responsibilities = [
        "Design visual-first workflows emphasizing intuitive iconography over complex text",
        "Ensure high-contrast color palettes visible under direct farm sunlight",
        "Create responsive layouts adaptable across varied screen aspect ratios",
      ];
      relatedTasks = ["Design High-Contrast Farmer UI", "Iconography & Regional Layouts"];
    }
    // Food Delivery Mappings
    else if (cap.name.includes("Order Processing & Dispatch Backend")) {
      roleName = "Backend & Systems Architect";
      category = "Technical";
      requiredSkills = ["Node.js / Go", "Redis", "PostgreSQL", "WebSocket / Real-Time", "Microservices"];
      responsibilities = [
        "Develop high-concurrency order placement and automated courier assignment state machine",
        "Implement real-time pub/sub event bus for live order updates across apps",
        "Design distributed transaction safety for payment and stock confirmation",
      ];
      relatedTasks = ["Order State Machine Backend", "Live Dispatch Algorithm"];
    } else if (cap.name.includes("Restaurant & Merchant Operations")) {
      roleName = "Merchant Operations Specialist";
      category = "Business";
      requiredSkills = ["Kitchen Operations", "Menu Schema Modeling", "Vendor Onboarding", "SLA Management"];
      responsibilities = [
        "Define restaurant menu taxonomies, modifier options, and kitchen prep timings",
        "Establish merchant onboarding and food safety compliance workflows",
        "Design kitchen order ticket formatting for rapid kitchen staff execution",
      ];
      relatedTasks = ["Merchant Taxonomy & Schema Setup", "Restaurant Onboarding Guidelines"];
    } else if (cap.name.includes("Geospatial Routing")) {
      roleName = "Geospatial / Navigation Engineer";
      category = "Technical";
      requiredSkills = ["PostGIS", "Google Maps / Mapbox APIs", "Spatial Indexing", "ETA Algorithms"];
      responsibilities = [
        "Implement live courier GPS breadcrumb streaming and geofenced arrival triggers",
        "Optimize routing algorithms to minimize courier idle time and fuel consumption",
      ];
      relatedTasks = ["Real-Time GPS Tracking Pipeline", "Geofencing & ETA Prediction"];
    } else if (cap.name.includes("Payment Gateway")) {
      roleName = "Fintech & Payments Engineer";
      category = "Technical";
      requiredSkills = ["Stripe / Razorpay API", "Payment Compliance", "Ledger Accounting", "Webhook Security"];
      responsibilities = [
        "Integrate seamless multi-method digital payments with instant receipt generation",
        "Implement automated payout splits for restaurants, courier earnings, and platform fees",
      ];
      relatedTasks = ["Payment Gateway Integration", "Automated Courier Payout Engine"];
    } else if (cap.name.includes("QA & Real-Time Systems")) {
      roleName = "Systems Reliability Engineer";
      category = "Technical";
      requiredSkills = ["K6 / Locust", "Load Testing", "Fault Injection", "API Automation"];
      responsibilities = [
        "Simulate high-volume dinner rush traffic to verify zero dropped orders",
        "Test network drop recovery and offline reconnection handling on mobile apps",
      ];
      relatedTasks = ["High-Concurrency Load Testing", "Courier App Field Simulation"];
    }
    // Film Mappings
    else if (cap.name.includes("Cinematic Directing") || cap.name.includes("Creative Vision")) {
      roleName = "Film Director";
      category = "Creative";
      requiredSkills = ["Dramatic Directing", "Visual Storytelling", "Actor Blocking", "Scene Composition"];
      responsibilities = [
        "Steer overarching dramatic vision, tone, and visual execution",
        "Direct actor performances to evoke authentic character emotions",
        "Collaborate with Cinematographer on camera placement and lighting atmosphere",
      ];
      relatedTasks = ["Director Shot List & Blocking", "On-Set Creative Direction"];
    } else if (cap.name.includes("Cinematography")) {
      roleName = "Cinematographer (Director of Photography)";
      category = "Creative";
      requiredSkills = ["Cinema Cameras", "Lighting Design", "Lenses", "Framing & Composition"];
      responsibilities = [
        "Design visual lighting plans for each scene location",
        "Operate camera packages and choose lenses matching the emotional scene tone",
        "Ensure consistent color temperature, exposure, and focus pull",
      ];
      relatedTasks = ["Camera & Lighting Equipment Setup", "Principal Photography Filming"];
    } else if (cap.name.includes("Dramatic Acting") || cap.name.includes("Cast Performance")) {
      roleName = "Lead Actor / Cast";
      category = "Creative";
      requiredSkills = ["Screen Acting", "Emotional Expression", "Script Memorization", "Voice Modulation"];
      responsibilities = [
        "Inhabit the protagonist role and deliver authentic dialogue performances",
        "Rehearse scene beats and physical character actions with the Director",
      ];
      relatedTasks = ["Character Rehearsals & Table Reads", "On-Camera Performance Filming"];
    } else if (cap.name.includes("Picture Editing")) {
      roleName = "Video Editor";
      category = "Creative";
      requiredSkills = ["DaVinci Resolve / Premiere Pro", "Pacing & Continuity", "Dialogue Editing", "Visual Assembly"];
      responsibilities = [
        "Ingest and sync daily video and audio footage",
        "Assemble assembly cut, rough cut, and deliver finalized picture lock",
      ];
      relatedTasks = ["Footage Sync & Assembly Cut", "Final Picture Lock"];
    } else if (cap.name.includes("Location Audio") || cap.name.includes("Sound Design")) {
      roleName = "Sound Designer & Recordist";
      category = "Technical";
      requiredSkills = ["Location Audio Capture", "Boom Pole Operation", "Pro Tools", "Audio Mastering"];
      responsibilities = [
        "Record clean, distortion-free dialogue on set using directional mics",
        "Design atmospheric sound effects, Foley footsteps, and master the stereo/surround mix",
      ];
      relatedTasks = ["On-Set Audio Recording", "Final Sound Design & Audio Mix"];
    } else if (cap.name.includes("Color Grading")) {
      roleName = "Colorist";
      category = "Creative";
      requiredSkills = ["DaVinci Resolve", "Color Science", "LUT Creation", "HDR / DCI-P3 Mastering"];
      responsibilities = [
        "Balance exposure and color continuity across disparate camera shots",
        "Create mood-specific color grades that reinforce dramatic narrative themes",
      ];
      relatedTasks = ["Color Grading & Tone Shaping", "Master Festival Export"];
    }
    // Cybersecurity Mappings
    else if (cap.name.includes("Threat Detection Engineering")) {
      roleName = "Cybersecurity / Detection Engineer";
      category = "Technical";
      requiredSkills = ["Sigma Rules", "MITRE ATT&CK", "YARA", "Python / Go", "Threat Detection"];
      responsibilities = [
        "Author, benchmark, and deploy automated detection rules for emerging threat vectors",
        "Map detection coverage to MITRE ATT&CK enterprise tactics and techniques",
      ];
      relatedTasks = ["Detection Heuristics & Sigma Rules", "Adversary Tactic Benchmarking"];
    } else if (cap.name.includes("Infosec & Threat Modeling")) {
      roleName = "Information Security Architect";
      category = "Technical";
      requiredSkills = ["Threat Modeling", "Zero-Trust Architecture", "Security Compliance", "Vulnerability Management"];
      responsibilities = [
        "Define enterprise attack surface boundaries and zero-trust verification rules",
        "Conduct comprehensive threat modeling across API endpoints and cloud resources",
      ];
      relatedTasks = ["System Threat Modeling", "Zero-Trust Security Policies"];
    } else if (cap.name.includes("Distributed Pipeline & Telemetry")) {
      roleName = "Security Data Engineer";
      category = "Technical";
      requiredSkills = ["Kafka / Vector", "ClickHouse / Elasticsearch", "Data Streaming", "Rust / Go"];
      responsibilities = [
        "Build ingestion pipelines capable of processing millions of security events per second",
        "Ensure zero-loss telemetry buffering, filtering, and schema parsing",
      ];
      relatedTasks = ["Telemetry Ingestion Pipeline", "High-Throughput Event Storage"];
    } else if (cap.name.includes("Security Dashboard")) {
      roleName = "Frontend Security Developer";
      category = "Technical";
      requiredSkills = ["React / TypeScript", "Data Visualization", "D3.js", "SOC Triage Workflows"];
      responsibilities = [
        "Build fast, high-density incident investigation and alert triage dashboards",
        "Implement attack graph visualizations and timeline drill-downs for analysts",
      ];
      relatedTasks = ["Incident Triage Dashboard", "Attack Graph Visualizer"];
    } else if (cap.name.includes("Cloud Security & DevSecOps")) {
      roleName = "DevSecOps / Cloud Security Engineer";
      category = "Technical";
      requiredSkills = ["Terraform", "Kubernetes Hardening", "AWS/GCP Security", "CI/CD Security Gating"];
      responsibilities = [
        "Automate vulnerability scanning in build pipelines and enforce container isolation",
        "Maintain zero-drift cloud infrastructure security configurations and IAM boundaries",
      ];
      relatedTasks = ["Infrastructure Hardening", "Automated Security CI/CD Gateways"];
    }
    // College Festival Mappings
    else if (cap.name.includes("Live Event Planning")) {
      roleName = "Event Coordinator / Director";
      category = "Communication";
      requiredSkills = ["Event Production", "Budget Management", "Vendor Coordination", "Schedule Management"];
      responsibilities = [
        "Oversee master festival production timeline and university administrative compliance",
        "Coordinate multi-committee deliverables across technical, sponsor, and artist tracks",
      ];
      relatedTasks = ["Master Festival Timeline", "Administrative & Vendor Coordination"];
    } else if (cap.name.includes("Live Audio Engineering")) {
      roleName = "Live Sound Engineer";
      category = "Technical";
      requiredSkills = ["Live Sound Mixing", "Line Array Acoustics", "Digital Consoles", "Microphone Rigging"];
      responsibilities = [
        "Rig and tune concert line array speaker systems and stage audio monitors",
        "Execute live multi-channel sound mixing and artist soundchecks during concerts",
      ];
      relatedTasks = ["Concert Sound Rigging & Tuning", "Live Stage Sound Mixing"];
    } else if (cap.name.includes("Stage Lighting")) {
      roleName = "Stage & Lighting Technician";
      category = "Technical";
      requiredSkills = ["DMX Lighting", "Truss Rigging", "Moving Heads", "Electrical Safety"];
      responsibilities = [
        "Rig overhead lighting trusses, spotlights, and stage atmospheric hazers",
        "Program energetic DMX lighting sequences synchronized to live musical sets",
      ];
      relatedTasks = ["Stage Lighting Truss Setup", "Live Concert DMX Programming"];
    } else if (cap.name.includes("Sponsorship & Business")) {
      roleName = "Sponsorship / Partnerships Manager";
      category = "Business";
      requiredSkills = ["Sponsorship Pitching", "Brand Activation", "Negotiation", "Client Management"];
      responsibilities = [
        "Present festival sponsorship packages to corporate and regional brand partners",
        "Manage sponsor booth locations, promotional deliveries, and proof-of-performance",
      ];
      relatedTasks = ["Brand Sponsorship Outreach", "Sponsor Deliverable Fulfillment"];
    } else if (cap.name.includes("Artist Liaison")) {
      roleName = "Artist Hospitality & Backstage Liaison";
      category = "Communication";
      requiredSkills = ["Artist Hospitality", "Backstage Coordination", "Schedule Tracking", "Rider Management"];
      responsibilities = [
        "Ensure visiting headline artists have agreed green room and tech requirements fulfilled",
        "Manage artist stage arrival, escort, and performance timing adherence",
      ];
      relatedTasks = ["Artist Hospitality Rider Setup", "Backstage Stage Coordination"];
    }
    // Adaptive Capability Mappings
    else if (cap.name.includes("Technical Architecture") || cap.name.includes("Core Engineering")) {
      roleName = `${domain} Systems Architect`;
      category = "Technical";
      requiredSkills = [`${domain} Architecture`, "Systems Design", "Technical Verification"];
      responsibilities = [
        `Architect and build foundational technical systems and execution deliverables for ${domain}`,
        "Establish modular component boundaries and oversee technical integration",
      ];
      relatedTasks = [`Architect ${domain} Technical Systems`, `Core ${domain} Deliverables`];
    } else if (cap.name.includes("Specialist Knowledge") || cap.name.includes("Domain Rigor")) {
      roleName = `${domain} Strategy & Subject Matter Lead`;
      category = cap.type === "domain" ? "Creative" : "Business";
      requiredSkills = [`${domain} Methodologies`, "Industry Best Practices", "Quality Governance"];
      responsibilities = [
        `Ensure industry-standard rigor, domain compliance, and specialized best practices for ${domain}`,
        "Validate milestone deliverables against real-world domain requirements",
      ];
      relatedTasks = [`Formulate ${domain} Quality Framework`, "Domain Deliverable Review"];
    } else if (cap.name.includes("Quality Assurance") || cap.name.includes("Systems Testing")) {
      roleName = "QA & Systems Test Specialist";
      category = "Technical";
      requiredSkills = ["Automated Testing", "Integration Testing", "Edge Case Validation"];
      responsibilities = [
        "Develop test specifications and conduct comprehensive functional and regression audits",
        "Document performance bottlenecks and verify release readiness criteria",
      ];
      relatedTasks = ["System Integration Test Suite", "Quality Assurance Sign-Off"];
    } else if (cap.name.includes("Interface") || cap.name.includes("Experience Design") || cap.name.includes("UI")) {
      roleName = "UI/UX & Product Experience Designer";
      category = "Creative";
      requiredSkills = ["User Journey Mapping", "UI Design", "Figma", "Design Systems"];
      responsibilities = [
        "Design intuitive user journeys, interactive workflows, and visual specifications",
        "Conduct usability reviews to maximize end-user adoption and satisfaction",
      ];
      relatedTasks = ["User Experience Wireframing", "Production UI Visual Assets"];
    } else if (cap.name.includes("Deployment") || cap.name.includes("Operations Management") || cap.name.includes("Ops")) {
      roleName = "DevOps & Release Operations Engineer";
      category = "Technical";
      requiredSkills = ["CI/CD", "Release Management", "Cloud Operations", "Monitoring"];
      responsibilities = [
        "Automate deployment pipelines and manage staging/production environments",
        "Establish monitoring telemetry, uptime alerts, and operational runbooks",
      ];
      relatedTasks = ["Configure Release Pipeline", "Production Launch & Monitoring Setup"];
    }
    // Music Band Role Mappings
    else if (cap.name.includes("Vocal Performance & Lead Melody") || cap.name.includes("Lead Vocal")) {
      roleName = "Lead Singer / Vocalist";
      category = "Creative";
      requiredSkills = ["Singing", "Vocal Performance", "Vocal Phrasing", "Microphone Technique", "Stage Presence"];
      responsibilities = [
        "Deliver powerful lead vocal performances, hooks, and dynamic emotional phrasing",
        "Command stage audience engagement and band presence during live showcases",
        "Collaborate on vocal harmonies, phrasing, and melodic hooks",
      ];
      relatedTasks = ["Vocal Audition & Melodic Rehearsal", "Lead Vocal Tracking"];
    } else if (cap.name.includes("Lead & Acoustic Guitar Arrangement") || cap.name.includes("Guitar")) {
      roleName = "Lead Guitarist";
      category = "Creative";
      requiredSkills = ["Lead Guitar", "Guitar Solos", "Riffs & Chords", "Electric Guitar", "Acoustic Guitar"];
      responsibilities = [
        "Compose and perform signature riffs, melodic leads, and dynamic guitar solos",
        "Maintain rhythm guitar timing and pedalboard tone modulation",
        "Dial in amp tones matching the band's signature genre style",
      ];
      relatedTasks = ["Guitar Riff & Solo Composition", "Guitar Stem Tracking"];
    } else if (cap.name.includes("Rhythm & Bass Harmony") || cap.name.includes("Bass")) {
      roleName = "Bass Guitarist";
      category = "Creative";
      requiredSkills = ["Bass Guitar", "Slap Bass", "Groove Rhythm", "Harmonic Timing", "Walking Bass"];
      responsibilities = [
        "Provide solid low-frequency groove foundation locking with the drum kick",
        "Support chord transitions and dynamic accents through verse-chorus transitions",
      ];
      relatedTasks = ["Bass Line Arrangement", "Bass Stem Tracking"];
    } else if (cap.name.includes("Percussion & Rhythm Drive") || cap.name.includes("Drums") || cap.name.includes("Percussion")) {
      roleName = "Drummer";
      category = "Creative";
      requiredSkills = ["Drums", "Drum Kit", "Percussion", "Tempo Control", "Dynamic Fills", "Polyrhythms"];
      responsibilities = [
        "Anchor band tempo and rhythm across varied time signatures and dynamic breakdowns",
        "Perform dynamic drum fills, builds, and groove rhythms during jam sessions and recordings",
      ];
      relatedTasks = ["Drum Kit Setup & Metronome Rehearsal", "Drum Tracking Session"];
    } else if (cap.name.includes("Piano & Keyboard Harmony") || cap.name.includes("Piano") || cap.name.includes("Keyboard")) {
      roleName = "Piano / Keyboard Player";
      category = "Creative";
      requiredSkills = ["Piano", "Keyboard", "Synthesizer", "Chord Progressions", "Music Theory", "Key Soloing"];
      responsibilities = [
        "Perform acoustic piano accompaniments, synth leads, and lush harmonic chord pads",
        "Harmonize vocal melodies and add atmospheric ambient sound textures",
      ];
      relatedTasks = ["Keyboard & Synth Arrangement", "Keys Stem Tracking"];
    } else if (cap.name.includes("Music Production & Track Direction") || cap.name.includes("Music Producer")) {
      roleName = "Music Producer";
      category = "Technical";
      requiredSkills = ["Music Production", "DAW (Logic/Ableton/FL)", "Track Arrangement", "Session Direction", "Beat Making"];
      responsibilities = [
        "Supervise track arrangements, recording sessions, and instrumentation balance",
        "Direct studio musicians for optimal tone, timing, and emotional impact",
      ];
      relatedTasks = ["Track Arrangement & Stems Structuring", "Session Production Direction"];
    } else if (cap.name.includes("Sound Engineering & Audio Mix") || cap.name.includes("Audio Mix")) {
      roleName = "Sound Engineer";
      category = "Technical";
      requiredSkills = ["Sound Engineering", "Audio Mixing", "Microphone Placement", "Pro Tools", "Live Sound", "Audio Mastering"];
      responsibilities = [
        "Place and calibrate studio and stage microphones for acoustic clarity",
        "Perform multi-track audio mixing, equalization, compression, and stereo master polish",
      ];
      relatedTasks = ["Studio Acoustic Calibration", "Multi-Track Audio Mixing & Mastering"];
    } else if (cap.name.includes("Original Songwriting & Composition") || cap.name.includes("Songwriting")) {
      roleName = "Songwriter / Composer";
      category = "Creative";
      requiredSkills = ["Songwriting", "Lyric Writing", "Composition", "Melody Construction", "Chord Progressions"];
      responsibilities = [
        "Write original song lyrics, catchy chorus hooks, and narrative themes",
        "Structure chord charts and musical progressions for the band",
      ];
      relatedTasks = ["Draft Song Lyrics & Melody", "Finalize Chord Chart"];
    }
    // Generic / Domain Fallbacks
    else {
      let cleanCap = cap.name
        .replace(/Knowledge|Architecture|Specialist|Lead|Manager/gi, "")
        .trim();
      if (cleanCap.toLowerCase().startsWith(domain.toLowerCase())) {
        cleanCap = cleanCap.substring(domain.length).trim();
      }
      roleName = cleanCap.length > 0 ? `${domain} ${cleanCap} Specialist` : `${domain} Technical Specialist`;
      if (roleName === "Project Lead" || roleName === "Domain Specialist") {
        roleName = `${domain} Systems Specialist`;
      }
      category = cap.type === "technical" ? "Technical" : cap.type === "domain" ? "Creative" : "Business";
      requiredSkills = [`${domain} Expertise`, "Project Execution", "Technical Verification"];
      responsibilities = [
        `Deliver high-quality work packages addressing ${cap.name.toLowerCase()}`,
        "Collaborate with cross-functional team members to align milestone deliverables",
      ];
      relatedTasks = [`Execute ${cap.name} Deliverables`];
    }

    derivedRoles.push({
      roleName,
      capability: cap.name,
      responsibilities,
      whyRequired: cap.whyRequired || cap.description,
      requiredOrOptional: cap.level,
      relatedTasks,
      category,
      requiredSkills,
    });
  }

  // If Film and user is Director, ensure Director role reflects user
  if (domain === "Film" && context?.isUserDirector) {
    const dirRole = derivedRoles.find((r) => r.roleName.toLowerCase().includes("director"));
    if (dirRole) {
      dirRole.whyRequired = "Covered by you as Director — steering artistic vision and dramatic performances.";
    }
  }

  return derivedRoles;
}

/**
 * 3. PHASE & TASK DERIVATION ENGINE
 *
 * Dynamically derives multi-stage phases from actual project requirements
 * and assigns tasks to the derived roles.
 *
 * NEVER defaults to generic "Discovery & Planning" + "Development & Production"!
 */
export function derivePhasesAndTasks(
  requirements: StructuredRequirements,
  capabilities: DerivedCapability[],
  roles: DerivedRole[],
  domain: ProjectDomain
): {
  phases: ProjectPhase[];
  deliverables: ProjectDeliverable[];
  workflowStages: string[];
  parallelWorkstreams: ParallelWorkstream[];
} {
  const phases: ProjectPhase[] = [];
  const deliverables: ProjectDeliverable[] = [];
  const workflowStages: string[] = [];
  const parallelWorkstreams: ParallelWorkstream[] = [];

  const isAgriAI = domain === "AI / ML" || requirements.projectGoal.toLowerCase().includes("crop") || requirements.projectGoal.toLowerCase().includes("leaf");
  const isFoodDelivery = requirements.projectGoal.toLowerCase().includes("food delivery") || requirements.projectGoal.toLowerCase().includes("delivery app");
  const isFilm = domain === "Film" || requirements.projectGoal.toLowerCase().includes("film") || requirements.projectGoal.toLowerCase().includes("movie");
  const isCybersecurity = domain === "Cybersecurity" || requirements.projectGoal.toLowerCase().includes("cybersecurity") || requirements.projectGoal.toLowerCase().includes("threat");
  const isEvent = domain === "Events" || requirements.projectGoal.toLowerCase().includes("festival") || requirements.projectGoal.toLowerCase().includes("event");

  // Helper to find assigned role name
  const findRole = (keyword: string, fallback: string): string => {
    const match = roles.find((r) => r.roleName.toLowerCase().includes(keyword.toLowerCase()));
    return match ? match.roleName : (roles[0]?.roleName || fallback);
  };

  const makeTaskItem = (
    phaseId: string,
    title: string,
    description: string,
    roleKeyword: string,
    skills: string[],
    priority: "low" | "medium" | "high" | "urgent" = "high",
    duration: string = "3 days",
    order: number = 1,
    dependencies: string[] = []
  ): ProjectTask => {
    const assignedRole = findRole(roleKeyword, roles[0]?.roleName || "Project Engineer");
    return {
      id: genId("task"),
      phaseId,
      title,
      description,
      requiredRole: assignedRole,
      requiredSkills: skills.length > 0 ? skills : [assignedRole],
      dependencies,
      parallelWith: [],
      estimatedDuration: duration,
      priority,
      status: "to_do",
      order,
    };
  };

  // ==========================================
  // CASE 1: CROP DISEASE / AGRI AI VISION
  // ==========================================
  if (isAgriAI) {
    workflowStages.push(
      "Farmer & Problem Discovery",
      "Dataset Collection & Preprocessing",
      "AI Vision Model Development",
      "API & Mobile Application Development",
      "Field Validation & Usability Testing",
      "Production Deployment & Telemetry"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Farmer & Problem Discovery",
        description: "Engage local farmers and agricultural extension specialists to define target crop diseases, field lighting issues, and diagnostic needs.",
        purpose: "Establish real-world agronomic boundaries, target diseases, and farmer usability requirements.",
        sourceReason: "AI tools fail in the field unless grounded in realistic farming constraints.",
        order: 1,
        workstreams: ["Field Discovery"],
        tasks: [
          makeTaskItem(p1, "Field Needs & Crop Disease Scoping", "Interview farmers and catalog high-priority regional crop diseases (e.g. blight, rust, leaf spot).", "Agricultural", ["Plant Pathology", "Agronomy"], "urgent", "3 days", 1),
          makeTaskItem(p1, "Ground-Truth Pathology Taxonomy Setup", "Formulate clear botanical criteria for healthy vs. diseased leaf symptom stages.", "Agricultural", ["Agronomic Taxonomy"], "high", "2 days", 2),
        ],
      },
      {
        id: p2,
        name: "Dataset Collection & Preprocessing",
        description: "Gather, curate, clean, and augment thousands of diverse leaf photos under realistic outdoor sunlight conditions.",
        purpose: "Build a balanced, high-accuracy training foundation for computer vision models.",
        sourceReason: "Prevents model overfitting on uniform lab photos and ensures resilience to outdoor shadows.",
        order: 2,
        workstreams: ["Data Engineering"],
        tasks: [
          makeTaskItem(p2, "Leaf Photo Dataset Ingestion & Annotation", "Curate and label thousands of high-resolution leaf images verified by agricultural specialists.", "Data / ML", ["Data Augmentation", "OpenCV"], "urgent", "5 days", 1),
          makeTaskItem(p2, "Outdoor Lighting & Artifact Preprocessing", "Build automated pipeline for color calibration, perspective normalization, and background subtraction.", "Data / ML", ["Image Preprocessing"], "high", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "AI Vision Model Development",
        description: "Architect, train, benchmark, and optimize deep learning computer vision models for multi-class plant disease classification.",
        purpose: "Produce an accurate, low-latency visual diagnostic classifier.",
        sourceReason: "Core intellectual property and automated classification engine of the project.",
        order: 3,
        workstreams: ["Model Development"],
        tasks: [
          makeTaskItem(p3, "Vision Model Architecture & Training", "Train CNN / Vision Transformer architectures on augmented leaf dataset using transfer learning.", "Computer Vision", ["PyTorch", "Deep Learning"], "urgent", "6 days", 1),
          makeTaskItem(p3, "Validation Benchmarking & Quantization", "Evaluate model precision, recall, and quantize weights for on-device edge mobile inference.", "Computer Vision", ["Model Quantization", "TFLite / ONNX"], "high", "3 days", 2),
        ],
      },
      {
        id: p4,
        name: "API & Mobile Application Development",
        description: "Build the farmer-facing mobile capture UI and low-latency cloud model serving endpoints.",
        purpose: "Provide an intuitive tool farmers can use directly in the field with instant diagnosis.",
        sourceReason: "Connects the complex machine learning model to an accessible, simple user interface.",
        order: 4,
        workstreams: ["Software Engineering"],
        tasks: [
          makeTaskItem(p4, "Low-Latency Model Serving REST API", "Deploy containerized inference service with image verification, batching, and diagnostic endpoints.", "Backend", ["FastAPI", "Docker"], "high", "4 days", 1),
          makeTaskItem(p4, "Farmer Mobile UI & Camera Capture Interface", "Develop responsive camera capture workflow with guided leaf framing and offline diagnosis caching.", "Mobile", ["React Native / Flutter", "Camera API"], "urgent", "5 days", 2),
        ],
      },
      {
        id: p5,
        name: "Field Validation & Usability Testing",
        description: "Test the application with real farmers in agricultural fields under direct sunlight and variable cellular connectivity.",
        purpose: "Validate diagnostic accuracy against real crops and ensure farmers can easily interpret results.",
        sourceReason: "Ensures the application works reliably in remote farms without technical supervision.",
        order: 5,
        workstreams: ["Validation"],
        tasks: [
          makeTaskItem(p5, "On-Site Farmer Usability Pilot", "Conduct field trials across pilot farming clusters to test camera ease-of-use and diagnosis comprehension.", "Farmer", ["Usability Testing", "Field Interviews"], "high", "4 days", 1),
          makeTaskItem(p5, "Agronomic Remediation Accuracy Audit", "Review generated treatment recommendations with plant pathologists to ensure chemical and organic guidance safety.", "Agricultural", ["Agronomy Review"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p6,
        name: "Production Deployment & Telemetry",
        description: "Deploy production model serving infrastructure, release mobile app APK, and configure accuracy drift telemetry.",
        purpose: "Ship the verified solution to farmers with continuous reliability.",
        sourceReason: "Guarantees high uptime and allows the team to detect seasonal crop pathology shifts.",
        order: 6,
        workstreams: ["Deployment & Ops"],
        tasks: [
          makeTaskItem(p6, "Cloud Production Deployment & MLOps Pipeline", "Deploy auto-scaling GPU inference cluster with model versioning and latency monitoring.", "MLOps", ["Kubernetes", "Prometheus"], "high", "3 days", 1),
          makeTaskItem(p6, "Public Release & Farmer Community Onboarding", "Publish Android APK / PWA and onboard regional farmer extension networks.", "Mobile", ["App Release", "Onboarding"], "high", "2 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Curated & Labeled Leaf Disease Dataset", description: "Thousands of expert-annotated leaf photos across common crop pathologies.", isKey: true },
      { id: genId("del"), title: "Benchmarked Computer Vision Disease Classifier", description: "Trained deep learning model achieving high validation accuracy and quantized for mobile.", isKey: true },
      { id: genId("del"), title: "Farmer Mobile Diagnostic Application", description: "Intuitive camera capture app with offline caching and localized disease guidance.", isKey: true },
      { id: genId("del"), title: "Scalable Model Serving Cloud API", description: "Low-latency REST API with containerized inference and user diagnostic history.", isKey: true },
      { id: genId("del"), title: "Field Usability & Botanical Validation Report", description: "Documented results from on-site farm testing and expert agronomic audit.", isKey: false }
    );

    parallelWorkstreams.push(
      {
        id: "ws-1",
        phaseName: "API & Mobile Application Development",
        streamName: "Mobile Client & Backend Engineering",
        taskIds: phases[3].tasks.map((t) => t.id),
        simultaneousWith: ["AI Vision Model Development"],
        efficiencyNote: "Mobile UI and Backend endpoints are developed concurrently while AI model training converges.",
      },
      {
        id: "ws-2",
        phaseName: "AI Vision Model Development",
        streamName: "Model Training & Quantization Track",
        taskIds: phases[2].tasks.map((t) => t.id),
        simultaneousWith: ["Mobile Client & Backend Engineering"],
        efficiencyNote: "Data engineers continuously feed augmented batches into the model training pipeline.",
      }
    );
  }

  // ==========================================
  // CASE 2: FOOD DELIVERY APPLICATION
  // ==========================================
  else if (isFoodDelivery) {
    workflowStages.push(
      "Scope & Order Architecture",
      "Core Platform & Dispatch Engine",
      "Consumer & Courier Mobile Apps",
      "Merchant Portal & Kitchen Display",
      "Payment & Security Hardening",
      "Pilot Delivery Operations & City Launch"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Scope & Order Architecture",
        description: "Define multi-party order lifecycle, delivery geofences, and database schemas.",
        purpose: "Establish rock-solid data architecture for high-volume transactions.",
        sourceReason: "Prevents data inconsistencies between restaurants, couriers, and customers.",
        order: 1,
        workstreams: ["System Architecture"],
        tasks: [
          makeTaskItem(p1, "Order Lifecycle & State Machine Architecture", "Design finite state machine covering order placement, prep, pickup, and delivery.", "Backend", ["PostgreSQL", "System Architecture"], "urgent", "3 days", 1),
          makeTaskItem(p1, "Merchant Menu Schema & Modifier Modeling", "Structure multi-tier restaurant menu options, dietary tags, and price variations.", "Merchant", ["Menu Modeling"], "high", "2 days", 2),
        ],
      },
      {
        id: p2,
        name: "Core Platform & Dispatch Engine",
        description: "Build the high-throughput backend, WebSocket real-time notification engine, and courier matching.",
        purpose: "Enable automated, instant courier assignment and live state broadcasting.",
        sourceReason: "Core transaction throughput engine powering the entire logistics network.",
        order: 2,
        workstreams: ["Backend Engineering"],
        tasks: [
          makeTaskItem(p2, "Real-Time Courier Dispatch Algorithm", "Implement proximity-based courier matching using spatial queries and ETA heuristics.", "Backend", ["Redis", "PostGIS"], "urgent", "5 days", 1),
          makeTaskItem(p2, "WebSocket Live Event Notification Stream", "Build pub/sub streaming channels for instant order status alerts across apps.", "Backend", ["WebSockets", "Node.js"], "high", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "Consumer & Courier Mobile Apps",
        description: "Develop the customer ordering application and courier navigation tool.",
        purpose: "Deliver intuitive customer checkout and smooth courier turn-by-turn navigation.",
        sourceReason: "The customer and courier mobile interfaces represent 90% of user interactions.",
        order: 3,
        workstreams: ["Mobile Development"],
        tasks: [
          makeTaskItem(p3, "Customer Mobile Ordering & Cart Experience", "Implement menu browsing, dish customization, cart, and live order tracking map.", "Mobile", ["React Native / Flutter"], "urgent", "6 days", 1),
          makeTaskItem(p3, "Courier Navigation & Order Fulfillment App", "Build courier order accept/reject screen, GPS navigation route, and proof-of-delivery.", "Mobile", ["Google Maps API", "Geolocation"], "urgent", "5 days", 2),
        ],
      },
      {
        id: p4,
        name: "Merchant Portal & Kitchen Display",
        description: "Develop the restaurant web portal and tablet kitchen order display system.",
        purpose: "Give restaurant kitchen staff immediate visibility and prep time control.",
        sourceReason: "Reduces kitchen order bottleneck and inaccurate prep estimations.",
        order: 4,
        workstreams: ["Merchant Web"],
        tasks: [
          makeTaskItem(p4, "Kitchen Order Display System (KDS)", "Build high-contrast tablet interface for audio-alerted order confirmations and prep timers.", "Mobile", ["React", "Audio Alerts"], "high", "4 days", 1),
          makeTaskItem(p4, "Merchant Menu & Business Analytics Portal", "Create web dashboard for real-time item 86ing, hours update, and revenue metrics.", "Backend", ["Next.js / React"], "high", "3 days", 2),
        ],
      },
      {
        id: p5,
        name: "Payment & Security Hardening",
        description: "Integrate PCI-compliant payment gateways, automated courier split disbursements, and security testing.",
        purpose: "Ensure zero transaction fraud and seamless checkout conversion.",
        sourceReason: "Financial settlement and customer trust are essential for food delivery platforms.",
        order: 5,
        workstreams: ["Fintech & QA"],
        tasks: [
          makeTaskItem(p5, "Payment Gateway & Escrow Settlement Pipeline", "Integrate credit card, wallet, and automated restaurant/courier payout calculation.", "Fintech", ["Stripe / Razorpay API"], "urgent", "4 days", 1),
          makeTaskItem(p5, "High-Concurrency Order Load Simulation", "Stress test order queues against simulated dinner rush traffic (5,000+ simultaneous orders).", "Reliability", ["K6", "Load Testing"], "high", "3 days", 2),
        ],
      },
      {
        id: p6,
        name: "Pilot Delivery Operations & City Launch",
        description: "Onboard pilot restaurants, recruit courier cohort, and launch localized delivery zone.",
        purpose: "Validate real delivery times, food temperatures, and customer satisfaction.",
        sourceReason: "Identifies operational bottlenecks before scaling city-wide.",
        order: 6,
        workstreams: ["Operations & Launch"],
        tasks: [
          makeTaskItem(p6, "Pilot Delivery Zone Operations Testing", "Execute live test orders with contracted couriers and measure actual pickup-to-door times.", "Merchant", ["Field Operations"], "urgent", "4 days", 1),
          makeTaskItem(p6, "City Launch & Performance Monitoring", "Open platform to live customers in target geographic district with customer support on standby.", "Backend", ["Production Ops"], "high", "2 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Scalable Food Delivery Backend & Dispatch Engine", description: "Real-time order state machine and proximity courier dispatch algorithm.", isKey: true },
      { id: genId("del"), title: "Customer Mobile Application", description: "Interactive menu browsing, checkout, and live delivery tracking.", isKey: true },
      { id: genId("del"), title: "Courier Navigation & Fulfillment App", description: "Mobile GPS routing, order management, and earnings ledger.", isKey: true },
      { id: genId("del"), title: "Restaurant Merchant Kitchen Dashboard", description: "Real-time kitchen order display with audio notifications and menu toggle.", isKey: true },
      { id: genId("del"), title: "Payment Gateway & Split Settlement Pipeline", description: "Automated customer charging, merchant payout, and courier tip disbursement.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Consumer & Courier Mobile Apps",
      streamName: "Mobile Apps & Merchant Portal Parallel Track",
      taskIds: [...phases[2].tasks.map((t) => t.id), ...phases[3].tasks.map((t) => t.id)],
      simultaneousWith: ["Core Platform & Dispatch Engine"],
      efficiencyNote: "Customer app, Courier app, and Merchant dashboard are engineered in parallel against shared OpenAPI contracts.",
    });
  }

  // ==========================================
  // CASE 3: SHORT FILM PRODUCTION
  // ==========================================
  else if (isFilm) {
    workflowStages.push(
      "Story Development & Screenplay Lock",
      "Pre-Production, Casting & Locations",
      "Principal Photography & Production",
      "Picture Editorial & Rough Cut",
      "Sound Design, Score & Color Grading",
      "Festival Mastering & Distribution"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Story Development & Screenplay Lock",
        description: "Draft, revise, and lock the final shooting screenplay with complete scene beats and character dialogue.",
        purpose: "Establish the narrative blueprint and emotional arc before committing production budget.",
        sourceReason: "A solid locked script prevents expensive reshoots and narrative confusion during filming.",
        order: 1,
        workstreams: ["Writing & Vision"],
        tasks: [
          makeTaskItem(p1, "Shooting Screenplay Revision & Scene Beats", "Refine dialogue, action lines, and lock final scene beats for production breakdown.", "Director", ["Screenwriting", "Story Structuring"], "urgent", "4 days", 1),
          makeTaskItem(p1, "Director Shot List & Visual Atmosphere Moodboard", "Map camera angles, coverage setups, and visual lighting tone references.", "Director", ["Shot Listing", "Visual Tone"], "high", "3 days", 2),
        ],
      },
      {
        id: p2,
        name: "Pre-Production, Casting & Locations",
        description: "Audition actors, scout and secure filming locations, and assemble cinema equipment packages.",
        purpose: "Prepare all creative and physical logistics before shoot day.",
        sourceReason: "Proper pre-production ensures shoot days run smoothly without unexpected location or casting delays.",
        order: 2,
        workstreams: ["Pre-Production"],
        tasks: [
          makeTaskItem(p2, "Cast Auditions & Role Rehearsals", "Cast lead characters and conduct table reads to establish authentic emotional dynamics.", "Director", ["Casting", "Actor Rehearsal"], "urgent", "4 days", 1),
          makeTaskItem(p2, "Location Scouting & Technical Camera Recce", "Secure filming permits, scout shooting venues, and test camera lenses under natural light.", "Cinematographer", ["Location Scouting", "Lens Testing"], "high", "3 days", 2),
        ],
      },
      {
        id: p3,
        name: "Principal Photography & Production",
        description: "Execute camera filming, lighting design, actor performances, and sound recording across planned shoot days.",
        purpose: "Capture all primary visual footage and synchronized on-set audio.",
        sourceReason: "Transforms script pages into real visual cinematic footage.",
        order: 3,
        workstreams: ["Production"],
        tasks: [
          makeTaskItem(p3, "Scene Lighting & Camera Package Filming", "Execute master shots, close-ups, and camera movements adhering to the director shot list.", "Cinematographer", ["Cinema Camera", "Lighting Setup"], "urgent", "4 days", 1),
          makeTaskItem(p3, "Multi-Channel Location Audio Recording", "Capture clean dialogue, room tone, and on-set Foley using boom and wireless lavalier mics.", "Sound", ["Boom Recording", "Sound Engineering"], "urgent", "4 days", 2),
        ],
      },
      {
        id: p4,
        name: "Picture Editorial & Rough Cut",
        description: "Ingest daily rushes, sync audio stems, assemble scenes, and lock picture timing with the director.",
        purpose: "Shape the dramatic rhythm, pacing, and emotional progression of the film.",
        sourceReason: "Allows the director and editor to refine storytelling pacing before final color and audio master.",
        order: 4,
        workstreams: ["Post-Production"],
        tasks: [
          makeTaskItem(p4, "Footage Ingest, Sync & Assembly Cut", "Organize shoot takes, synchronize dual-system audio, and cut initial chronological assembly.", "Video Editor", ["DaVinci Resolve / Premiere Pro"], "urgent", "4 days", 1),
          makeTaskItem(p4, "Fine Cut Pacing & Picture Lock", "Trim scene transitions, tighten dialogue pacing, and finalize locked visual cut.", "Video Editor", ["Editorial Pacing"], "high", "3 days", 2),
        ],
      },
      {
        id: p5,
        name: "Sound Design, Score & Color Grading",
        description: "Perform cinematic color grading, atmospheric sound effects design, and final stereo/surround mix.",
        purpose: "Elevate production quality to theatrical, festival-grade immersion.",
        sourceReason: "Rich sound design and color grading provide 50% of the cinematic emotional impact.",
        order: 5,
        workstreams: ["Finishing"],
        tasks: [
          makeTaskItem(p5, "Cinematic Color Grading & Shot Matching", "Grade footage in DaVinci Resolve, match skin tones across takes, and apply filmic look.", "Colorist", ["Color Grading", "DaVinci Resolve"], "urgent", "3 days", 1),
          makeTaskItem(p5, "Sound Effects, Foley & Audio Master", "Layer environmental soundscapes, clean dialogue noise, and master the final sound mix.", "Sound", ["Sound Design", "Audio Mixing"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p6,
        name: "Festival Mastering & Distribution",
        description: "Export high-resolution DCI-compliant cinema packages (DCP), create trailer, and prepare festival kits.",
        purpose: "Position the completed short film for international festival laurels and audience distribution.",
        sourceReason: "Ensures the final film meets strict theatrical exhibition technical guidelines.",
        order: 6,
        workstreams: ["Distribution"],
        tasks: [
          makeTaskItem(p6, "DCP Festival Master & High-Bitrate Export", "Generate digital cinema package with synchronized subtitles and 5.1/stereo audio tracks.", "Video Editor", ["DCP Export", "Mastering"], "high", "2 days", 1),
          makeTaskItem(p6, "Press Kit, Trailer & Festival Submissions", "Assemble film synopsis, high-res production stills, teaser trailer, and submit to festivals.", "Director", ["Marketing", "Festival Submissions"], "high", "3 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Locked Shooting Screenplay & Director Shot List", description: "Complete scene beats, dialogue, and camera placement plan.", isKey: true },
      { id: genId("del"), title: "Raw Cinematic Production Footage & Synced Audio", description: "High-resolution RAW / ProRes camera takes and clean multi-track audio stems.", isKey: true },
      { id: genId("del"), title: "Color Graded & Picture Locked Short Film", description: "Final edited master with polished cinematic color timing and skin-tone consistency.", isKey: true },
      { id: genId("del"), title: "Surround & Stereo Mastered Audio Mix", description: "Atmospheric sound design, balanced dialogue, and custom musical score.", isKey: true },
      { id: genId("del"), title: "Festival DCP Package & Promotional Press Kit", description: "Theatrical digital cinema package ready for festival projection and web release.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Sound Design, Score & Color Grading",
      streamName: "Color Grading & Audio Mastering Parallel Finishing",
      taskIds: phases[4].tasks.map((t) => t.id),
      simultaneousWith: [],
      efficiencyNote: "Color grading in DaVinci Resolve proceeds simultaneously with Sound Design and audio mixing once picture lock is established.",
    });
  }

  // ==========================================
  // CASE 4: CYBERSECURITY PLATFORM
  // ==========================================
  else if (isCybersecurity) {
    workflowStages.push(
      "Threat Modeling & Architecture Design",
      "Telemetry Pipeline & Ingestion Engine",
      "Correlation Rules & Detection Engine",
      "SOC Analyst Incident Response Dashboard",
      "Penetration Testing & Red Teaming Audit",
      "Production Hardening & SIEM Rollout"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Threat Modeling & Architecture Design",
        description: "Map organizational attack surfaces, define adversary threat models, and establish zero-trust boundaries.",
        purpose: "Identify primary vulnerability vectors before building detection mechanisms.",
        sourceReason: "Security systems must be architected around realistic attack topologies and MITRE techniques.",
        order: 1,
        workstreams: ["Threat Architecture"],
        tasks: [
          makeTaskItem(p1, "Enterprise Attack Surface & Threat Modeling", "Map network ingress vectors, critical asset boundaries, and MITRE ATT&CK adversary tactics.", "Security", ["Threat Modeling", "MITRE ATT&CK"], "urgent", "3 days", 1),
          makeTaskItem(p1, "Zero-Trust Architecture & Telemetry Specs", "Specify endpoint telemetry protocols, encryption standards, and distributed schema models.", "Security", ["Zero-Trust", "Security Architecture"], "high", "3 days", 2),
        ],
      },
      {
        id: p2,
        name: "Telemetry Pipeline & Ingestion Engine",
        description: "Build high-throughput event streaming pipeline capable of ingesting millions of endpoint logs per second.",
        purpose: "Provide lossless, real-time security log streaming from firewalls, servers, and cloud accounts.",
        sourceReason: "Dropped telemetry leads directly to undetected breach activities.",
        order: 2,
        workstreams: ["Data Engineering"],
        tasks: [
          makeTaskItem(p2, "High-Throughput Log Ingestion Engine", "Deploy distributed message queue for network and endpoint event streaming.", "Data", ["Kafka / Vector", "Go / Rust"], "urgent", "5 days", 1),
          makeTaskItem(p2, "Log Normalization & Schema Parsing", "Parse disparate log formats into standardized Open Cybersecurity Schema Framework (OCSF).", "Data", ["Log Parsing", "OCSF"], "high", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "Correlation Rules & Detection Engine",
        description: "Develop automated detection engine executing Sigma rules, behavioral anomaly detection, and alert scoring.",
        purpose: "Detect malicious intrusion, lateral movement, and privilege escalation in real time.",
        sourceReason: "Automates threat identification and minimizes attacker dwell time.",
        order: 3,
        workstreams: ["Detection Engineering"],
        tasks: [
          makeTaskItem(p3, "Real-Time Sigma Rule Correlation Engine", "Implement rule matching engine evaluating incoming telemetry against community Sigma rules.", "Detection", ["Sigma Rules", "Stream Processing"], "urgent", "5 days", 1),
          makeTaskItem(p3, "Behavioral Anomaly & Heuristic Scoring", "Build anomaly detection models for abnormal login hours, beaconing, and privilege escalation.", "Detection", ["Machine Learning", "Anomaly Detection"], "high", "4 days", 2),
        ],
      },
      {
        id: p4,
        name: "SOC Analyst Incident Response Dashboard",
        description: "Build intuitive analyst triage portal with attack graphs, timeline drilldowns, and automated response actions.",
        purpose: "Empower security analysts to investigate alerts rapidly and quarantine compromised endpoints.",
        sourceReason: "Reduces Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR).",
        order: 4,
        workstreams: ["Frontend & Automation"],
        tasks: [
          makeTaskItem(p4, "Incident Triage Dashboard & Attack Graph", "Develop React dashboard visualizing alert timelines, MITRE tactic tags, and asset relationships.", "Frontend", ["React / TypeScript", "Data Visualization"], "urgent", "5 days", 1),
          makeTaskItem(p4, "Automated Response Playbooks & Webhooks", "Implement one-click endpoint isolation, IP firewall blocking, and Slack/PagerDuty alerts.", "Backend", ["Automation", "Webhooks"], "high", "3 days", 2),
        ],
      },
      {
        id: p5,
        name: "Penetration Testing & Red Teaming Audit",
        description: "Simulate offensive cyber attacks against the platform to validate detection triggers and verify resilience.",
        purpose: "Prove detection efficacy against real-world malware techniques and exploitation scripts.",
        sourceReason: "Identifies blind spots in detection logic prior to enterprise deployment.",
        order: 5,
        workstreams: ["Offensive Validation"],
        tasks: [
          makeTaskItem(p5, "Simulated Adversary Attack Scenarios", "Execute simulated ransomware execution, credential dumping, and lateral movement to test alerts.", "Penetration", ["Red Teaming", "Metasploit / Cobalt Strike"], "urgent", "4 days", 1),
          makeTaskItem(p5, "False Positive Elimination & Rule Tuning", "Tune detection thresholds to eliminate noise and analyst alert fatigue.", "Detection", ["Rule Optimization"], "high", "3 days", 2),
        ],
      },
      {
        id: p6,
        name: "Production Hardening & SIEM Rollout",
        description: "Deploy production cloud clusters with immutable infrastructure, KMS encryption, and enterprise SIEM integrations.",
        purpose: "Deliver hardened, enterprise-ready cybersecurity monitoring platform.",
        sourceReason: "Ensures the security platform itself is impervious to adversary compromise.",
        order: 6,
        workstreams: ["Cloud & Governance"],
        tasks: [
          makeTaskItem(p6, "Cloud Security Hardening & Immutable Deployments", "Lock down Kubernetes clusters, enforce strict IAM policies, and configure audit logging.", "DevSecOps", ["Kubernetes", "Terraform"], "high", "3 days", 1),
          makeTaskItem(p6, "Enterprise SIEM & SOC Onboarding", "Connect platform telemetry to customer SIEMs and train analysts on investigation playbooks.", "Security", ["Customer Onboarding"], "high", "2 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Real-Time Threat Detection Engine & Sigma Rule Library", description: "Automated correlation pipeline mapped to MITRE ATT&CK enterprise tactics.", isKey: true },
      { id: genId("del"), title: "High-Throughput Telemetry Ingestion Pipeline", description: "Distributed event ingestion processing millions of events per second without loss.", isKey: true },
      { id: genId("del"), title: "SOC Analyst Incident Investigation Dashboard", description: "Centralized console with attack graphs, timeline drilldowns, and alert scoring.", isKey: true },
      { id: genId("del"), title: "Automated Incident Response Playbooks", description: "One-click endpoint isolation, IP blocking, and automated incident escalation.", isKey: true },
      { id: genId("del"), title: "Red Team Penetration Testing & Hardening Report", description: "Validated efficacy report showing zero blind spots against simulated attacks.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Correlation Rules & Detection Engine",
      streamName: "Detection Engine & Dashboard Parallel Build",
      taskIds: [...phases[2].tasks.map((t) => t.id), ...phases[3].tasks.map((t) => t.id)],
      simultaneousWith: [],
      efficiencyNote: "Correlation rule authoring proceeds in parallel with incident investigation dashboard development.",
    });
  }

  // ==========================================
  // CASE 5: COLLEGE CULTURAL FESTIVAL
  // ==========================================
  else if (isEvent) {
    workflowStages.push(
      "Festival Scope, Committee & Budgeting",
      "Artist Lineup & Brand Sponsorships",
      "Stage, Sound & Lighting Production Setup",
      "Campus PR, Ticketing & Registration",
      "Live Festival Operations & Stage Execution",
      "Post-Festival Review & Sponsor Deliverables"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Festival Scope, Committee & Budgeting",
        description: "Form core student organizing committees, establish departmental budgets, and secure university approvals.",
        purpose: "Establish clear leadership, venue permissions, and allocated budgets for staging.",
        sourceReason: "Prevents administrative friction and keeps student teams aligned on core deliverables.",
        order: 1,
        workstreams: ["Committee Planning"],
        tasks: [
          makeTaskItem(p1, "Festival Master Schedule & Committee Allocation", "Draft multi-day schedule, allocate student committee leads, and secure venue permits.", "Event Coordinator", ["Event Management", "Budgeting"], "urgent", "3 days", 1),
          makeTaskItem(p1, "Administrative & Safety Compliance Clearance", "Secure university dean approval, emergency medical standby, and campus security clearance.", "Event Coordinator", ["Campus Compliance"], "high", "2 days", 2),
        ],
      },
      {
        id: p2,
        name: "Artist Lineup & Brand Sponsorships",
        description: "Book headline celebrity performers, contract artist riders, and secure corporate brand sponsorships.",
        purpose: "Lock key revenue streams and headline entertainment to drive student excitement.",
        sourceReason: "Celebrity bookings require early date locking and contracts.",
        order: 2,
        workstreams: ["Talent & Funding"],
        tasks: [
          makeTaskItem(p2, "Corporate Sponsorship Pitching & Contracts", "Pitch brand sponsors, finalize booth spaces, and secure cash and in-kind sponsorships.", "Sponsorship", ["Sponsorship Pitching", "Negotiation"], "urgent", "5 days", 1),
          makeTaskItem(p2, "Headline Artist Booking & Technical Rider Review", "Contract headline musical artists, arrange green room hospitality, and verify audio riders.", "Artist", ["Artist Management", "Rider Review"], "urgent", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "Stage, Sound & Lighting Production Setup",
        description: "Rig concert-grade line array sound systems, overhead lighting trusses, LED stage walls, and power safety.",
        purpose: "Build professional concert staging that delivers thrilling audio-visual energy.",
        sourceReason: "Live concerts demand high acoustic fidelity and safety-certified electrical distribution.",
        order: 3,
        workstreams: ["Technical Production"],
        tasks: [
          makeTaskItem(p3, "Concert Sound System Rigging & Acoustic Tuning", "Erect line arrays, subwoofers, monitor wedges, and perform digital console line checks.", "Sound", ["Live Sound", "Line Array Acoustics"], "urgent", "3 days", 1),
          makeTaskItem(p3, "Stage Lighting Truss & LED Video Wall Programming", "Rig moving head lights, DMX controllers, and program dynamic visual lighting sequences.", "Lighting", ["DMX Lighting", "Stage Rigging"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p4,
        name: "Campus PR, Ticketing & Registration",
        description: "Launch online registration portal, distribute QR entry passes, and execute campus promotional campaigns.",
        purpose: "Maximize student turnout and ensure rapid, orderly crowd entry.",
        sourceReason: "Digital ticketing prevents counterfeit passes and bottlenecked campus gates.",
        order: 4,
        workstreams: ["Marketing & Ticketing"],
        tasks: [
          makeTaskItem(p4, "Campus PR & Social Media Teaser Campaign", "Deploy promotional reels, posters across college campuses, and run social giveaways.", "Marketing", ["Social Media", "PR"], "high", "4 days", 1),
          makeTaskItem(p4, "Online Registration & QR Gate Pass Rollout", "Deploy mobile registration portal and configure QR scanning apps for gate security.", "Event Coordinator", ["Ticketing Portal", "Access Control"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p5,
        name: "Live Festival Operations & Stage Execution",
        description: "Coordinate live stage performances, artist hospitality, crowd management, and sponsor activations during festival days.",
        purpose: "Execute festival days flawlessly with safe crowd control and thrilling entertainment.",
        sourceReason: "The core event days where all planning translates into the live student experience.",
        order: 5,
        workstreams: ["Live Operations"],
        tasks: [
          makeTaskItem(p5, "Live Stage Mixing & Performance Timekeeping", "Mix live concert sound, run programmed DMX lights, and manage artist stage transitions.", "Sound", ["Live Mixing", "Stage Timekeeping"], "urgent", "3 days", 1),
          makeTaskItem(p5, "Crowd Flow & Gate Access Management", "Direct student queueing, scan entry QR codes, and monitor venue safety barricades.", "Event Coordinator", ["Crowd Control", "Safety"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p6,
        name: "Post-Festival Review & Sponsor Deliverables",
        description: "Dismantle stage production, settle vendor accounts, publish festival aftermovie, and deliver sponsor ROI reports.",
        purpose: "Conclude all financial and commercial obligations and celebrate festival achievements.",
        sourceReason: "Sponsor proof-of-performance ensures recurring corporate partnerships for future years.",
        order: 6,
        workstreams: ["Wrap-Up"],
        tasks: [
          makeTaskItem(p6, "Stage Teardown & Venue Restoration", "Supervise safe removal of audio/lighting gear and restore college campus grounds.", "Lighting", ["Production Teardown"], "high", "2 days", 1),
          makeTaskItem(p6, "Sponsor Proof-of-Performance & Aftermovie", "Compile photographic proof of brand activations, attendee analytics, and release official recap video.", "Sponsorship", ["Sponsor Reporting", "Media Recap"], "high", "3 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Master Festival Schedule & Approved Budget", description: "Multi-stage performance breakdown, permits, and committee responsibilities.", isKey: true },
      { id: genId("del"), title: "Confirmed Brand Sponsorships & Cash Funding", description: "Secured corporate brand agreements and funding for staging and talent.", isKey: true },
      { id: genId("del"), title: "Professional Concert Sound & Lighting Setup", description: "Tuned line array sound system, DMX lighting truss, and LED video walls.", isKey: true },
      { id: genId("del"), title: "Digital Ticketing & QR Gate Access System", description: "Online registration and entry pass system for student crowd management.", isKey: true },
      { id: genId("del"), title: "Official Festival Aftermovie & Sponsor Recap", description: "Cinematic highlights video and sponsor ROI metric documentation.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Artist Lineup & Brand Sponsorships",
      streamName: "Sponsorship Outreach & Staging Rigging Track",
      taskIds: [...phases[1].tasks.map((t) => t.id), ...phases[2].tasks.map((t) => t.id)],
      simultaneousWith: [],
      efficiencyNote: "Sponsorship fulfillment and technical audio/lighting staging proceed simultaneously leading up to festival opening day.",
    });
  }

  // ==========================================
  // ARTIFACT 6: MUSIC BAND
  // ==========================================
  else if (domain === "Music") {
    workflowStages.push(
      "Band Vision, Repertoire & Musical Direction",
      "Musician Auditions & Lineup Assembly",
      "Songwriting, Composition & Jam Sessions",
      "Band Rehearsals & Setlist Tightening",
      "Studio Multi-Track Recording & Production",
      "Audio Mixing, Mastering & Live Gig Launch"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";
    const p5 = "phase-5";
    const p6 = "phase-6";

    phases.push(
      {
        id: p1,
        name: "Band Vision, Repertoire & Musical Direction",
        description: "Define core musical genre, band artistic identity, original vs. cover repertoire, and sonic references.",
        purpose: "Establish a cohesive artistic direction and repertoire roadmap.",
        sourceReason: "A unified musical vision prevents stylistic conflict among band members.",
        order: 1,
        workstreams: ["Concept & Repertoire"],
        tasks: [
          makeTaskItem(p1, "Define Musical Genre & Repertoire Setlist", "Establish artistic direction, genre influences, and target audience.", "Songwriter", ["Composition", "Songwriting"], "high", "3 days", 1),
          makeTaskItem(p1, "Select Key Musical Influences & Vocal Keys", "Curate initial setlist of songs, tempo roadmaps, and key signatures.", "Vocalist", ["Vocal Phrasing", "Singing"], "high", "2 days", 2),
        ],
      },
      {
        id: p2,
        name: "Musician Auditions & Lineup Assembly",
        description: "Scout, audition, and lock core band members across vocals, guitars, bass, drums, and keyboards.",
        purpose: "Assemble a synchronized, talented musical lineup with complementary performance chemistry.",
        sourceReason: "Live bands require high musical synchronization and personal reliability.",
        order: 2,
        workstreams: ["Musician Auditions"],
        tasks: [
          makeTaskItem(p2, "Audition Rhythm Section (Drums & Bass)", "Evaluate groove tightness, metronome lock, and dynamic chemistry between drums and bass.", "Drummer", ["Drums", "Tempo Control"], "urgent", "4 days", 1),
          makeTaskItem(p2, "Audition Lead Melodic Instruments & Keys", "Test guitar solos, piano chord voicings, and synthesizer texture compatibility.", "Guitarist", ["Lead Guitar", "Guitar Solos"], "urgent", "4 days", 2),
          makeTaskItem(p2, "Lock Complete Core Musician Lineup", "Finalize musician commitments, rehearsal agreements, and role assignments.", "Producer", ["Session Direction", "Music Production"], "high", "2 days", 3),
        ],
      },
      {
        id: p3,
        name: "Songwriting, Composition & Jam Sessions",
        description: "Develop original song chord charts, write lyrics and vocal melodies, and test arrangement variations.",
        purpose: "Create and refine the band's signature musical compositions and song arrangements.",
        sourceReason: "Original material establishes band distinctiveness and audience loyalty.",
        order: 3,
        workstreams: ["Songwriting & Arranging"],
        tasks: [
          makeTaskItem(p3, "Write Original Lyrics & Vocal Melodies", "Draft verses, chorus hooks, and vocal harmonies tailored to singer register.", "Songwriter", ["Songwriting", "Lyric Writing"], "high", "5 days", 1),
          makeTaskItem(p3, "Jam Session Arrangement & Chord Lock", "Run collaborative jam sessions to lock song structures, bridges, and instrumental breaks.", "Keys", ["Piano", "Chord Progressions"], "high", "4 days", 2),
        ],
      },
      {
        id: p4,
        name: "Band Rehearsals & Setlist Tightening",
        description: "Conduct scheduled rehearsal sessions to lock performance timing, dynamic transitions, and setlist endurance.",
        purpose: "Build live performance muscle memory and eliminate timing discrepancies.",
        sourceReason: "Tight live performance requires rigorous group rehearsal and tempo discipline.",
        order: 4,
        workstreams: ["Band Rehearsals"],
        tasks: [
          makeTaskItem(p4, "Tempo & Metronome Discipline Rehearsals", "Lock rhythm section timing and tighten transitions into choruses and solos.", "Bassist", ["Bass Guitar", "Harmonic Timing"], "high", "4 days", 1),
          makeTaskItem(p4, "Full Setlist Run-Through & Vocal Stamina Check", "Rehearse complete performance setlist back-to-back with live vocal cues.", "Vocalist", ["Vocal Performance", "Stage Presence"], "urgent", "3 days", 2),
        ],
      },
      {
        id: p5,
        name: "Studio Multi-Track Recording & Production",
        description: "Capture clean multi-channel acoustic and DI stems in studio, including live drums, guitars, keys, and lead vocals.",
        purpose: "Produce high-fidelity studio recordings of the band's repertoire.",
        sourceReason: "Studio recordings provide commercial assets for streaming and promotional booking.",
        order: 5,
        workstreams: ["Studio Recording"],
        tasks: [
          makeTaskItem(p5, "Track Rhythm Section (Drums & Bass Stems)", "Record multi-mic drum kit and clean DI bass with zero phase cancellation.", "Drummer", ["Drums", "Percussion"], "urgent", "3 days", 1),
          makeTaskItem(p5, "Track Guitars, Keyboards & Lead Vocals", "Record lead guitar solos, synthesizer layers, and studio vocal takes with pop filters.", "Guitarist", ["Electric Guitar", "Guitar Solos"], "urgent", "3 days", 2),
          makeTaskItem(p5, "Supervise Session Takes & Comping", "Comp best vocal and instrumental takes into cohesive master tracking lanes.", "Producer", ["Music Production", "Session Direction"], "high", "2 days", 3),
        ],
      },
      {
        id: p6,
        name: "Audio Mixing, Mastering & Live Gig Launch",
        description: "Mix all audio stems into balanced commercial masters, calibrate stage sound, and perform debut showcase gig.",
        purpose: "Release broadcast-ready audio masters and perform the live debut showcase.",
        sourceReason: "Connects recorded releases with live venue bookings and audience acquisition.",
        order: 6,
        workstreams: ["Mixing & Live Launch"],
        tasks: [
          makeTaskItem(p6, "Multi-Track Stem Mixing & Mastering", "Apply EQ, compression, stereo widening, and loudness normalization for streaming.", "Audio Engineer", ["Audio Mixing", "Audio Mastering"], "high", "3 days", 1),
          makeTaskItem(p6, "Stage Plot & Live Soundcheck Calibration", "Configure venue line arrays, monitor wedges, and microphone balance for live showcase.", "Audio Engineer", ["Live Sound", "Microphone Placement"], "high", "2 days", 2),
          makeTaskItem(p6, "Debut Live Showcase & Gig Release", "Execute live performance set for audience, film live concert reels, and release tracks.", "Vocalist", ["Stage Presence", "Vocal Performance"], "high", "2 days", 3),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "Band Lineup & Core Instrumental Roster", description: "Locked band member agreements across all instrumental and vocal positions.", isKey: true },
      { id: genId("del"), title: "Original Repertoire & Song Chord Sheets", description: "Structured compositions, lyrics, and chord arrangement charts.", isKey: true },
      { id: genId("del"), title: "Multi-Track Studio Recordings & Audio Stems", description: "Raw multi-track stems across drums, bass, guitars, keys, and vocals.", isKey: true },
      { id: genId("del"), title: "Mastered Commercial Tracks & Streaming Package", description: "Commercial streaming masters, album art, and metadata.", isKey: true },
      { id: genId("del"), title: "Live Performance Setlist & Technical Stage Rider", description: "Stage plot, acoustic input list, and confirmed gig bookings.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Musician Auditions & Lineup Assembly",
      streamName: "Rhythm Section & Melodic Keys Track",
      taskIds: [phases[1].tasks[0].id, phases[1].tasks[1].id],
      simultaneousWith: [],
      efficiencyNote: "Auditioning rhythm players (drums/bass) and melodic players (guitar/keys) proceeds in parallel.",
    });
  }

  // ==========================================
  // CASE 7: GENERAL / ADAPTIVE MULTI-STAGE
  // ==========================================
  else {
    workflowStages.push(
      "Requirements & System Architecture",
      "Core Engineering & Implementation",
      "Integration, QA & User Validation",
      "Production Deployment & Operational Launch"
    );

    const p1 = "phase-1";
    const p2 = "phase-2";
    const p3 = "phase-3";
    const p4 = "phase-4";

    phases.push(
      {
        id: p1,
        name: "Requirements & System Architecture",
        description: "Specify technical boundaries, user workflows, and system architecture for the project.",
        purpose: "Establish clear architectural contracts and execution milestones.",
        sourceReason: "A solid architectural foundation prevents rework during core implementation.",
        order: 1,
        workstreams: ["Architecture & Planning"],
        tasks: [
          makeTaskItem(p1, "System Architecture & Scope Specification", "Document technical boundaries, data structures, and milestone timelines.", "Technical", ["Architecture Design"], "urgent", "3 days", 1),
          makeTaskItem(p1, "Domain Requirements & Workflow Definition", "Define industry standards, target user journeys, and compliance criteria.", "Specialist", ["Domain Analysis"], "high", "2 days", 2),
        ],
      },
      {
        id: p2,
        name: "Core Engineering & Implementation",
        description: "Build primary functional deliverables, backend services, and user interfaces.",
        purpose: "Produce the core functional value of the initiative.",
        sourceReason: "Realizes the primary deliverables required by the user prompt.",
        order: 2,
        workstreams: ["Core Execution"],
        tasks: [
          makeTaskItem(p2, "Core Functional Systems Implementation", "Implement primary features and data pipelines according to architectural specifications.", "Technical", ["Systems Development"], "urgent", "5 days", 1),
          makeTaskItem(p2, "User Interface & Experience Development", "Build accessible, responsive interface workflows for end users.", "Technical", ["UI Development"], "high", "4 days", 2),
        ],
      },
      {
        id: p3,
        name: "Integration, QA & User Validation",
        description: "Conduct comprehensive automated testing, edge-case evaluation, and user feedback validation.",
        purpose: "Ensure the solution is robust, defect-free, and meets user expectations.",
        sourceReason: "Validates functional performance before opening to production users.",
        order: 3,
        workstreams: ["Quality Assurance"],
        tasks: [
          makeTaskItem(p3, "End-to-End System Integration Testing", "Execute automated test suites across all core modules and verify data consistency.", "Quality", ["Integration Testing"], "urgent", "3 days", 1),
          makeTaskItem(p3, "User Acceptance Review & Feedback Polish", "Review deliverables with stakeholders and integrate critical usability refinements.", "Specialist", ["User Acceptance"], "high", "2 days", 2),
        ],
      },
      {
        id: p4,
        name: "Production Deployment & Operational Launch",
        description: "Deploy production release, publish documentation, and establish operational handoff.",
        purpose: "Deliver live, stable access to end users with maintainable operations.",
        sourceReason: "Concludes the initiative with verifiable operational stability.",
        order: 4,
        workstreams: ["Deployment & Launch"],
        tasks: [
          makeTaskItem(p4, "Production Environment Deployment", "Configure hosting infrastructure, domain DNS, and automated monitoring telemetry.", "Technical", ["Production Deployment"], "urgent", "2 days", 1),
          makeTaskItem(p4, "Launch Verification & Operational Handover", "Complete release checklist, deliver documentation, and onboard end users.", "Technical", ["Documentation & Handoff"], "high", "2 days", 2),
        ],
      }
    );

    deliverables.push(
      { id: genId("del"), title: "System Architecture & Requirements Document", description: "Complete technical boundaries and execution specifications.", isKey: true },
      { id: genId("del"), title: "Core Functional Implementation Assets", description: "Primary deliverable assets and production codebases.", isKey: true },
      { id: genId("del"), title: "Quality Assurance & Test Validation Report", description: "Documented verification of functional reliability and edge cases.", isKey: true },
      { id: genId("del"), title: "Production Release & Operational Documentation", description: "Live deployed solution with documentation and monitoring.", isKey: false }
    );

    parallelWorkstreams.push({
      id: "ws-1",
      phaseName: "Core Engineering & Implementation",
      streamName: "Core Implementation & UI Parallel Stream",
      taskIds: phases[1].tasks.map((t) => t.id),
      simultaneousWith: [],
      efficiencyNote: "Backend core logic and frontend interface development execute concurrently.",
    });
  }

  return { phases, deliverables, workflowStages, parallelWorkstreams };
}

/**
 * 4. CANONICAL BLUEPRINT GENERATION
 *
 * Generates the complete, requirements-derived blueprint during project creation.
 */
export function generateRequirementsDerivedBlueprint(
  promptOrOptions: string | { prompt: string; userType?: "creator" | "client"; creatorId?: string; userId?: string; currentUserRole?: string },
  userTypeParam: "creator" | "client" = "creator",
  creatorIdParam: string = "anon",
  currentUserRoleParam?: string
): OmniForgeProject {
  const prompt = typeof promptOrOptions === "string" ? promptOrOptions : (promptOrOptions.prompt || (promptOrOptions as any).userQuery || "");
  const userType = typeof promptOrOptions === "object" && promptOrOptions.userType ? promptOrOptions.userType : userTypeParam;
  const creatorId = typeof promptOrOptions === "object" && (promptOrOptions.creatorId || promptOrOptions.userId) ? (promptOrOptions.creatorId || promptOrOptions.userId)! : creatorIdParam;
  const currentUserRole = typeof promptOrOptions === "object" && promptOrOptions.currentUserRole ? promptOrOptions.currentUserRole : currentUserRoleParam;

  const isDirector =
    currentUserRole === "DIRECTOR" ||
    /\b(?:i\s+am\s+(?:the\s+|a\s+)?director|i\s+don'?t\s+need\s+directors?\s+because\s+i\s+am\s+a\s+director|i['’]?m\s+(?:the\s+|a\s+)?director|i\s+am\s+directing)\b/i.test(prompt);

  // 1. Extract structured requirements and capabilities
  const { requirements: structReqs, capabilities } = extractStructuredRequirements(prompt, {
    currentUserRole,
  });

  const domain = structReqs.domain;

  // 2. Derive roles from capabilities
  const derivedRoles = deriveRolesFromCapabilities(capabilities, domain, {
    isUserDirector: isDirector,
    existingProjectTitle: prompt,
  });

  // 3. Derive phases, tasks, deliverables, workflow stages, and workstreams
  const { phases, deliverables, workflowStages, parallelWorkstreams } = derivePhasesAndTasks(
    structReqs,
    capabilities,
    derivedRoles,
    domain
  );

  // Convert derived roles to ProjectRole[]
  const roles: ProjectRole[] = derivedRoles.map((r, idx) => {
    const isFilledByDirector = isDirector && r.roleName.toLowerCase().includes("director");
    return {
      id: `role-${idx + 1}-${r.roleName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      roleName: r.roleName,
      category: r.category,
      description: r.whyRequired,
      requiredCapabilities: [r.capability],
      requiredSkills: r.requiredSkills,
      estimatedHeadcount: 1,
      isFilled: isFilledByDirector,
      isEssential: r.requiredOrOptional === "REQUIRED",
      assignedCreatorName: isFilledByDirector ? "You (Director)" : undefined,
    };
  });

  // Calculate estimated duration from phases
  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const estimatedTotalDuration = phases.length >= 6 ? "4–6 weeks" : phases.length >= 4 ? "3–4 weeks" : "2 weeks";
  const complexity = phases.length >= 6 ? "Complex" : phases.length >= 4 ? "Moderate" : "Simple";

  // Derive flat requirements strings for backward compatibility
  const flatRequirements: string[] = [
    ...structReqs.coreFeatures,
    ...structReqs.technicalRequirements.slice(0, 2),
    ...structReqs.domainRequirements.slice(0, 1),
  ];

  // Derive title
  const cleanTitle = prompt
    .trim()
    .replace(
      /^(i\s+(?:want\s+to|would\s+like\s+to|need\s+to)\s+(?:build|make|create|develop|organize|launch|produce)|please\s+(?:build|make|create|develop|organize|launch|produce)|build\s+(?:a|an)|create\s+(?:a|an)|develop\s+(?:a|an)|make\s+(?:a|an)|organize\s+(?:a|an)|launch\s+(?:a|an))\s+/i,
      ""
    )
    .replace(/[.!?]+$/, "");

  let title = cleanTitle.length > 0 ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : prompt.trim();
  if (title.length > 55) {
    const words = title.split(" ");
    title = words.slice(0, 7).join(" ");
    if (title.length > 55) title = title.substring(0, 52) + "...";
  }

  // Capitalize and normalize archetype titles
  if (domain === "AI / ML" && (title.toLowerCase().includes("crop") || title.toLowerCase().includes("leaf"))) {
    title = "AI Crop Disease Detection System";
  } else if (domain === "Software" && title.toLowerCase().includes("food delivery")) {
    title = "On-Demand Food Delivery Application";
  } else if (domain === "Film" && title.toLowerCase().includes("film")) {
    title = title.length < 20 ? "Short Film Production" : title;
  } else if (domain === "Cybersecurity" && (title.toLowerCase().includes("cybersecurity") || title.toLowerCase().includes("threat"))) {
    title = "Cybersecurity Threat Detection Platform";
  } else if (domain === "Events" && (title.toLowerCase().includes("festival") || title.toLowerCase().includes("cultural"))) {
    title = "College Cultural Festival";
  } else if (domain === "Music" || title.toLowerCase().includes("music") || title.toLowerCase().includes("band")) {
    title = "My Music Band";
  }

  let canonicalDomain: import("./types").CanonicalDomain = "OTHER";
  if (domain === "Music") {
    canonicalDomain = "MUSIC_BAND";
  } else if (domain === "Film") {
    canonicalDomain = "FILM";
  } else if (domain === "Events") {
    canonicalDomain = "EVENT";
  } else if (domain === "Software" || domain === "Cybersecurity" || domain === "AI / ML") {
    canonicalDomain = "SOFTWARE";
  }

  const projectId = genId("proj");

  const project: OmniForgeProject = {
    id: projectId,
    ownerId: creatorId,
    title,
    description: prompt,
    domain,
    canonicalDomain,
    projectType: canonicalDomain === "MUSIC_BAND" ? "Music Band" : title,
    userType,
    stage: "planning",
    goal: structReqs.projectGoal,
    targetAudience: structReqs.targetUsers,
    expectedFinalOutcome: `Fully deployed ${title} achieving verified production benchmarks and user satisfaction.`,
    complexity,
    estimatedTotalDuration,
    requirements: flatRequirements,
    structuredRequirements: structReqs,
    capabilities,
    derivedRoles,
    workflowStages,
    deliverables,
    phases,
    roles,
    parallelWorkstreams,
    recommendations: [],
    coverage: {
      totalRequired: roles.filter((r) => r.isEssential && !r.isFilled).length,
      totalCovered: roles.filter((r) => r.isFilled).length,
      percentage: Math.round((roles.filter((r) => r.isFilled).length / Math.max(1, roles.length)) * 100),
      coveredCapabilities: roles
        .filter((r) => r.isFilled)
        .map((r) => ({ name: r.roleName, coveredBy: r.assignedCreatorName || "User" })),
      missingCapabilities: roles
        .filter((r) => !r.isFilled)
        .map((r) => ({
          roleId: r.id,
          roleName: r.roleName,
          category: r.category || "Technical",
          requiredSkills: r.requiredSkills,
          reason: r.description,
          suggestedActions: [
            { type: "open_request", label: "Find Creators", description: `Search verified creators for ${r.roleName}` },
            { type: "create_job", label: "Publish Job", description: `Post client brief for ${r.roleName}` },
            { type: "skill_swap", label: "Skill Swap", description: `Trade skills for ${r.roleName}` },
            { type: "manual_add", label: "Add Manually", description: `Add creator by @username` },
          ],
        })),
    },
    currentUserRole: isDirector ? "DIRECTOR" : currentUserRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return project;
}

/**
 * 5. CHAT FOLLOW-UP ARCHITECTURE REFINEMENT
 *
 * When the user asks:
 * "Build the complete project architecture with all technical and domain roles required."
 *
 * This updates the existing project's canonical blueprint, adds any missing
 * specialized roles (e.g. Farmer Liaison, Data Engineer, MLOps, Usability Researcher),
 * enriches the phases, and returns the persisted project update.
 */
export function enrichBlueprintWithArchitectureRefinement(
  existingProject: OmniForgeProject,
  instruction: string
): {
  updatedProject: OmniForgeProject;
  replyMessage: string;
  roleDiff: {
    addedRoles: string[];
    totalRoles: number;
    totalPhases: number;
  };
} {
  const updated = JSON.parse(JSON.stringify(existingProject)) as OmniForgeProject;
  const prompt = `${existingProject.title} ${existingProject.description} ${instruction}`;

  // Generate enriched requirements-derived architecture
  const enriched = generateRequirementsDerivedBlueprint(
    prompt,
    updated.userType || "creator",
    updated.ownerId || "anon",
    updated.currentUserRole
  );

  // Preserve existing project ID, owner, squad, and already filled recommendations
  enriched.id = updated.id;
  enriched.ownerId = updated.ownerId;
  enriched.squadId = updated.squadId;
  enriched.createdAt = updated.createdAt;

  // Merge any already accepted recommendations from existing project
  if (updated.recommendations && updated.recommendations.length > 0) {
    const acceptedRecs = updated.recommendations.filter(
      (r) => r.status === "accepted" || r.invitationStatus === "accepted"
    );
    enriched.recommendations = [...acceptedRecs];

    // Mark matching roles as filled
    acceptedRecs.forEach((rec) => {
      const targetRole = enriched.roles.find(
        (r) => r.roleName.toLowerCase() === rec.roleName.toLowerCase()
      );
      if (targetRole) {
        targetRole.isFilled = true;
        targetRole.assignedCreatorId = rec.creator.id;
        targetRole.assignedCreatorName = rec.creator.fullName || rec.creator.username;
      }
    });
  }

  // Recalculate coverage
  const totalReq = enriched.roles.filter((r) => r.isEssential && !r.isFilled).length;
  const totalCov = enriched.roles.filter((r) => r.isFilled).length;
  enriched.coverage = {
    totalRequired: totalReq,
    totalCovered: totalCov,
    percentage: Math.round((totalCov / Math.max(1, enriched.roles.length)) * 100),
    coveredCapabilities: enriched.roles
      .filter((r) => r.isFilled)
      .map((r) => ({ name: r.roleName, coveredBy: r.assignedCreatorName || "User" })),
    missingCapabilities: enriched.roles
      .filter((r) => !r.isFilled)
      .map((r) => ({
        roleId: r.id,
        roleName: r.roleName,
        category: r.category || "Technical",
        requiredSkills: r.requiredSkills,
        reason: r.description,
        suggestedActions: [
          { type: "open_request", label: "Find Creators", description: `Search verified creators for ${r.roleName}` },
          { type: "create_job", label: "Publish Job", description: `Post client brief for ${r.roleName}` },
          { type: "skill_swap", label: "Skill Swap", description: `Trade skills for ${r.roleName}` },
          { type: "manual_add", label: "Add Manually", description: `Add creator by @username` },
        ],
      })),
  };

  enriched.updatedAt = new Date().toISOString();

  // Calculate diff
  const oldRoleNames = new Set((existingProject.roles || []).map((r) => r.roleName.toLowerCase()));
  const addedRoles = enriched.roles
    .filter((r) => !oldRoleNames.has(r.roleName.toLowerCase()))
    .map((r) => r.roleName);

  const replyMessage =
    `### 📋 Complete Project Architecture Built: ${enriched.title}\n\n` +
    `I have updated and enriched the canonical project architecture with all specialized technical, domain, and operational capabilities:\n\n` +
    `• **Domain:** ${enriched.domain}\n` +
    `• **Total Execution Stages:** ${enriched.phases.length} Phases (${phasesToString(enriched.phases)})\n` +
    `• **Total Roles Required:** ${enriched.roles.length} Capability Areas (${enriched.roles.map((r) => r.roleName).join(", ")})\n\n` +
    `#### Structured Requirements & Capabilities\n` +
    `• **Goal:** ${enriched.goal}\n` +
    `• **Target Users:** ${enriched.targetAudience}\n` +
    `• **Core Features:** ${(enriched.structuredRequirements?.coreFeatures || []).slice(0, 3).join("; ")}\n\n` +
    `#### Required & Specialized Team Roles (${enriched.roles.length})\n` +
    enriched.roles.map((r) => `• **${r.roleName}** (${r.isEssential ? "REQUIRED" : "LIKELY"}): ${r.description}`).join("\n") +
    `\n\n#### Phased Execution Roadmap\n` +
    enriched.phases.map((p) => `${p.order}. **${p.name}:** ${p.description}`).join("\n") +
    `\n\nThe workspace blueprint has been persisted with this architecture. You can review tasks, workstreams, and match creators for these roles directly.`;

  return {
    updatedProject: enriched,
    replyMessage,
    roleDiff: {
      addedRoles,
      totalRoles: enriched.roles.length,
      totalPhases: enriched.phases.length,
    },
  };
}

function phasesToString(phases: ProjectPhase[]): string {
  return phases.map((p) => p.name).join(" → ");
}

/**
 * Builds the structured Music Band Team Architecture response breakdown
 * categorized by Vocals, Instruments, Creative, and Production.
 */
export function buildMusicBandTeamArchitectureResponse(
  project?: OmniForgeProject | null,
  userPrompt?: string
): string {
  return `### 🎵 Music Band Team Architecture

Here is the complete musical role breakdown tailored to your band lineup:

#### 🎤 Vocals
• **Lead Singer / Vocalist** (REQUIRED): Lead melodies, lyrical delivery, and stage frontmanship.
• **Backing Vocalist** (OPTIONAL): Harmonies, backing hooks, and vocal layering.

#### 🎸 Instruments
• **Lead Guitarist** (REQUIRED): Signature riffs, melodic solos, and electric/acoustic lead guitar.
• **Bass Guitarist** (REQUIRED): Low-frequency harmonic foundation and groove rhythm.
• **Drummer / Percussionist** (REQUIRED): Tempo control, percussion beats, and dynamic rhythm drive.
• **Piano / Keyboard Player** (REQUIRED): Acoustic piano chords, synthesizer textures, and harmonic keys.

#### 🎼 Creative & Composition
• **Songwriter / Lyricist** (LIKELY): Original lyrics, hooks, and lyrical storytelling.
• **Music Composer / Arranger** (LIKELY): Song structuring, chord charts, and arrangement orchestration.

#### 🎛️ Audio & Production
• **Music Producer** (LIKELY): Track arrangement, studio recording direction, and sound identity.
• **Sound / Audio Engineer** (LIKELY): Multi-track mixing, studio acoustics, and live gig sound reinforcement.
• **Mastering Engineer** (OPTIONAL): Final stereo audio polish and streaming loudness mastering.

---
Which roles would you like to search first? Or you can say **"Find all music creators"** to discover verified talent across all positions.`;
}

