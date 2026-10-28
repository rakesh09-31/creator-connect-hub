/**
 * OmniForge Dedicated Frontend & Web Curriculum Architect
 *
 * 12 Progressive Stages:
 * 1. Semantic HTML5 Living Standards & Accessibility (WCAG 2.2 AA)
 * 2. Modern CSS Architecture, Box Model, Flexbox & CSS Grid Systems
 * 3. Modern JavaScript & Browser DOM APIs, Promises & Async
 * 4. TypeScript for Frontend Engineers (Types, Generics, Narrowing)
 * 5. Component Architecture & React Core (JSX, Props, State)
 * 6. Advanced React Hooks, Custom Hooks & Reactive Primitives
 * 7. Scalable State Management & Data Fetching (TanStack Query)
 * 8. Routing, Layouts & Client-Side Navigation
 * 9. Responsive UI Design Systems & Modern CSS (Tailwind CSS)
 * 10. Automated Frontend Testing (Vitest & React Testing Library)
 * 11. Web Performance, Core Web Vitals & Security Hardening
 * 12. Production Cloud Capstone & Edge Deployment
 */

import { DeepTopicItem, RoadmapNode, ProgressiveProjectStage } from "../user-intelligence";
import { BlueprintStageDefinition, StageContentDetail } from "./types";

export const FRONTEND_BLUEPRINT_STAGES: BlueprintStageDefinition[] = [
  {
    stage: 1,
    title: "Semantic HTML5 Living Standards & Web Accessibility (WCAG 2.2 AA)",
    skillFocus: "Document Outline, Semantic Landmarks & Accessible Controls",
    objective: "Master semantic HTML5 markup, landmark roles, accessible forms, keyboard focus management, and WCAG 2.2 AA compliance.",
    prerequisites: ["Basic computer literacy and browser developer tools"],
    prerequisiteChecks: ["Verify ability to open and inspect DOM in Chrome/Firefox Developer Tools"],
    keyCompetencies: ["Semantic elements (<main>, <nav>, <article>)", "ARIA landmarks and attributes", "Accessible form controls", "axe accessibility auditing"],
    projectTitle: "WCAG 2.2 AA Compliant Department Portal & Form System",
    deliverables: ["Accessible index.html with landmarks", "Accessible registration form with native constraints", "axe DevTools audit report showing 0 violations"],
    definitionOfDone: ["Page achieves 100% score on automated axe audit", "All interactive elements are reachable and operable via keyboard only"],
    estimatedStudyHours: 14,
    recommendedPacing: "1 week at 2 hours/day",
  },
  {
    stage: 2,
    title: "Modern CSS Architecture, Box Model, Flexbox & CSS Grid Systems",
    skillFocus: "Box Model Geometry, Cascade Layers, Flexbox & Two-Dimensional Grid",
    objective: "Master CSS box-sizing, margin collapsing, cascade layers (@layer), flexbox alignment, and fluid CSS Grid layouts.",
    prerequisites: ["Stage 1: Semantic HTML5"],
    prerequisiteChecks: ["Solid grasp of HTML structure and element nesting"],
    keyCompetencies: ["border-box vs content-box sizing", "Flexbox main and cross axes", "CSS Grid minmax() and auto-fit", "@layer cascade management"],
    projectTitle: "Responsive Multi-Device Dashboard & Card Catalog",
    deliverables: ["styles.css with CSS custom properties and @layer reset", "Responsive dashboard layout adapting from mobile to 4K displays"],
    definitionOfDone: ["Zero horizontal scroll overflow across viewports from 320px to 2560px", "Clean CSS layout using zero !important tags"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 3,
    title: "Modern JavaScript & Browser DOM APIs, Promises & Async",
    skillFocus: "ES2024 Primitives, DOM Event Delegation & Asynchronous Fetch",
    objective: "Write clean, modern JavaScript utilizing event propagation, DOM manipulation, Promises, async/await, and the Fetch API.",
    prerequisites: ["Stage 2: Modern CSS"],
    prerequisiteChecks: ["Understanding of HTML IDs, classes, and element selection"],
    keyCompetencies: ["Event delegation and bubbling", "Promises and async/await", "Fetch API with defensive status checking", "LocalStorage persistence"],
    projectTitle: "Interactive Task Kanban Board with Cloud API Sync",
    deliverables: ["app.js with event delegation handlers", "api_client.js with error handling and retry logic", "LocalStorage offline fallback"],
    definitionOfDone: ["No memory leaks from uncleaned event listeners", "API errors surface accessible, human-readable notifications in the UI"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 4,
    title: "TypeScript for Frontend Engineers (Types, Generics, Narrowing)",
    skillFocus: "Static Type Checking, Discriminated Unions & Generics",
    objective: "Eliminate runtime errors using TypeScript strict mode, interfaces, type narrowing, discriminated unions, and reusable generics.",
    prerequisites: ["Stage 3: Modern JavaScript"],
    prerequisiteChecks: ["Proficiency with JavaScript objects, functions, and async promises"],
    keyCompetencies: ["Strict tsconfig.json setup", "Discriminated union pattern", "Generic utility types (Partial, Pick, Omit)", "Type guard functions (is)"],
    projectTitle: "Type-Safe State Machine & API Data Validator",
    deliverables: ["types.ts with clean domain definitions", "state_machine.ts using discriminated unions", "Zero compiler errors with strict: true"],
    definitionOfDone: ["TypeScript compiler executes with 0 errors in strict mode", "Zero usage of 'any' type in application code"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 5,
    title: "Component Architecture & React Core (JSX, Props, State)",
    skillFocus: "Declarative UI, Virtual DOM, Component Lifecycle & Unidirectional Data Flow",
    objective: "Build modular user interfaces using React 18+, JSX syntax, props interfaces, component decomposition, and useState hooks.",
    prerequisites: ["Stage 4: TypeScript"],
    prerequisiteChecks: ["Strong familiarity with modern JS destructuring and arrow functions"],
    keyCompetencies: ["JSX compilation mechanics", "Unidirectional data flow", "Lifting state up", "Pure rendering functions"],
    projectTitle: "Interactive Product Catalog & Filtering Showcase",
    deliverables: ["React component tree with typed props", "Multi-criteria filter controls (category, price range, search)"],
    definitionOfDone: ["Components render cleanly with zero React console warnings", "All list elements have unique, stable key identifiers"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 6,
    title: "Advanced React Hooks, Custom Hooks & Reactive Primitives",
    skillFocus: "Effect Lifecycles, Memoization (useMemo/useCallback) & Custom Hook Extraction",
    objective: "Master useEffect synchronization, ref management with useRef, memoization with useMemo/useCallback, and reusable custom hook extraction.",
    prerequisites: ["Stage 5: React Core"],
    prerequisiteChecks: ["Comfortable managing local component state with useState"],
    keyCompetencies: ["useEffect cleanup functions", "useRef for mutable values and DOM nodes", "useMemo / useCallback optimization", "Custom hook encapsulation"],
    projectTitle: "Real-Time Search with Debounce, Infinite Scroll & Window Resize Hooks",
    deliverables: ["useDebounce.ts, useIntersectionObserver.ts, useLocalStorage.ts", "Interactive search interface demonstrating custom hooks"],
    definitionOfDone: ["No infinite render loops in useEffect dependency arrays", "All custom hooks include automated unit tests"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 7,
    title: "Scalable State Management & Data Fetching (TanStack Query & Zustand)",
    skillFocus: "Server State Synchronization, Cache Invalidation & Global Store Architecture",
    objective: "Separate client state from server state using TanStack Query (React Query) for caching/pagination and Zustand for lightweight client state.",
    prerequisites: ["Stage 6: React Hooks"],
    prerequisiteChecks: ["Understanding of asynchronous promises and REST APIs"],
    keyCompetencies: ["useQuery and useMutation hooks", "Optimistic UI updates", "Query cache invalidation with queryClient.invalidateQueries", "Zustand global store slices"],
    projectTitle: "Enterprise E-Commerce Cart & Real-Time Inventory Portal",
    deliverables: ["cartStore.ts implementing Zustand state with persistence", "useProductsQuery.ts utilizing TanStack Query caching"],
    definitionOfDone: ["Cached data renders instantly on page navigation with zero stale screen flash", "Mutations handle network failures with automatic rollback"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 8,
    title: "Routing, Layouts & Client-Side Navigation (React Router / TanStack Router)",
    skillFocus: "Nested Routes, URL Search Params, Loaders & Protected Route Guards",
    objective: "Architect complex multi-page applications using nested route layouts, search parameter synchronization, data loaders, and auth guards.",
    prerequisites: ["Stage 7: State Management"],
    prerequisiteChecks: ["Familiarity with browser history, URLs, and navigation lifecycles"],
    keyCompetencies: ["Nested route hierarchy (<Outlet />)", "useSearchParams query state", "Protected route wrappers", "Route code splitting with React.lazy"],
    projectTitle: "Multi-Tenant SaaS Management Portal with Authentication Guard",
    deliverables: ["Route configuration tree with nested layouts", "AuthGuard component redirecting unauthenticated sessions", "Deep-linked filter states"],
    definitionOfDone: ["Refreshing nested sub-pages preserves route state and parameters perfectly", "Unauthenticated route access redirects to login with returnUrl redirect"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 9,
    title: "Responsive UI Design Systems & Modern CSS (Tailwind CSS & Headless UI)",
    skillFocus: "Utility-First CSS, Design Tokens, Dark Mode & Headless Components",
    objective: "Create cohesive, beautiful user interfaces using Tailwind CSS, customizable design tokens, dark mode theming, and accessible headless primitives.",
    prerequisites: ["Stage 2: Modern CSS and Stage 5: React Core"],
    prerequisiteChecks: ["Knowledge of CSS specificity and responsive design principles"],
    keyCompetencies: ["Tailwind utility classes and arbitrary values", "Custom tailwind.config.js theme tokens", "Dark mode implementation (class strategy)", "Radix UI / Headless UI accessibility primitives"],
    projectTitle: "Polished Component Design System & Theme Showcase",
    deliverables: ["Reusable UI kit (Button, Modal, Dropdown, Input, Toast)", "Dark/Light theme toggle with smooth transitions and system preference detection"],
    definitionOfDone: ["Design system achieves 100% keyboard accessibility on all modals and dropdowns", "Theme persists across browser reloads via LocalStorage"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 10,
    title: "Automated Frontend Testing (Vitest & React Testing Library)",
    skillFocus: "Unit Testing, User Event Simulation & Integration Verification",
    objective: "Author resilient automated test suites using Vitest and React Testing Library that verify user behavior rather than implementation details.",
    prerequisites: ["Stage 7: State Management and Stage 5: React Core"],
    prerequisiteChecks: ["Working knowledge of React components and props"],
    keyCompetencies: ["Vitest test runner configuration", "Testing Library queries (getByRole, findByRole)", "user-event interaction simulation", "Mock Service Worker (MSW) API mocking"],
    projectTitle: "Comprehensive Test Suite for Critical E-Commerce Flow",
    deliverables: ["tests/ directory covering checkout, search, and authentication flows", "MSW mock server handlers simulating success and 500 server error responses", "Coverage report verifying >= 80% coverage"],
    definitionOfDone: ["All tests pass using getByRole without reliance on brittle test-ids", "Async state transitions are properly awaited with findByRole"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 11,
    title: "Web Performance, Core Web Vitals & Security Hardening",
    skillFocus: "Lighthouse Optimization (LCP, INP, CLS), Bundle Splitting & Security (CSP)",
    objective: "Profile and optimize production applications to achieve 95+ Lighthouse scores, sub-2.5s LCP, zero layout shifts, and strong CSP headers.",
    prerequisites: ["Stage 8: Routing and Stage 10: Testing"],
    prerequisiteChecks: ["Ability to run production builds using Vite / Next.js"],
    keyCompetencies: ["Core Web Vitals metrics (LCP, INP, CLS)", "Dynamic code splitting and image optimization", "Content Security Policy (CSP) and XSS prevention", "Chrome DevTools Performance profiling"],
    projectTitle: "Production Performance Audit & Optimization Overhaul",
    deliverables: ["Production build optimization report with bundle visualizer", "Lighthouse 95+ performance and accessibility audit report", "Configured Content Security Policy (CSP) meta tags"],
    definitionOfDone: ["Largest Contentful Paint (LCP) under 2.5 seconds on simulated mobile 4G", "Cumulative Layout Shift (CLS) under 0.05 across all screens"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 12,
    title: "Production Enterprise Capstone & Edge Deployment",
    skillFocus: "Full-Scale Production Web Capstone, CI/CD & Edge Cloud Hosting",
    objective: "Deploy a production-grade enterprise web application featuring automated GitHub Actions CI/CD, edge cloud hosting (Vercel/Cloudflare), and error monitoring.",
    prerequisites: ["Stages 1 through 11"],
    prerequisiteChecks: ["Working repository with tested components, routing, and state"],
    keyCompetencies: ["Production build compilation", "GitHub Actions CI/CD workflows", "Edge hosting deployment", "Error boundary monitoring (Sentry / LogRocket)"],
    projectTitle: "OmniForge Creator Portfolio & Real-Time Collaboration Hub",
    deliverables: ["Full production web application codebase with documentation", "Automated GitHub Actions CI/CD pipeline running lint, test, and build", "Live production URL with custom domain and SSL certificate"],
    definitionOfDone: ["Production build compiles with zero TypeScript errors and zero warnings", "Application is deployed to edge CDN with 99.9% uptime and sub-second TTFB"],
    estimatedStudyHours: 24,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
];

export function getFrontendDeepStageContent(stageNum: number): StageContentDetail {
  const stage = FRONTEND_BLUEPRINT_STAGES.find((s) => s.stage === stageNum) || FRONTEND_BLUEPRINT_STAGES[0];
  const title = stage.title;

  return {
    topics: [
      {
        id: `fe_${stageNum}_1`,
        title: `${title}: Core Mechanics & Standards`,
        completed: false,
        subtopics: [
          `Living standards, specification guidelines, and browser parsing mechanics of ${title}`,
          `Accessible DOM structure, semantic hierarchy, and keyboard navigability`,
          `Edge case handling, cross-browser compatibility, and defensive coding`,
          `Performance implications and rendering pipeline efficiency (Layout, Paint, Composite)`,
          `Tooling setup, linting configs, and modern compiler integrations`,
        ],
        explanation:
          `Stage ${stageNum} establishes mastery over ${title}. Professional frontend engineering requires building web applications that are accessible to all users, responsive across all viewports, and compliant with modern web standards. Understanding how the browser parses markup and executes scripts ensures that applications remain fast and resilient.`,
        keySyntaxOrApis: [
          `// Core web standards for Stage ${stageNum}: ${title}`,
          `export interface ComponentProps { readonly id: string; }`,
          `const observer = new ResizeObserver((entries) => { /* handle size changes */ });`,
        ],
        example: {
          title: `${title} Reference Implementation`,
          description: `Demonstrating standards-compliant implementation patterns for Stage ${stageNum}.`,
          codeOrWalkthrough:
            `// Modern frontend implementation for Stage ${stageNum}: ${title}\nexport function createAccessibleElement(title: string): HTMLElement {\n  const container = document.createElement("section");\n  container.setAttribute("aria-labelledby", "section-title");\n  \n  const heading = document.createElement("h2");\n  heading.id = "section-title";\n  heading.textContent = title;\n  \n  container.appendChild(heading);\n  return container;\n}\n\n// Verification execution\nconst element = createAccessibleElement("Modern Web Architecture");\nconsole.log("Element created:", element.outerHTML);`,
        },
        exercise: {
          title: `${title} Hands-On Lab`,
          prompt: `Implement a responsive, accessible component applying the core patterns of Stage ${stageNum} with zero console warnings.`,
          expectedOutcome: `Component renders accurately across viewports and passes automated accessibility checks.`,
          starterCode: `// Starter code for Stage ${stageNum}\nfunction runFrontendLab() {\n  return { success: true, stage: ${stageNum} };\n}\nconsole.log(runFrontendLab());`,
        },
        troubleshooting: [
          `Always test interactive elements using only a keyboard (Tab, Enter, Space, Escape).`,
          `Verify that all image and icon elements provide appropriate text alternatives or aria-hidden attributes.`,
        ],
      },
      {
        id: `fe_${stageNum}_2`,
        title: `${title}: Architecture & Component Composition`,
        completed: false,
        subtopics: [
          `Component decomposition, modular separation, and single-responsibility boundaries`,
          `Clean state flows, immutable updates, and event-driven communication`,
          `Defensive prop typing, fallback UI rendering, and error boundary isolation`,
          `Theme integration, CSS custom properties, and design token inheritance`,
          `Scalable folder structure and path alias configuration`,
        ],
        explanation:
          `Modular component architecture enables teams to build complex web applications without creating brittle, tightly coupled code. Isolating business logic into pure helper functions and custom hooks ensures that UI components remain focused solely on presentation and user interaction.`,
        keySyntaxOrApis: [
          `// Component architecture patterns for ${title}`,
          `type Status = "idle" | "loading" | "success" | "error";`,
          `interface State<T> { data: T | null; status: Status; error: string | null; }`,
        ],
        example: {
          title: `${title} Modular Component Architecture`,
          description: `Demonstrating clean prop interfaces, defensive fallbacks, and accessible markup.`,
          codeOrWalkthrough:
            `// TypeScript component contract pattern\nexport interface CardProps {\n  title: string;\n  description: string;\n  onAction?: () => void;\n}\n\nexport function renderCard(props: CardProps): string {\n  return \`\n    <article class="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">\n      <h3 class="font-bold text-lg text-slate-900">\${props.title}</h3>\n      <p class="text-sm text-slate-600 mt-1">\${props.description}</p>\n    </article>\n  \`;\n}`,
        },
        exercise: {
          title: `${title} Architecture & Refactoring Lab`,
          prompt: `Refactor a monolithic UI component into three focused, reusable sub-components with typed props and clear responsibilities.`,
          expectedOutcome: `Decomposed components can be tested and reused in isolation with zero regression.`,
        },
        troubleshooting: [
          `Avoid prop drilling through more than two levels; use context or state management libraries instead.`,
          `Never mutate state objects directly; always create fresh copies using object spread or immutable helpers.`,
        ],
      },
      {
        id: `fe_${stageNum}_3`,
        title: `${title}: Testing, Performance & Verification`,
        completed: false,
        subtopics: [
          `Automated unit and component testing with Vitest and React Testing Library`,
          `Simulating authentic user interactions and verifying accessible roles`,
          `Profiling render cycles and eliminating unnecessary re-renders`,
          `Auditing performance metrics (LCP, INP, CLS) using Lighthouse and Web Vitals`,
          `Production build verification and bundle size budget enforcement`,
        ],
        explanation:
          `Reliable frontend development requires continuous testing and performance monitoring. Writing tests that mirror real user interactions ensures that code refactoring does not break critical user flows. Enforcing strict bundle size budgets guarantees that mobile users enjoy fast, responsive experiences.`,
        keySyntaxOrApis: [
          `// Vitest and Testing Library patterns`,
          `import { describe, it, expect } from "vitest";`,
          `// expect(element).toHaveAccessibleName("Submit Form");`,
        ],
        example: {
          title: `${title} Automated Testing Pattern`,
          description: `Demonstrating behavior-driven component assertions using accessible roles.`,
          codeOrWalkthrough:
            `// Vitest behavior verification test pattern\nfunction calculateDiscount(price: number, discountPercent: number): number {\n  if (price < 0 || discountPercent < 0 || discountPercent > 100) {\n    throw new Error("Invalid parameters");\n  }\n  return price * (1 - discountPercent / 100);\n}\n\n// Assertion tests\nconsole.assert(calculateDiscount(100, 20) === 80, "Discount calculation should return 80");\nconsole.assert(calculateDiscount(50, 0) === 50, "0% discount should preserve price");\nconsole.log("All calculation assertions passed!");`,
        },
        exercise: {
          title: `${title} Quality & Performance Verification Lab`,
          prompt: `Write an automated test suite verifying component behavior under normal, loading, and error states, and run a performance audit to ensure 0 layout shifts.`,
          expectedOutcome: `100% of test cases pass cleanly with zero unhandled exceptions or console errors.`,
        },
        troubleshooting: [
          `Query elements by their accessible role (e.g. getByRole('button', { name: /save/i })) rather than CSS classes.`,
          `Ensure images include explicit width and height attributes to eliminate Cumulative Layout Shift (CLS).`,
        ],
      },
    ],
    commonMistakesAndTroubleshooting: [
      {
        mistake: `Using non-semantic <div> elements for interactive buttons and navigation links`,
        consequence: "Screen readers fail to announce the element as interactive and keyboard users cannot focus or activate it.",
        solutionOrFix: "Always use native <button> elements for actions and <a> tags for URL navigations.",
      },
      {
        mistake: `Omitting explicit dependency arrays in useEffect hooks or ignoring linter warnings`,
        consequence: "Creates infinite re-render loops that crash the browser tab or produces stale closures referencing outdated state.",
        solutionOrFix: "Include all referenced variables in the useEffect dependency array or extract stable functions with useCallback.",
      },
      {
        mistake: `Ignoring layout shifts caused by dynamic content injection without reserved space`,
        consequence: "Degrades the Cumulative Layout Shift (CLS) Core Web Vital score and causes jarring visual jumps for users.",
        solutionOrFix: "Set explicit aspect ratios or min-height placeholders on containers loading dynamic images or async data.",
      },
    ],
    knowledgeCheck: [
      {
        question: `What are the primary architectural benefits of adhering to WCAG 2.2 AA accessibility standards in Stage ${stageNum}?`,
        options: [
          "It makes CSS stylesheets significantly smaller in file size",
          "It ensures the web application is fully usable by people with disabilities and improves overall usability and SEO",
          "It automatically compiles TypeScript into web workers",
          "It replaces the need for responsive CSS media queries",
        ],
        answerOrExplanation:
          "Option B: Adhering to WCAG 2.2 AA standards ensures that individuals using screen readers, keyboard-only navigation, and other assistive technologies can access the application, while drastically improving code semantics, SEO rankings, and general user experience.",
        solutionRubric: "Demonstrates clear understanding of digital accessibility, inclusive design, and semantic standards.",
      },
      {
        question: `How do you systematically diagnose and resolve performance bottlenecks in Stage ${stageNum}?`,
        answerOrExplanation:
          "Open the Chrome DevTools Performance panel, record a trace while performing the user interaction, identify long tasks exceeding 50ms, inspect layout thrashing caused by style recalculations, and split large bundles using dynamic code imports.",
        solutionRubric: "Articulates a structured methodology using browser profilers, Long Tasks analysis, and code splitting.",
      },
      {
        question: `What distinguishes production-ready web application code from an MVP prototype in Stage ${stageNum}?`,
        answerOrExplanation:
          "Production-ready web code features full keyboard accessibility, automated test coverage with Vitest/RTL, strict TypeScript typing with zero 'any', Core Web Vitals optimization (LCP < 2.5s, CLS < 0.1), structured error boundaries, and automated CI/CD pipelines.",
        solutionRubric: "Identifies accessibility, testing, static types, performance vitals, and automated pipelines.",
      },
    ],
    completionCriteria: [
      `All Stage ${stageNum} topic checklists verified and thoroughly understood`,
      `Milestone project implemented with zero console errors or accessibility violations`,
      `Code adheres strictly to modern web standards and TypeScript strict mode`,
      `Stage self-assessment knowledge check answered accurately`,
    ],
    freeResources: [
      {
        title: `MDN Web Docs — Modern Web Standards & APIs`,
        url: "https://developer.mozilla.org/en-US/",
        platform: "Mozilla Developer Network",
        type: "docs",
        isFree: true,
      },
      {
        title: "W3C Web Accessibility Initiative (WAI) — WCAG 2.2 Guidelines",
        url: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        platform: "W3C",
        type: "docs",
        isFree: true,
      },
    ],
  };
}
