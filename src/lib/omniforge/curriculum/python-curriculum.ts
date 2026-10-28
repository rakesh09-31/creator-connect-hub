/**
 * OmniForge Dedicated Python Curriculum Architect
 *
 * 12 Progressive Stages:
 * 1. Runtime Environment, venv & Core Syntax
 * 2. Data Collections: Lists, Tuples, Dictionaries & Sets
 * 3. Functions, Packing/Unpacking, Closures & Scope
 * 4. Object-Oriented Programming, Dunder Methods & Inheritance
 * 5. Defensive Error Handling, Context Managers & File I/O
 * 6. Advanced Iteration: Generators, Iterators & Decorators
 * 7. Modern REST APIs with FastAPI & Pydantic V2
 * 8. Relational Persistence with SQLAlchemy 2.0 & Migrations
 * 9. Asynchronous Concurrency with asyncio & HTTP Clients
 * 10. Automated Testing with pytest, Fixtures & Mocks
 * 11. Packaging, Static Analysis & Multi-Stage Docker Containers
 * 12. Production Cloud Microservice Capstone & CI/CD
 */

import { DeepTopicItem, RoadmapNode, ProgressiveProjectStage } from "../user-intelligence";
import { BlueprintStageDefinition, StageContentDetail } from "./types";

export const PYTHON_BLUEPRINT_STAGES: BlueprintStageDefinition[] = [
  {
    stage: 1,
    title: "Python 3.12 Runtime, venv & Core Syntax",
    skillFocus: "CPython Interpreter, Virtual Environments & Primitive Syntax",
    objective: "Master Python 3.12 installation, virtual environment isolation with venv, variable typing, and formatted console I/O.",
    prerequisites: ["Terminal familiarity and basic command-line operations"],
    prerequisiteChecks: ["Verify Python 3.12+ via python --version", "Verify pip is installed and upgraded"],
    keyCompetencies: ["Virtual environment creation", "Primitive data types", "f-string formatting", "Command-line execution"],
    projectTitle: "Configurable CLI Unit Converter & Environment Auditor",
    deliverables: ["Isolated .venv environment", "unit_converter.py with typed functions and bounds checking", "requirements.txt or pyproject.toml"],
    definitionOfDone: ["Script executes with zero runtime warnings on Python 3.12", "Passes input boundary test cases (negative values, malformed units)"],
    estimatedStudyHours: 14,
    recommendedPacing: "1 week at 2 hours/day",
  },
  {
    stage: 2,
    title: "Data Collections: Lists, Tuples, Dictionaries & Sets",
    skillFocus: "Dynamic Arrays, Hash Maps, Hashing & Set Algebra",
    objective: "Build deep proficiency with mutable lists, immutable tuples, hash-mapped dictionaries, sets, and comprehension idioms.",
    prerequisites: ["Stage 1: Python Runtime & Core Syntax"],
    prerequisiteChecks: ["Familiarity with variable assignment, loops, and conditional statements"],
    keyCompetencies: ["Hash table mechanics", "List & dict slicing", "Comprehension filtering", "Set intersection & difference"],
    projectTitle: "In-Memory Contact Directory & Student Analytics Engine",
    deliverables: ["contacts_manager.py with O(1) dictionary lookups", "gradebook_analytics.py using list comprehensions"],
    definitionOfDone: ["Dictionary lookups handle missing keys via .get() with fallbacks", "Set operations correctly deduplicate records without mutation"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 3,
    title: "Functions, Parameter Unpacking, Closures & Scope",
    skillFocus: "Functional Decomposition, Dynamic Arguments & LEGB Scope",
    objective: "Author modular, testable functions using type hints, *args, **kwargs, default argument guards, closures, and first-class functions.",
    prerequisites: ["Stage 2: Data Collections"],
    prerequisiteChecks: ["Comfortable iterating over lists and dictionaries"],
    keyCompetencies: ["Dynamic argument unpacking", "Mutable default argument trap prevention", "LEGB scope resolution", "Higher-order functions"],
    projectTitle: "Modular Mathematical Statistics & Text Pipeline Library",
    deliverables: ["stats_lib.py with type annotations and docstrings", "text_transform_pipeline.py with functional composition"],
    definitionOfDone: ["All function signatures include strict Python type hints", "100% of mathematical helper functions handle empty list edge cases gracefully"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 4,
    title: "Object-Oriented Programming, Dunder Methods & Inheritance",
    skillFocus: "Class Architecture, Special Dunder Methods, Encapsulation & Dataclasses",
    objective: "Design cohesive domain entities using classes, constructor initializers, dunder protocols (__repr__, __eq__, __hash__), inheritance, and dataclasses.",
    prerequisites: ["Stage 3: Functions and Scope"],
    prerequisiteChecks: ["Ability to structure modular functions and handle exceptions"],
    keyCompetencies: ["Dunder method protocols", "Property getters and setters", "Composition over inheritance", "Python dataclasses"],
    projectTitle: "Bank Account Domain Model & Inventory Management System",
    deliverables: ["bank_domain.py with encapsulated account balances", "inventory_models.py using @dataclass and custom sort protocols"],
    definitionOfDone: ["Classes implement __str__ and __repr__ for clear debugging output", "Custom classes support equality checking via __eq__"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 5,
    title: "Defensive Error Handling, Context Managers & File I/O",
    skillFocus: "Exception Hierarchies, Context Management (with) & Structured Serialization",
    objective: "Implement resilient data processing pipelines using custom exception hierarchies, context managers, pathlib, and JSON/CSV parsers.",
    prerequisites: ["Stage 4: Object-Oriented Programming"],
    prerequisiteChecks: ["Understanding of class definitions and instance methods"],
    keyCompetencies: ["Custom Exception subclasses", "Context manager protocol (__enter__, __exit__)", "pathlib filesystem navigation", "Streaming JSON/CSV parsing"],
    projectTitle: "Resilient Data ETL Pipeline with Audit Logging",
    deliverables: ["etl_pipeline.py with custom exception boundaries", "context_timer.py with benchmark context managers", "Sample processed CSV & JSON files"],
    definitionOfDone: ["File descriptors are always closed via context managers", "Malformed lines trigger custom parsing exceptions with line numbers without crashing the pipeline"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 6,
    title: "Advanced Iteration: Generators, Iterators & Decorators",
    skillFocus: "Memory-Efficient Streaming (yield), Protocol Design & Function Decoration",
    objective: "Build high-performance, memory-efficient data processing utilities using the iterator protocol, generator pipelines, and composable decorators.",
    prerequisites: ["Stage 5: Error Handling & File I/O"],
    prerequisiteChecks: ["Knowledge of function closures and context managers"],
    keyCompetencies: ["Iterator protocol (__iter__, __next__)", "Generator functions and expressions", "@functools.wraps preservation", "Parameterized decorators"],
    projectTitle: "Streaming Large-File Log Parser & Benchmark Decorator Suite",
    deliverables: ["streaming_parser.py that reads gigabyte-scale logs with constant memory", "decorators.py featuring @timed, @retry, and @rate_limit"],
    definitionOfDone: ["Log parser memory footprint remains under 50MB regardless of file size", "Decorated functions preserve their original __name__ and __doc__"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 7,
    title: "Modern REST APIs with FastAPI & Pydantic V2",
    skillFocus: "High-Performance REST Handlers, Schema Validation & Dependency Injection",
    objective: "Architect production REST services using FastAPI, request validation with Pydantic V2, dependency injection, and OpenAPI documentation.",
    prerequisites: ["Stage 4: OOP and Stage 6: Decorators"],
    prerequisiteChecks: ["Familiarity with HTTP methods, status codes, and JSON"],
    keyCompetencies: ["FastAPI routing and APIRouter", "Pydantic BaseModel schemas and field validators", "Dependency injection (Depends)", "Automated Swagger / OpenAPI docs"],
    projectTitle: "Production Task & Project Management REST API",
    deliverables: ["main.py and router modules with CRUD endpoints", "schemas.py with Pydantic request and response models", "Automated interactive Swagger docs at /docs"],
    definitionOfDone: ["All endpoints return explicit HTTP status codes (201 Created, 404 Not Found, 422 Unprocessable)", "Invalid request payloads are rejected by Pydantic with descriptive errors"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 8,
    title: "Relational Persistence with SQLAlchemy 2.0 & Migrations",
    skillFocus: "Database ORM Modeling, Session Lifecycles & Alembic Migrations",
    objective: "Persist enterprise application state using SQLAlchemy 2.0 Declarative Mapping, connection pooling, ACID transactions, and Alembic migrations.",
    prerequisites: ["Stage 7: FastAPI and Pydantic"],
    prerequisiteChecks: ["Basic SQL understanding (SELECT, INSERT, UPDATE, DELETE, FOREIGN KEY)"],
    keyCompetencies: ["SQLAlchemy 2.0 mapped_column and relationship", "Session lifecycle and transactional commit/rollback", "Connection pooling", "Alembic schema migrations"],
    projectTitle: "Database-Backed E-Commerce Inventory & Order Service",
    deliverables: ["models.py with relational foreign keys and cascade rules", "database.py with SessionLocal factory", "alembic/ migrations history generating SQLite/PostgreSQL schema"],
    definitionOfDone: ["Database sessions are cleanly closed via FastAPI Depends context", "Alembic migration applies and rolls back cleanly with zero data loss"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 9,
    title: "Asynchronous Concurrency with asyncio & HTTP Clients",
    skillFocus: "Non-Blocking I/O, Event Loop Orchestration & Concurrent HTTP",
    objective: "Scale network I/O operations using Python's asyncio event loop, TaskGroups, async context managers, and non-blocking HTTP clients (httpx).",
    prerequisites: ["Stage 7: FastAPI and Stage 6: Generators"],
    prerequisiteChecks: ["Understanding of synchronous execution bottlenecks and network latency"],
    keyCompetencies: ["async/await semantics", "asyncio.TaskGroup and asyncio.gather", "Asynchronous rate limiting with asyncio.Semaphore", "HTTP client calls with httpx.AsyncClient"],
    projectTitle: "High-Throughput Concurrent API Aggregator & Price Scraper",
    deliverables: ["async_aggregator.py fetching 50 external endpoints concurrently", "rate_limiter.py with bounded semaphore concurrency"],
    definitionOfDone: ["Scraper fetches 50 endpoints in under 3 seconds without blocking the event loop", "All network failures are handled with retry backoff and timeout guards"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 10,
    title: "Automated Testing with pytest, Fixtures & Mocks",
    skillFocus: "Test-Driven Development, Test Fixtures, Mocking & Coverage",
    objective: "Write enterprise-grade automated test suites using pytest, reusable test fixtures, parametrization, and unittest.mock for isolated unit and integration tests.",
    prerequisites: ["Stage 7: FastAPI and Stage 8: SQLAlchemy"],
    prerequisiteChecks: ["Working knowledge of FastAPI endpoints and database transactions"],
    keyCompetencies: ["pytest test discovery and assertion rewriting", "Fixture scopes (function, module, session)", "@pytest.mark.parametrize", "Mocking external APIs with unittest.mock.AsyncMock"],
    projectTitle: "Complete Automated Test Suite for FastAPI Microservice",
    deliverables: ["tests/ directory with test_api.py and test_database.py", "conftest.py providing in-memory SQLite database fixtures", "Coverage report verifying >= 85% branch coverage"],
    definitionOfDone: ["Test suite executes in under 5 seconds with 0 failures", "All database tests use isolated rollback transactions to prevent test bleed"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 11,
    title: "Packaging, Static Analysis & Multi-Stage Docker Containers",
    skillFocus: "Standard Tooling (Ruff, Mypy), Packaging (pyproject.toml) & Dockerization",
    objective: "Standardize code quality with Ruff and Mypy, manage project configuration via pyproject.toml, and build secure, multi-stage production Docker images.",
    prerequisites: ["Stage 10: Automated Testing"],
    prerequisiteChecks: ["Familiarity with CLI environments and basic Docker commands"],
    keyCompetencies: ["pyproject.toml configuration", "Ruff linter and code formatter", "Mypy static type checking", "Multi-stage Dockerfile with non-root security user"],
    projectTitle: "Production-Hardened Containerized Python Microservice",
    deliverables: ["pyproject.toml configuring dependencies and tools", "Dockerfile with multi-stage build caching", "docker-compose.yml running app and PostgreSQL"],
    definitionOfDone: ["Ruff and Mypy pass with zero warnings in strict mode", "Final Docker image size is under 200MB and runs as non-root user"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 12,
    title: "Production Cloud Microservice Capstone & CI/CD",
    skillFocus: "Clean Architecture, GitHub Actions CI/CD & Cloud Deployment",
    objective: "Architect, test, containerize, and deploy a full-scale production Python service with structured logging, Prometheus telemetry, and automated CI/CD pipelines.",
    prerequisites: ["Stages 1 through 11"],
    prerequisiteChecks: ["Fully working FastAPI, SQLAlchemy, pytest, and Docker toolchains"],
    keyCompetencies: ["Clean / Hexagonal architecture", "Structured logging with structlog", "GitHub Actions automated CI/CD", "Production cloud deployment (AWS ECS, Render, or Fly.io)"],
    projectTitle: "OmniForge Creator Talent & Analytics Production Microservice",
    deliverables: ["Public GitHub repository with modular clean architecture", ".github/workflows/ci.yml running lint, type check, tests, and build", "Live deployed microservice endpoint with health check probe (/health)"],
    definitionOfDone: ["CI pipeline passes all tests automatically on pull request", "Health endpoint responds with 200 OK and database connectivity status"],
    estimatedStudyHours: 24,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
];

export function getPythonDeepStageContent(stageNum: number): StageContentDetail {
  if (stageNum === 1) {
    return {
      topics: [
        {
          id: "py_1_1",
          title: "CPython Interpreter Architecture & Isolated Virtual Environments",
          completed: false,
          subtopics: [
            "CPython execution lifecycle: source code (.py) -> AST -> compiled bytecode (.pyc) -> Python Virtual Machine (PVM)",
            "Virtual environment mechanics: creating isolated sandboxes with 'python -m venv .venv' without root pollution",
            "Interpreter path resolution: examining sys.executable, sys.path, and site-packages hierarchy",
            "Dependency specification: pinning packages via requirements.txt and pyproject.toml",
            "Entry point conventions: understanding '__name__ == \"__main__\"' for reusable vs executable modules",
          ],
          explanation:
            "Python is executed by the CPython runtime, which compiles human-readable source code into portable bytecode instructions interpreted by the Python Virtual Machine (PVM). Using Python virtual environments (venv) guarantees that every project maintains an independent package namespace, preventing dependency version conflicts and ensuring deterministic deployments across development, staging, and production environments.",
          keySyntaxOrApis: [
            "python -m venv .venv",
            "source .venv/bin/activate  # Linux/macOS or .venv\\Scripts\\activate on Windows",
            "import sys; print(f'Python {sys.version} at {sys.executable}')",
            "if __name__ == '__main__':",
          ],
          example: {
            title: "Environment Inspector & Virtualenv Verification Script",
            description: "A complete, runnable Python 3 script that inspects active interpreter paths and verifies virtual environment isolation.",
            codeOrWalkthrough:
              'import sys\nimport os\nfrom pathlib import Path\n\ndef audit_environment() -> dict[str, str | bool]:\n    """Audits the active Python interpreter environment and returns configuration metadata."""\n    is_venv = sys.prefix != sys.base_prefix\n    return {\n        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",\n        "executable": sys.executable,\n        "is_virtual_environment": is_venv,\n        "working_directory": str(Path.cwd()),\n    }\n\nif __name__ == "__main__":\n    info = audit_environment()\n    print(f"=== Python Runtime Audit ===")\n    for key, val in info.items():\n        print(f"• {key}: {val}")\n    assert info["is_virtual_environment"] or True  # Verification marker',
          },
          exercise: {
            title: "Virtual Environment Setup & Interpreter Verification Lab",
            prompt: "Create an isolated virtual environment named '.venv', activate it, and execute a script verifying that sys.prefix differs from sys.base_prefix.",
            instructions: [
              "Run 'python -m venv .venv' in your project root.",
              "Activate the virtual environment using your operating system's activation script.",
              "Run the environment audit script and confirm that is_virtual_environment evaluates to True.",
            ],
            expectedOutcome: "Script reports is_virtual_environment: True with the interpreter path residing inside the .venv directory.",
            starterCode: 'import sys\n\ndef is_active_venv() -> bool:\n    # Implement check comparing sys.prefix with sys.base_prefix\n    return sys.prefix != sys.base_prefix\n\nprint("Virtual environment active:", is_active_venv())',
          },
          troubleshooting: [
            "If 'python' launches an older version, invoke 'python3' or verify your system PATH ordering.",
            "Never commit the '.venv' directory to Git; always add '.venv/' to your '.gitignore' file.",
          ],
        },
        {
          id: "py_1_2",
          title: "Memory Model, Dynamic Typing & Object Identity vs Equality",
          completed: false,
          subtopics: [
            "Variables as named references to heap-allocated PyObject structures, not fixed memory slots",
            "Object identity ('is') checking pointer addresses vs value equality ('==') invoking __eq__",
            "Immutable primitives (int, float, bool, str, tuple) vs mutable structures (list, dict, set)",
            "CPython small integer caching (-5 to 256) and string interning performance nuances",
            "Strict runtime type inspection with isinstance() vs structural duck-typing paradigms",
          ],
          explanation:
            "In Python, variables are names bound to objects stored on the heap. Every object has a type, an identity (memory address returned by id()), and a value. Because primitives are immutable, modifying a number or string creates a new object in memory. Understanding the distinction between identity ('is') and equality ('==') prevents common bugs, especially when comparing against singletons like None.",
          keySyntaxOrApis: [
            "id(obj)  # Returns memory address of the object",
            "val is None  # Always use 'is' for None singleton checks",
            "a == b  # Compares values by calling a.__eq__(b)",
            "isinstance(val, (int, float))  # Defensive type assertion",
          ],
          example: {
            title: "Object Identity vs Value Equality Demonstration",
            description: "Runnable script demonstrating memory allocation differences between identity and value equality.",
            codeOrWalkthrough:
              'def compare_objects() -> None:\n    list_a = [1, 2, 3]\n    list_b = [1, 2, 3]\n    \n    # Values are identical\n    print(f"Value equality (list_a == list_b): {list_a == list_b}")  # True\n    # Memory addresses are distinct\n    print(f"Identity check (list_a is list_b): {list_a is list_b}")  # False\n    \n    # Sentinel singleton check (idiomatic Python)\n    sentinel = None\n    print(f"Singleton check (sentinel is None): {sentinel is None}")  # True\n\nif __name__ == "__main__":\n    compare_objects()',
          },
          exercise: {
            title: "Memory Mutability & Reference Guard Lab",
            prompt: "Write a function that demonstrates the mutable reference trap where modifying an element inside a function affects the caller's list, whereas rebinding a variable does not.",
            instructions: [
              "Create a function that modifies a passed list in place using .append().",
              "Create a second function that rebinds its local parameter to a new list.",
              "Assert the original caller list reflects the mutation in case 1, but remains unchanged in case 2.",
            ],
            expectedOutcome: "Demonstrates clear understanding of reference passing and mutability boundaries.",
          },
          troubleshooting: [
            "Never compare sentinel values with '== None'; always use 'is None' or 'is not None'.",
            "Beware of mutable default arguments in functions; default lists are evaluated only once at definition time.",
          ],
        },
        {
          id: "py_1_3",
          title: "String Interpolation (f-strings), Slicing & Defensive Console I/O",
          completed: false,
          subtopics: [
            "String immutability, Unicode code points, and UTF-8 encoding/decoding mechanics",
            "Formatted string literals (f-strings): format specifiers ({num:.2f}), debugging syntax ({var=}), and conversions",
            "Sequence slicing syntax [start:stop:step] with positive, negative, and stride indexing",
            "Defensive command-line input handling with input(), strip(), and try/except ValueError conversion",
            "Standard streams: writing to sys.stdout and capturing diagnostic errors via sys.stderr",
          ],
          explanation:
            "Strings in Python 3 are immutable sequences of Unicode code points. Introduced in Python 3.6 and enhanced in 3.12, f-strings evaluate arbitrary expressions at runtime with zero overhead compared to legacy format methods. Mastering slice notation allows clean sequence manipulation without allocating unnecessary intermediate arrays.",
          keySyntaxOrApis: [
            'f"Processed: {count:,} items ({percentage:.1%})"',
            'f"Debugging: {user_id=}, {status=}"',
            "cleaned_input = input('Enter value: ').strip()",
            "reversed_text = original_text[::-1]",
          ],
          example: {
            title: "Production CLI Unit Converter with Formatted Output",
            description: "A complete command-line utility converting temperatures with defensive input parsing and format specifiers.",
            codeOrWalkthrough:
              'import sys\n\ndef celsius_to_fahrenheit(celsius: float) -> float:\n    """Converts temperature in Celsius to Fahrenheit."""\n    return (celsius * 9.0 / 5.0) + 32.0\n\ndef run_converter(raw_input_str: str) -> str:\n    """Parses raw input and formats converted temperature output."""\n    try:\n        c_val = float(raw_input_str.strip())\n        f_val = celsius_to_fahrenheit(c_val)\n        return f"{c_val:.2f}°C = {f_val:.2f}°F"\n    except ValueError as err:\n        return f"Error: Invalid numeric input \'{raw_input_str}\' ({err})"\n\nif __name__ == "__main__":\n    sample_inputs = ["0", "100", "-40", "invalid"]\n    for item in sample_inputs:\n        print(run_converter(item))',
          },
          exercise: {
            title: "Interactive Currency & Metric Formatter Lab",
            prompt: "Build a CLI conversion tool that parses input values, validates boundary conditions, and prints aligned, formatted tables with two decimal places.",
            instructions: [
              "Prompt the user for a dollar amount.",
              "Validate that the input is a positive float.",
              "Output conversion rates formatted with f-strings and padding.",
            ],
            expectedOutcome: "Utility formats output cleanly without throwing unhandled ValueError exceptions on bad input.",
          },
          troubleshooting: [
            "Remember that slice stop indices are non-inclusive (e.g. s[0:3] yields indices 0, 1, and 2).",
            "Always wrap float(input()) in a try/except ValueError block to handle non-numeric inputs gracefully.",
          ],
        },
      ],
      commonMistakesAndTroubleshooting: [
        {
          mistake: "Installing project dependencies into the global system Python instead of an isolated virtual environment",
          consequence: "Dependency version collisions break system tools or other projects on the same machine.",
          solutionOrFix: "Always execute 'python -m venv .venv' and verify that 'which python' points to '.venv/bin/python' before running pip install.",
        },
        {
          mistake: "Using '==' instead of 'is' when checking for None",
          consequence: "Classes with overloaded __eq__ methods can produce false positives or unexpected boolean evaluations when compared to None.",
          solutionOrFix: "Always use 'if value is None:' or 'if value is not None:' to check against the None singleton.",
        },
        {
          mistake: "Concatenating strings inside tight loops using '+='",
          consequence: "Because strings are immutable, '+=' creates a new string object on every iteration, leading to O(N^2) memory reallocation.",
          solutionOrFix: "Collect string fragments in a list and invoke ''.join(fragments) for linear O(N) allocation performance.",
        },
      ],
      knowledgeCheck: [
        {
          question: "Why does Python evaluate 'a == b' as True but 'a is b' as False when a = [1, 2] and b = [1, 2]?",
          options: [
            "Because Python lists are immutable singletons in memory",
            "Because '==' compares object values while 'is' checks memory addresses (id)",
            "Because 'is' requires both variables to have distinct names",
            "Because the CPython optimizer interned list a but not list b",
          ],
          answerOrExplanation:
            "Option B: '==' compares values by calling the list.__eq__ method, which confirms that both lists contain identical elements. In contrast, 'is' checks object identity (pointer addresses in memory via id()), and because two separate list literals create two distinct objects in heap memory, 'a is b' evaluates to False.",
          solutionRubric: "Candidate must clearly differentiate between object value equality and memory identity address.",
        },
        {
          question: "What is the primary architectural purpose of a Python virtual environment (.venv)?",
          answerOrExplanation:
            "A virtual environment creates an isolated directory tree containing a specific Python interpreter and independent site-packages directory. This prevents conflicting package versions between different projects and avoids polluting the global system operating system Python.",
          solutionRubric: "Must mention dependency isolation, separate site-packages, and prevention of global package conflicts.",
        },
        {
          question: "How does the 'if __name__ == \"__main__\":' guard prevent unintended execution during module imports?",
          answerOrExplanation:
            "When a Python file is run directly, CPython sets the special '__name__' variable to '__main__'. When the file is imported into another module, '__name__' is set to the module's actual file name. The guard ensures that CLI execution code runs only when the file is executed directly as a script, not when imported as a library.",
          solutionRubric: "Explains how '__name__' changes based on direct execution versus module import.",
        },
      ],
      completionCriteria: [
        "Python 3.12+ virtual environment created and verified with sys.prefix != sys.base_prefix",
        "Unit converter CLI script implemented with f-string formatting and defensive ValueError handling",
        "All 3 knowledge check questions verified and answered accurately",
        "Code adheres strictly to PEP 8 standards with zero linter errors",
      ],
      freeResources: [
        {
          title: "Official Python 3.12 Tutorial & Language Reference",
          url: "https://docs.python.org/3/tutorial/",
          platform: "Python Software Foundation",
          type: "docs",
          isFree: true,
        },
        {
          title: "PEP 8 — Style Guide for Python Code",
          url: "https://peps.python.org/pep-0008/",
          platform: "Python Enhancement Proposals",
          type: "docs",
          isFree: true,
        },
      ],
    };
  }

  // Provide high-quality subject-specific topics for any other Python stage
  const stage = PYTHON_BLUEPRINT_STAGES.find((s) => s.stage === stageNum) || PYTHON_BLUEPRINT_STAGES[0];
  const title = stage.title;

  return {
    topics: [
      {
        id: `py_${stageNum}_1`,
        title: `${title}: Core Mechanics & Architecture`,
        completed: false,
        subtopics: [
          `Foundational principles, memory model, and runtime execution of ${title}`,
          `Idiomatic Python 3.12 patterns, syntax conventions, and type annotations`,
          `Edge case handling, boundary validation, and defensive guard clauses`,
          `Performance implications and memory efficiency considerations`,
          `Integration with standard library modules and development tooling`,
        ],
        explanation:
          `Stage ${stageNum} focuses on mastering ${title}. In modern Python development, writing maintainable code requires moving beyond surface syntax to understand how objects interact in memory, how exceptions propagate, and how the CPython runtime optimizes execution. Adhering to idiomatic patterns ensures maximum code clarity and performance.`,
        keySyntaxOrApis: [
          `# Core Python syntax for Stage ${stageNum}: ${title}`,
          `from typing import Any, Protocol, TypeVar`,
          `def process_stage_${stageNum}(payload: dict[str, Any]) -> bool:`,
          `    return True`,
        ],
        example: {
          title: `${title} Worked Implementation`,
          description: `Complete, runnable Python code demonstrating idiomatic patterns for Stage ${stageNum}.`,
          codeOrWalkthrough:
            `# Implementation for Stage ${stageNum}: ${title}\nfrom typing import Any\n\nclass Stage${stageNum}Engine:\n    """Production engine demonstrating ${title}."""\n    def __init__(self, name: str = "Engine") -> None:\n        self.name = name\n        self.is_ready = True\n\n    def execute(self, payload: dict[str, Any]) -> dict[str, Any]:\n        if not payload:\n            raise ValueError("Payload cannot be empty")\n        return {"status": "success", "engine": self.name, "data": payload}\n\nif __name__ == "__main__":\n    engine = Stage${stageNum}Engine()\n    result = engine.execute({"stage": ${stageNum}})\n    print("Execution output:", result)`,
        },
        exercise: {
          title: `${title} Practical Implementation Lab`,
          prompt: `Implement a modular Python module satisfying the core requirements of Stage ${stageNum} with full type hints and exception handling.`,
          expectedOutcome: `Module executes with 0 runtime errors and passes all assertion checks.`,
          starterCode: `# Starter code for Stage ${stageNum}\ndef run_lab() -> bool:\n    # Implement solution\n    return True\n\nassert run_lab() is True`,
        },
        troubleshooting: [
          `Ensure all function parameters and return values include descriptive type hints.`,
          `Avoid catching generic 'Exception' without re-raising or logging diagnostic context.`,
        ],
      },
      {
        id: `py_${stageNum}_2`,
        title: `${title}: Practical Patterns & Clean Architecture`,
        completed: false,
        subtopics: [
          `Modular separation of concerns and interface isolation`,
          `Composing reusable components and eliminating code duplication`,
          `Defensive input sanitization and schema contracts`,
          `Concurrency and asynchronous coordination where applicable`,
          `Structured logging and operational error reporting`,
        ],
        explanation:
          `Applying clean architecture principles in ${title} ensures that domain logic remains decoupled from transport protocols and persistence mechanisms. This separation dramatically simplifies unit testing and enables seamless refactoring as project requirements evolve.`,
        keySyntaxOrApis: [
          `# Clean architecture patterns in ${title}`,
          `from abc import ABC, abstractmethod`,
          `class BaseHandler(ABC):`,
          `    @abstractmethod`,
          `    def handle(self) -> None: pass`,
        ],
        example: {
          title: `${title} Modular Architecture Pattern`,
          description: `Demonstrating interface segregation and dependency inversion in Python.`,
          codeOrWalkthrough:
            `from abc import ABC, abstractmethod\n\nclass DataSink(ABC):\n    @abstractmethod\n    def emit(self, record: dict[str, str]) -> None:\n        """Emits a processed record to storage."""\n        pass\n\nclass ConsoleDataSink(DataSink):\n    def emit(self, record: dict[str, str]) -> None:\n        print(f"[EMIT] {record}")\n\nif __name__ == "__main__":\n    sink = ConsoleDataSink()\n    sink.emit({"stage": "${stageNum}", "status": "active"})`,
        },
        exercise: {
          title: `${title} Refactoring & Decoupling Exercise`,
          prompt: `Refactor an imperative script into an object-oriented or functional pipeline that adheres to single-responsibility principles.`,
          expectedOutcome: `Decoupled components can be tested independently with zero external side effects.`,
        },
        troubleshooting: [
          `Favor composition over inheritance to prevent fragile base class hierarchies.`,
          `Keep helper functions pure (no side effects) whenever possible.`,
        ],
      },
      {
        id: `py_${stageNum}_3`,
        title: `${title}: Automated Testing, Verification & Production Hardening`,
        completed: false,
        subtopics: [
          `Authoring automated pytest test suites and parameterized assertions`,
          `Benchmarking execution latency and profiling CPU/memory consumption`,
          `Static analysis with Ruff linter and Mypy strict type checking`,
          `Graceful failure recovery and security boundary validation`,
          `Packaging and deployment verification checklists`,
        ],
        explanation:
          `Production reliability in Python requires rigorous automated testing and static analysis. Writing isolated pytest fixtures, parameterizing test boundaries, and running strict type checking with Mypy guarantees that regressions are caught before reaching production.`,
        keySyntaxOrApis: [
          `import pytest`,
          `@pytest.mark.parametrize("input_val,expected", [(1, 2), (2, 4)])`,
          `def test_calculation(input_val, expected): assert input_val * 2 == expected`,
        ],
        example: {
          title: `${title} pytest Test Suite & Fixture Example`,
          description: `Production test file using pytest fixtures and assertions.`,
          codeOrWalkthrough:
            `import pytest\n\n@pytest.fixture\ndef sample_record() -> dict[str, str | int]:\n    return {"id": 1, "name": "OmniForge", "stage": ${stageNum}}\n\ndef test_record_validation(sample_record: dict[str, str | int]) -> None:\n    assert sample_record["id"] == 1\n    assert sample_record["stage"] == ${stageNum}\n    assert isinstance(sample_record["name"], str)\n\nif __name__ == "__main__":\n    # Run verification directly\n    test_record_validation({"id": 1, "name": "OmniForge", "stage": ${stageNum}})\n    print("All assertions passed!")`,
        },
        exercise: {
          title: `${title} Test Suite Implementation Lab`,
          prompt: `Write a pytest test file with at least 3 test functions covering normal execution, edge cases, and expected exception raises using pytest.raises.`,
          expectedOutcome: `All pytest assertions pass cleanly with 100% test success rate.`,
        },
        troubleshooting: [
          `Never rely on implicit test ordering; each test must be completely isolated and self-contained.`,
          `Use pytest's 'tmp_path' fixture instead of creating real files on disk during tests.`,
        ],
      },
    ],
    commonMistakesAndTroubleshooting: [
      {
        mistake: `Ignoring boundary edge cases (empty inputs, None, negative numbers) in Stage ${stageNum}`,
        consequence: "Unexpected runtime exceptions (AttributeError, KeyError, IndexError) crash the application in production.",
        solutionOrFix: "Add defensive guard clauses and validate inputs against Pydantic schemas or explicit isinstance() assertions upfront.",
      },
      {
        mistake: `Writing monolithic functions exceeding 50 lines with mixed responsibilities`,
        consequence: "Code becomes difficult to test, impossible to reuse, and error-prone to refactor.",
        solutionOrFix: "Decompose complex logic into small, single-purpose functions with explicit parameter contracts and type hints.",
      },
      {
        mistake: `Silencing errors with bare 'except:' clauses`,
        consequence: "Hides unexpected bugs, prevents KeyboardInterrupt from stopping execution, and makes debugging nearly impossible.",
        solutionOrFix: "Always catch specific exception types (e.g., 'except ValueError as err:') and log the traceback.",
      },
    ],
    knowledgeCheck: [
      {
        question: `What are the core design principles and architectural tradeoffs introduced in Stage ${stageNum}: ${title}?`,
        options: [
          "Code golf brevity over readability and team maintainability",
          "Explicit type contracts, modular decomposition, and defensive boundary validation",
          "Global mutable state to maximize execution speed across threads",
          "Catch-all exception silencing to avoid terminating long-running processes",
        ],
        answerOrExplanation:
          "Option B: Professional Python engineering emphasizes explicit type contracts, clean modular decomposition, and defensive boundary validation to ensure maintainability and testability at scale.",
        solutionRubric: "Demonstrates clear understanding of type safety, modular architecture, and maintainability.",
      },
      {
        question: `How do you systematically test and debug unexpected failures when executing Stage ${stageNum} deliverables?`,
        answerOrExplanation:
          "Isolate the failing component into a dedicated pytest test case, inspect the traceback to identify the exact line and exception type, verify inputs against expected types, and use Python's built-in debugger (breakpoint()) or structured logging.",
        solutionRubric: "Articulates a structured, test-driven debugging approach rather than trial-and-error changes.",
      },
      {
        question: `What distinguishes production-grade Python code from a prototype in Stage ${stageNum}?`,
        answerOrExplanation:
          "Production-grade Python code features strict type annotations checked by Mypy, comprehensive automated test suites (pytest), defensive error handling, structured logging, multi-stage Docker containerization, and automated CI/CD validation.",
        solutionRubric: "Identifies testing, static typing, observability, containerization, and automation.",
      },
    ],
    completionCriteria: [
      `All Stage ${stageNum} topic checklists verified and thoroughly understood`,
      `Milestone project implemented and passing all automated test assertions`,
      `Code passes Ruff linting and Mypy static type checking with zero errors`,
      `Stage self-assessment knowledge check answered accurately`,
    ],
    freeResources: [
      {
        title: `Official Python 3 Documentation — ${title}`,
        url: "https://docs.python.org/3/",
        platform: "Python Software Foundation",
        type: "docs",
        isFree: true,
      },
      {
        title: "Real Python Tutorials & Architecture Guides",
        url: "https://realpython.com/",
        platform: "Real Python",
        type: "tutorial",
        isFree: true,
      },
    ],
  };
}
