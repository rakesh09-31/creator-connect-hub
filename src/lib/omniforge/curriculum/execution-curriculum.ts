/**
 * OmniForge Dedicated Project Execution Roadmap Architect
 *
 * Designed exclusively for delivering real-world projects and outcomes:
 * - Mobile App Launches (iOS/Android/Cross-Platform)
 * - SaaS Platforms & MVP Launches
 * - E-Commerce Systems
 * - Full-Stack Application Architectures
 *
 * Each phase contains:
 * - Objective & expected deliverable
 * - Concrete actionable tasks with assigned roles, dependencies, deliverables, and validation procedures
 * - Implementation guidance & required skills/tools
 * - Acceptance criteria & Definition of Done
 * - Testing & verification steps
 * - Risks & mitigation strategies
 * - Verifiable completion evidence
 */

import { RoadmapNode, ProgressiveProjectStage, RoadmapActionableTask } from "../user-intelligence";
import { BlueprintStageDefinition, StageContentDetail } from "./types";

export interface ExecutionPhaseTemplate {
  phase: number;
  title: string;
  objective: string;
  deliverables: string[];
  roles: string[];
  requiredTools: string[];
  actionableTasks: Array<{
    id: string;
    title: string;
    role: string;
    deliverable: string;
    dependencies: string[];
    description: string;
    risks: string;
    riskMitigation: string;
    validationProcedure: string;
  }>;
  implementationGuidance: string;
  acceptanceCriteria: string[];
  testingAndVerification: string[];
  risksAndMitigations: Array<{ risk: string; mitigation: string }>;
  definitionOfDone: string[];
  evidenceRequired: string[];
  estimatedEffortHours: number;
  estimatedCalendarPacing: string;
}

export function buildExecutionPhasesForProject(projectSubject: string, domain: string): ExecutionPhaseTemplate[] {
  const normSubject = projectSubject.toLowerCase();
  const isMobile = normSubject.includes("mobile") || normSubject.includes("app") || normSubject.includes("ios") || normSubject.includes("android");
  const isEcommerce = normSubject.includes("e-commerce") || normSubject.includes("shop") || normSubject.includes("store") || normSubject.includes("marketplace");

  const baseTitle = isMobile
    ? "Mobile Application"
    : isEcommerce
    ? "E-Commerce Platform"
    : projectSubject;

  if (isMobile) {
    return [
      {
        phase: 1,
        title: "Product Discovery, User Journeys & Mobile Architecture",
        objective: "Define user journeys, cross-platform vs native evaluation, OpenAPI backend contracts, and architecture specification for mobile.",
        deliverables: [
          "Mobile PRD & User Flow Specification",
          "Cross-platform architecture evaluation document",
          "OpenAPI 3.0 specification for backend mobile endpoints",
          "Wireframe prototypes with interaction states",
        ],
        roles: ["Lead Mobile Architect", "Product Manager", "UX Designer"],
        requiredTools: ["Figma", "OpenAPI", "Notion", "Miro"],
        actionableTasks: [
          {
            id: "mob_task_1_1",
            title: "Author Mobile PRD & Core Interaction Flows",
            role: "Product Manager",
            deliverable: "Approved Mobile PRD with edge case interaction handling",
            dependencies: [],
            description: "Define screen flows, gesture interactions, offline requirements, and error recovery states.",
            risks: "Underestimating offline edge cases and network latency variability",
            riskMitigation: "Design offline-first state machines with clear fallback indicators",
            validationProcedure: "Stakeholder sign-off on PRD and wireflow walk-through",
          },
          {
            id: "mob_task_1_2",
            title: "Specify Mobile System Architecture & Data Layer",
            role: "Lead Mobile Architect",
            deliverable: "Architecture blueprint defining state management, cache invalidation, and network resilient layer",
            dependencies: ["mob_task_1_1"],
            description: "Select runtime (React Native / Flutter / Swift / Kotlin), local persistence engine, and OpenAPI contract generator.",
            risks: "Choosing architectural abstractions that impede 60fps rendering",
            riskMitigation: "Benchmark frame rate with prototype list virtualization before committing to architecture",
            validationProcedure: "Prototype demonstrates 60fps scrolling and valid schema generation",
          },
        ],
        implementationGuidance: "Establish schema contracts and offline-first design patterns upfront.",
        acceptanceCriteria: [
          "PRD approved with 100% of mobile screens wireframed",
          "Architecture specification defines local cache and networking layers",
          "OpenAPI spec passes linting and generates type-safe SDK",
        ],
        testingAndVerification: [
          "Validate OpenAPI schema using automated linters",
          "Review interaction prototype across phone and tablet aspect ratios",
        ],
        risksAndMitigations: [
          { risk: "Navigation complexity across deep-links", mitigation: "Enforce centralized URL schema tree." },
        ],
        definitionOfDone: [
          "PRD approved and architecture document signed off",
          "OpenAPI contracts published to shared repository",
        ],
        evidenceRequired: [
          "Approved PRD document in project wiki",
          "OpenAPI 3.0 YAML spec file in repo",
        ],
        estimatedEffortHours: 35,
        estimatedCalendarPacing: "Sprint 1 (1.5 weeks)",
      },
      {
        phase: 2,
        title: "Mobile Design System, Atomic UI & Navigation Stack",
        objective: "Construct design tokens, accessible touch-friendly component hierarchy, and deep-linkable navigation routes.",
        deliverables: [
          "Theme-aware token system (light & dark modes)",
          "Accessible UI component library (inputs, buttons, cards)",
          "Deep-linkable nested stack & tab navigation tree",
        ],
        roles: ["Senior Mobile UI Engineer", "Design Systems Engineer"],
        requiredTools: ["React Navigation / Flutter Navigator", "Tailwind / StyleSheets", "Figma Tokens"],
        actionableTasks: [
          {
            id: "mob_task_2_1",
            title: "Build Theme Tokens & Accessible Atomic UI Library",
            role: "Design Systems Engineer",
            deliverable: "Atomic component library with touch targets >= 48x48dp",
            dependencies: [],
            description: "Implement design tokens for typography scales, color palettes, spacing, and high-contrast accessibility.",
            risks: "Inconsistent padding and clipping across diverse Android/iOS screen notches",
            riskMitigation: "Utilize Safe Area Insets and automated multi-device snapshot testing",
            validationProcedure: "Components pass accessibility audit with zero clipped content on notched devices",
          },
          {
            id: "mob_task_2_2",
            title: "Configure Route Hierarchy & Deep-Linking Engine",
            role: "Senior Mobile UI Engineer",
            deliverable: "Nested navigation tree with universal link / app link routing",
            dependencies: ["mob_task_2_1"],
            description: "Set up nested tabs, stacks, modal presentations, and deep link URL parser.",
            risks: "Unauthenticated deep links exposing protected screens",
            riskMitigation: "Implement route navigation guards verifying authentication before rendering",
            validationProcedure: "Simulate deep-link URLs; confirm proper redirects and auth guard activation",
          },
        ],
        implementationGuidance: "Prioritize responsive touch targets and strict safe-area management.",
        acceptanceCriteria: [
          "All components adhere to minimum 48x48dp touch targets",
          "Dark and light mode toggle flawlessly without contrast loss",
          "Deep link routes handle valid and invalid payloads safely",
        ],
        testingAndVerification: [
          "Run Storybook / Component showcase on iOS simulator and Android emulator",
          "Execute automated link opening tests via adb and xcrun simctl",
        ],
        risksAndMitigations: [
          { risk: "Back button hardware behavior differs on Android", mitigation: "Implement BackHandler hardware listener." },
        ],
        definitionOfDone: [
          "UI component library passes visual regression suite",
          "Navigation tree handles nested routes and parameter passing",
        ],
        evidenceRequired: [
          "Component library screenshot showcase",
          "Navigation test passing log in CI",
        ],
        estimatedEffortHours: 40,
        estimatedCalendarPacing: "Sprint 2 (2 weeks)",
      },
      {
        phase: 3,
        title: "Local State Management & Offline Persistence",
        objective: "Implement resilient local caching, encrypted credentials storage, and background synchronization.",
        deliverables: [
          "SQLite / WatermelonDB / MMKV offline database engine",
          "Encrypted keychain / keystore credential storage",
          "Optimistic update mutation pipeline with sync queue",
        ],
        roles: ["Senior Mobile Systems Engineer", "Security Engineer"],
        requiredTools: ["WatermelonDB / MMKV", "SQLite", "Keychain / Keystore"],
        actionableTasks: [
          {
            id: "mob_task_3_1",
            title: "Implement Offline Database Schema & Indexes",
            role: "Senior Mobile Systems Engineer",
            deliverable: "High-performance indexed local SQLite/MMKV database",
            dependencies: [],
            description: "Define database migrations, indexed queries, and relational models for cached entities.",
            risks: "Database migrations corrupting user state during app upgrades",
            riskMitigation: "Write idempotent forward migrations and verify with downgrade/upgrade tests",
            validationProcedure: "Migrations execute cleanly across 10,000 synthetic records with zero data loss",
          },
          {
            id: "mob_task_3_2",
            title: "Build Optimistic Mutations & Background Sync Queue",
            role: "Senior Mobile Systems Engineer",
            deliverable: "Sync queue managing network transitions and retry exponential backoff",
            dependencies: ["mob_task_3_1"],
            description: "Implement local optimistic cache updates with background replay when device regains connectivity.",
            risks: "Out-of-order writes causing synchronization conflicts with backend state",
            riskMitigation: "Adopt timestamp vector clocks and server-wins conflict resolution policies",
            validationProcedure: "Disconnect network, perform mutations, reconnect; verify server syncs without data conflict",
          },
        ],
        implementationGuidance: "Design for zero network connectivity as the default state.",
        acceptanceCriteria: [
          "App renders full cached dashboard when launched in airplane mode",
          "Mutations queue offline and flush automatically upon reconnection",
          "Sensitive tokens stored exclusively in Keychain / Keystore",
        ],
        testingAndVerification: [
          "Simulate airplane mode and poor 2G/3G network throttling",
          "Execute sync queue fuzzing tests with concurrent mutations",
        ],
        risksAndMitigations: [
          { risk: "Sync storm when multiple devices reconnect", mitigation: "Add randomized jitter to retry intervals." },
        ],
        definitionOfDone: [
          "Offline persistence verified with automated integration tests",
          "Zero plain-text secrets in LocalStorage or unencrypted files",
        ],
        evidenceRequired: [
          "Offline mode demonstration screen recording",
          "Integration test report verifying sync queue replay",
        ],
        estimatedEffortHours: 45,
        estimatedCalendarPacing: "Sprint 3 (2 weeks)",
      },
      {
        phase: 4,
        title: "API Integration, Authentication & Push Notifications",
        objective: "Connect cloud APIs, implement OAuth2/Biometric authentication, and deliver targeted push notifications.",
        deliverables: [
          "Resilient HTTP client with automatic JWT token refreshing",
          "Biometric FaceID / TouchID authentication unlock flow",
          "APNs & FCM push notification handling and background receivers",
        ],
        roles: ["Senior Mobile Full Stack Engineer", "Security Engineer"],
        requiredTools: ["Axios / Ky", "Firebase Cloud Messaging", "Apple APNs", "Biometric SDK"],
        actionableTasks: [
          {
            id: "mob_task_4_1",
            title: "Implement JWT Refresh Interceptor & Biometric Auth",
            role: "Senior Mobile Full Stack Engineer",
            deliverable: "HTTP interceptor handling 401s transparently and biometric login modal",
            dependencies: [],
            description: "Configure Axios/fetch interceptor to refresh expired access tokens seamlessly without logging the user out.",
            risks: "Race conditions when multiple concurrent requests trigger simultaneous token refreshes",
            riskMitigation: "Queue failed requests behind a singleton refresh promise",
            validationProcedure: "Trigger 10 concurrent requests with expired access token; confirm single refresh and all 10 succeed",
          },
          {
            id: "mob_task_4_2",
            title: "Configure FCM & APNs Push Notification Service",
            role: "Senior Mobile Full Stack Engineer",
            deliverable: "Push token registration and deep-link notification handler",
            dependencies: ["mob_task_4_1"],
            description: "Register device tokens with backend, handle foreground heads-up banners, and navigate to target route on push tap.",
            risks: "Users disabling push permissions leaving critical notifications unseen",
            riskMitigation: "Provide in-app notification inbox alongside push notifications",
            validationProcedure: "Send test APNs and FCM pushes; verify foreground banner and tap deep-link navigation",
          },
        ],
        implementationGuidance: "Handle token expiration transparently without disruptive logout dialogs.",
        acceptanceCriteria: [
          "Access token refreshed automatically with zero user friction",
          "FaceID/Biometrics unlocks user session securely",
          "Push notifications route user directly to specific content screen",
        ],
        testingAndVerification: [
          "Test token refresh with expired token fixtures",
          "Send test payload via Firebase Console and APNs command line tools",
        ],
        risksAndMitigations: [
          { risk: "Push notification token rotation", mitigation: "Re-register token with backend on every application launch." },
        ],
        definitionOfDone: [
          "Authentication suite passing security review",
          "Push notification integration verified on physical devices",
        ],
        evidenceRequired: [
          "Token refresh sequence diagram and test assertion log",
          "Device screenshot receiving real push notification",
        ],
        estimatedEffortHours: 40,
        estimatedCalendarPacing: "Sprint 4 (2 weeks)",
      },
      {
        phase: 5,
        title: "Hardware Device Testing, Performance & Security",
        objective: "Conduct automated end-to-end device testing, memory leak profiling, 60fps frame audits, and security vulnerability scans.",
        deliverables: [
          "Automated Maestro / Detox E2E test suite running in CI",
          "Performance audit report confirming 60fps rendering and zero memory leaks",
          "OWASP Mobile Top 10 security verification report",
        ],
        roles: ["QA Automation Engineer", "Performance Specialist", "Security Auditor"],
        requiredTools: ["Maestro / Detox", "Flipper / Xcode Instruments", "MobSF", "Charles Proxy"],
        actionableTasks: [
          {
            id: "mob_task_5_1",
            title: "Author Automated End-to-End Test Suite",
            role: "QA Automation Engineer",
            deliverable: "Automated test suite executing core user journeys on simulators and devices",
            dependencies: [],
            description: "Implement automated E2E tests for onboarding, checkout, search, and profile management.",
            risks: "Flaky tests due to asynchronous animations and network latency",
            riskMitigation: "Use Maestro UI automation with deterministic polling assertions instead of sleep timeouts",
            validationProcedure: "E2E suite runs 5 times consecutively on CI with 100% pass rate",
          },
          {
            id: "mob_task_5_2",
            title: "Execute Memory Leak & 60fps Performance Profiling",
            role: "Performance Specialist",
            deliverable: "Instruments profile showing stable RAM and 60fps frame rate",
            dependencies: ["mob_task_5_1"],
            description: "Profile application with Xcode Instruments and Android Studio Profiler under intensive scroll and navigation cycles.",
            risks: "Uncollected closures causing memory leaks and eventual OOM crashes",
            riskMitigation: "Isolate leaked instances in heap dumps and detach listeners in component unmount lifecycle",
            validationProcedure: "Continuous navigation cycle across 50 screens maintains RAM within +/- 15MB of baseline",
          },
        ],
        implementationGuidance: "Profile on low-end target physical hardware, not solely high-spec dev simulators.",
        acceptanceCriteria: [
          "E2E test suite passes 100% across critical user workflows",
          "No dropped frames (> 55fps) during list scrolling",
          "Zero plain-text data captured over HTTPS proxy (SSL Pinning enabled)",
        ],
        testingAndVerification: [
          "Run Maestro automated flows on AWS Device Farm or local test farm",
          "Verify SSL Pinning by attempting MITM inspection via Charles Proxy",
        ],
        risksAndMitigations: [
          { risk: "App crashes on older OS versions", mitigation: "Configure CI to run matrix tests on minimum supported OS version." },
        ],
        definitionOfDone: [
          "E2E regression suite passes with 0 failures",
          "Performance benchmarks meet 60fps budget and memory targets",
        ],
        evidenceRequired: [
          "Maestro E2E execution video recorded in CI",
          "Instruments memory profiling graph export",
        ],
        estimatedEffortHours: 45,
        estimatedCalendarPacing: "Sprint 5 (2 weeks)",
      },
      {
        phase: 6,
        title: "Release Engineering, App Store & Google Play Launch",
        objective: "Automate code signing, build release packages, pass App Store & Play Store review guidelines, and launch to production.",
        deliverables: [
          "Automated Fastlane build, sign & deploy pipeline",
          "Signed .ipa (iOS) and .aab (Android) production packages",
          "Approved App Store & Google Play listings with localized metadata",
          "Production crash monitoring and staged rollout plan",
        ],
        roles: ["Release Engineer", "Product Manager", "Compliance Lead"],
        requiredTools: ["Fastlane", "App Store Connect", "Google Play Console", "Sentry"],
        actionableTasks: [
          {
            id: "mob_task_6_1",
            title: "Configure Fastlane Match & Automated Signing Pipeline",
            role: "Release Engineer",
            deliverable: "Fastlane pipeline producing signed App Store & Play Store bundles",
            dependencies: [],
            description: "Set up encrypted certificate management (Fastlane Match) and automated changelog generation.",
            risks: "Certificate expiration halting production release pipeline",
            riskMitigation: "Store certificates in encrypted git repository with automated 60-day expiration alerts",
            validationProcedure: "Fastlane lane triggers build, signs bundle, and uploads build to TestFlight / Internal Track",
          },
          {
            id: "mob_task_6_2",
            title: "App Store Review Compliance & Phased Rollout Execution",
            role: "Product Manager",
            deliverable: "Approved app store listings and staged rollout schedule",
            dependencies: ["mob_task_6_1"],
            description: "Prepare privacy labels, account deletion mechanisms, review credentials, and initiate 7-day phased rollout.",
            risks: "App Store review rejection due to guideline 5.1.1 (Privacy) or account deletion compliance",
            riskMitigation: "Pre-audit app against Apple Human Interface Guidelines and App Review Guidelines before submission",
            validationProcedure: "App receives formal 'Ready for Sale' status from Apple and Google review teams",
          },
        ],
        implementationGuidance: "Always utilize phased release (1%, 5%, 20%, 50%, 100%) to catch telemetry spikes early.",
        acceptanceCriteria: [
          "Fastlane pipeline builds and deploys to store tracks automatically",
          "App complies with all Apple & Google store privacy directives",
          "Crash-free users rate exceeds 99.8% during initial rollout",
        ],
        testingAndVerification: [
          "TestFlight internal testing verified with 20+ testers",
          "Verify account deletion flow functions from within the app",
        ],
        risksAndMitigations: [
          { risk: "Critical bug discovered during rollout", mitigation: "Halt phased rollout immediately within App Store Connect / Play Console." },
        ],
        definitionOfDone: [
          "App live in App Store and Google Play Store",
          "Post-launch crash monitoring active with zero blocking bugs",
        ],
        evidenceRequired: [
          "App Store and Google Play Store live URLs",
          "Fastlane release pipeline successful run log",
        ],
        estimatedEffortHours: 40,
        estimatedCalendarPacing: "Sprint 6 (1.5 weeks)",
      },
    ];
  }

  return [
    {
      phase: 1,
      title: "Product Discovery, System Architecture & Technical PRD",
      objective: `Define target user journeys, non-functional latency/availability SLOs, system data contracts, and complete architecture specification for ${baseTitle}.`,
      deliverables: [
        "Product Requirements Document (PRD) with user stories",
        "System Architecture Blueprint & Data Flow Diagram",
        "OpenAPI 3.0 specification for backend endpoints",
        "Non-functional requirements specification (SLAs/SLOs)",
      ],
      roles: ["Lead System Architect", "Product Manager", "Security Engineer"],
      requiredTools: ["Figma", "OpenAPI / Swagger", "Mermaid / PlantUML", "Notion / Confluence"],
      actionableTasks: [
        {
          id: "task_1_1",
          title: "Author Product Requirements Document & User Stories",
          role: "Product Manager",
          deliverable: "Approved PRD document with prioritized user stories and acceptance criteria",
          dependencies: [],
          description: "Decompose user requirements into prioritized epics and user stories with measurable business outcomes.",
          risks: "Scope creep and unstated edge case requirements causing timeline delays",
          riskMitigation: "Enforce strict Moscow prioritization (Must have, Should have, Could have) with stakeholder sign-off",
          validationProcedure: "Stakeholder review and formal sign-off on PRD scope",
        },
        {
          id: "task_1_2",
          title: "Design System Architecture & Infrastructure Topology",
          role: "Lead System Architect",
          deliverable: "System architecture blueprint with service boundaries and network topology",
          dependencies: ["task_1_1"],
          description: "Specify service boundaries, communication protocols (REST/gRPC), caching layers, and database selections.",
          risks: "Underestimating traffic spikes and choosing single-point-of-failure infrastructure",
          riskMitigation: "Design stateless services with horizontal autoscaling and multi-AZ database clustering",
          validationProcedure: "Architecture review board evaluation against 99.9% uptime target",
        },
        {
          id: "task_1_3",
          title: "Author OpenAPI 3.0 Contract & Schema Definitions",
          role: "Lead System Architect",
          deliverable: "Valid OpenAPI 3.0 YAML/JSON specification with schema typing",
          dependencies: ["task_1_2"],
          description: "Author comprehensive REST API endpoints, request bodies, response schemas, and authentication schemes.",
          risks: "Inconsistent data contracts between frontend and backend teams",
          riskMitigation: "Generate automated TypeScript types and mock servers directly from OpenAPI schema",
          validationProcedure: "OpenAPI linter passes with 0 errors and generates valid mock responses",
        },
      ],
      implementationGuidance:
        "Begin by establishing clear service boundaries and explicit data contracts before writing code. Enforcing schema-first API design ensures that client and server teams can execute concurrently against generated mock interfaces.",
      acceptanceCriteria: [
        "PRD approved with 100% of P0 user stories defined with acceptance criteria",
        "Architecture blueprint defines all service boundaries, database schemas, and caching layers",
        "OpenAPI 3.0 spec validates with zero errors using Spectral linter",
      ],
      testingAndVerification: [
        "Run automated Spectral linting on OpenAPI specification",
        "Verify mock server generates valid responses for all endpoints",
        "Confirm architectural review checklist passes security and scalability criteria",
      ],
      risksAndMitigations: [
        { risk: "Ambiguous user requirements cause mid-sprint scope changes", mitigation: "Lock P0 requirements in sprint planning and defer additions to Phase 2 backlog." },
        { risk: "Architectural single points of failure in database persistence", mitigation: "Specify managed database instances with automated read replicas and failover." },
      ],
      definitionOfDone: [
        "PRD signed off by technical and product leads",
        "Architecture diagram committed to version control",
        "OpenAPI contracts published to shared mock server",
      ],
      evidenceRequired: [
        "PRD markdown or PDF document with approved stakeholder signatures",
        "Committed openapi.yaml specification file in repository root",
        "Architecture review approval ticket in issue tracker",
      ],
      estimatedEffortHours: 40,
      estimatedCalendarPacing: "Sprint 1 (2 weeks)",
    },
    {
      phase: 2,
      title: "UI/UX Design System, Component Library & Navigation Flows",
      objective: `Construct design tokens, accessible reusable component libraries, navigation hierarchies, and responsive views for ${baseTitle}.`,
      deliverables: [
        "Design tokens (colors, typography scale, spacing tokens)",
        "Accessible atomic component library (Button, Modal, Input, Card)",
        "Responsive views for mobile, tablet, and desktop viewports",
        "Interactive navigation prototype with deep-linking support",
      ],
      roles: ["UI/UX Designer", "Senior Frontend / Mobile Engineer", "Accessibility Auditor"],
      requiredTools: ["Figma", "Tailwind CSS / React Native StyleSheets", "Storybook", "axe DevTools"],
      actionableTasks: [
        {
          id: "task_2_1",
          title: "Establish Design Tokens & Atomic Component Primitives",
          role: "UI/UX Designer",
          deliverable: "Figma design system with tokens and exported CSS/JS variables",
          dependencies: ["task_1_1"],
          description: "Define semantic color palettes, accessible contrast ratios (4.5:1 minimum), typography scales, and button/input states.",
          risks: "Inconsistent spacing and color values across screens causing fragmented user experience",
          riskMitigation: "Standardize on an 8pt spatial grid and export tokens programmatically",
          validationProcedure: "Contrast audit confirms 100% compliance with WCAG 2.2 AA",
        },
        {
          id: "task_2_2",
          title: "Build Responsive Component Library in Storybook",
          role: "Senior Frontend / Mobile Engineer",
          deliverable: "Tested component library documented in Storybook with keyboard accessibility",
          dependencies: ["task_2_1"],
          description: "Implement reusable atomic components with TypeScript props, focus indicators, and dark mode support.",
          risks: "Inaccessible modal dialogs and dropdown menus breaking screen reader navigation",
          riskMitigation: "Utilize headless accessible primitives (Radix UI / Headless UI / React Native primitives)",
          validationProcedure: "Automated axe accessibility tests pass with zero critical violations",
        },
        {
          id: "task_2_3",
          title: "Implement Navigation Hierarchy & Screen Routing Shell",
          role: "Senior Frontend / Mobile Engineer",
          deliverable: "Working application shell with nested routing, deep links, and loading states",
          dependencies: ["task_2_2"],
          description: "Configure route hierarchy, modal stacks, tab bars, and route transitions with deep-link URL parsing.",
          risks: "Broken back-button behavior and deep links failing on cold app launches",
          riskMitigation: "Configure URL prefix matching and test cold launch deep-linking routes",
          validationProcedure: "Manual and automated smoke tests verify deep links open target screens",
        },
      ],
      implementationGuidance:
        "Build components in isolation using Storybook before wiring into pages. Test all interactive controls using only keyboard navigation to verify that focus rings remain clearly visible across both light and dark themes.",
      acceptanceCriteria: [
        "All components adhere strictly to WCAG 2.2 AA color contrast ratios (>= 4.5:1)",
        "Components render correctly across 320px, 768px, and 1440px viewports",
        "Storybook builds with zero errors and showcases all component states",
      ],
      testingAndVerification: [
        "Run axe-core automated accessibility tests on all Storybook stories",
        "Perform cross-browser visual regression testing (Chrome, Safari, Firefox)",
        "Verify touch target sizes meet minimum 48x48dp mobile touch guidelines",
      ],
      risksAndMitigations: [
        { risk: "Component bloat causing large JavaScript bundle sizes", mitigation: "Enforce tree-shaking and dynamic import splitting for heavy dependencies." },
        { risk: "Inconsistent responsive behavior on small mobile screens", mitigation: "Design mobile-first and test on real physical viewports." },
      ],
      definitionOfDone: [
        "Component library published to Storybook with 100% test coverage",
        "Application navigation shell verified on mobile and desktop viewports",
        "Zero accessibility violations detected by automated audits",
      ],
      evidenceRequired: [
        "Storybook build deployed to preview URL",
        "axe DevTools audit report showing 0 violations",
        "Screen routing test passing in test suite",
      ],
      estimatedEffortHours: 45,
      estimatedCalendarPacing: "Sprint 2 (2 weeks)",
    },
    {
      phase: 3,
      title: "Data Architecture, Relational Schema & Migration Engine",
      objective: `Model normalized relational database schemas, connection pooling, ACID transaction boundaries, and automated schema migrations for ${baseTitle}.`,
      deliverables: [
        "Normalized database ERD (Entity Relationship Diagram)",
        "Database migration scripts with up/down rollback support",
        "Seed scripts for local development and test environments",
        "Connection pool configuration with health checks",
      ],
      roles: ["Database Architect / Senior Backend Engineer", "DevOps Engineer"],
      requiredTools: ["PostgreSQL / MySQL", "SQLAlchemy / Prisma / Flyway", "Docker Compose", "pgAdmin / DBeaver"],
      actionableTasks: [
        {
          id: "task_3_1",
          title: "Model Entity Relationships & Define Normalized Schemas",
          role: "Database Architect / Senior Backend Engineer",
          deliverable: "Database ERD and SQL schema definitions with primary/foreign keys and indexes",
          dependencies: ["task_1_2"],
          description: "Model core entities, foreign key relationships, cascade delete rules, and B-tree indexes for high-frequency queries.",
          risks: "Unindexed foreign keys and search columns causing full-table scans under load",
          riskMitigation: "Add explicit indexes on all foreign keys, status filters, and created_at timestamps",
          validationProcedure: "EXPLAIN ANALYZE verifies query plans utilize index scans",
        },
        {
          id: "task_3_2",
          title: "Implement Automated Migration Engine & Seed Scripts",
          role: "Database Architect / Senior Backend Engineer",
          deliverable: "Version-controlled migration files with clean up/down migration scripts",
          dependencies: ["task_3_1"],
          description: "Configure Alembic / Prisma migration toolchain to apply incremental, non-destructive schema changes automatically.",
          risks: "Migrations failing in production causing database lockups and downtime",
          riskMitigation: "Enforce zero-downtime migration guidelines (never rename columns in a single migration)",
          validationProcedure: "Execute full migration forward and backward rollback on staging replica",
        },
        {
          id: "task_3_3",
          title: "Configure Connection Pooling & Database Health Probes",
          role: "DevOps Engineer",
          deliverable: "Configured connection pool with idle timeouts, max connections, and /health/db probe",
          dependencies: ["task_3_2"],
          description: "Tune connection pool parameters (HikariCP / SQLAlchemy pool_size), set query timeouts, and write health check endpoints.",
          risks: "Connection starvation under concurrent traffic spikes crashing the application",
          riskMitigation: "Set bounded pool sizes with queue limits and 5-second connection acquisition timeouts",
          validationProcedure: "Simulate 500 concurrent connections; verify pool handles load without connection leaks",
        },
      ],
      implementationGuidance:
        "Always execute schema migrations through version-controlled migration scripts rather than manual SQL consoles. Test all migrations against a staging clone containing realistic data volumes before applying to production.",
      acceptanceCriteria: [
        "All tables feature primary keys, timestamps, and proper foreign key cascade constraints",
        "Migrations apply and roll back cleanly in automated CI/CD pipeline",
        "Connection pool recovers automatically after simulated database disconnects",
      ],
      testingAndVerification: [
        "Run automated migration up and down tests in CI",
        "Execute query plan profiling with EXPLAIN ANALYZE on all high-traffic queries",
        "Perform connection pool exhaustion test under simulated high load",
      ],
      risksAndMitigations: [
        { risk: "Long-running transactions hold locks and block incoming writes", mitigation: "Enforce statement_timeout = '3s' on all OLTP transactions." },
        { risk: "Accidental data loss during schema migration", mitigation: "Require automated database snapshot backup immediately prior to migration execution." },
      ],
      definitionOfDone: [
        "Database migrations verified and committed to repository",
        "Seed data script populates realistic test entities",
        "Health check endpoint confirms active database connectivity",
      ],
      evidenceRequired: [
        "Entity Relationship Diagram (ERD) image or diagram file in docs/",
        "Committed migration files in repository",
        "CI pipeline log confirming migration success",
      ],
      estimatedEffortHours: 40,
      estimatedCalendarPacing: "Sprint 3 (2 weeks)",
    },
    {
      phase: 4,
      title: "Backend API Services, Authentication & External Integrations",
      objective: `Implement core REST/gRPC business logic, token-based authentication (OAuth2 / JWT), and external vendor integrations for ${baseTitle}.`,
      deliverables: [
        "REST API microservice endpoints with request validation",
        "Authentication & Authorization middleware (JWT + RBAC)",
        "External third-party integration client (Stripe, SendGrid, S3, or push)",
        "Centralized error handling and structured request logging",
      ],
      roles: ["Senior Backend Engineer", "Security Engineer"],
      requiredTools: ["FastAPI / Node.js / Spring Boot", "Postman / Bruno", "Redis", "JWT / OAuth2"],
      actionableTasks: [
        {
          id: "task_4_1",
          title: "Implement Authentication, Token Rotation & RBAC Middleware",
          role: "Security Engineer",
          deliverable: "Secure auth module with password hashing (Argon2), JWT signing, and RBAC guards",
          dependencies: ["task_3_2"],
          description: "Build user registration, login with rate limiting, access/refresh token rotation, and role authorization middleware.",
          risks: "JWT secret leakage, weak password hashing, and missing role checks on sensitive endpoints",
          riskMitigation: "Use Argon2id, store secrets in vault, and enforce least-privilege middleware guards on all routes",
          validationProcedure: "Security test confirms expired tokens and unauthorized roles receive 401/403 responses",
        },
        {
          id: "task_4_2",
          title: "Build Core Business Logic CRUD & Search Endpoints",
          role: "Senior Backend Engineer",
          deliverable: "Fully implemented business logic endpoints complying with OpenAPI specification",
          dependencies: ["task_4_1"],
          description: "Author request validation schemas, database transaction logic, and pagination handlers for core resources.",
          risks: "N+1 query loading degrading endpoint performance under multi-item fetches",
          riskMitigation: "Utilize eager loading (joinedload / selectinload) and enforce maximum page limits (e.g. limit=50)",
          validationProcedure: "Automated integration tests verify 100% of CRUD operations with expected status codes",
        },
        {
          id: "task_4_3",
          title: "Integrate Third-Party Vendor Services & Webhook Handlers",
          role: "Senior Backend Engineer",
          deliverable: "Resilient third-party integration client with webhook signature verification",
          dependencies: ["task_4_2"],
          description: "Connect payment gateways, email notifications, and storage with retry policies and idempotent webhook handlers.",
          risks: "Duplicate webhook events causing duplicate orders or charges",
          riskMitigation: "Enforce idempotency keys and store processed webhook transaction IDs in Redis/database",
          validationProcedure: "Replaying identical webhook payloads produces idempotent 200 OK with zero duplicate state",
        },
      ],
      implementationGuidance:
        "All API endpoints must validate incoming payloads defensively before hitting business logic. Store third-party credentials strictly in environment variables, and verify HMAC signatures on all incoming webhooks.",
      acceptanceCriteria: [
        "All endpoints conform exactly to the OpenAPI 3.0 specification",
        "Authentication enforces secure token rotation and passwords hashed with Argon2id",
        "Webhooks verify signatures and guarantee idempotent execution",
      ],
      testingAndVerification: [
        "Execute automated integration test suite against test database",
        "Perform webhook replay test verifying idempotency protection",
        "Test authentication endpoints against invalid tokens and brute-force lockouts",
      ],
      risksAndMitigations: [
        { risk: "External vendor API outages freeze backend request threads", mitigation: "Implement circuit breakers with 3-second timeouts and graceful fallback messaging." },
        { risk: "Unvalidated input causes injection or unhandled 500 crashes", mitigation: "Use Pydantic / Zod schema validation to reject invalid payloads at the gateway." },
      ],
      definitionOfDone: [
        "All API endpoints operational and passing automated test suite",
        "Integration tests verify end-to-end authentication and CRUD flows",
        "Structured logs emit correlation IDs across all request lifecycles",
      ],
      evidenceRequired: [
        "Automated integration test run report with 100% passing rate",
        "Recorded Postman / Bruno collection verifying all endpoints",
        "Security audit verification of JWT signing and password hashing",
      ],
      estimatedEffortHours: 45,
      estimatedCalendarPacing: "Sprint 4 (2 weeks)",
    },
    {
      phase: 5,
      title: "Client State, Offline Resilience & API Synchronization",
      objective: `Integrate client UI with backend APIs, client caching, offline persistence, optimistic UI updates, and error recovery for ${baseTitle}.`,
      deliverables: [
        "Integrated client UI with live API data fetching",
        "Offline storage engine (IndexedDB / SQLite / MMKV)",
        "Optimistic UI updates for high-frequency user actions",
        "Resilient network error handling and toast notifications",
      ],
      roles: ["Senior Frontend / Mobile Engineer", "Full Stack Engineer"],
      requiredTools: ["TanStack Query / Zustand / Redux", "Axios / Fetch", "IndexedDB / MMKV", "Network Throttler"],
      actionableTasks: [
        {
          id: "task_5_1",
          title: "Wire Client Data Fetching with Caching & Automatic Refetching",
          role: "Senior Frontend / Mobile Engineer",
          deliverable: "Data hooks utilizing TanStack Query with caching, pagination, and invalidation",
          dependencies: ["task_2_3", "task_4_2"],
          description: "Implement typed API clients, query hooks, and cache invalidation following mutations.",
          risks: "Stale data displayed to users after mutative actions",
          riskMitigation: "Trigger queryClient.invalidateQueries immediately upon successful mutation responses",
          validationProcedure: "Creating an item automatically updates list views without manual page refresh",
        },
        {
          id: "task_5_2",
          title: "Implement Offline Storage & Background Sync Queue",
          role: "Senior Frontend / Mobile Engineer",
          deliverable: "Offline persistence layer that queues actions during connectivity loss",
          dependencies: ["task_5_1"],
          description: "Persist core data in local storage (MMKV / IndexedDB) and queue mutative actions to replay upon reconnection.",
          risks: "Sync conflicts when multiple devices modify records while offline",
          riskMitigation: "Implement last-write-wins with timestamp versioning or explicit conflict resolution dialogs",
          validationProcedure: "Disable network in DevTools, perform action, re-enable network, and verify queued action syncs",
        },
        {
          id: "task_5_3",
          title: "Implement Optimistic UI Updates & Error Rollbacks",
          role: "Senior Frontend / Mobile Engineer",
          deliverable: "Optimistic update handlers that instantly reflect user actions with graceful rollback on failure",
          dependencies: ["task_5_2"],
          description: "Update client state immediately before server confirmation, saving snapshot to revert if API returns an error.",
          risks: "UI shows successful state when server rejects the action",
          riskMitigation: "Preserve prior state snapshot in onMutate and restore in onError callback",
          validationProcedure: "Simulate 500 error on mutation; verify UI rolls back to previous state and displays error toast",
        },
      ],
      implementationGuidance:
        "Test client applications under simulated 3G network conditions and complete offline states. Ensure loading spinners are localized to affected components rather than blocking the entire screen with full-page loaders.",
      acceptanceCriteria: [
        "Application remains usable when network is completely severed",
        "Optimistic updates provide instant visual feedback to user interactions",
        "Failed network requests trigger informative error messages with retry buttons",
      ],
      testingAndVerification: [
        "Perform offline toggle test in browser/device dev tools",
        "Simulate high-latency 3G throttling (1500ms latency) and verify UI responsiveness",
        "Verify optimistic mutation rollback on simulated HTTP 500 errors",
      ],
      risksAndMitigations: [
        { risk: "Local storage quotas exceeded by large media or cached datasets", mitigation: "Set bounded cache sizes and implement LRU (Least Recently Used) cache eviction." },
        { risk: "Infinite refetch loops on persistent HTTP 400 errors", mitigation: "Configure query retries: false for 4xx client errors." },
      ],
      definitionOfDone: [
        "Client UI completely synchronized with backend APIs",
        "Offline caching allows browsing cached data without connection",
        "Optimistic updates tested with verified rollback on failure",
      ],
      evidenceRequired: [
        "Screen recording or automated test verifying offline functionality",
        "Passing test suite covering mutation retry and rollback logic",
        "Network latency audit report under simulated 3G conditions",
      ],
      estimatedEffortHours: 40,
      estimatedCalendarPacing: "Sprint 5 (2 weeks)",
    },
    {
      phase: 6,
      title: "End-to-End Testing, Security Hardening & Performance Optimization",
      objective: `Execute automated end-to-end user journey tests, security penetration audits, load testing, and performance profiling for ${baseTitle}.`,
      deliverables: [
        "Automated Playwright / Cypress / Maestro E2E test suite",
        "Load testing report (k6 / Artillery) validating 1,000 concurrent RPS",
        "Security penetration audit report with OWASP checklist",
        "Lighthouse / Profiling optimization report (90+ performance score)",
      ],
      roles: ["QA Lead / SDET", "Security Engineer", "Performance Engineer"],
      requiredTools: ["Playwright / Maestro", "k6 / Artillery", "Semgrep / OWASP ZAP", "Chrome DevTools Profiler"],
      actionableTasks: [
        {
          id: "task_6_1",
          title: "Author Automated End-to-End Critical User Journey Tests",
          role: "QA Lead / SDET",
          deliverable: "Automated E2E test suite validating registration, checkout/creation, and search flows",
          dependencies: ["task_5_3"],
          description: "Write automated Playwright / Maestro scripts executing critical business journeys across web and mobile viewports.",
          risks: "Flaky tests caused by non-deterministic network timings",
          riskMitigation: "Avoid arbitrary sleep timers; rely strictly on DOM state assertions (waitForSelector / expect)",
          validationProcedure: "E2E suite runs 5 consecutive times in CI with 100% pass rate",
        },
        {
          id: "task_6_2",
          title: "Conduct Load Testing & Database Concurrency Profiling",
          role: "Performance Engineer",
          deliverable: "k6 load test report measuring throughput, error rates, and p95 latency under peak load",
          dependencies: ["task_6_1"],
          description: "Simulate peak concurrent users (1,000 RPS) hitting core read and write endpoints, monitoring database CPU and memory.",
          risks: "System crashes under peak load due to unoptimized database locks or memory leaks",
          riskMitigation: "Profile slow queries, add Redis caching on hot read endpoints, and tune connection pool bounds",
          validationProcedure: "k6 test demonstrates p95 latency under 200ms with < 0.1% error rate at target load",
        },
        {
          id: "task_6_3",
          title: "Perform Security Penetration Scan & Dependency Audit",
          role: "Security Engineer",
          deliverable: "Security audit report confirming 0 critical or high-severity vulnerabilities",
          dependencies: ["task_6_1"],
          description: "Run automated DAST scans with OWASP ZAP, execute SAST scans with Semgrep, and audit npm/pip dependencies.",
          risks: "Undiscovered vulnerabilities in third-party packages allowing remote code execution or data theft",
          riskMitigation: "Enforce automated vulnerability scanning in CI and remediate all vulnerable dependencies",
          validationProcedure: "Security scan reports 0 critical or high vulnerabilities",
        },
      ],
      implementationGuidance:
        "Execute load testing against a staging environment that mirrors production specifications. Profile database slow queries using pg_stat_statements to identify queries requiring optimization before release.",
      acceptanceCriteria: [
        "Automated E2E tests pass consistently across all supported viewports",
        "Load test confirms system maintains p95 latency < 200ms at 1,000 requests/second",
        "Security audit reveals zero critical or high vulnerabilities",
      ],
      testingAndVerification: [
        "Run full automated Playwright/Maestro E2E test suite in CI pipeline",
        "Execute k6 load test script simulating target concurrency",
        "Run OWASP ZAP and dependency vulnerability scanners",
      ],
      risksAndMitigations: [
        { risk: "Database CPU reaches 100% during simulated peak load", mitigation: "Implement Redis caching layer for read-heavy catalog/profile endpoints." },
        { risk: "Third-party dependency introduces zero-day vulnerability", mitigation: "Pin exact package versions and run automated daily dependency audit alerts." },
      ],
      definitionOfDone: [
        "All E2E test suites pass with zero flakiness",
        "Load testing benchmarks verified and documented",
        "Security audit sign-off granted by Security Engineer",
      ],
      evidenceRequired: [
        "E2E test suite execution video/report in test artifacts",
        "k6 load test HTML report showing latency and throughput curves",
        "OWASP security scan clean bill of health report",
      ],
      estimatedEffortHours: 45,
      estimatedCalendarPacing: "Sprint 6 (2 weeks)",
    },
    {
      phase: 7,
      title: "Production Release Engineering, CI/CD & Launch Packaging",
      objective: `Automate multi-stage CI/CD pipelines, configure production infrastructure, establish monitoring alarms, and deploy ${baseTitle} to production.`,
      deliverables: [
        "Automated GitHub Actions CI/CD deployment pipeline",
        "Production cloud infrastructure with auto-scaling and SSL",
        "Centralized monitoring & alerting dashboard (Datadog / Prometheus / Sentry)",
        "Production launch runbook and rollback plan",
      ],
      roles: ["Lead DevOps Engineer", "Product Manager", "Release Manager"],
      requiredTools: ["GitHub Actions", "Docker / Kubernetes / Terraform", "Sentry / Grafana", "Cloudflare"],
      actionableTasks: [
        {
          id: "task_7_1",
          title: "Build Multi-Stage CI/CD Deployment Pipeline",
          role: "Lead DevOps Engineer",
          deliverable: "Automated GitHub Actions pipeline deploying to staging and production environments",
          dependencies: ["task_6_1"],
          description: "Configure automated linting, testing, Docker image building, and blue-green / rolling deployments on push to main.",
          risks: "Deployment pipeline failure leaving production in an inconsistent state",
          riskMitigation: "Implement blue-green deployments or health-checked rolling updates with automatic rollback",
          validationProcedure: "Trigger test deployment; verify automated promotion and zero-downtime cutover",
        },
        {
          id: "task_7_2",
          title: "Configure Production Monitoring, Sentry & Latency Alarms",
          role: "Lead DevOps Engineer",
          deliverable: "Configured Sentry error tracking, Prometheus metrics, and automated Slack/PagerDuty alerts",
          dependencies: ["task_7_1"],
          description: "Instrument client and server with Sentry error monitoring, export Prometheus metrics, and set alarms for 5xx errors.",
          risks: "Production failures occurring undetected by the engineering team",
          riskMitigation: "Set automated PagerDuty / Slack alerts when error rate exceeds 1% over a 5-minute window",
          validationProcedure: "Simulate test exception; confirm alert triggers notification within 60 seconds",
        },
        {
          id: "task_7_3",
          title: "Execute Production Launch Runbook & Post-Launch Smoke Tests",
          role: "Release Manager",
          deliverable: "Completed launch runbook checklist and signed-off post-launch verification report",
          dependencies: ["task_7_2"],
          description: "Execute DNS cutover, verify SSL certificates, run synthetic smoke tests on production endpoints, and open access.",
          risks: "DNS propagation delays or SSL certificate misconfiguration blocking user access",
          riskMitigation: "Pre-warm DNS with low TTL (300s) and verify SSL certificate chains prior to cutover",
          validationProcedure: "Synthetic smoke test verifies registration, authentication, and core workflow in live production",
        },
      ],
      implementationGuidance:
        "Never perform production deployments on Friday afternoons. Ensure database backups are verified and tested for restoration immediately before executing DNS switchover.",
      acceptanceCriteria: [
        "CI/CD pipeline deploys code automatically with zero downtime",
        "Error tracking (Sentry) and infrastructure monitoring dashboards are operational",
        "Production domain is live with valid SSL and synthetic smoke tests pass 100%",
      ],
      testingAndVerification: [
        "Test automated rollback by triggering a simulated deployment failure",
        "Execute synthetic production smoke test verifying critical user paths",
        "Verify DNS propagation and SSL certificate expiration monitoring",
      ],
      risksAndMitigations: [
        { risk: "Critical production bug discovered immediately post-launch", mitigation: "Execute pre-tested one-click rollback script to revert to previous stable release." },
        { risk: "Sudden traffic surge on launch day overwhelms compute instances", mitigation: "Configure horizontal pod autoscaling (HPA) to scale instances automatically based on CPU/traffic." },
      ],
      definitionOfDone: [
        "Application deployed and accessible on live production domain",
        "Monitoring and alerting active with verified test notification",
        "Launch runbook documented and completed with stakeholder sign-off",
      ],
      evidenceRequired: [
        "Live production URL with active SSL certificate",
        "CI/CD pipeline successful deployment log in GitHub Actions",
        "Monitoring dashboard screenshot confirming healthy production telemetry",
      ],
      estimatedEffortHours: 40,
      estimatedCalendarPacing: "Sprint 7 (1.5 weeks)",
    },
  ];
}

export function buildExecutionNodesFromTemplates(templates: ExecutionPhaseTemplate[]): RoadmapNode[] {
  return templates.map((t, idx) => {
    const level = t.phase;
    const actionableTasks: RoadmapActionableTask[] = t.actionableTasks.map((task) => ({
      id: task.id,
      title: task.title,
      role: task.role,
      roleOrOwner: task.role,
      deliverable: task.deliverable,
      dependencies: task.dependencies,
      description: task.description,
      risks: task.risks,
      riskMitigation: task.riskMitigation,
      validationProcedure: task.validationProcedure,
      completed: false,
    }));

    return {
      id: `exec_node_${level}`,
      level,
      title: t.title,
      skill: t.roles[0] || "Project Architecture",
      category: level <= 2 ? "Discovery & Architecture" : level <= 5 ? "Core Engineering" : "Verification & Release",
      concept: t.objective,
      state: idx === 0 ? "IN_PROGRESS" : "LOCKED",
      whyLearnThis: `Phase ${level} delivers essential milestone deliverables required to de-risk and launch the project successfully.`,
      prerequisites: level === 1 ? ["Project Scope & Initial Stakeholder Alignment"] : [`Phase ${level - 1} Completion Gate`],
      task: {
        title: `Execute Phase ${level} Deliverables`,
        description: t.implementationGuidance,
        deliverables: t.deliverables,
      },
      miniProject: {
        title: `${t.title.split(",")[0].split("&")[0].trim()} Milestone Package`,
        description: `Concrete project deliverable verifying completion of Phase ${level}.`,
        techStack: t.requiredTools,
        difficulty: level <= 2 ? "Intermediate" : level <= 5 ? "Advanced" : "Production",
        requirements: t.acceptanceCriteria,
      },
      learningObjectives: [
        t.objective,
        `Coordinate tasks across roles: ${t.roles.join(", ")}`,
        `Satisfy Definition of Done with verifiable evidence`,
      ],
      topicChecklist: [
        ...actionableTasks.map((at) => ({
          id: at.id,
          title: `${at.title} (${at.role})`,
          completed: false,
        })),
        {
          id: `verify_phase_${level}`,
          title: `Verification & Quality Gate Sign-off for Phase ${level}`,
          completed: false,
        },
      ],
      practicalExercises: [
        {
          id: `ex_phase_${level}`,
          title: `Phase ${level} Implementation Lab`,
          prompt: `Execute the primary deliverable for Phase ${level}: ${t.deliverables[0] || t.title}. Verify against acceptance criteria.`,
          expectedOutcome: `Phase ${level} deliverable verified and passing acceptance criteria.`,
        },
      ],
      actionableTasks,
      acceptanceCriteria: t.acceptanceCriteria,
      definitionOfDone: t.definitionOfDone,
      testingAndVerification: t.testingAndVerification,
      risksAndMitigations: t.risksAndMitigations,
      requiredToolsAndResources: t.requiredTools,
      evidenceRequired: t.evidenceRequired,
      completionCriteria: t.definitionOfDone,
      validationProcedures: t.testingAndVerification,
      assessment: {
        criterion: `Verified completion of all Phase ${level} deliverables with passing quality gates.`,
        passingScore: 90,
      },
      estimatedStudyHours: t.estimatedEffortHours,
      estimatedStudyTime: t.estimatedCalendarPacing,
      freeResources: [
        {
          title: "Production Software Architecture & Release Guidelines",
          url: "https://12factor.net/",
          platform: "The Twelve-Factor App",
          type: "docs",
          isFree: true,
        },
        {
          title: "OWASP Software Assurance Maturity Model (SAMM)",
          url: "https://owaspsamm.org/",
          platform: "OWASP",
          type: "docs",
          isFree: true,
        },
      ],
    };
  });
}
