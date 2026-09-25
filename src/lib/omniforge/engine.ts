import {
  ProjectDomain,
  OmniForgeProject,
  ProjectPhase,
  ProjectTask,
  ProjectRole,
  ParallelWorkstream,
  ProjectDeliverable,
  ChatMessage,
  ClarificationQuestion,
  CapabilityCoverage,
  OmniForgeIntent,
  AIResponseLevel,
  AIStructuredResponse,
  CreatorRecommendation,
  SkillSwapListingMatch,
  ConversationState,
} from "./types";
import { matchCreatorsForSingleRole, matchCreatorsForProject } from "./matcher";
import { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "./engine-blueprint";
import {
  classifyMessageSemanticIntent,
  extractRoleFromQuery,
  resolveAnaphoricRole,
  ClassifiedDecision,
} from "./intent-classifier";
import { searchRealSkillSwapListings } from "./skill-swap-matcher";
import {
  createInitialConversationState,
  transitionConversationState,
  generateContextualConversationResponse,
} from "./conversation-state";

// ============================================================================
// 1. DOMAIN DETECTION ENGINE
// ============================================================================

const DOMAIN_KEYWORDS: Record<ProjectDomain, string[]> = {
  "Film": ["film", "movie", "short film", "cinema", "documentary", "screenplay", "script", "cinematography", "actor", "actress", "director", "scene", "shoot", "footage", "trailer"],
  "Music": ["song", "music", "album", "track", "compose", "melody", "vocals", "singer", "beat", "mastering", "mixing", "producer", "audio production", "instrumental", "lyrics"],
  "AI / ML": ["machine learning", "deep learning", "neural network", "llm", "computer vision", "nlp", "model training", "dataset", "disease detection", "predictive model", "ai classifier"],
  "Mobile App": ["mobile app", "ios app", "android app", "react native", "flutter", "swift", "kotlin", "app store", "play store"],
  "Web App": ["web app", "website", "web application", "saas", "dashboard", "frontend", "full stack", "react", "next.js", "e-commerce site", "club website", "portal"],
  "Software": ["software", "api", "platform", "system", "database", "microservice", "infrastructure", "backend engine"],
  "Cybersecurity": ["cybersecurity", "security audit", "vulnerability", "pentesting", "infosec", "encryption", "firewall", "threat detection"],
  "Hardware / IoT": ["hardware", "iot", "sensor", "arduino", "raspberry pi", "embedded", "circuit", "robotics", "drone"],
  "Photography": ["photoshoot", "photography", "photographer", "portrait", "fashion shoot", "lookbook", "lighting setup", "retouching"],
  "Design": ["graphic design", "branding", "logo", "visual identity", "poster", "ui/ux", "wireframe", "figma", "typography"],
  "Animation": ["animation", "2d animation", "3d animation", "motion graphics", "rigging", "blender", "after effects", "cgi"],
  "Writing": ["book", "novel", "article", "copywriting", "creative writing", "content writing", "blog", "story", "ghostwriting", "manuscript"],
  "Content Creation": ["youtube", "tiktok", "reels", "influencer", "podcast", "vlog", "channel", "social content"],
  "Marketing": ["marketing", "campaign", "growth", "seo", "social media strategy", "lead generation", "paid ads"],
  "Advertising": ["ad", "commercial", "promotional video", "promo video", "brand advertisement", "restaurant ad", "billboard"],
  "Events": ["event", "festival", "college fest", "cultural festival", "conference", "hackathon", "meetup", "concert", "exhibition"],
  "Education": ["course", "curriculum", "tutorial", "learning platform", "workshop", "edtech"],
  "Business": ["business plan", "startup", "pitch deck", "go-to-market", "financial model", "product launch", "restaurant order", "ordering solution"],
  "Social Impact": ["ngo", "charity", "social campaign", "community initiative", "environmental", "sustainability", "awareness"],
  "Gaming": ["game", "unity", "unreal engine", "game design", "indie game", "gameplay", "level design"],
  "Research": ["research paper", "study", "data science", "survey", "academic", "whitepaper", "market analysis"],
  "Custom Project": []
};

export function detectProjectDomain(text: string): { primary: ProjectDomain; secondary?: ProjectDomain[] } {
  const lower = text.toLowerCase();
  const scoredDomains: Array<{ domain: ProjectDomain; score: number }> = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(" ") ? 3 : 1.5;
      }
    }
    if (score > 0) {
      scoredDomains.push({ domain: domain as ProjectDomain, score });
    }
  }

  scoredDomains.sort((a, b) => b.score - a.score);

  if (scoredDomains.length === 0) {
    return { primary: "Custom Project" };
  }

  const primary = scoredDomains[0].domain;
  const secondary = scoredDomains.slice(1, 3).map((d) => d.domain);

  return { primary, secondary: secondary.length > 0 ? secondary : undefined };
}

// Re-export role extraction helpers for backward compatibility
export const getLastDiscussedRole = resolveAnaphoricRole;
export const extractRoleFromText = extractRoleFromQuery;
export const classifyOmniForgeIntent = (
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[] = []
) => classifyMessageSemanticIntent(text, currentProject, conversationHistory);

// ============================================================================
// 2. GENERAL KNOWLEDGE & CONVERSATION HANDLERS
// ============================================================================

export function handleGeneralDialogue(
  query: string,
  intent: OmniForgeIntent = "UNKNOWN",
  targetRole?: string,
  currentProject?: OmniForgeProject | null
): AIStructuredResponse {
  const lower = query.toLowerCase().trim();
  const clean = lower.replace(/[?!.,]+$/, "").trim();

  // --------------------------------------------------------------------------
  // 1. E-COMMERCE WEBSITE DEVELOPMENT ROADMAP & STEPS
  // --------------------------------------------------------------------------
  if (
    clean.includes("ecommerce") ||
    clean.includes("e-commerce") ||
    clean.includes("online store") ||
    clean.includes("shopping website") ||
    (clean.includes("store") && clean.includes("website"))
  ) {
    if (
      clean.includes("step") ||
      clean.includes("how to") ||
      clean.includes("develop") ||
      clean.includes("build") ||
      clean.includes("roadmap") ||
      clean.includes("guide") ||
      clean.includes("make") ||
      clean.includes("plan")
    ) {
      return {
        intent: "HOW_TO",
        responseLevel: "SIMPLE_ANSWER",
        message: `### Comprehensive E-Commerce Website Development Roadmap

Here is a structured, production-ready guide to building a scalable e-commerce platform from conception to deployment:

---

#### 1. Requirements & Architecture Planning
* **Product Catalog & Business Model:** Define B2C/B2B structure, physical vs. digital inventory, SKU variants, and tax/shipping regions.
* **Tech Stack Selection:**
  * **Frontend:** Next.js / React (SSR/SSG for SEO and sub-second page loads), Tailwind CSS.
  * **Backend & API:** Node.js (Express/Fastify) or Next.js Server Actions / API Routes.
  * **Database & Auth:** PostgreSQL (Supabase / Prisma ORM) with Row-Level Security (RLS).
  * **Payments & Infrastructure:** Stripe / Razorpay, AWS S3 / Cloudinary for assets, Vercel for hosting.

---

#### 2. UI/UX Design & User Flows (Figma)
* **Design System:** Typography, accessible color tokens, responsive mobile-first grid.
* **Key Wireframes & Screens:**
  * Homepage with hero banner and featured collections.
  * Product Listing Page (PLP) with multi-facet filters (category, price, rating, size).
  * Product Detail Page (PDP) with high-res gallery, variant selector, and stock alerts.
  * Frictionless Slide-out Cart & One-Page Checkout.
  * User Account Portal (Order history, saved addresses, tracking).

---

#### 3. Database Schema & Data Modeling
* **Users & Auth:** \`id\`, \`email\`, \`password_hash\`, \`role\` (customer/admin), \`shipping_addresses\`.
* **Products & Categories:** \`id\`, \`title\`, \`slug\`, \`description\`, \`base_price\`, \`category_id\`.
* **Variants & Inventory:** \`id\`, \`product_id\`, \`sku\`, \`attributes\` (JSON: color, size), \`stock_quantity\`, \`price_adjustment\`.
* **Orders & Line Items:** \`id\`, \`user_id\`, \`status\` (pending, paid, fulfilled, refunded), \`total_amount\`, \`payment_intent_id\`.

---

#### 4. Frontend & Storefront Implementation
* **Product Discovery:** Instant search with debouncing, category breadcrumbs, pagination, and sorting.
* **State Management:** Persistent cart store (Zustand / React Context + LocalStorage sync).
* **Micro-Interactions:** Optimistic UI cart updates, skeleton loaders, and toast notifications.

---

#### 5. Backend APIs & Authentication
* **Authentication:** Secure session cookies (JWT / Supabase Auth) with OAuth (Google/GitHub).
* **REST/GraphQL Endpoints:**
  * \`GET /api/products\`, \`GET /api/products/:slug\`
  * \`POST /api/cart\`, \`POST /api/checkout/session\`
  * \`GET /api/orders\`, \`POST /api/webhooks/stripe\`

---

#### 6. Payment Integration & Security
* **Gateway Setup:** Stripe Elements or Razorpay Checkout with webhooks for asynchronous fulfillment.
* **Idempotency & Webhooks:** Validate Stripe signature headers (\`stripe-signature\`) and ensure orders are only fulfilled once.
* **Compliance & Security:** PCI-DSS compliance (no raw card data on server), HTTPS/SSL, CORS whitelisting, and rate limiting.

---

#### 7. Order Processing & Admin Dashboard
* **Order Lifecycle:** Automated confirmation emails, invoice PDF generation, tracking number dispatch.
* **Admin Capabilities:** Inventory replenishment alerts, revenue analytics, customer lookup, and order status overrides.

---

#### 8. Testing, Deployment & Monitoring
* **Testing:** Automated unit tests for cart calculation, integration tests for checkout, E2E tests with Playwright.
* **CI/CD & Deployment:** GitHub Actions pipeline to Vercel/Docker, production database migrations, CDN asset caching.
* **Performance & SEO:** Schema.org Product JSON-LD markup, dynamic Open Graph tags, Core Web Vitals optimization.`,
        suggestedFollowUps: [
          "What database schema is best for products?",
          "How do I integrate Stripe webhooks?",
          "Find creators for my e-commerce team",
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 2. GENERAL WEBSITE & APP DEVELOPMENT ROADMAP
  // --------------------------------------------------------------------------
  if (
    clean.includes("steps to develop a website") ||
    clean.includes("steps to make a website") ||
    clean.includes("steps to build a website") ||
    clean.includes("steps to develop the website") ||
    clean.includes("steps to develop a web app") ||
    clean.includes("steps to develop an app") ||
    clean.includes("guide to develop a website") ||
    clean.includes("how to develop a website") ||
    clean.includes("how to build a website") ||
    clean.includes("roadmap to develop a website") ||
    clean.includes("make the steps to develop a website")
  ) {
    return {
      intent: "HOW_TO",
      responseLevel: "SIMPLE_ANSWER",
      message: `### End-to-End Website Development Roadmap

Here are the essential stages for developing a high-performance modern website:

---

#### 1. Discovery & Project Scoping
* **Define Goals:** Target audience, core value proposition, key performance indicators (KPIs).
* **Information Architecture:** Sitemap hierarchy, content outline, user journey mapping.

---

#### 2. UI/UX Design & Prototyping
* **Wireframing:** Low-fidelity sketches to establish visual hierarchy and layout balance.
* **Visual Design System:** Typography, color palettes, responsive breakpoints (Desktop, Tablet, Mobile) in Figma.
* **Interactive Prototype:** Test user navigation, button states, and flow transitions.

---

#### 3. Frontend Architecture
* **Framework:** React / Next.js / Vite for component-driven UI.
* **Styling:** Tailwind CSS or Modern Modular CSS for fluid, maintainable styling.
* **Accessibility (a11y):** Semantic HTML5, ARIA attributes, keyboard navigation, and contrast compliance.

---

#### 4. Backend & Database (If Dynamic)
* **API Layer:** Node.js, Express, or Next.js server endpoints for data operations.
* **Database:** PostgreSQL / Supabase for structured relational storage with automated migrations.
* **Authentication:** Secure user login with OAuth and encrypted session tokens.

---

#### 5. Content Integration & SEO
* **Content:** Engaging copywriting, high-resolution optimized images (WebP/AVIF format).
* **On-Page SEO:** Meta title/description tags, Open Graph preview tags, and XML sitemaps.

---

#### 6. Quality Assurance & Testing
* **Cross-Browser & Device Testing:** Verify layout on Chrome, Safari, Firefox, iOS, and Android.
* **Performance Audit:** Google Lighthouse audit targeting 90+ across Performance, Accessibility, Best Practices, and SEO.

---

#### 7. Deployment, CI/CD & Launch
* **Hosting:** Vercel, Netlify, or Cloudflare Pages with SSL certification and custom domain DNS routing.
* **CI/CD Automation:** Automated linting, test suites, and build validation on every Git commit.
* **Analytics & Health Monitoring:** Real-user analytics, uptime checks, and error logging with Sentry.`,
      suggestedFollowUps: [
        "What tech stack should I choose?",
        "How do I structure the frontend components?",
        "Find a UI/UX designer and web developer",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 3. SCREENPLAY & CREATIVE WRITING
  // --------------------------------------------------------------------------
  if (
    clean.includes("write a screenplay") ||
    clean.includes("write a script") ||
    clean.includes("write a short film screenplay") ||
    clean.includes("screenplay about") ||
    clean.includes("write a suspense thriller") ||
    clean.includes("write a scene")
  ) {
    let subject = "A Missing Student";
    if (clean.includes("lost key")) subject = "The Lost Key";
    else if (clean.includes("village girl")) subject = "The Village Singer";
    else if (clean.includes("detective") || clean.includes("mystery")) subject = "Midnight Investigation";

    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message: `### Short Film Screenplay: *"${subject}"*

**TITLE: ${subject.toUpperCase()}**
**GENRE:** Suspense / Drama
**FORMAT:** Short Film (5 Minutes)

---

**EXT. UNIVERSITY ARCHIVES - NIGHT**

A heavy thunderstorm hammers the gothic stone facade. Rain cascades down the gargoyles. Lightning fractures across the black sky.

MAYA (22), soaked in an oversized yellow raincoat, clutches a cracked tablet against her chest. Her eyes dart nervously across the empty courtyard.

She reaches the heavy brass door. It is ajar. A single beam of flickering amber light spills out into the dark.

**MAYA**
*(whispering into her voice recorder)*
If I'm not back by sunrise... check Professor Vance's basement terminal. File 804.

She pushes the door open. It GROANS against the wind.

---

**INT. ARCHIVES - CONTINUOUS**

Towering bookshelves vanish into the vaulted shadows. Dust motes dance in the amber light. Water DRIPS into a rusted metal bucket with rhythmic precision: *TICK... TICK... TICK.*

Maya steps inside. Her wet sneakers SQUEAK against the polished marble floor.

**MAYA**
Rohan? Are you in here?

No answer. Only the low HUM of an antique server rack in the corner.

She approaches the reading desk. In the center sits an open leather notebook. Fresh blue ink glistens under the green desk lamp.

Maya leans closer. The page reads:
*"THEY KNOW YOU'RE COMING, MAYA."*

A FLOORBOARD CREAKS directly behind her.

Maya FREEZES. She slowly turns around.

Standing in the shadow between two book stacks is a TALL FIGURE in a dark trench coat, clutching an iron key card.

**FIGURE (O.S.)**
You shouldn't have dug into the archives, Maya.

Lightning FLASHES through the stained glass, illuminating the Figure's face for a split second—

**FADE OUT.**

---
*Would you like to expand this into a multi-scene shooting script, generate a shot list, or plan casting for the actors?*`,
      suggestedFollowUps: [
        "Generate a shot list for this scene",
        "Plan the shooting schedule",
        "Find actors for Maya and the Figure",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 4. "EXPLAIN THE NEXT STEP" / "WHAT IS THE NEXT STEP"
  // --------------------------------------------------------------------------
  if (
    clean.includes("explain the next step") ||
    clean.includes("what is the next step") ||
    clean.includes("what is next") ||
    clean.includes("what should we do next") ||
    clean.includes("what should i do next") ||
    clean.includes("explain next step")
  ) {
    if (currentProject) {
      const activePhase = currentProject.phases?.find((p) => p.tasks?.some((t) => t.status === "to_do" || t.status === "in_progress")) || currentProject.phases?.[0];
      const pendingTasks = activePhase?.tasks?.filter((t) => t.status === "to_do" || t.status === "in_progress") || [];

      if (pendingTasks.length > 0) {
        const topTask = pendingTasks[0];
        const taskList = pendingTasks.map((t) => `• **${t.title}** (${t.requiredRole} — Est. ${t.estimatedDuration})`).join("\n");
        return {
          intent: "PROJECT_STATUS",
          responseLevel: "CONTEXTUAL_ANSWER",
          message: `### Next Step for **${currentProject.title}**

Your immediate priority is **${topTask.title}** within **${activePhase?.name || "Stage 1"}**.

#### Why this comes next:
Completing this milestone establishes the core foundation before downstream production and execution can proceed.

#### Current actionable tasks:
${taskList}

You can assign tasks, invite creators, or adjust milestone dates directly in your workspace!`,
          suggestedFollowUps: [
            "Find creators for this step",
            "What comes after this stage?",
            "View Workspace Roadmap",
          ],
        };
      }
    }

    return {
      intent: "PROJECT_STATUS",
      responseLevel: "SIMPLE_ANSWER",
      message: `### Recommended Next Step

Based on standard development best practices:
1. **Solidify the Scope:** Define the minimum viable deliverable (MVP) features or core script scenes.
2. **Assign Core Roles:** Confirm who is handling design/architecture or directing/cinematography.
3. **Set Milestones:** Establish a clear target timeline for Pre-Production / Sprint 1.

Would you like to generate a detailed project plan or explore verified creators for your team?`,
      suggestedFollowUps: [
        "Generate a project blueprint",
        "Find verified creators",
        "What is Skill Swap?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 5. CHIT-CHAT & CASUAL GREETINGS
  // --------------------------------------------------------------------------
  if (intent === "GENERAL_CONVERSATION" || clean === "hi" || clean === "hello" || clean === "hey") {
    if (clean.includes("joke") || clean.includes("laugh")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Why did the developer go broke? Because they used up all their cache! 😄\n\nWhat are you working on or planning to build today?",
        suggestedFollowUps: ["I want to build a website", "I want to make a short film", "What can you do?"],
      };
    }
    if (clean.includes("how are you") || clean.includes("how's it going") || clean.includes("whats up")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "I'm doing great and ready to build! What would you like to explore or create today?",
        suggestedFollowUps: ["I want to build an e-commerce website", "I want to make a film", "What is Skill Swap?"],
      };
    }
    if (clean.includes("thank") || clean.includes("thanks") || clean.includes("helpful")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "You're very welcome! Let me know whenever you'd like to brainstorm an idea, write code, outline steps, or find creators.",
        suggestedFollowUps: ["What can you do?", "How does Skill Swap work?"],
      };
    }
    if (clean.includes("confused") || clean.includes("don't know what") || clean.includes("dont know what")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "No problem at all! Feel free to brainstorm with me, ask questions about tech and filmmaking, or explore what's possible on OmniCraft whenever you're ready.",
        suggestedFollowUps: ["What can you do?", "What is a director?", "How does Skill Swap work?"],
      };
    }
    if (clean === "bye" || clean === "goodbye" || clean.includes("see you")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Goodbye! Feel free to return anytime you want to develop an idea or collaborate with creators. Have a great day!",
        suggestedFollowUps: ["Hi", "What can you do?"],
      };
    }
    if (clean === "ok" || clean === "okay" || clean === "cool" || clean === "got it" || clean === "great" || clean === "nice" || clean === "sweet") {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Sounds great! Where would you like to go next?",
        suggestedFollowUps: ["I want to make a short film", "I want to build a website", "What is Skill Swap?"],
      };
    }
    return {
      intent: "GENERAL_CONVERSATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Hello! I'm OmniForge AI, your intelligent project architect and conversational creator assistant. How can I help you today? You can ask me technical questions, brainstorm creative ideas, plan website or film roadmaps, or discover creators.",
      suggestedFollowUps: [
        "Can you provide the steps to develop the ecommerce website?",
        "I have an idea for a short film",
        "What is React?",
        "What can you do?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 6. CAPABILITIES & DEFINITIONS
  // --------------------------------------------------------------------------
  if (clean.includes("what can you do") || clean.includes("who are you") || clean.includes("help me")) {
    return {
      intent: "GENERAL_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message: `I'm OmniForge AI, your comprehensive project architect and creative partner. Here's what I can do for you:

1. **Conversational Assistant:** Answer technical, creative, and planning questions (programming, screenwriting, architecture).
2. **Project Roadmaps:** Provide comprehensive step-by-step blueprints for websites, e-commerce stores, apps, films, and events.
3. **Creator Discovery:** Search and match real verified creators from the OmniCraft network (directors, developers, editors, designers).
4. **Squad Orchestration:** Form cross-functional teams and set up collaborative workspaces.
5. **Skill Swap:** Connect you with creators willing to trade skills without cash transactions.`,
      suggestedFollowUps: [
        "Can you provide the steps to develop the ecommerce website?",
        "I want to make a short film",
        "Explain Skill Swap",
      ],
    };
  }

  // Technical definitions
  if (clean.includes("react") || clean === "what is react") {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: `### What is React?

**React** is an open-source, component-based JavaScript library created by Meta for building dynamic, high-performance user interfaces, particularly Single-Page Applications (SPAs) and web applications.

#### Key Core Concepts:
* **Components:** Reusable, self-contained building blocks of UI (functional components with JSX).
* **Virtual DOM:** React keeps an in-memory representation of the real DOM and computes minimal diffs to update the page efficiently.
* **State & Hooks:** Reactive state management using built-in hooks like \`useState\`, \`useEffect\`, \`useMemo\`, and \`useCallback\`.
* **Unidirectional Data Flow:** Data flows down from parent to child components via props, making applications predictable and easier to debug.
* **Ecosystem:** Powers modern frameworks like Next.js, Remix, and React Native for cross-platform mobile apps.`,
      suggestedFollowUps: [
        "What is Next.js?",
        "What is an API?",
        "Can you provide the steps to develop the ecommerce website?",
      ],
    };
  }

  if (clean.includes("python") || clean.includes("learn python")) {
    return {
      intent: "HOW_TO",
      responseLevel: "SIMPLE_ANSWER",
      message: `**Python** is a versatile, high-level programming language known for its clean, human-readable syntax. It is widely used in AI, data analysis, backend development, and script automation.

**Practical 4-Step Learning Path:**
1. **Core Fundamentals:** Variables, data structures (lists, dicts), loops, and functions.
2. **Hands-on Practice:** Build small CLI projects (e.g. text adventure, calculator, file renamer).
3. **Domain Libraries:** Explore FastAPI for web backends or Pandas/PyTorch for data & AI.
4. **Version Control:** Use Git and collaborate with developers on OmniCraft.`,
      suggestedFollowUps: ["What is an API?", "What is a database?", "I want to build a website"],
    };
  }

  if (clean.includes("writer") && clean.includes("director")) {
    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message: `**Screenwriter vs. Film Director:**

* **The Screenwriter** creates the narrative on paper — crafting the plot structure, scene descriptions, pacing, and spoken dialogue.
* **The Film Director** translates that written script into living audio-visual reality — coaching actors on emotional subtext, deciding camera angles with the DoP, and shaping the rhythm during editing.

In many independent films, the director also writes the screenplay (an *auteur* approach), which maintains pure creative continuity with minimal budget.`,
      suggestedFollowUps: [
        "Can a director also edit?",
        "I want to make a short film",
        "What is cinematography?",
      ],
    };
  }

  if (clean.includes("what is next.js") || clean.includes("what is nextjs") || clean.includes("next.js") || clean.includes("nextjs")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: `### What is Next.js?

**Next.js** is a full-stack React framework created by Vercel that adds server-side rendering (SSR), static site generation (SSG), server actions, optimized routing, and automatic asset optimization on top of React.`,
      suggestedFollowUps: ["What is React?", "What is an API?"],
    };
  }

  if (clean.includes("html")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "HTML (HyperText Markup Language) is the fundamental standard markup language used to structure web pages and their content (headings, paragraphs, links, images, forms, and media).",
      suggestedFollowUps: ["What is React?", "What is an API?"],
    };
  }

  if (clean.includes("api") || clean.includes("what is api")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "An API (Application Programming Interface) is a defined set of protocols that allows different software applications and systems to communicate, exchange data, and execute actions securely.",
      suggestedFollowUps: ["What is React?", "What is a database?"],
    };
  }

  if (clean.includes("database") || clean.includes("postgresql") || clean.includes("supabase")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A database is an organized collection of structured data stored electronically. PostgreSQL is an advanced open-source relational SQL database, and Supabase is an open-source Firebase alternative providing PostgreSQL with real-time subscriptions, authentication, and storage.",
      suggestedFollowUps: ["What is an API?", "What is React?"],
    };
  }

  if (clean.includes("ai") || clean.includes("artificial intelligence")) {
    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Artificial Intelligence (AI) refers to computational systems engineered to perform complex cognitive tasks historically requiring human intelligence—including natural language processing, visual recognition, pattern synthesis, and decision making.",
      suggestedFollowUps: ["What is machine learning?", "How does an API work?"],
    };
  }

  if (clean.includes("what is a director") || clean.includes("what does a director do") || clean.includes("film director")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A film director is the lead creative visionary who guides the artistic and dramatic aspects of a film—working with actors on performances and collaborating with the cinematographer, sound designer, and editor to shape the overall visual narrative.",
      suggestedFollowUps: ["What does a cinematographer do?", "Find me a director"],
    };
  }

  if (clean.includes("cinematograph") || clean.includes("dop") || clean.includes("director of photography")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A Cinematographer (Director of Photography / DoP) oversees camera operation, lenses, composition, and lighting design. They translate the director's script into evocative visual shots, moods, and color palettes.",
      suggestedFollowUps: ["What does a director do?", "Find a cinematographer"],
    };
  }

  if (clean.includes("what is a squad") || clean.includes("squad in omnicraft")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A Squad in OmniCraft is a cross-functional collaborative team assembled around a specific project. Squad members share an integrated workspace, task dependency board, shared assets, group chat, and milestone tracking.",
      suggestedFollowUps: ["Can I create a Squad for my project?", "How does Skill Swap work?"],
    };
  }

  if (clean.includes("skill swap")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Skill Swap is OmniCraft's peer-to-peer collaboration model where creators trade expertise directly without money. For example, a video editor can exchange color grading for original soundtrack composition or UI/UX design.",
      suggestedFollowUps: ["How do I start a Skill Swap?", "Can I swap skills for my project?"],
    };
  }

  if (clean.includes("speed of light")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s or 186,282 miles per second).",
      suggestedFollowUps: ["What is AI?", "What can you do?"],
    };
  }

  // --------------------------------------------------------------------------
  // 7. DEFAULT CONVERSATIONAL RESPONSE
  // --------------------------------------------------------------------------
  if (currentProject) {
    return {
      intent: "GENERAL_CONVERSATION",
      responseLevel: "SIMPLE_ANSWER",
      message: `I'm here to assist you with **${currentProject.title}** or answer any creative, technical, and development questions! You can ask about next steps, roadmap roadmaps, coding architecture, screenplay writing, or finding verified creators.`,
      suggestedFollowUps: [
        "What should we do next?",
        "Can you provide the steps to develop the ecommerce website?",
        "Find creators for my project",
      ],
    };
  }

  return {
    intent: "GENERAL_CONVERSATION",
    responseLevel: "SIMPLE_ANSWER",
    message: `I'm ready to help! You can ask me technical development questions, request detailed website or film roadmaps, brainstorm creative screenplays, or search for verified OmniCraft creators. What's on your mind?`,
    suggestedFollowUps: [
      "Can you provide the steps to develop the ecommerce website?",
      "Can you make the steps to develop a website?",
      "What is React?",
      "I have an idea for a short film",
    ],
  };
}

// ============================================================================
// 3. SKILL SWAP HANDLER (Integrated Real Supabase Search & Guidance)
// ============================================================================

export async function handleSkillSwapQuery(
  query: string,
  currentUserId: string = "anon",
  currentProject: OmniForgeProject | null = null
): Promise<AIStructuredResponse> {
  const lower = query.toLowerCase();

  // General Skill Swap explanation
  const isGeneralExplanation =
    lower.includes("what is skill swap") ||
    lower.includes("how does skill swap work") ||
    lower.includes("how do i start a skill swap") ||
    lower.includes("can i offer my skills");

  if (isGeneralExplanation && !lower.includes("exchange editing") && !lower.includes("for my project")) {
    return {
      intent: "SKILL_SWAP_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Skill Swap is OmniCraft's peer-to-peer collaboration model where creators trade expertise directly without money. For example, a video editor can exchange color grading or cutting for cinematography, original soundtrack composition, or UI/UX design.\n\nEvery creator defines skills they can teach or provide, and skills they want to learn or receive in return.",
      suggestedFollowUps: [
        "Can I swap skills for my project?",
        "Can I exchange editing for cinematography?",
        "Find creators who offer Skill Swap",
      ],
    };
  }

  // Parse what the user wants to offer and what they need
  let needSkill = "";
  let offerSkill = "";

  if (lower.includes("editing") || lower.includes("editor")) {
    if (lower.includes("need") && (lower.includes("need an editor") || lower.includes("need editing"))) {
      needSkill = "Video Editing";
    } else {
      offerSkill = "Video Editing";
    }
  }

  if (lower.includes("cinematographer") || lower.includes("cinematography") || lower.includes("shoot") || lower.includes("camera")) {
    needSkill = "Cinematography";
  }

  if (lower.includes("poster") || lower.includes("graphic design") || lower.includes("design")) {
    if (lower.includes("design the poster") || lower.includes("offer design")) {
      offerSkill = "Graphic Design";
    } else if (!offerSkill) {
      needSkill = "Graphic Design";
    }
  }

  if (lower.includes("website") || lower.includes("developer") || lower.includes("web")) {
    if (lower.includes("helps with my website") || lower.includes("need a website")) {
      needSkill = "Web Development";
    } else if (!offerSkill) {
      offerSkill = "Web Development";
    }
  }

  // Search real database listings
  const realListings = await searchRealSkillSwapListings({
    needSkillOrRole: needSkill,
    offerSkill: offerSkill,
    currentUserId,
    limit: 3,
  });

  if (realListings.length > 0) {
    const listingLines = realListings
      .map(
        (l) =>
          `• **${l.creatorName}** (${l.title})\n  *Offering:* ${l.teachSkills.join(", ")} | *Looking for:* ${l.learnSkills.join(", ")}`
      )
      .join("\n\n");

    const message = `Yes! Skill Swap allows you to collaborate without cash by exchanging work. Here are real active Skill Swap listings from the OmniCraft network:\n\n${listingLines}\n\nWould you like to propose an exchange with one of these creators, or post your own Skill Swap listing?`;

    return {
      intent: "SKILL_SWAP_SEARCH",
      responseLevel: "CREATOR_DISCOVERY",
      message,
      skillSwapCards: realListings,
      uiAction: {
        type: "SHOW_SKILL_SWAP_MATCHES",
      },
      suggestedFollowUps: [
        "Post a Skill Swap listing",
        "Find verified creators",
        "How do I create a listing?",
      ],
    };
  }

  // Fallback when no active listing matches the exact pair
  return {
    intent: "SKILL_SWAP_SEARCH",
    responseLevel: "SIMPLE_ANSWER",
    message: `Yes, you can collaborate through Skill Swap! In your case, you can offer **${offerSkill || "your skills"}** in return for **${needSkill || "collaborator support"}**.\n\nCurrently, there are no active listings specifically trading that exact pair. However, you can publish a new Skill Swap listing to broadcast your offer to the entire creator network!`,
    suggestedFollowUps: [
      "How do I create a listing?",
      "Find creators for my project",
      "Can I combine roles instead?",
    ],
  };
}

// ============================================================================
// 4. AMBIGUOUS & INDIRECT PROJECT HANDLERS
// ============================================================================

export function handleClarificationQuery(query: string): AIStructuredResponse {
  const lower = query.toLowerCase();

  if (lower.includes("farmers") || lower.includes("farm")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What are you trying to create for farmers — a mobile app, an online marketplace, an educational campaign, a research initiative, or something else?",
      clarifications: [
        {
          id: "farmer_type",
          question: "What format best describes what you want to create?",
          fieldTarget: "project_type",
          options: ["Mobile / Web Application", "Educational Video / Campaign", "Community Marketplace", "Research Project"],
        },
      ],
      suggestedFollowUps: ["A mobile app for crop advice", "An awareness video series"],
    };
  }

  if (lower.includes("college")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What are you planning for your college — a club website, a cultural festival, a student showcase, or something else?",
      clarifications: [
        {
          id: "college_type",
          question: "What are you looking to organize or build?",
          fieldTarget: "project_type",
          options: ["College Club Website", "Cultural Festival Event", "Student Film Project", "Campus App"],
        },
      ],
      suggestedFollowUps: ["A website for our college club", "A college cultural festival"],
    };
  }

  if (lower.includes("story")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Great! Tell me a little about the story premise — are you planning to turn it into a short narrative film, an animated piece, an audio drama, or a book?",
      clarifications: [
        {
          id: "story_format",
          question: "What format are you envisioning?",
          fieldTarget: "story_format",
          options: ["Short Narrative Film", "Animated Video", "Audio Drama / Podcast", "Written Book / Novel"],
        },
      ],
      suggestedFollowUps: ["I wrote a story about a village girl who wants to become a singer", "An animated short film"],
    };
  }

  if (lower.includes("ai")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What kind of AI project are you thinking of — an intelligent web/mobile app, an AI-enhanced documentary, a computer vision tool, or a research model?",
      clarifications: [
        {
          id: "ai_type",
          question: "What type of AI application are you planning?",
          fieldTarget: "ai_type",
          options: ["Web / Mobile AI App", "AI-Powered Documentary", "Vision / Image Classifier", "NLP / Chat Tool"],
        },
      ],
      suggestedFollowUps: ["An AI documentary about traditional crafts", "An AI disease detector"],
    };
  }

  if (lower.includes("actor") || lower.includes("actress") || lower.includes("casting")) {
    return {
      intent: "CREATOR_SEARCH",
      responseLevel: "CONTEXTUAL_ANSWER",
      message:
        "Absolutely! Let's find an actor who fits your short film. I'll ask a few questions to understand the character and your requirements.\n\nWhat type of role is it — lead, supporting, antagonist, or another character?",
      suggestedFollowUps: ["Lead actor", "Supporting actor", "Villain or antagonist", "I need multiple actors"],
    };
  }

  if (lower.includes("film") || lower.includes("short film") || lower.includes("movie")) {
    return {
      intent: "PROJECT_IDEA",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Great! What is the central idea or story you're planning? Tell me a little about the premise, genre, or the message you want to convey.",
      suggestedFollowUps: ["Suspense thriller", "Drama / Emotional", "Comedy short", "Sci-Fi / Concept"],
    };
  }

  if (lower.includes("website") || lower.includes("web app")) {
    return {
      intent: "PROJECT_IDEA",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Great! What is the website for — a business, college project, portfolio, e-commerce store, or something else?",
      suggestedFollowUps: [
        "College club website",
        "Personal portfolio",
        "Business / Startup site",
        "E-commerce store",
      ],
    };
  }

  return {
    intent: "CLARIFICATION",
    responseLevel: "SIMPLE_ANSWER",
    message: "What are you thinking of creating — an app, product, campaign, creative film, music track, or something else?",
    clarifications: [
      {
        id: "general_idea",
        question: "What type of project would you like to plan?",
        fieldTarget: "project_type",
        options: ["Website or Web App", "Short Film or Video", "Music Production", "College Event or Fest"],
      },
    ],
    suggestedFollowUps: ["I want to create a website for our college club", "I have an idea for a short film"],
  };
}

export function handleIndirectProjectProblem(query: string): AIStructuredResponse {
  const lower = query.toLowerCase();

  if (lower.includes("college") || lower.includes("club") || lower.includes("students")) {
    return {
      intent: "PROJECT_PROBLEM",
      responseLevel: "SIMPLE_ANSWER",
      message: "It sounds like you need a way to keep students updated about events and make registration easier. A simple event-management website could help with both.\n\nWould you like me to turn this into a project plan, or would you prefer to explore other solutions first?",
      suggestedFollowUps: ["Build a solution for this", "What roles would I need?", "Not right now"],
    };
  }

  return {
    intent: "PROJECT_PROBLEM",
    responseLevel: "SIMPLE_ANSWER",
    message: "I understand the challenge: phone orders can cause order errors, busy phone lines, and manual record keeping. A digital ordering web application with an online menu, automated order alerts, and customer receipt tracking would make this much smoother.\n\nWould you like me to architect a simple project blueprint for an online ordering website?",
    suggestedFollowUps: ["Yes, build a project plan for this", "What roles would I need?", "Not right now"],
  };
}

// ============================================================================
// 5. CONTEXTUAL PROJECT & ROLE QUESTIONS (Preserves Active Project)
// ============================================================================

export function handleContextualProjectQuestion(
  query: string,
  targetRole: string,
  project: OmniForgeProject,
  conversationHistory: ChatMessage[] = []
): AIStructuredResponse {
  const lower = query.toLowerCase();

  // "How would I make it?" / "How can I actually turn this idea into a film?" / "Show me the plan"
  if (lower.includes("how would i make it") || lower.includes("how can i actually turn this idea into a film") || lower.includes("show me the plan")) {
    const stagesList = project.phases.map((p, idx) => `${idx + 1}. **${p.name}:** ${p.description}`).join("\n");
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Here is the execution roadmap for **${project.title}** in ${project.phases.length} clear stages:\n\n${stagesList}\n\nWould you like to review the required team roles or find creators?`,
      suggestedFollowUps: ["Who would I need?", "Find me a director", "Do I need a producer?"],
    };
  }

  // Stage and Phase explanations
  if (lower.includes("first stage") || lower.includes("stage 1") || lower.includes("initial stage")) {
    const firstPhase = project.phases[0];
    const taskDetails = (firstPhase?.tasks || []).map((t) => `• **${t.title}** (${t.requiredRole} — ${t.estimatedDuration})`).join("\n");
    return {
      intent: "PHASE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `In **Stage 1: ${firstPhase?.name || "Discovery & Planning"}** for **${project.title}**, the objective is: ${firstPhase?.description || "Initial groundwork and pre-production"}.\n\nKey work items in this stage:\n${taskDetails || "• Requirements scoping and asset gathering."}`,
      suggestedFollowUps: ["Explain the next stage", "Who do I need for this stage?", "What should we do first?"],
    };
  }

  // "Who would I need?" / "Who else do I need?"
  if (lower.includes("who would i need") || lower.includes("who else do i need")) {
    const rolesList = project.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, you will need:\n\n${rolesList}\n\nYou can cover roles with your existing team, use Skill Swap, or find verified OmniCraft creators.`,
      suggestedFollowUps: ["I already have a writer", "Do I need a director?", "Find creators"],
    };
  }

  // "Why do we need an editor?" / "Why do I need an editor?"
  if (lower.includes("why do we need an editor") || lower.includes("why do i need an editor")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the Video Editor turns raw multi-angle footage into a compelling story. They establish pacing, cut scenes to match emotional song moments, and ensure smooth continuity between dialogue and visuals.`,
      roleCard: {
        roleName: "Video Editor",
        category: "Creative",
        purpose: "Assembles raw footage, creates narrative rhythm, and color grades.",
        skills: ["Premiere Pro", "DaVinci Resolve", "Color Grading"],
      },
      suggestedFollowUps: ["Can the director do that instead?", "What would happen if we remove the editor?"],
    };
  }

  // "Can the director do that instead?" / "Can the director also edit?" / "Can they also edit?"
  if (
    lower.includes("can the director do that instead") ||
    lower.includes("can the director edit") ||
    lower.includes("can the director also edit") ||
    lower.includes("can they also edit") ||
    lower.includes("can they edit")
  ) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Yes! For a short indie film like **${project.title}**, a Director with editing skills can handle both roles to preserve their creative vision and keep the team lean. You would just need to confirm they have the editing software experience and bandwidth.`,
      suggestedFollowUps: ["Okay, find someone who can do both.", "What would happen if we remove the editor?"],
    };
  }

  // "What would happen if we remove the editor?"
  if (lower.includes("what would happen if we remove the editor") || lower.includes("remove the editor")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `If you remove the dedicated editor, the director or another team member must take on cutting the footage, color grading, and export mastering. This keeps the team lean but increases the post-production workload for that person.`,
      suggestedFollowUps: ["Okay, find someone who can do both.", "Keep the editor", "Find an editor"],
    };
  }

  // "Can they do it?" / Pronoun capability query
  if (lower.includes("can they do it") || lower.includes("can they handle it") || lower.includes("can they do that")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Yes! A skilled **${targetRole}** can handle this task efficiently, ensuring high quality and smooth execution for **${project.title}**.`,
      suggestedFollowUps: [`Find a ${targetRole.toLowerCase()}`, "What should we do next?"],
    };
  }

  // "How does editing fit into my project?"
  if (lower.includes("how does editing fit into my project") || lower.includes("how does editing fit")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Editing happens during the post-production phase of **${project.title}**, right after principal photography is completed. The editor synchronizes recorded audio with camera video, cuts scenes, applies color grading, and prepares the master export.`,
      suggestedFollowUps: ["Find an editor", "What should we do next?"],
    };
  }

  // Specific role definitions within project
  if (targetRole === "UI/UX Designer" || lower.includes("designer")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the UI/UX Designer creates the wireframes, visual theme, responsive page layouts, and interactive Figma mockups before frontend development begins.`,
      roleCard: {
        roleName: "UI/UX Designer",
        category: "Creative",
        purpose: "Designs screen wireframes, visual themes, and user experience flows in Figma.",
        skills: ["Figma", "Wireframing", "UI Design", "Prototyping"],
      },
      suggestedFollowUps: ["Find me a designer", "What should we do next?"],
    };
  }

  if (targetRole === "Film Director" || lower.includes("director")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the Director guides actor performances, determines camera framing with the cinematographer, and ensures the story's emotional authenticity. In your story, the director would help bring the village girl's journey to life.`,
      roleCard: {
        roleName: "Film Director",
        category: "Creative",
        purpose: "Directs actors, guides camera scenes, and maintains creative vision throughout.",
        skills: ["Directing", "Shot List Creation", "Pacing & Rhythm"],
      },
      suggestedFollowUps: ["Can the director also edit?", "Okay, find one", "Do I need a producer?"],
    };
  }

  return {
    intent: "ROLE_QUESTION",
    responseLevel: "CONTEXTUAL_ANSWER",
    message: `For **${project.title}**, the **${targetRole}** ensures high quality across milestone deliverables. Would you like to find verified creators or adjust this role?`,
    suggestedFollowUps: [`Find me a ${targetRole.toLowerCase()}`, `Remove ${targetRole.toLowerCase()}`, "What should we do next?"],
  };
}

// ============================================================================
// 6. TEAM OPTIMIZATION & REFINEMENT
// ============================================================================

export function optimizeTeamForConstraints(
  project: OmniForgeProject,
  instruction: string,
  conversationHistory: ChatMessage[] = []
): { updatedProject: OmniForgeProject; replyMessage: string } {
  const lower = instruction.toLowerCase();
  const updated: OmniForgeProject = JSON.parse(JSON.stringify(project));
  let replyMessage = "";

  // 1. "I only have three people." / Lean team
  if (
    lower.includes("three people") ||
    lower.includes("3 people") ||
    lower.includes("only have 3") ||
    lower.includes("reduce the team") ||
    lower.includes("reduce team")
  ) {
    if (project.domain.includes("Film") || project.domain.includes("Cinema")) {
      replyMessage = `Here is how you can optimize **${project.title}** for a lean 3-person team:\n\n1. **Person 1 (Writer + Director):** Leads the story, actor direction, and creative vision.\n2. **Person 2 (Cinematographer + Lighting):** Operates camera gear and manages shoot lighting.\n3. **Person 3 (Editor + Sound Designer):** Cuts the footage, color grades, and balances audio.\n\nThis covers all essential capabilities with 3 core members.`;
    } else if (project.domain.includes("Web") || project.domain.includes("Software")) {
      replyMessage = `Here is how you can run **${project.title}** with a 3-person team:\n\n1. **Person 1 (Product / Content):** Defines requirements and drafts text content.\n2. **Person 2 (UI/UX Designer):** Designs Figma wireframes and mobile layouts.\n3. **Person 3 (Full Stack Developer):** Builds the frontend pages, connects database, and deploys.\n\nAll necessary capabilities are covered!`;
    } else {
      replyMessage = `For a 3-person team, we can combine complementary roles (such as design + content, or production + editing) to keep execution efficient.`;
    }
    return { updatedProject: updated, replyMessage };
  }

  // 2. "I have a video editor who also knows basic sound editing."
  if (lower.includes("knows basic sound editing") || lower.includes("also knows sound")) {
    const soundRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("sound"));
    if (soundRole) {
      soundRole.isFilled = true;
      soundRole.description += " (Covered by Video Editor)";
    }
    updated.coverage.coveredCapabilities.push({
      name: "Sound Design",
      coveredBy: "Your Video Editor (Dual Capability)",
    });
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("sound")
    );
    updated.coverage.totalCovered = updated.coverage.coveredCapabilities.length;
    updated.coverage.percentage = updated.roles.length > 0
      ? Math.round((updated.coverage.totalCovered / updated.roles.length) * 100)
      : 100;

    replyMessage = `✓ Great! Marked **Sound Design** as covered by your Video Editor. Capability coverage updated to ${updated.coverage.percentage}%. You don't need a separate sound editor.`;
    return { updatedProject: updated, replyMessage };
  }

  // 3. "I only have a small student budget."
  if (lower.includes("student budget") || lower.includes("small budget") || lower.includes("low budget")) {
    replyMessage = `For a student budget on **${project.title}**:\n\n1. **Use Skill Swap:** Trade skills with student peers instead of cash fees.\n2. **Combine Roles:** Have the director handle editing, or utilize natural sunlight and existing camera gear.\n3. **Simplify Locations:** Use campus or public locations requiring zero permit fees.\n4. **Keep Runtime Tight:** Focus on a punchy 3 to 5-minute cut.`;
    return { updatedProject: updated, replyMessage };
  }

  // 4. "Actually, I only want a 5-minute student short film."
  if (lower.includes("5-minute") || lower.includes("5 minute")) {
    updated.complexity = "Simple";
    updated.estimatedTotalDuration = "2 to 3 Weeks";
    updated.title = updated.title.replace("Cinematic Short Film", "5-Minute Student Short Film");
    replyMessage = `✓ Recalculated project scope for a **5-minute student short film**:\n\n• Complexity reduced to **Simple**\n• Estimated duration streamlined to **2 to 3 Weeks**\n• Tasks adjusted for a lean shoot schedule.`;
    return { updatedProject: updated, replyMessage };
  }

  // 5. "I already have someone handling the music." / "Don't include another music person."
  if (lower.includes("already have someone handling the music") || lower.includes("dont include another music person") || lower.includes("don't include another music person")) {
    const musicRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("music"));
    if (musicRole) {
      musicRole.isFilled = true;
      musicRole.assignedCreatorId = project.ownerId;
    }
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes("music"));
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("music")
    );
    replyMessage = `✓ Noted! Marked Music as covered by your existing team. No external music creator will be recommended.`;
    return { updatedProject: updated, replyMessage };
  }

  // 6. "I already have a writer."
  if (lower.includes("already have a writer") || lower.includes("i have a writer")) {
    const writerRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("writer"));
    if (writerRole) {
      writerRole.isFilled = true;
      writerRole.assignedCreatorId = project.ownerId;
    }
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes("writer"));
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("writer")
    );
    replyMessage = `✓ Noted that you already have a Screenwriter. Remaining roles needed: **Director, Cinematographer, Lead Actor, Editor, and Sound Designer**.`;
    return { updatedProject: updated, replyMessage };
  }

  // 7. "Can we remove that?" / "Remove [role]"
  if (lower.includes("remove") || lower.includes("drop")) {
    const roleToRemove = extractRoleFromQuery(lower, project, conversationHistory);
    updated.roles = updated.roles.filter((r) => !r.roleName.toLowerCase().includes(roleToRemove.toLowerCase()));
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes(roleToRemove.toLowerCase()));
    replyMessage = `✓ Removed **${roleToRemove}** role from the required plan.`;
    return { updatedProject: updated, replyMessage };
  }

  return modifyBlueprintFromInstruction(project, instruction);
}

// ============================================================================
// 7. MASTER CONVERSATIONAL ORCHESTRATOR
// ============================================================================

export function extractProjectIdeaFromHistory(conversationHistory: ChatMessage[]): string {
  const domainSpecificMsg = [...conversationHistory].reverse().find(
    (m) =>
      m.sender === "user" &&
      (m.text.toLowerCase().includes("film") ||
        m.text.toLowerCase().includes("movie") ||
        m.text.toLowerCase().includes("short film") ||
        m.text.toLowerCase().includes("website") ||
        m.text.toLowerCase().includes("song") ||
        m.text.toLowerCase().includes("music") ||
        m.text.toLowerCase().includes("app") ||
        m.text.toLowerCase().includes("event"))
  );
  if (domainSpecificMsg) return domainSpecificMsg.text;

  const priorIdeaMsg = [...conversationHistory].reverse().find(
    (m) =>
      m.sender === "user" &&
      !m.text.toLowerCase().startsWith("help me") &&
      !m.text.toLowerCase().startsWith("show me") &&
      !m.text.toLowerCase().startsWith("return to") &&
      (m.text.toLowerCase().includes("idea") ||
        m.text.toLowerCase().includes("make") ||
        m.text.toLowerCase().includes("create") ||
        m.text.toLowerCase().includes("story"))
  );
  return priorIdeaMsg?.text || "Short film production project";
}

export async function processConversationalOmniForgeMessage(
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[],
  userType: "creator" | "client",
  currentUserId: string = "anon",
  conversationState?: ConversationState | null
): Promise<AIStructuredResponse> {
  const currentState = transitionConversationState(
    conversationState || createInitialConversationState(text),
    text,
    conversationHistory
  );

  const clean = text.toLowerCase().trim().replace(/[?!.,]+$/, "").trim();
  const lower = clean;

  // 1. Direct Knowledge & Definitions (Answers directly without forcing project creation!)
  const isDirectInfoQuery =
    clean.includes("cinematography") ||
    clean.includes("what is a database") ||
    clean.includes("what is database") ||
    clean.includes("what does a film director do") ||
    clean.includes("what does a director do") ||
    clean === "what is a director" ||
    clean.includes("what is a director") ||
    clean.includes("what is skill swap") ||
    clean.includes("what's skill swap") ||
    clean.includes("how does skill swap work") ||
    clean.includes("what is react") ||
    clean.includes("what is an api") ||
    clean.includes("what is api") ||
    clean.includes("how do i learn python") ||
    clean.includes("how to learn python") ||
    clean.includes("writer and a director") ||
    clean.includes("writer vs director") ||
    clean.includes("return to my film") ||
    clean.includes("back to my film");

  if (isDirectInfoQuery) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  // 2. Casting & Creator Search Flow
  if (
    currentState.investigationArea === "casting" ||
    currentState.stage === "CREATOR_MATCHING" ||
    clean.includes("need an actor") ||
    clean.includes("actor for my short film") ||
    clean.includes("suggest the best")
  ) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  const decision = classifyMessageSemanticIntent(text, currentProject, conversationHistory);
  const { intent, targetRole } = decision;

  // 3. Informational, Definition, How-To, Explanation & Creator Search Questions are ALWAYS answered first
  const isDirectQuestion =
    intent === "HOW_TO" ||
    intent === "EXPLANATION" ||
    intent === "DEFINITION" ||
    intent === "GENERAL_QUESTION" ||
    intent === "GENERAL_CONVERSATION" ||
    intent === "CREATOR_SEARCH" ||
    intent === "CREATOR_DISCOVERY" ||
    intent === "SKILL_SWAP_QUESTION" ||
    intent === "SKILL_SWAP_SEARCH" ||
    intent === "PROJECT_STATUS" ||
    clean.includes("step") ||
    clean.includes("what is") ||
    clean.includes("how to") ||
    clean.includes("how do") ||
    clean.includes("explain");

  // 3b. Project Discovery & Requirements Investigation Flow (Only if not asking a direct question/explanation)
  if (
    !isDirectQuestion &&
    (currentState.stage === "PROJECT_DISCOVERY" || currentState.stage === "REQUIREMENTS_INVESTIGATION") &&
    !clean.includes("show me the plan") &&
    !clean.includes("show me plan") &&
    !clean.includes("complete plan")
  ) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  // 4. Squad Authorization Confirmation ("Yes" / "Confirm")
  if (
    decision.targetAction === "CONFIRM_SQUAD_CREATION" &&
    currentProject
  ) {
    return {
      intent: "SQUAD_REQUEST",
      responseLevel: "SIMPLE_ANSWER",
      message: `✓ Confirmed! Launching your project Squad for **${currentProject.title}**. Opening your collaborative workspace and dispatching creator invitations.`,
      conversationState: currentState,
      projectAction: {
        type: "CREATE_SQUAD",
        payload: { projectId: currentProject.id },
      },
      suggestedFollowUps: ["What should we do first?", "View Workspace Roadmap"],
    };
  }

  // 5. Skill Swap Inquiry & Search
  if (intent === "SKILL_SWAP_QUESTION" || intent === "SKILL_SWAP_SEARCH") {
    const ssRes = await handleSkillSwapQuery(text, currentUserId, currentProject);
    return {
      ...ssRes,
      conversationState: currentState,
    };
  }

  // 6. Ambiguous Project Ideas (CLARIFICATION)
  if (intent === "CLARIFICATION") {
    const clarRes = handleClarificationQuery(text);
    return {
      ...clarRes,
      conversationState: currentState,
    };
  }

  // 7. Indirect Problem Statements (e.g. Restaurant Ordering, College Club)
  if (intent === "PROJECT_PROBLEM") {
    const probRes = handleIndirectProjectProblem(text);
    return {
      ...probRes,
      conversationState: currentState,
    };
  }

  // 8. LEVEL 0: General Greetings & Casual Dialogue (NO PROJECT CREATION)
  if (intent === "GENERAL_CONVERSATION") {
    const genRes = handleGeneralDialogue(text, intent, targetRole);
    return {
      ...genRes,
      conversationState: currentState,
    };
  }

  // 9. HOW_TO & EXPLANATIONS ("How do I develop...", "Provide steps...", etc.)
  if (intent === "HOW_TO") {
    const genRes = handleGeneralDialogue(text, intent, targetRole, currentProject);
    return {
      ...genRes,
      conversationState: currentState,
    };
  }

  if (
    intent === "PROJECT_PLANNING" ||
    clean.includes("show me the plan") ||
    clean.includes("show me the complete plan")
  ) {
    let proj = currentProject;
    if (!proj) {
      const projIdea = currentState.requirements.storyPremise || currentState.requirements.websitePurpose || extractProjectIdeaFromHistory(conversationHistory) || text;
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const stagesList = proj.phases.map((p, idx) => `### Stage ${idx + 1}: ${p.name}\n${p.description}`).join("\n\n");
    const reqsList = (proj.requirements || []).map((r) => `• ${r}`).join("\n");
    const workflowVisual = (proj.workflowStages || proj.phases.map((p) => p.name)).join("  ➔  ");
    const rolesList = proj.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");

    const message = `## 1. What I Understood\n${proj.goal}\n\n## 2. Project Stages\n${stagesList}\n\n## 3. What is Required\n${reqsList}\n\n## 4. How the Work Flows\n${workflowVisual}\n\n## 5. People / Roles Needed\n${rolesList}\n\n## 6. Next Step\nHere is your complete execution plan for **${proj.title}**! You can review the stages, find verified creators, or assemble your squad.`;

    return {
      intent: "PROJECT_PLANNING",
      responseLevel: "PROJECT_ANALYSIS",
      message,
      updatedProject: proj,
      conversationState: {
        ...currentState,
        stage: "PROJECT_BLUEPRINT",
      },
      projectAction: {
        type: "CREATE_BLUEPRINT",
        payload: proj,
      },
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: ["Find me a director", "Create a squad", "Who do I need?"],
    };
  }

  // 7. LEVEL 1: General Knowledge, Definitions & How-To (NO PROJECT CREATION)
  if (intent === "GENERAL_QUESTION" || intent === "DEFINITION" || intent === "EXPLANATION" || intent === "HOW_TO") {
    return handleGeneralDialogue(text, intent, targetRole, currentProject);
  }

  // 7. LEVEL 2: Contextual Role & Project Questions
  if (intent === "ROLE_QUESTION" || intent === "PHASE_QUESTION") {
    if (currentProject) {
      const roleName = targetRole || currentProject.roles[0]?.roleName || "Film Director";
      return handleContextualProjectQuestion(text, roleName, currentProject, conversationHistory);
    }

    // Role question without prior project loaded (e.g. "Can they also edit?")
    if (lower.includes("edit") || lower.includes("both")) {
      return {
        intent: "ROLE_QUESTION",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Yes! Many Directors can also handle Video Editing, especially on independent short films. When a director edits their own film, it ensures strong artistic continuity and keeps team costs lean. However, on larger productions, pairing a dedicated Video Editor with the Director brings fresh objective pacing, advanced color grading, and faster turnaround.`,
        roleCard: {
          roleName: "Film Director & Editor",
          category: "Creative & Post-Production",
          purpose: "Directs visual performances and cuts footage into the final cut.",
          skills: ["Directing", "Premiere Pro", "DaVinci Resolve", "Story Pacing"],
        },
        suggestedFollowUps: ["Find me a director", "Create a squad", "What should we do first?"],
      };
    }

    const roleName = targetRole || "Film Director";
    const fallbackProj = generateStructuredBlueprint("Short film production", userType, currentUserId);
    return handleContextualProjectQuestion(text, roleName, fallbackProj, conversationHistory);
  }

  // 8. LEVEL 3: Targeted Creator Search & Dual Skill Matching
  if (intent === "CREATOR_SEARCH" || intent === "CREATOR_DISCOVERY") {
    const isBothDirectAndEdit = lower.includes("do both") || (lower.includes("direct") && lower.includes("edit"));
    const roleName = isBothDirectAndEdit
      ? "Film Director"
      : targetRole || (currentProject ? currentProject.roles[0]?.roleName : "Film Director") || "Film Director";

    const foundCreators = await matchCreatorsForSingleRole(roleName, isBothDirectAndEdit ? ["Directing", "Premiere Pro", "Video Editing"] : [], currentUserId);

    if (foundCreators.length > 0) {
      const topCandidates = foundCreators.slice(0, 3);
      const names = topCandidates.map((c) => `• **${c.creator.fullName || c.creator.username}** (Match: ${c.matchScore}%)`).join("\n");

      const headerMsg = isBothDirectAndEdit
        ? `Found verified creators with overlapping capabilities in **Directing & Video Editing**:\n\n${names}\n\nReview their portfolio evidence below:`
        : `I discovered ${foundCreators.length} verified creators in the OmniCraft network for **${roleName}**:\n\n${names}\n\nReview their portfolio evidence below:`;

      return {
        intent,
        responseLevel: "CREATOR_DISCOVERY",
        message: headerMsg,
        uiAction: {
          type: "SHOW_CREATOR_RECOMMENDATIONS",
          roleName,
          creators: topCandidates,
        },
        creatorCards: topCandidates,
        suggestedFollowUps: [
          `Why did you recommend ${topCandidates[0].creator.fullName || topCandidates[0].creator.username}?`,
          `Replace ${roleName}`,
          `Add ${topCandidates[0].creator.fullName || topCandidates[0].creator.username} to team`,
        ],
      };
    } else {
      return {
        intent,
        responseLevel: "CREATOR_DISCOVERY",
        message: `No active creators currently match the exact skills for **${roleName}**. You can post a client job listing, initiate a Skill Swap, or invite an external collaborator directly.`,
        suggestedFollowUps: ["Publish Job", "Open Skill Swap", "Manual Add"],
      };
    }
  }

  // 9. LEVEL 3: Creator Evidence & Portfolio Inquiries
  if (intent === "CREATOR_COMPARISON" && currentProject) {
    const role = targetRole || "Film Director";
    const recs = currentProject.recommendations.filter(
      (r) => r.roleName.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(r.roleName.toLowerCase())
    );
    const alts = currentProject.alternativeCandidates?.[role] || [];
    const allCandidates = [...recs, ...alts];

    if (lower.includes("compare these two") || (lower.includes("compare") && allCandidates.length >= 2)) {
      const candA = allCandidates[0];
      const candB = allCandidates[1];

      const analysis = `• **${candA.creator.fullName || candA.creator.username}**: Verified skills in ${candA.creator.skills.slice(0, 3).join(", ") || "Production"} with ${candA.creator.portfolioItemsCount} portfolio project(s).\n• **${candB.creator.fullName || candB.creator.username}**: Specializes in ${candB.creator.specialties.slice(0, 2).join(", ") || "Creative Arts"} with strong role alignment.\n\nBoth are verified talent on OmniCraft.`;

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Here is the evidence-based comparison for **${role}**:\n\n${analysis}`,
        uiAction: {
          type: "SHOW_CREATOR_COMPARISON",
          roleName: role,
          comparisonData: {
            roleName: role,
            candidates: [candA, candB],
            analysis,
          },
        },
        comparisonCard: {
          roleName: role,
          candidates: [candA, candB],
          analysis,
        },
        suggestedFollowUps: [
          `Select ${candA.creator.fullName || candA.creator.username}`,
          `Select ${candB.creator.fullName || candB.creator.username}`,
        ],
      };
    } else if (allCandidates.length >= 1) {
      const cand = allCandidates[0];
      const name = cand.creator.fullName || cand.creator.username;
      const portfolioSample = cand.creator.portfolioSamples[0]?.title ? `"${cand.creator.portfolioSamples[0].title}"` : `${cand.creator.portfolioItemsCount} portfolio projects`;

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `**${name}** is recommended for **${cand.roleName}** based on real database records:\n\n• **Experience & Bio:** ${cand.creator.bio || "Active contributor in creative productions"}\n• **Verified Skills:** ${cand.creator.skills.join(", ") || cand.evidenceSources.skillsMatched.join(", ") || "Directing, Storytelling"}\n• **Portfolio Evidence:** Verified work including ${portfolioSample}\n• **Match Score:** ${cand.matchScore}% alignment with project requirements.`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
      };
    } else if (currentProject.recommendations.length > 0) {
      const firstRec = currentProject.recommendations[0];
      const name = firstRec.creator.fullName || firstRec.creator.username;
      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `**${name}** is recommended for **${firstRec.roleName}** based on verified portfolio evidence (${firstRec.creator.portfolioItemsCount} submitted pieces) and matched skills (${firstRec.evidenceSources.skillsMatched.join(", ") || "Specialized domain"}).`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?"],
      };
    } else {
      const lastRecFromHistory = conversationHistory
        .slice()
        .reverse()
        .find((m) => m.creatorCards && m.creatorCards.length > 0)?.creatorCards?.[0];

      if (lastRecFromHistory) {
        const name = lastRecFromHistory.creator.fullName || lastRecFromHistory.creator.username;
        const portfolioSample = lastRecFromHistory.creator.portfolioSamples[0]?.title
          ? `"${lastRecFromHistory.creator.portfolioSamples[0].title}"`
          : `${lastRecFromHistory.creator.portfolioItemsCount} portfolio pieces`;

        return {
          intent: "CREATOR_COMPARISON",
          responseLevel: "CONTEXTUAL_ANSWER",
          message: `**${name}** was recommended for **${lastRecFromHistory.roleName}** based on real database evidence:\n\n• **Experience:** ${lastRecFromHistory.creator.bio || "Active contributor in creative productions"}\n• **Verified Skills:** ${lastRecFromHistory.creator.skills.join(", ") || "Directing, Storytelling"}\n• **Portfolio Evidence:** Verified work including ${portfolioSample}\n• **Match Score:** ${lastRecFromHistory.matchScore}% alignment with project requirements.`,
          suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
        };
      }

      const foundFromDB = (await matchCreatorsForSingleRole(role, [], currentUserId)).slice(0, 1);
      if (foundFromDB.length > 0) {
        const topCand = foundFromDB[0];
        const name = topCand.creator.fullName || topCand.creator.username;
        return {
          intent: "CREATOR_COMPARISON",
          responseLevel: "CONTEXTUAL_ANSWER",
          message: `**${name}** is recommended for **${role}** based on verified skills (${topCand.creator.skills.slice(0, 3).join(", ") || "Production"}) and portfolio evidence on OmniCraft.`,
          suggestedFollowUps: ["What if they aren't available?", "What should we do first?"],
        };
      }

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Verified creators for **${role}** on OmniCraft are recommended based on their verified skill badges, portfolio pieces, and domain relevance.`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
      };
    }
  }

  // 10. LEVEL 3: Creator Replacement & "What if they aren't available?"
  if (intent === "CREATOR_REPLACEMENT" && currentProject) {
    const roleName = targetRole || currentProject.roles[0]?.roleName || "Film Director";
    const alts = (await matchCreatorsForSingleRole(roleName, [], currentUserId)).slice(0, 3);

    return {
      intent: "CREATOR_REPLACEMENT",
      targetRole: roleName,
      responseLevel: "CREATOR_DISCOVERY",
      message: `If they are not available, here are alternative verified creators for **${roleName}**:`,
      uiAction: {
        type: "SHOW_CREATOR_RECOMMENDATIONS",
        roleName,
        creators: alts,
      },
      creatorCards: alts,
      suggestedFollowUps: [`Select replacement for ${roleName}`, "I only have three people", "Create the squad"],
    };
  }

  // 11. LEVEL 3: Squad Launch Confirmation Prompt
  if (intent === "SQUAD_REQUEST") {
    let proj = currentProject;
    if (!proj) {
      const projIdea = extractProjectIdeaFromHistory(conversationHistory);
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const assignedCount = proj.recommendations.length;
    return {
      intent: "SQUAD_REQUEST",
      responseLevel: "CONFIRMATION_REQUIRED",
      message: `Ready to assemble the team for **${proj.title}**? This will initialize your collaborative Squad workspace and dispatch invitations to ${assignedCount > 0 ? assignedCount : "assigned"} creators.`,
      requiresConfirmation: true,
      updatedProject: proj,
      uiAction: {
        type: "SHOW_CONFIRMATION",
        confirmationPrompt: {
          title: "Launch Project Squad",
          message: `Confirm launching Squad "${proj.title}"?`,
          actionType: "create_squad",
          payload: { projectId: proj.id },
        },
      },
      confirmationCard: {
        title: "Launch Project Squad",
        message: `Initialize workspace and dispatch invitations to creators.`,
        actionType: "create_squad",
        payload: { projectId: proj.id },
      },
      suggestedFollowUps: ["Yes", "Not yet, review team first"],
    };
  }

  // 12. LEVEL 3: Team Optimization & Project Modification
  if (intent === "PROJECT_MODIFICATION" && currentProject) {
    const { updatedProject, replyMessage } = optimizeTeamForConstraints(currentProject, text, conversationHistory);
    return {
      intent: "PROJECT_MODIFICATION",
      responseLevel: "PROJECT_MODIFICATION",
      message: replyMessage,
      updatedProject,
      projectAction: {
        type: "UPDATE_ROLE",
        payload: updatedProject,
      },
      uiAction: {
        type: "SHOW_PROJECT_UPDATE",
        updateSummary: {
          title: "Team & Scope Optimized",
          detail: replyMessage,
          actionType: "scope_change",
        },
      },
      updateCard: {
        title: "Team & Scope Optimized",
        detail: replyMessage,
        actionType: "scope_change",
      },
      suggestedFollowUps: ["What should we do first?", "Create the squad", "What should we do next?"],
    };
  }

  // 13. LEVEL 5: Project Status & "What should we do first / next?"
  if (intent === "PROJECT_STATUS") {
    let proj = currentProject;
    if (!proj) {
      const projIdea = extractProjectIdeaFromHistory(conversationHistory);
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const { reply } = processWorkspaceAssistantQuery(text, proj);
    return {
      intent: "PROJECT_STATUS",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Returning to your film project (**${proj.title}**):\n\n${reply}`,
      updatedProject: proj,
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: ["Create the squad", "Find me a director", "View Workspace Roadmap"],
    };
  }

  // 14. LEVEL 5: Project Blocker / Delay Analysis ("Cinematographer is unavailable")
  if (intent === "PROJECT_BLOCKER" && currentProject) {
    const { reply } = processWorkspaceAssistantQuery(text, currentProject);
    return {
      intent: "PROJECT_BLOCKER",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: reply,
      suggestedFollowUps: ["Find replacement creator", "Shift milestone dates", "Advance parallel tasks"],
    };
  }

  // 15. LEVEL 4: Project Idea -> Structured Blueprint Decomposition
  if (intent === "PROJECT_CREATION") {
    const blueprint = generateStructuredBlueprint(text, userType, currentUserId);

    // Format structured chat response
    const stagesList = blueprint.phases.map((p, idx) => `### Stage ${idx + 1}: ${p.name}\n${p.description}`).join("\n\n");
    const reqsList = (blueprint.requirements || []).map((r) => `• ${r}`).join("\n");
    const workflowVisual = (blueprint.workflowStages || blueprint.phases.map((p) => p.name)).join("  ➔  ");
    const rolesList = blueprint.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");

    const message = `## 1. What I Understood\n${blueprint.goal}\n\n## 2. Project Stages\n${stagesList}\n\n## 3. What is Required\n${reqsList}\n\n## 4. How the Work Flows\n${workflowVisual}\n\n## 5. People / Roles Needed\n${rolesList}\n\n## 6. Next Step\nYour initial project plan is ready! You can ask me anything about it, change the plan, find creators, or build the team.`;

    return {
      intent: "PROJECT_CREATION",
      responseLevel: "PROJECT_ANALYSIS",
      message,
      updatedProject: blueprint,
      projectAction: {
        type: "CREATE_BLUEPRINT",
        payload: blueprint,
      },
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: [
        "How would I make it?",
        "Who would I need?",
        "Do I need a director?",
        "Find creators",
      ],
    };
  }

  // 16. Contextual & General Fallback
  return handleGeneralDialogue(text, intent, undefined, currentProject);
}

// ============================================================================
// 8. WORKSPACE AI ASSISTANT QUERY HANDLER
// ============================================================================

export function processWorkspaceAssistantQuery(
  query: string,
  project: OmniForgeProject
): {
  reply: string;
  suggestedAction?: {
    type: "reschedule" | "replace_creator" | "modify_scope" | "highlight_task";
    payload?: any;
  };
} {
  const q = query.toLowerCase();

  if (q.includes("unavailable") || q.includes("delay") || q.includes("sick") || q.includes("leave") || q.includes("no longer available")) {
    let affectedRole = "cinematographer";
    if (q.includes("director")) affectedRole = "director";
    else if (q.includes("editor")) affectedRole = "editor";
    else if (q.includes("developer") || q.includes("engineer")) affectedRole = "developer";

    return {
      reply: `⚠️ **Impact & Schedule Conflict Analysis:**\nThe **${affectedRole}** is on the critical path for milestones. A delay or unavailability directly impacts dependent development and delivery tasks.\n\n**Recommended Next Actions:**\n1. **Find an available replacement creator** from the OmniCraft network to protect the target release date.\n2. **Shift downstream milestones** while advancing prerequisite tasks in parallel.\n3. **Redistribute responsibilities** if another team member can cover these tasks.`,
      suggestedAction: {
        type: "replace_creator",
      },
    };
  }

  if (q.includes("what should we do first") || q.includes("what should we do now") || q.includes("what should we do next") || q.includes("what should i do next") || q.includes("next step") || q.includes("status") || q.includes("what is pending")) {
    const activePhase = project.phases?.find((p) => p.tasks?.some((t) => t.status === "to_do" || t.status === "in_progress")) || project.phases?.[0];
    const pendingTasks = activePhase?.tasks?.filter((t) => t.status === "to_do" || t.status === "in_progress") || [];

    if (pendingTasks.length > 0) {
      const topTask = pendingTasks[0];
      const taskList = pendingTasks.map((t) => `• **${t.title}** (${t.requiredRole} — Est. ${t.estimatedDuration})`).join("\n");

      return {
        reply: `Your immediate first step is **${topTask.title}** in **${activePhase?.name || "Stage 1"}** because subsequent milestones depend on it.\n\nCurrent actionable tasks:\n${taskList}\n\nYou can review or invite creators directly from the Creator Team tab!`,
        suggestedAction: {
          type: "highlight_task",
        },
      };
    } else {
      return {
        reply: `All tasks in **${activePhase?.name || "current stage"}** are completed! You can proceed to the next stage in your Workspace Roadmap.`,
      };
    }
  }

  if (q.includes("remove") || q.includes("scope") || q.includes("drop") || q.includes("add") || q.includes("already have")) {
    const { replyMessage } = modifyBlueprintFromInstruction(project, query);
    return {
      reply: replyMessage,
      suggestedAction: {
        type: "modify_scope",
      },
    };
  }

  // Answer normal questions, roadmaps, technical queries, or creative writing
  const genResponse = handleGeneralDialogue(query, "HOW_TO", undefined, project);
  return {
    reply: genResponse.message,
  };
}

// Re-export blueprint generator
export { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "./engine-blueprint";
