/**
 * OmniForge Initial Knowledge Corpus
 *
 * 13 Curated Internal Knowledge Documents covering:
 * 1. Film Production Roles
 * 2. Film Production Workflow
 * 3. Short Film Team Structure
 * 4. Cinematography Fundamentals
 * 5. Sound Design
 * 6. Video Editing
 * 7. Software Engineering Roles
 * 8. AI Engineering
 * 9. Full Stack Development
 * 10. Project Architecture
 * 11. Skill Development
 * 12. Learning Roadmaps
 * 13. OmniCraft Platform Concepts
 *
 * All documents are authored internally as authentic domain references.
 */

import { supabase } from "@/integrations/supabase/client";
import { ingestDocument } from "./ingestion";
import { KnowledgeDomain } from "./types";

export interface CorpusDocument {
  id: string;
  title: string;
  description: string;
  domain: KnowledgeDomain;
  category: string;
  source_type: "internal";
  content: string;
}

export const INITIAL_KNOWLEDGE_CORPUS: CorpusDocument[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    title: "Film Production Roles and Responsibilities",
    description: "Comprehensive breakdown of key above-the-line and below-the-line filmmaking roles.",
    domain: "FILMMAKING",
    category: "Roles & Crew",
    source_type: "internal",
    content: `## Film Production Roles and Responsibilities

### The Director
The Director is the creative visionary and artistic head of a film project. The Director interprets the screenplay, guides the actors' emotional performances, orchestrates camera composition with the Cinematographer, establishes the visual pacing with the Editor, and makes final creative decisions across all production phases.

### The Cinematographer (Director of Photography / DP)
The Cinematographer or Director of Photography (DP) translates the director's narrative vision into photographic imagery. The DP oversees the camera department, selects camera bodies, lenses, and filters, designs the lighting schemes (3-point lighting, motivated practicals, diffusion), establishes camera movement (dolly, gimbal, handheld), and controls exposure, framing, and color tone on set.

### The Video Editor
The Video Editor shapes the captured footage into a cohesive narrative during post-production. Key responsibilities include assembling footage according to the script (assembly cut), refining pacing and rhythm (rough cut and fine cut), selecting the best performance takes, maintaining spatial and temporal continuity, and collaborating with the sound and color teams.

### The Sound Designer and Audio Engineer
The Sound Designer constructs the acoustic identity of the film. This includes recording high-fidelity on-set dialogue, cleaning audio tracks, creating custom sound effects (SFX), foley artistry (footsteps, clothing rustle, prop handling), recording automated dialogue replacement (ADR), building atmospheric ambient beds, and mixing all stems according to broadcast loudness standards.

### The Producer
The Producer manages the business, logistical, and organizational aspects of filmmaking from inception to release. The Producer secures financing, oversees budget allocation, contracts crew and cast, manages shooting schedules, secures location permits, and supervises festival submissions and distribution channels.

### The Production Designer and Art Department
The Production Designer defines the physical and visual world of the film, overseeing set design, location scouting decoration, props, wardrobe, and makeup to ensure the aesthetic reinforces the thematic mood.

### Supporting Film Roles
- **Gaffer**: Chief lighting technician working directly under the DP to execute lighting setups.
- **Colorist**: Balances color temperatures, matches shots, and creates the artistic color grade in DaVinci Resolve.
- **Composer / Music Director**: Composes original score to evoke emotion and reinforce dramatic beats.
- **Choreographer**: Designs and directs dance routines, movement sequences, or stage combat.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    title: "The Filmmaking Workflow: From Development to Distribution",
    description: "The complete five-phase lifecycle of motion picture production.",
    domain: "FILMMAKING",
    category: "Production Lifecycle",
    source_type: "internal",
    content: `## The Filmmaking Workflow

### Phase 1: Development
Development is the inception phase where the story is conceptualized, pitched, and drafted. Key milestones include logline creation, step outlines, screenplay drafting, script revisions, securing rights, and assembling initial financing or proof-of-concept moodboards.

### Phase 2: Pre-Production
Pre-production is the logistical planning stage before camera rolls. Critical activities include:
- Script breakdown: Tagging props, cast, locations, visual effects, and stunts.
- Storyboarding and shot-listing: Visualizing camera setups and lens requirements.
- Crew assembly: Hiring the DP, sound engineer, assistant directors, gaffers, and actors.
- Location scouting and permitting: Locking down practical filming spaces.
- Production scheduling and call sheets: Establishing efficient shooting days.

### Phase 3: Production (Principal Photography)
Production is the physical execution phase where all planned scenes are recorded on set. The Director blocks scenes, the DP lights and shoots setups, sound records clean dialogue stems, and the Assistant Director manages set safety and schedule adherence. Consistency across takes and slating are strictly enforced.

### Phase 4: Post-Production
Post-production turns raw footage into the finished master film:
1. Editorial: Ingesting footage, creating proxies, assembly cut, rough cut, director's cut, picture lock.
2. Sound Post: Dialogue cleaning, Foley recording, sound effects design, music scoring, final 5.1/stereo re-recording mix.
3. Visual Finishing: VFX compositing, title design, conform to camera original RAW footage, and color grading.
4. Mastering: Creating DCP (Digital Cinema Package), ProRes 4444 master files, and web delivery encodings.

### Phase 5: Distribution and Marketing
The final phase focuses on audience reach: film festival circuit strategies, trailer cuts, press kits, online streaming releases, theatrical bookings, and community screenings.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    title: "Short Film Team Structure: Lean Crew Architecture",
    description: "Optimal team sizing, role consolidation, and staffing strategies for independent short films.",
    domain: "FILMMAKING",
    category: "Team Architecture",
    source_type: "internal",
    content: `## Short Film Team Structure

### Lean Independent Crew Model (4 to 8 People)
Unlike commercial features with hundreds of crew members, independent short films thrive on agile, multidisciplinary teams:
1. **Director**: Usually writes the script and leads creative direction on set. Often handles initial assembly editing.
2. **Cinematographer / Camera Operator**: Operates camera, designs lighting with a minimal 2-to-3 light kit, and selects focal lengths.
3. **Sound Recordist / Boom Operator**: Dedicated strictly to capturing pristine audio on set using hypercardioid boom mics and wireless lavaliers.
4. **Lead Actors**: 1 to 3 primary performers carrying the central dramatic conflict.
5. **Gaffer / Grip / Assistant**: Assists the DP with light placement, flags, reflectors, and power management.
6. **Production Assistant / Coordinator**: Manages schedule, craft services, actor releases, and on-set logistics.

### Role Consolidation Guidelines
- **Director-as-Editor**: Common in indie shorts. Benefits from deep familiarity with the footage, though an external editor provides invaluable objectivity.
- **Never Consolidate Sound and Camera**: The single most catastrophic indie film mistake is expecting the camera operator to also monitor sound. Dedicated sound recording is non-negotiable.
- **Director-as-Lead Actor**: Challenging due to inability to observe performances objectively; requires an experienced assistant director or dedicated monitor playback.

### Team Gap Analysis for Short Films
When evaluating short film readiness:
- **Mandatory Roles**: Director, Lead Actor, Cinematographer, Sound Recordist, Video Editor.
- **Contextual Roles**: Dancer/Choreographer (for music or movement pieces), Stunt Coordinator (for physical action), Colorist (for high-end festival visuals).
- **Covered By User**: If the user is the Director, the Director role is automatically covered; open recruitment focuses exclusively on technical and performance talent.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000004",
    title: "Cinematography Fundamentals: Lighting, Lenses, and Composition",
    description: "Core technical and artistic principles of visual storytelling and camera operation.",
    domain: "FILMMAKING",
    category: "Camera & Lighting",
    source_type: "internal",
    content: `## Cinematography Fundamentals

### Three-Point Lighting and Motivated Lighting
Traditional three-point lighting comprises:
- **Key Light**: The primary illuminator on the subject, establishing directionality and exposure.
- **Fill Light**: Soft illumination placed opposite the key light to fill in shadows and control contrast ratio.
- **Backlight / Hair Light / Rim Light**: Positioned behind the subject to create separation from the background.
In modern cinematic aesthetics, motivated lighting is preferred: ensuring every light source appears to originate from a believable in-world fixture, such as a window, table lamp, or practical neon sign.

### Lens Selection and Focal Lengths
- **Wide Angle (18mm - 28mm)**: Expands space, accentuates camera movement, emphasizes depth and environment, but distorts close-up facial features.
- **Normal Lens (35mm - 50mm)**: Closely mimics natural human visual perspective with minimal geometric distortion; ideal for medium shots.
- **Telephoto Lens (85mm - 135mm+)**: Compresses background distance, creates shallow depth of field, isolates subjects with creamy bokeh, flattering for close-up portraits.

### Camera Movement and Composition
- **Rule of Thirds and Golden Ratio**: Framing subjects along grid intersections to create visual balance.
- **Headroom, Lead Room, and Look Room**: Leaving intentional negative space in front of a moving or gazing character.
- **Camera Angles**: Eye-level (neutral intimacy), Low-angle (authority, power, menace), High-angle (vulnerability, isolation).
- **Movement**: Static tripod (deliberate, controlled), Dolly/Slider (smooth narrative reveal), Handheld (urgency, kinetic tension, documentary realism).`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000005",
    title: "Sound Design and Audio Engineering Principles",
    description: "The complete guide to acoustic storytelling, production audio, Foley, and audio mixing.",
    domain: "FILMMAKING",
    category: "Audio Engineering",
    source_type: "internal",
    content: `## Sound Design and Audio Engineering

### Audio Hierarchy in Filmmaking
Sound conveys up to 70% of the perceived emotional quality of visual media. Professional sound design consists of four distinct layers:
1. **Dialogue (DX)**: The highest priority stem. Must remain intelligible, clean, and consistent across room acoustical transitions.
2. **Foley**: Custom recorded human-performed sound effects synchronized to picture (footsteps on various surfaces, jacket zips, glass clinks).
3. **Sound Effects (SFX / Hard FX)**: Synthetic or library sound design elements (explosions, car engines, gunshots, sci-fi UI beeps).
4. **Atmospheres and Backgrounds (BG / Ambience)**: Subtle ambient beds (wind through trees, city hum, HVAC rumble, cricket chirps) that establish physical environment.
5. **Music (MX)**: Score and source cues that elevate dramatic tension and emotional pacing.

### Production Sound Capture
- **Microphone Polar Patterns**: Shotgun/Hypercardioid mics excel for directional rejection outdoors or in treated rooms; lavaliers capture consistent close proximity audio.
- **Signal-to-Noise Ratio (SNR)**: Maximize microphone proximity to talent's chest/mouth while keeping mics outside the visual frame.
- **Room Tone**: Always record 60 seconds of silent room tone in every location to facilitate seamless dialogue audio edits.

### Mixing and Loudness Standards
- **Streaming Master (YouTube / Netflix / Spotify)**: Target -14 LUFS to -16 LUFS integrated loudness with peak levels below -1.0 dB True Peak.
- **Theatrical Cinema Master**: Calibrated to 85 dBC reference listening level with wide dynamic range (-24 LUFS to -27 LUFS).`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000006",
    title: "Video Editing Workflows and Montage Theory",
    description: "Techniques, phases, and best practices in post-production video editing.",
    domain: "FILMMAKING",
    category: "Post-Production",
    source_type: "internal",
    content: `## Video Editing Workflows

### The Five Editorial Cuts
1. **Assembly Cut**: Arranging every scripted scene in sequential order using select takes without trimming down to target duration.
2. **Rough Cut**: Trimming extraneous heads and tails, establishing scene flow, and discovering the narrative rhythm.
3. **Fine Cut**: Frame-accurate trimming of each transition, enhancing performance timing, cutaways, and micro-reactions.
4. **Picture Lock**: Complete freeze on video edits so audio post-production, VFX, and color grading can proceed without conform drift.
5. **Final Conform**: Re-linking offline editorial proxies to high-resolution camera original RAW media.

### Continuity Editing vs Montage Theory
- **180-Degree Rule**: Keeping the camera on one side of an imaginary axis of action between characters to preserve spatial orientation.
- **Cutting on Action**: Masking cuts during a physical movement (e.g., throwing a punch, opening a door) to make the transition invisible.
- **Match Cut**: Transitioning between two shots that share visual composition, shape, or sound motif to create intellectual metaphor.
- **Montage (Soviet Montage / Eisenstein)**: Juxtaposing contrasting shots to generate emergent conceptual meaning that exists in neither shot individually.

### Industry Software Standards
- **DaVinci Resolve Studio**: Industry leader for unified editing, Blackmagic RAW color grading, Fairlight audio, and Fusion compositing.
- **Adobe Premiere Pro**: Ubiquitous for corporate, commercial, YouTube, and agile content creation teams.
- **Final Cut Pro**: Optimized for rapid turnaround on Apple silicon hardware.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000007",
    title: "Software Engineering Roles and Responsibilities",
    description: "Detailed taxonomy of contemporary software development and engineering team specializations.",
    domain: "SOFTWARE_ENGINEERING",
    category: "Roles & Structure",
    source_type: "internal",
    content: `## Software Engineering Roles

### Frontend Engineer
Responsible for the client-side user experience, user interface components, and responsive layouts. Key competencies include modern HTML5/CSS3, TypeScript/JavaScript, React, Vue, Next.js, state management (Zustand, Redux), accessibility standards (WCAG 2.1), Web Vitals optimization, and cross-browser resilience.

### Backend Engineer
Constructs scalable server architectures, database engines, and API endpoints. Responsibilities include business logic implementation, database schema design and indexing (PostgreSQL, MySQL), caching mechanisms (Redis), authentication and authorization (JWT, OAuth2, RBAC), microservices, message queues (RabbitMQ, Kafka), and REST/GraphQL interface design.

### Full Stack Engineer
Bridges client-side application design with server-side architecture. Adept at navigating end-to-end data flow: from UI state transitions and client routing to server API endpoints, ORMs, database migrations, and cloud deployment pipelines.

### DevOps and Site Reliability Engineer (SRE)
Maintains high availability, continuous integration and delivery (CI/CD), infrastructure automation, and system resilience. Manages Docker containerization, Kubernetes orchestration, cloud providers (AWS, GCP, Azure), automated testing pipelines, and telemetry monitoring (Prometheus, Grafana, Datadog).

### System Architect
Defines the high-level structural design of software ecosystems. Evaluates architectural tradeoffs (monolith vs microservices, event-driven vs synchronous RPC), enforces security postures, data governance, and scalability roadmaps across engineering squads.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000008",
    title: "AI Engineering: Architectures, RAG, and LLM Orchestration",
    description: "Core concepts of production AI systems, vector retrieval, embeddings, and hybrid intelligence.",
    domain: "AI_ML",
    category: "AI & Vector Architectures",
    source_type: "internal",
    content: `## AI Engineering: Architectures and RAG

### The Anatomy of Production AI Systems
Modern AI applications move beyond naive single-prompt chatbots into structured hybrid orchestration:
1. **Deterministic Fast Path**: Rule-based classifiers, regex intent extractors, and cached lookup tables that answer instant queries within <10ms without wasting GPU compute.
2. **Database of Record (Live Truth)**: Relational database (Supabase PostgreSQL) holding mutable user state, project squads, creator profiles, and permission boundaries.
3. **Retrieval-Augmented Generation (RAG)**: Dense vector similarity search over curated knowledge corpora, preventing hallucination and providing external factual grounding.
4. **Local / Cloud Inference Models (Qwen3:4B, Ollama)**: Reasoning engines that synthesize evidence, generate natural language responses, and formulate creative narratives.

### Embeddings and Vector Search with pgvector
- **Embeddings**: Mathematical representations of text in high-dimensional vector space (e.g., nomic-embed-text generates 768-dimensional floating point vectors). Semantically similar concepts cluster close together in cosine distance space.
- **pgvector**: PostgreSQL extension allowing vector storage and nearest-neighbor indexing (HNSW, IVFFlat) directly alongside relational application tables.
- **Cosine Distance vs Inner Product**: In cosine similarity, 1.0 represents identical semantic alignment, while 0.0 represents orthogonal disconnection.

### Prompt Injection Defense and Grounding Contracts
- **Data vs Instructions**: RAG retrieval chunks must strictly be treated as untrusted data inputs, wrapped in explicit delimiters (<<<BEGIN_RETRIEVED_KNOWLEDGE>>>).
- **Zero Hallucination Contract**: The LLM must never invent database entities (creators, squad members, jobs) that do not exist in the live database of record.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000009",
    title: "Full Stack Web Development: Modern Web Architecture",
    description: "Foundations of scalable web applications: HTTP, REST, client-server models, and database design.",
    domain: "WEB_DEVELOPMENT",
    category: "Web Architecture",
    source_type: "internal",
    content: `## Full Stack Web Development Architecture

### Client-Server Architecture and REST
- **Client Tier**: Web browsers executing single-page applications (React, Vite, Next.js) requesting resources via asynchronous HTTP/Fetch.
- **Application Server Tier**: Node.js/Express, FastAPI, or serverless functions executing business rules, authenticating user sessions, and enforcing permission boundaries.
- **Database Tier**: Persistent relational stores (PostgreSQL) guaranteeing ACID transactions and data consistency.

### RESTful API Design Principles
A robust REST API follows predictable HTTP semantics:
- \`GET /api/projects\`: Idempotent retrieval of resource collections.
- \`POST /api/projects\`: Creation of a new resource with a validated request payload.
- \`PUT /api/projects/:id\`: Full idempotent replacement of an existing resource.
- \`PATCH /api/projects/:id\`: Partial update of specific fields without replacing the whole entity.
- \`DELETE /api/projects/:id\`: Idempotent removal of the resource.
- Standard HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error.

### Relational Database Schema Design
1. **Normalization (1NF to 3NF)**: Eliminating duplicate data anomalies by splitting entities into specialized tables linked by foreign keys.
2. **Indexes**: B-tree indexes on foreign keys and frequently queried fields (e.g., \`user_id\`, \`status\`, \`created_at\`) to prevent costly full table scans.
3. **Row Level Security (RLS)**: Enforcing data privacy policies at the PostgreSQL database engine layer rather than relying purely on client-side checks.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000010",
    title: "Project Architecture Design and Technical Blueprints",
    description: "Methodologies for transforming product briefs into production-grade technical blueprints.",
    domain: "PROJECT_MANAGEMENT",
    category: "System Design",
    source_type: "internal",
    content: `## Project Architecture Design

### Requirements Decomposition Framework
When designing an end-to-end technical project (such as an AI crop disease detection application or college festival portal):
1. **Target Users and Stakeholders**: Defining user personas (farmers, agronomists, field inspectors) and their core operational workflows.
2. **Functional Requirements**: Discrete capabilities the system must provide (image upload, offline inference, disease severity scoring, treatment prescription).
3. **Non-Functional Requirements**: System qualities including latency (<2s image diagnosis), offline capability, data security, mobile responsiveness, and 99.9% uptime.
4. **Architectural Components**:
   - Mobile / Web Frontend: Camera capture, geolocation tagging, offline indexedDB caching.
   - API Gateway and Ingestion Layer: Multipart upload handling, rate limiting, token validation.
   - AI / ML Inference Service: Pretrained Vision Transformer / CNN model running in ONNX or PyTorch container.
   - Relational Database: User profiles, historical diagnoses, field location coordinates.
   - Storage Layer: Object storage (S3 / Supabase Storage) for raw crop leaves imagery.

### Canonical Project Persistence
In OmniCraft, an architectural blueprint generated in AI Chat must be synchronized into the canonical project record. The center workspace must reflect the exact same persisted modules, database schema, team requirements, and risk factors as discussed in the conversation.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000011",
    title: "Skill Development and Evidence-Based Skill DNA",
    description: "Frameworks for competency mapping, verified skill evidence, and professional development.",
    domain: "CAREER_DEVELOPMENT",
    category: "Skill DNA",
    source_type: "internal",
    content: `## Skill Development and Skill DNA

### The Skill DNA Concept
Skill DNA in OmniCraft is an evidence-grounded representation of a creator's verified capabilities. Rather than arbitrary self-reported ratings, Skill DNA is synthesized from three authentic data vectors:
1. **Extracted Evidence**: Documented skills, years of experience, and tools extracted from authenticated resumes and work histories.
2. **Demonstrated Portfolio Work**: Uploaded artifacts, video reels, GitHub repositories, and verifiable project links.
3. **Completed Project Milestones**: Verified contributions to completed squads, collaborative peer reviews, and milestone sign-offs.

### Skill Gap Analysis
To calculate genuine skill gaps:
- Compare the **Required Target Skills** of a desired role against the creator's **Verified Skill DNA**.
- Categorize skills into:
  - **Mastered / Verified**: Sufficient authentic evidence exists.
  - **In Progress / Partial**: Basic familiarity demonstrated, advanced portfolio proof needed.
  - **Missing / Actionable**: Prerequisite gaps requiring deliberate hands-on project practice.
- The AI must never invent skill percentages or experience years without verifiable underlying evidence.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000012",
    title: "Learning Roadmaps and Milestone Progression",
    description: "Structuring progressive 10-stage learning journeys with milestone gates and hands-on deliverables.",
    domain: "CAREER_DEVELOPMENT",
    category: "Roadmaps",
    source_type: "internal",
    content: `## Learning Roadmaps and Milestone Progression

### The 10-Stage Learning Journey
To master a complex professional discipline (such as Full Stack Development, Cinematography, or AI Engineering), the journey is divided into sequential stages:
1. **Foundations & Core Principles**: Essential vocabulary, tooling setup, and conceptual syntax.
2. **Fundamental Tooling**: Development environments, cameras, IDEs, version control.
3. **Hands-On Basics**: Small contained exercises building muscle memory.
4. **Intermediate Techniques**: Multi-variable problems, lighting contrast ratios, state management.
5. **Architectural Thinking**: System organization, shot-listing, database schemas.
6. **Real-World Project Building**: Comprehensive end-to-end artifact creation.
7. **Refinement & Optimization**: Performance profiling, color grading, audio cleaning.
8. **Testing & Peer Review**: Code coverage, test screenings, feedback integration.
9. **Portfolio & Deployment**: Public hosting, film festival submissions, case studies.
10. **Professional Collaboration**: Cross-functional squad work, client pitches, and skill swaps.

### Milestone Verification Gates
Roadmap progression is locked to verifiable task completion. The AI reasoning engine provides prerequisite explanations, guidance, and project suggestions, but actual stage advancement is driven by the user's authentic completed deliverables.`,
  },
  {
    id: "a0000000-0000-4000-8000-000000000013",
    title: "OmniCraft Platform Architecture: Squads, Skill Swaps, and Hybrid Intelligence",
    description: "Core conceptual reference for the OmniCraft collaborative ecosystem.",
    domain: "OMNICRAFT",
    category: "Platform Concepts",
    source_type: "internal",
    content: `## OmniCraft Platform Concepts

### Collaborative Squads
A Squad in OmniCraft is a cross-functional creative team formed to execute an ambitious project. Squad members have clearly designated roles (e.g. Director, Cinematographer, Editor, Lead Actor). The creator of the squad serves as the project owner. Invitations sent to creators transition through states: PENDING, ACCEPTED, or DECLINED.

### Skill Swap
Skill Swap is a peer-to-peer barter mechanism enabling creators to exchange specialized services without monetary exchange (e.g. a Video Editor edits a musician's music video in exchange for original score composition).

### Creator vs Client Modes
- **Creator Mode**: Talent seeking collaborative squads, Skill Swaps, learning roadmaps, portfolio showcases, and freelance opportunities.
- **Client Mode**: Project owners or organizations seeking to hire qualified talent, manage project milestones, and assemble vetted creative teams.

### The Three-Panel OmniForge Studio
1. **Left Panel (AI Chat)**: Interactive conversational intelligence supporting deterministic actions, RAG retrieval, and Qwen reasoning.
2. **Center Panel (Interactive Workspace)**: Dynamic canvas displaying project blueprints, creator recommendations, Skill Gap matrices, and submission gates.
3. **Right Panel (Visual Roadmap Journey)**: Progressive 10-stage learning track featuring animated avatar positioning and verifiable milestone markers.`,
  },
];

/**
 * Checks if the knowledge corpus has already been ingested into Supabase pgvector.
 * If empty or force=true, automatically ingests all 13 initial documents.
 */
export async function seedInitialCorpusIfEmpty(force: boolean = false): Promise<{ seeded: number; skipped: boolean }> {
  try {
    const { count, error } = await (supabase as any)
      .from("knowledge_documents")
      .select("*", { count: "exact", head: true });

    if (!force && !error && typeof count === "number" && count >= INITIAL_KNOWLEDGE_CORPUS.length) {
      return { seeded: count, skipped: true };
    }

    console.log(`[RAG Corpus] Seeding ${INITIAL_KNOWLEDGE_CORPUS.length} authoritative knowledge documents...`);
    let seededCount = 0;

    for (const doc of INITIAL_KNOWLEDGE_CORPUS) {
      try {
        const res = await ingestDocument(doc);
        console.log(`[RAG Corpus] Ingested "${doc.title}": ${res.chunkCount} chunks (Doc ID: ${res.documentId})`);
        seededCount++;
      } catch (ingestErr: any) {
        console.warn(`[RAG Corpus] Failed to ingest "${doc.title}":`, ingestErr?.message);
      }
    }

    return { seeded: seededCount, skipped: false };
  } catch (err: any) {
    console.error(`[RAG Corpus] Failed to verify or seed initial corpus:`, err);
    return { seeded: 0, skipped: false };
  }
}
