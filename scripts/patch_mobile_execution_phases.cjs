const fs = require('fs');

const filePath = 'src/lib/omniforge/curriculum/execution-curriculum.ts';
let code = fs.readFileSync(filePath, 'utf8');

const mobileBlock = `  if (isMobile) {
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
`;

// Insert mobileBlock right after baseTitle definition
const insertPoint = code.indexOf('  return [');
if (insertPoint === -1) {
  console.error('Could not find insert point!');
  process.exit(1);
}

code = code.slice(0, insertPoint) + mobileBlock + '\n' + code.slice(insertPoint);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched mobile execution phases!');
