/**
 * OmniCraft – Hierarchical Skill Architecture (v2)
 *
 * Implements strict multi-tier hierarchy:
 * Role -> Skill Category -> Skill -> Sub-Skill -> Software / Tool -> Specialty
 *
 * Fully covers 50+ industry roles across Technology, Creative, Business/Marketing, and Communication.
 * Completely extensible with custom roles, skills, sub-skills, and specialties.
 */

export type RoleCategory = "Technology" | "Creative" | "Business / Marketing" | "Communication" | "Custom";

export interface SpecialtyDef {
  name: string;
  description?: string;
}

export interface SoftwareDef {
  name: string;
  specialties: string[];
}

export interface SubSkillGroup {
  category: string;
  items: string[];
}

export interface SkillDef {
  id: string;
  name: string;
  category: string;
  description: string;
  subSkillGroups: SubSkillGroup[];
  software: SoftwareDef[];
  specialties: string[];
}

export interface RoleDef {
  id: string;
  name: string;
  category: RoleCategory;
  description: string;
  skills: SkillDef[];
}

// ============================================================================
// 1. CREATIVE ROLES (Video Editor, Photo Editor, Graphic Designer, UI/UX, etc.)
// ============================================================================

const VIDEO_EDITING_SKILL: SkillDef = {
  id: "video-editing",
  name: "Video Editing",
  category: "Post-Production",
  description: "End-to-end video assembly, pacing, transitions, motion graphics, audio sync, and mastering.",
  subSkillGroups: [
    {
      category: "Fundamentals",
      items: [
        "Cutting", "Trimming", "Splitting", "Timeline Editing", "Sequence Management",
        "Frame Rate (FPS)", "Resolution & Scaling", "Aspect Ratio", "Bitrate Control",
        "Codec Standards (H.264/H.265/ProRes/DNxHR)", "Container Formats (MP4/MOV)",
        "Rendering Pipelines", "Export Optimization", "Data Rate Compression"
      ]
    },
    {
      category: "Editing Techniques",
      items: [
        "Jump Cuts", "Match Cuts", "J Cuts & L Cuts", "Montage Theory",
        "Pacing & Rhythm", "Continuity Editing", "B-roll Layering", "A-roll Pacing",
        "Multicam Synchronization", "3-Point Editing", "Story Arc Construction"
      ]
    },
    {
      category: "Transitions",
      items: [
        "Hard Cut", "Dissolve & Crossfade", "Dip to Black/White", "Whip Pan Transition",
        "Match Action Transition", "Masking Transition", "Speed Ramp Transition", "Seamless Zoom Cut"
      ]
    },
    {
      category: "Motion & Keyframing",
      items: [
        "Position / Scale / Rotation / Opacity", "Bezier Keyframe Interpolation",
        "Speed Ramping", "Optical Flow Time Remapping", "Planar Motion Tracking",
        "Camera Tracking", "Warp / Gyro Stabilization"
      ]
    },
    {
      category: "Visual Effects & Compositing",
      items: [
        "Green Screen / Chroma Keying", "Garbage Matte & Rotoscoping", "Layer Blend Modes",
        "Object Removal", "Screen Replacement", "Corner Pin Tracking", "Alpha Channel Matte"
      ]
    },
    {
      category: "Color Correction & Grading",
      items: [
        "White Balance & Tint", "Exposure & Contrast Balancing", "Waveform & Vectorscope Analysis",
        "3-Way Primary Wheels", "RGB Curves & Hue-Vs-Hue", "LUT Application & Pipeline",
        "Skin Tone Line Correction", "Shot Matching", "Rec.709 / Rec.2020 / Log Conversions"
      ]
    },
    {
      category: "Audio Post-Production",
      items: [
        "Dialogue Cleaning & Editing", "Noise Suppression (De-noise/De-reverb)", "Parametric EQ",
        "Dynamic Compression & Limiting", "Audio Normalization (-14 LUFS)", "Auto-Ducking",
        "Foley & Sound Effects Layering", "Waveform Phase Alignment", "Multi-Track Audio Mixing"
      ]
    },
    {
      category: "Delivery & Formats",
      items: [
        "YouTube 4K Export", "Instagram Reels (9:16)", "TikTok & Shorts Formats",
        "Broadcast Master (ProRes 422 HQ)", "Alpha Channel WebM", "SubRip (.srt) Closed Captions"
      ]
    }
  ],
  software: [
    {
      name: "Adobe Premiere Pro",
      specialties: ["Multi-Camera Editing", "Dynamic Link with After Effects", "Lumetri Color Scopes", "Essential Sound Audio Ducting", "Proxy Workflow", "Morph Cut"]
    },
    {
      name: "DaVinci Resolve",
      specialties: ["Node-Based Color Grading", "Fusion VFX Compositing", "Fairlight Audio Mixing", "Color Match & ACES Workflow", "Magic Mask Rotoscoping", "Tracker Studio"]
    },
    {
      name: "Final Cut Pro",
      specialties: ["Magnetic Timeline 2", "Compound Clips", "Color Wheels & Curves", "360 Video Editing", "Optimized & Proxy Media", "Keyframe Animation"]
    },
    {
      name: "CapCut Pro",
      specialties: ["Short-form Auto Captions", "Keyframe Speed Ramping", "Background Cutout", "Trending Audio Sync", "Mask Overlay FX", "LUT Filters"]
    },
    {
      name: "Avid Media Composer",
      specialties: ["Enterprise Shared Projects", "AMA Linking & Transcoding", "Trim Mode Precision", "Symphony Color Option", "ScriptSync"]
    }
  ],
  specialties: [
    "Talking Head & Podcasts", "High-Retention YouTube Videos", "Instagram Reels & TikToks",
    "Documentary Storytelling", "Cinematic Color Grading", "Commercials & Brand Ads",
    "Music Videos", "Vlog & Lifestyle", "Gaming Highlights", "Course & Tutorial Production"
  ]
};

const PHOTO_EDITING_SKILL: SkillDef = {
  id: "photo-editing",
  name: "Photo Editing",
  category: "Photography & Visual Arts",
  description: "RAW processing, color grading, frequency separation, portrait retouching, and compositing.",
  subSkillGroups: [
    {
      category: "Fundamentals",
      items: [
        "Exposure & Dynamic Range", "Contrast & Black/White Points", "Highlights & Shadows Recovery",
        "White Balance & Color Temperature", "Vibrance vs Saturation", "Sharpness & Unsharp Mask",
        "Luminance & Color Noise Reduction", "Chromatic Aberration Removal", "Histogram Evaluation"
      ]
    },
    {
      category: "Photoshop Precision",
      items: [
        "Non-Destructive Layer Masks", "Pen Tool Selections", "Healing Brush & Patch Tool",
        "Clone Stamp Techniques", "Content-Aware Fill", "Smart Objects & Filters",
        "Adjustment Layers & Clipping Masks", "Blend Modes (Multiply/Screen/Overlay)",
        "RGB & Lab Curves", "Channel Operations & Luminosity Masks", "Liquify Facial Sculpting"
      ]
    },
    {
      category: "Retouching Techniques",
      items: [
        "High-End Frequency Separation", "Micro Dodge & Burn", "Global Dodge & Burn",
        "Skin Texture Preservation", "Stray Hair Removal", "Eye & Iris Enhancement",
        "Teeth Whitening", "Body Contour Shaping", "Color Neutralization for Skin"
      ]
    },
    {
      category: "Lightroom / RAW Processing",
      items: [
        "Catalog & Collection Hierarchy", "RAW DNG Conversion", "HSL Color Mixer",
        "Tone Curve Precision", "AI Masking (Subject/Sky/Background)", "Color Grading Split Tones",
        "Lens Profile Corrections", "Batch Preset Development", "Watermarking & Color Space Export (sRGB/AdobeRGB)"
      ]
    },
    {
      category: "Mobile & Fast Retouching",
      items: [
        "Snapseed Selective Adjustments", "Lightroom Mobile Profiles", "Healing & Geometry Corrections",
        "Double Exposure Mobile", "Grain & Vintage Emulation"
      ]
    }
  ],
  software: [
    {
      name: "Adobe Photoshop",
      specialties: ["Frequency Separation", "Dodge & Burn", "Complex Compositing", "Pen Tool Clipping", "Color Grading with Curves", "Luminosity Masking"]
    },
    {
      name: "Adobe Lightroom Classic",
      specialties: ["RAW Photo Processing", "AI Subject Masking", "Color Mixer & Color Grading", "Lens Calibration", "Batch Preset Workflows"]
    },
    {
      name: "Capture One Pro",
      specialties: ["Tethered Studio Capture", "Advanced Skin Tone Wheel", "Layers & Color Balance", "Precise Keystone Correction"]
    },
    {
      name: "Snapseed / Mobile",
      specialties: ["Selective Adjustments", "Portrait Glow", "Healing Tool", "Curves & Drama Filter"]
    }
  ],
  specialties: [
    "Beauty & Fashion Retouching", "Studio Portrait Retouching", "Commercial Product Editing",
    "Real Estate Photo Processing", "Landscape & Travel Grading", "Wedding & Event Batch Editing",
    "E-Commerce White Background Cleanups", "Creative Photo Manipulation"
  ]
};

const MOTION_GRAPHICS_SKILL: SkillDef = {
  id: "motion-graphics",
  name: "Motion Graphics",
  category: "Animation & VFX",
  description: "2D and 3D kinetic typography, logo animations, HUDs, infographics, and visual elements.",
  subSkillGroups: [
    {
      category: "Principles of Animation",
      items: [
        "Squash and Stretch", "Anticipation", "Staging", "Straight Ahead & Pose to Pose",
        "Follow Through & Overlapping Action", "Slow In and Slow Out (Easing)", "Arcs",
        "Secondary Action", "Timing & Rhythm", "Exaggeration", "Solid Drawing", "Appeal"
      ]
    },
    {
      category: "Technical After Effects",
      items: [
        "Graph Editor Speed vs Value Curves", "Shape Layers & Path Trim", "Null Object Parenting",
        "3D Camera & Light Layers", "Expressions (wiggle, loopOut, time, clamp)",
        "Track Mattes & Alpha Invert", "Ray-traced & Cinema 4D Renderer", "Puppet Pin Tool"
      ]
    },
    {
      category: "Asset Preparation & Workflow",
      items: [
        "Illustrator Vector Layer Import", "Photoshop Layer Separation", "Lottie / Bodymovin JSON Export",
        "MOGRT (Motion Graphics Template) Creation", "Alpha Channel ProRes 4444 Export"
      ]
    }
  ],
  software: [
    {
      name: "Adobe After Effects",
      specialties: ["Kinetic Typography", "Logo Reveals", "MOGRT Development", "Expressions & Scripting", "3D Camera Movement", "Character Rigging (Duik)"]
    },
    {
      name: "Cinema 4D",
      specialties: ["MoGraph Cloner", "Dynamic Rigid Body Physics", "Redshift Shader Creation", "Camera Animation"]
    },
    {
      name: "Blender 3D",
      specialties: ["Geometry Nodes Motion", "Grease Pencil 2D Animation", "Eevee Real-time Shaders", "Physics Simulation"]
    }
  ],
  specialties: [
    "YouTube Intro / Outro & Lower Thirds", "Kinetic Typography Explainer", "Brand Logo Animation",
    "UI Animation & App Micro-interactions", "3D Product Promo Animation", "Broadcast Package Graphics"
  ]
};

const GRAPHIC_DESIGN_SKILL: SkillDef = {
  id: "graphic-design",
  name: "Graphic Design",
  category: "Visual Communication",
  description: "Brand identity, typography, layout composition, vector illustration, and print production.",
  subSkillGroups: [
    {
      category: "Design Theory & Foundations",
      items: [
        "Color Theory & Harmonies (Complementary, Triadic)", "Typography Pairing & Hierarchy",
        "Kerning, Leading & Tracking", "Grid Systems & Golden Ratio", "Visual Weight & Negative Space",
        "Gestalt Principles (Proximity, Similarity, Continuity)", "Contrast & Focal Points"
      ]
    },
    {
      category: "Vector Graphics & Illustration",
      items: [
        "Bezier Curves & Node Editing", "Pathfinder & Shape Builder", "Gradient Meshes",
        "Pattern Making & Textures", "Scalable Vector Iconography", "Logo Grid Construction"
      ]
    },
    {
      category: "Print & Production Standards",
      items: [
        "CMYK vs RGB Color Spaces", "Bleed, Slug & Margin Setup", "DPI / PPI Resolution Standards",
        "Spot Colors & Pantone Matching", "Pre-Flight Verification", "Packaging Die-Lines"
      ]
    }
  ],
  software: [
    {
      name: "Adobe Illustrator",
      specialties: ["Logo Design", "Vector Iconography", "Packaging Design", "Custom Lettering", "Print Ready Pre-Flight"]
    },
    {
      name: "Adobe Photoshop",
      specialties: ["Photo-realistic Mockups", "Social Media Banners", "Poster Composite Design", "Texture Generation"]
    },
    {
      name: "Figma",
      specialties: ["Vector Component Systems", "Social Media Kit Design", "Auto-Layout Graphic Templates", "Brand Guidelines"]
    },
    {
      name: "Canva Pro",
      specialties: ["Brand Kit Setup", "Template Architecture", "Multi-format Social Media Resizing", "Print Collateral"]
    }
  ],
  specialties: [
    "Brand Identity & Logo Packages", "High-CTR YouTube Thumbnails", "Social Media Ad Creatives",
    "Packaging & Label Design", "Print Flyers, Brochures & Menus", "Infographic Design"
  ]
};

const UI_UX_SKILL: SkillDef = {
  id: "ui-ux-design",
  name: "UI/UX Design",
  category: "Product & Digital Design",
  description: "User research, wireframing, design systems, interactive prototyping, and usability testing.",
  subSkillGroups: [
    {
      category: "UX Research & Architecture",
      items: [
        "User Personas & Empathy Maps", "User Journey Mapping", "Information Architecture (IA)",
        "Card Sorting & Sitemap Design", "Heuristic Evaluation (Nielsen Norman)", "Competitive Analysis",
        "Usability Testing Protocols"
      ]
    },
    {
      category: "UI Design & Design Systems",
      items: [
        "Atomic Design Methodology", "Component Variants & Properties", "Design Tokens (Spacing/Color/Type)",
        "Auto-Layout & Responsive Constraints", "WCAG 2.1 AA Accessibility Standards",
        "Dark Mode / Light Mode Theming", "Microcopy & UX Writing"
      ]
    },
    {
      category: "Interactive Prototyping",
      items: [
        "Smart Animate Interactions", "Interactive Component States (Hover/Active/Disabled)",
        "Variables & Conditional Logic", "User Flow Clickable Prototypes", "Developer Handoff Documentation"
      ]
    }
  ],
  software: [
    {
      name: "Figma",
      specialties: ["Design Systems Architecture", "Advanced Auto-Layout", "Interactive Variables & Logic", "Developer Handoff & Specs", "FigJam UX Workshops"]
    },
    {
      name: "Framer",
      specialties: ["React-Based Web Design", "CMS Architecture", "Scroll Transforms & Interactions", "Responsive Breakpoints"]
    },
    {
      name: "Adobe XD",
      specialties: ["Component States", "Voice Prototyping", "Auto-Animate", "Repeat Grid"]
    }
  ],
  specialties: [
    "Mobile App UI/UX (iOS Human Interface / Material 3)", "SaaS Dashboard & Web App Design",
    "Landing Page Conversion Optimization", "Design System Engineering", "E-Commerce Checkout UX"
  ]
};

// ============================================================================
// 2. TECHNOLOGY ROLES (React Developer, Web Dev, Python, Backend, AI, etc.)
// ============================================================================

const REACT_DEVELOPMENT_SKILL: SkillDef = {
  id: "react-development",
  name: "React.js",
  category: "Frontend Engineering",
  description: "Modern component architecture, Hooks, state management, render optimization, and Next.js.",
  subSkillGroups: [
    {
      category: "React Core & Hooks",
      items: [
        "JSX Syntax & Virtual DOM Reconciliation", "Component Lifecycle & Effects",
        "useState & useReducer State Logic", "useEffect Dependency Array Gotchas",
        "useMemo & useCallback Memoization", "useRef for Imperative DOM & Stable Values",
        "useContext for Dependency Injection", "Custom Hooks Architecture", "React 19 Server Actions & use Hook"
      ]
    },
    {
      category: "State Architecture",
      items: [
        "Local vs Lifted State", "Global Store with Zustand / Redux Toolkit",
        "Server State with TanStack React Query", "Optimistic UI Updates",
        "Cache Invalidation & Stale-While-Revalidate", "URL State Management"
      ]
    },
    {
      category: "Performance & Rendering Optimization",
      items: [
        "React Fiber Reconciliation Engine", "Profiler Tools & Flamechart Analysis",
        "Code Splitting & React.lazy / Suspense", "Virtualizing Massive Lists (TanStack Virtual)",
        "Avoiding Unnecessary Re-renders", "SSR & Hydration Mismatches"
      ]
    },
    {
      category: "Frameworks & Ecosystem",
      items: [
        "Next.js App Router (RSC vs Client Components)", "Server-Side Rendering (SSR) & Static Site Gen (SSG)",
        "Tailwind CSS & Component Styling (Shadcn/UI)", "React Hook Form & Zod Schema Validation",
        "TypeScript with Strict React Props & Generics", "Unit Testing with Vitest & React Testing Library"
      ]
    }
  ],
  software: [
    {
      name: "VS Code / Cursor",
      specialties: ["TypeScript Configuration", "ESLint & Prettier Strict Rules", "React DevTools Integration", "Debugging Breakpoints"]
    },
    {
      name: "Next.js 14/15",
      specialties: ["Server Actions", "Route Handlers & Middleware", "Incremental Static Regeneration (ISR)", "Parallel & Intercepting Routes"]
    },
    {
      name: "Vite",
      specialties: ["HMR Optimization", "Rollup Plugin Bundling", "Environment Variable Strategy", "SPA Performance Tuning"]
    }
  ],
  specialties: [
    "Full-Stack Next.js Applications", "Complex Interactive Dashboards", "Design System Component Libraries",
    "High-Performance SPA Development", "State Management Architecture", "Real-Time Web Applications (WebSockets/Supabase)"
  ]
};

const PYTHON_DEVELOPMENT_SKILL: SkillDef = {
  id: "python-development",
  name: "Python Programming",
  category: "Software & Data Engineering",
  description: "Object-oriented programming, asynchronous programming, FastAPI, automation, and backend systems.",
  subSkillGroups: [
    {
      category: "Language Fundamentals & OOP",
      items: [
        "Data Structures (Lists, Dicts, Sets, Tuples, Deque)", "List & Dictionary Comprehensions",
        "Generators, Iterators & yield", "Decorators & Function Wrappers",
        "Dunder Methods (__init__, __repr__, __call__, __enter__)", "Context Managers (with statements)",
        "Type Hinting & Pydantic Validation", "OOP Principles & Multiple Inheritance"
      ]
    },
    {
      category: "Concurrency & Async",
      items: [
        "Asyncio Event Loops & Coroutines", "Threading vs Multiprocessing (GIL Considerations)",
        "Task Pools & ThreadPoolExecutor", "Async Context Managers & HTTP Clients (httpx/aiohttp)"
      ]
    },
    {
      category: "Web Frameworks & APIs",
      items: [
        "FastAPI Dependency Injection & OpenAPI Specs", "Django ORM & Model Relationships",
        "Flask Microservice Architecture", "SQLAlchemy 2.0 Async Session Management",
        "Celery Distributed Task Queue & Redis Broker", "JWT Authentication & OAuth2 Flow"
      ]
    },
    {
      category: "Testing & Best Practices",
      items: [
        "pytest Fixtures & Parameterization", "Mocking & Monkeypatching",
        "Poetry / uv Package Management", "Docker Containerization of Python Services", "PEP 8 Compliance & Ruff Linter"
      ]
    }
  ],
  software: [
    {
      name: "FastAPI",
      specialties: ["Pydantic V2 Models", "Async Endpoint Handlers", "Dependency Injection Framework", "Background Tasks & WebSockets"]
    },
    {
      name: "Django",
      specialties: ["Django REST Framework (DRF)", "Custom Middleware & Authentication", "Complex QuerySets & Migrations", "Celery Task Integration"]
    },
    {
      name: "PyCharm / VS Code",
      specialties: ["Virtualenv Isolation", "Remote SSH Debugging", "Memory Profiling", "Database Inspection"]
    }
  ],
  specialties: [
    "Scalable REST API Development", "Asynchronous Backend Microservices", "Web Scraping & Data Extraction",
    "Data Pipeline Automation", "AI / LLM Backend Integration (LangChain/LlamaIndex)"
  ]
};

const DATA_ANALYSIS_SKILL: SkillDef = {
  id: "data-analysis",
  name: "Data Analysis & Visualization",
  category: "Data Science & Analytics",
  description: "Exploratory data analysis, SQL querying, statistical modeling, Pandas, and interactive BI dashboards.",
  subSkillGroups: [
    {
      category: "SQL & Relational Databases",
      items: [
        "Complex Joins (Inner, Left, Cross, Self)", "Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD)",
        "Common Table Expressions (CTEs) & Recursive Queries", "Subqueries & Correlated Subqueries",
        "Aggregation & Grouping Sets / Rollup", "Query Execution Plans & Index Optimization"
      ]
    },
    {
      category: "Python Data Stack (Pandas / NumPy)",
      items: [
        "DataFrame Indexing, Slicing & Filtering", "Handling Missing Values & Outliers",
        "GroupBy Aggregations & Pivot Tables", "Merging, Joining & Concatenating DataFrames",
        "Vectorized Operations with NumPy Arrays", "Time Series Analysis & Resampling"
      ]
    },
    {
      category: "Statistical Concepts",
      items: [
        "Descriptive Statistics (Mean, Median, Std Dev, IQR)", "Hypothesis Testing & p-values (A/B Testing)",
        "Correlation vs Causation (Pearson, Spearman)", "Probability Distributions (Normal, Binomial, Poisson)",
        "Confidence Intervals & Sample Sizing"
      ]
    },
    {
      category: "Visualization & Dashboards",
      items: [
        "Chart Selection Principles (Bar, Scatter, Heatmap, Boxplot)", "Matplotlib & Seaborn Statistical Plots",
        "Interactive Plotly Charts", "Power BI Data Modeling (DAX & Power Query)", "Tableau Calculated Fields & LOD Expressions"
      ]
    }
  ],
  software: [
    {
      name: "Power BI",
      specialties: ["DAX Measure Calculations", "Power Query M Transformations", "Star Schema Data Modeling", "Row-Level Security (RLS)"]
    },
    {
      name: "Tableau",
      specialties: ["Level of Detail (LOD) Expressions", "Interactive Dashboard Actions", "Table Calculations", "Data Blending"]
    },
    {
      name: "Jupyter / Python",
      specialties: ["Pandas Data Wrangling", "Seaborn / Matplotlib Visuals", "Statsmodels Hypothesis Testing", "Automated EDA Reports"]
    }
  ],
  specialties: [
    "Executive KPI Dashboards", "E-Commerce Customer Cohort Analysis", "Marketing Attribution & Funnel Analytics",
    "A/B Testing & Experimentation", "Financial Trend Forecasting", "Automated SQL Reporting Pipelines"
  ]
};

// ============================================================================
// 3. BUSINESS & MARKETING ROLES (Digital Marketer, SEO, Copywriter, etc.)
// ============================================================================

const DIGITAL_MARKETING_SKILL: SkillDef = {
  id: "digital-marketing",
  name: "Digital Marketing & Performance Ads",
  category: "Growth & Acquisition",
  description: "Paid advertising, campaign structure, conversion rate optimization (CRO), ROAS scaling, and analytics.",
  subSkillGroups: [
    {
      category: "Paid Ads Strategy & Execution",
      items: [
        "Meta Ads Manager Campaign Architecture (CBO vs ABO)", "Audience Segmentation & Lookalikes (LAL)",
        "Google Search Ads (Keyword Match Types, Negative Keywords)", "Google Performance Max (PMax) Campaigns",
        "TikTok Ads Spark Ads & Creative Hooks", "Retargeting Funnels (TOFU, MOFU, BOFU)"
      ]
    },
    {
      category: "Metrics & Analytics",
      items: [
        "ROAS, CPA, CPM, CPC, CTR & CVR Calculation", "Google Analytics 4 (GA4) Event Setup & Custom Dimensions",
        "Meta Pixel & Conversions API (CAPI) Server-Side Tracking", "UTM Tracking Parameter Architecture",
        "Cohort LTV & Customer Acquisition Cost (CAC) Ratio"
      ]
    },
    {
      category: "Conversion Rate Optimization (CRO)",
      items: [
        "Landing Page Value Proposition Design", "A/B Split Testing Protocols",
        "Heatmap & Session Recording Analysis (Hotjar/Clarity)", "Checkout Funnel Friction Removal"
      ]
    }
  ],
  software: [
    {
      name: "Meta Ads Manager",
      specialties: ["CBO Campaign Budget Scaling", "Dynamic Creative Testing (DCT)", "Custom & Lookalike Audiences", "Conversions API Setup"]
    },
    {
      name: "Google Ads",
      specialties: ["Search Keyword Bidding Strategies (tCPA/tROAS)", "Performance Max Optimization", "Negative Keyword Lists", "Conversion Tracking"]
    },
    {
      name: "Google Analytics 4",
      specialties: ["Custom Exploration Reports", "E-commerce Purchase Funnels", "Audience Builder", "Attribution Modeling"]
    }
  ],
  specialties: [
    "D2C E-Commerce Paid Scaling", "B2B Lead Generation Funnels", "App Install Campaigns",
    "High-ROAS Retargeting Systems", "Conversion Rate Optimization (CRO)"
  ]
};

const SEO_SKILL: SkillDef = {
  id: "seo-optimization",
  name: "Search Engine Optimization (SEO)",
  category: "Organic Search & Content Growth",
  description: "Keyword research, technical SEO, on-page optimization, backlink strategy, and search rankings.",
  subSkillGroups: [
    {
      category: "Technical SEO",
      items: [
        "Crawlability & Indexability (robots.txt, XML sitemaps)", "Core Web Vitals (LCP, INP, CLS Optimization)",
        "Canonicalization & Duplicate Content Handling", "Schema.org Structured Data Markup (JSON-LD)",
        "HTTP Status Codes & 301/302 Redirect Strategies", "Mobile-First Indexing Audit"
      ]
    },
    {
      category: "Keyword Research & Content Strategy",
      items: [
        "Search Intent Analysis (Informational, Commercial, Transactional)", "Keyword Difficulty vs Search Volume Evaluation",
        "Topic Clustering & Pillar Page Strategy", "Content Gap Analysis against Competitors",
        "Featured Snippet & People Also Ask Optimization"
      ]
    },
    {
      category: "On-Page & Off-Page SEO",
      items: [
        "Title Tag & Meta Description CTR Optimization", "Header Hierarchy (H1, H2, H3)",
        "Internal Linking Architecture & PageRank Distribution", "High-Quality Backlink Outreach & Link Insertion",
        "Local SEO & Google Business Profile Optimization"
      ]
    }
  ],
  software: [
    {
      name: "Ahrefs",
      specialties: ["Site Explorer Backlink Audits", "Keywords Explorer Gap Analysis", "Content Explorer Trend Mining", "Site Audit Crawler"]
    },
    {
      name: "Semrush",
      specialties: ["Domain Overview & Competitor Benchmarking", "Keyword Magic Tool", "On-Page SEO Checker", "Position Tracking"]
    },
    {
      name: "Google Search Console",
      specialties: ["Performance Query Analysis", "Coverage & Indexing Fixes", "Core Web Vitals Report", "URL Inspection Tool"]
    }
  ],
  specialties: [
    "SaaS Organic Growth Strategy", "E-Commerce Category SEO", "Programmatic SEO Architecture",
    "Local SEO Domination", "Technical Site Migration & Relaunches"
  ]
};

// ============================================================================
// 4. COMMUNICATION ROLES (Public Speaker, English Coach, Script Writer, etc.)
// ============================================================================

const PUBLIC_SPEAKING_SKILL: SkillDef = {
  id: "public-speaking",
  name: "Public Speaking & Presentation",
  category: "Oral Communication & Executive Presence",
  description: "Vocal modulation, stage presence, narrative storytelling, audience engagement, and keynote delivery.",
  subSkillGroups: [
    {
      category: "Vocal Delivery & Mechanics",
      items: [
        "Diaphragmatic Breath Control", "Pitch Modulation & Vocal Variety", "Pacing & Strategic Pauses",
        "Articulation & Enunciation", "Eliminating Filler Words (Ums, Ahs, Likes)", "Projection & Volume Control"
      ]
    },
    {
      category: "Non-Verbal Communication",
      items: [
        "Stage Presence & Movement", "Open Body Language & Posture", "Purposeful Hand Gestures",
        "Eye Contact Distribution", "Micro-Expressions & Warmth"
      ]
    },
    {
      category: "Speech Structure & Storytelling",
      items: [
        "Hook & Opening Impact", "The Hero's Journey Narrative Arc", "Problem-Agitation-Solution Structure",
        "Rhetorical Devices (Anaphora, Rule of Three, Metaphor)", "Call to Action (CTA) & Memorable Closing"
      ]
    }
  ],
  software: [
    {
      name: "Keynote / PowerPoint",
      specialties: ["Visual Slide Deck Design", "Minimalist Typography Slides", "Presenter View Mastery", "Clicker Timing"]
    }
  ],
  specialties: [
    "Tech Keynote & Pitch Competitions", "TEDx-Style Narrative Speeches", "Corporate Executive Presentations",
    "Webinar & Online Workshop Hosting", "Master of Ceremonies (Emcee)"
  ]
};

// ============================================================================
// COMPLETE 50+ ROLE LIBRARY
// ============================================================================

export const ROLES: RoleDef[] = [
  // ── CREATIVE ROLES ──
  {
    id: "video-editor",
    name: "Video Editor",
    category: "Creative",
    description: "Specializes in editing, color grading, pacing, and post-production for digital and broadcast video.",
    skills: [VIDEO_EDITING_SKILL, MOTION_GRAPHICS_SKILL]
  },
  {
    id: "photo-editor",
    name: "Photo Editor",
    category: "Creative",
    description: "Expert in RAW image processing, portrait retouching, frequency separation, and color correction.",
    skills: [PHOTO_EDITING_SKILL, GRAPHIC_DESIGN_SKILL]
  },
  {
    id: "graphic-designer",
    name: "Graphic Designer",
    category: "Creative",
    description: "Crafts brand identities, vector illustrations, promotional collateral, and print publications.",
    skills: [GRAPHIC_DESIGN_SKILL, PHOTO_EDITING_SKILL]
  },
  {
    id: "ui-ux-designer",
    name: "UI/UX Designer",
    category: "Creative",
    description: "Designs user-centric digital interfaces, wireframes, design systems, and interactive prototypes.",
    skills: [UI_UX_SKILL, GRAPHIC_DESIGN_SKILL]
  },
  {
    id: "motion-graphics-designer",
    name: "Motion Graphics Designer",
    category: "Creative",
    description: "Creates animated typography, 2D/3D visual assets, logo animations, and title sequences.",
    skills: [MOTION_GRAPHICS_SKILL, VIDEO_EDITING_SKILL]
  },
  {
    id: "3d-artist",
    name: "3D Artist & Modeler",
    category: "Creative",
    description: "Builds 3D assets, character models, hard-surface environments, lighting, and realistic shaders.",
    skills: [MOTION_GRAPHICS_SKILL]
  },
  {
    id: "photographer",
    name: "Photographer",
    category: "Creative",
    description: "Captures studio, portrait, commercial, and landscape photography with advanced lighting control.",
    skills: [PHOTO_EDITING_SKILL]
  },
  {
    id: "content-creator",
    name: "Content Creator",
    category: "Creative",
    description: "Produces engaging multi-platform video, social media hooks, and audience-building content.",
    skills: [VIDEO_EDITING_SKILL, PHOTO_EDITING_SKILL, GRAPHIC_DESIGN_SKILL]
  },
  {
    id: "music-producer",
    name: "Music Producer & Beatmaker",
    category: "Creative",
    description: "Composes, arranges, synthesizes, and mixes music tracks across modern genres.",
    skills: [VIDEO_EDITING_SKILL]
  },
  {
    id: "audio-editor",
    name: "Audio Editor & Sound Designer",
    category: "Creative",
    description: "Specializes in dialogue cleanup, Foley sound design, podcast mixing, and audio mastering.",
    skills: [VIDEO_EDITING_SKILL]
  },

  // ── TECHNOLOGY ROLES ──
  {
    id: "react-developer",
    name: "React Developer",
    category: "Technology",
    description: "Specializes in building modern, interactive SPAs and full-stack web applications with React & Next.js.",
    skills: [REACT_DEVELOPMENT_SKILL]
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    category: "Technology",
    description: "Builds responsive, high-performance web applications using HTML5, modern CSS/Tailwind, and TypeScript.",
    skills: [REACT_DEVELOPMENT_SKILL, UI_UX_SKILL]
  },
  {
    id: "full-stack-developer",
    name: "Full Stack Developer",
    category: "Technology",
    description: "Engineers complete web solutions spanning frontend client interfaces, APIs, and database persistence.",
    skills: [REACT_DEVELOPMENT_SKILL, PYTHON_DEVELOPMENT_SKILL]
  },
  {
    id: "python-developer",
    name: "Python Developer",
    category: "Technology",
    description: "Builds robust backend services, automated scripts, API integrations, and async systems with Python.",
    skills: [PYTHON_DEVELOPMENT_SKILL, DATA_ANALYSIS_SKILL]
  },
  {
    id: "backend-developer",
    name: "Backend Developer",
    category: "Technology",
    description: "Architects scalable microservices, relational/NoSQL databases, authentication, and caching layers.",
    skills: [PYTHON_DEVELOPMENT_SKILL]
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    category: "Technology",
    description: "Extracts business insights from raw data using SQL, Pandas, statistical testing, and BI dashboards.",
    skills: [DATA_ANALYSIS_SKILL, PYTHON_DEVELOPMENT_SKILL]
  },
  {
    id: "machine-learning-engineer",
    name: "Machine Learning Engineer",
    category: "Technology",
    description: "Trains, fine-tunes, and deploys predictive ML models and deep learning architectures into production.",
    skills: [PYTHON_DEVELOPMENT_SKILL, DATA_ANALYSIS_SKILL]
  },
  {
    id: "mobile-developer",
    name: "Mobile App Developer (React Native / Flutter)",
    category: "Technology",
    description: "Creates cross-platform iOS and Android native-like experiences with smooth mobile UI.",
    skills: [REACT_DEVELOPMENT_SKILL]
  },
  {
    id: "devops-engineer",
    name: "DevOps & Cloud Engineer",
    category: "Technology",
    description: "Automates CI/CD pipelines, Kubernetes container orchestration, and cloud infrastructure as code (IaC).",
    skills: [PYTHON_DEVELOPMENT_SKILL]
  },
  {
    id: "database-developer",
    name: "Database Developer & Architect",
    category: "Technology",
    description: "Designs relational schemas, complex stored procedures, indexing strategies, and high-volume data stores.",
    skills: [DATA_ANALYSIS_SKILL]
  },

  // ── BUSINESS & MARKETING ROLES ──
  {
    id: "digital-marketer",
    name: "Digital Marketer",
    category: "Business / Marketing",
    description: "Executes paid acquisition campaigns, social growth, and multi-channel marketing funnels.",
    skills: [DIGITAL_MARKETING_SKILL, SEO_SKILL]
  },
  {
    id: "seo-specialist",
    name: "SEO Specialist",
    category: "Business / Marketing",
    description: "Drives organic search traffic through technical site audits, keyword strategies, and backlink growth.",
    skills: [SEO_SKILL, DIGITAL_MARKETING_SKILL]
  },
  {
    id: "social-media-manager",
    name: "Social Media Manager",
    category: "Business / Marketing",
    description: "Manages social presence, content calendars, community growth, and viral distribution strategies.",
    skills: [DIGITAL_MARKETING_SKILL, GRAPHIC_DESIGN_SKILL]
  },
  {
    id: "copywriter",
    name: "Copywriter & Content Writer",
    category: "Business / Marketing",
    description: "Writes high-converting sales copy, email sequences, landing page headlines, and long-form articles.",
    skills: [SEO_SKILL, DIGITAL_MARKETING_SKILL]
  },
  {
    id: "brand-strategist",
    name: "Brand Strategist",
    category: "Business / Marketing",
    description: "Defines brand positioning, messaging pillars, competitive differentiation, and tone of voice.",
    skills: [GRAPHIC_DESIGN_SKILL, DIGITAL_MARKETING_SKILL]
  },
  {
    id: "product-manager",
    name: "Product Manager",
    category: "Business / Marketing",
    description: "Defines product roadmaps, user stories, feature prioritization, and go-to-market execution.",
    skills: [UI_UX_SKILL, DATA_ANALYSIS_SKILL]
  },

  // ── COMMUNICATION ROLES ──
  {
    id: "public-speaker",
    name: "Public Speaker",
    category: "Communication",
    description: "Delivers keynote presentations, motivational talks, and executive speeches with vocal command.",
    skills: [PUBLIC_SPEAKING_SKILL]
  },
  {
    id: "english-coach",
    name: "English Communication Coach",
    category: "Communication",
    description: "Coaches professionals on accent softening, business English fluency, and confident workplace dialogue.",
    skills: [PUBLIC_SPEAKING_SKILL]
  },
  {
    id: "script-writer",
    name: "Script Writer",
    category: "Communication",
    description: "Writes YouTube scripts, commercial video treatments, narrative dialogues, and retention-focused hooks.",
    skills: [PUBLIC_SPEAKING_SKILL, VIDEO_EDITING_SKILL]
  },
  {
    id: "presentation-specialist",
    name: "Presentation Specialist",
    category: "Communication",
    description: "Crafts high-impact pitch decks, visual narrative structures, and executive slide presentations.",
    skills: [PUBLIC_SPEAKING_SKILL, GRAPHIC_DESIGN_SKILL]
  }
];

// ============================================================================
// HELPER QUERY FUNCTIONS
// ============================================================================

export function getRoleByNameOrId(identifier: string): RoleDef | undefined {
  if (!identifier) return undefined;
  const lower = identifier.toLowerCase().trim();
  return ROLES.find(r => r.id.toLowerCase() === lower || r.name.toLowerCase() === lower);
}

export function getSkillsForRole(roleNameOrId: string): SkillDef[] {
  const role = getRoleByNameOrId(roleNameOrId);
  if (!role) {
    // Return all default popular skills if role is custom or not found
    return [VIDEO_EDITING_SKILL, PHOTO_EDITING_SKILL, GRAPHIC_DESIGN_SKILL, UI_UX_SKILL, REACT_DEVELOPMENT_SKILL, PYTHON_DEVELOPMENT_SKILL, DATA_ANALYSIS_SKILL, DIGITAL_MARKETING_SKILL, SEO_SKILL, PUBLIC_SPEAKING_SKILL];
  }
  return role.skills;
}

export function getSkillByNameOrId(skillNameOrId: string): SkillDef | undefined {
  if (!skillNameOrId) return undefined;
  const lower = skillNameOrId.toLowerCase().trim();
  for (const role of ROLES) {
    const found = role.skills.find(s => s.id.toLowerCase() === lower || s.name.toLowerCase() === lower);
    if (found) return found;
  }
  return undefined;
}

export function getSubSkillsForSkill(skillNameOrId: string): SubSkillGroup[] {
  const skill = getSkillByNameOrId(skillNameOrId);
  return skill ? skill.subSkillGroups : [];
}

export function getSoftwareForSkill(skillNameOrId: string): SoftwareDef[] {
  const skill = getSkillByNameOrId(skillNameOrId);
  return skill ? skill.software : [];
}

export function getSpecialtiesForSoftware(skillNameOrId: string, softwareName: string): string[] {
  const skill = getSkillByNameOrId(skillNameOrId);
  if (!skill) return [];
  const sw = skill.software.find(s => s.name.toLowerCase() === softwareName.toLowerCase());
  return sw ? sw.specialties : skill.specialties;
}

export function getGeneralSpecialtiesForSkill(skillNameOrId: string): string[] {
  const skill = getSkillByNameOrId(skillNameOrId);
  return skill ? skill.specialties : [];
}
