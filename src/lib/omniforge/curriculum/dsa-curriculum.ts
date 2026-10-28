/**
 * OmniForge Data Structures & Algorithms (DSA) Curriculum
 *
 * Subject: Data Structures and Algorithms (DSA)
 * Domain: Computer Science & Software Engineering
 * Target Outcome: Algorithmic Mastery & Technical Interview Competency
 *
 * Designed with a rigorous, logically progressive 14-stage structure:
 * - Time & Space Complexity (Big-O, Omega, Theta), Master Theorem
 * - Arrays, Two Pointers, Sliding Window, Prefix Sums
 * - Strings, Sliding Window, Rabin-Karp / KMP
 * - Linked Lists, Fast/Slow Pointers, Cycle Detection (Floyd's)
 * - Stacks, Queues, Monotonic Stacks, Next Greater Element
 * - Recursion, Divide & Conquer, Merge Sort, Quick Sort
 * - Binary Trees, Tree Traversals, BST Properties, Balancing
 * - Heaps, Priority Queues, Top-K, Median from Data Stream
 * - Hash Tables, Collision Handling, Disjoint Set Union (Union-Find)
 * - Graph BFS/DFS, Cycle Detection, Bipartite Graphs
 * - Shortest Paths (Dijkstra, Bellman-Ford), MST (Kruskal, Prim), Topo Sort
 * - Backtracking, Pruning, Combinatorial Search, N-Queens
 * - 1D Dynamic Programming, Memoization vs Tabulation, Kadane's Algorithm
 * - 2D/3D Dynamic Programming, Knapsack, LCS, LIS, Interval DP & Capstone
 */

import { CurriculumBlueprint, StageContentDetail } from "./types";

export const DSA_BLUEPRINT: CurriculumBlueprint = {
  subject: "Data Structures and Algorithms",
  domain: "Computer Science & Software Engineering",
  roadmapType: "LEARNING",
  experienceLevel: "All Levels",
  targetOutcome: "Master of Data Structures, Algorithms & Competitive Programming",
  estimatedEffort: "14 Stages · ~180 Study Hours · 12–16 Weeks",
  prerequisiteRelationships: {
    2: [1],
    3: [2],
    4: [2],
    5: [4],
    6: [1, 2],
    7: [4, 6],
    8: [7],
    9: [2, 4],
    10: [7, 9],
    11: [10],
    12: [6],
    13: [6, 12],
    14: [13],
  },
  stages: [
    {
      stage: 1,
      title: "Algorithmic Complexity, Big-O Notation & Asymptotic Analysis",
      skillFocus: "Time & Space Complexity Analysis, Big-O / Omega / Theta & Master Theorem",
      objective: "Master mathematical asymptotic analysis to rigorously quantify worst-case, average-case, and best-case execution bounds for any procedural routine.",
      prerequisites: ["Familiarity with at least one programming language (Python, Java, C++, TypeScript)"],
      keyCompetencies: ["Big-O, Big-Omega, and Big-Theta formal definitions", "Time vs Space complexity tradeoffs", "Logarithmic, linearithmic, polynomial, and exponential growth rates", "Analyzing nested loop structures and recursive recurrence relations"],
      projectTitle: "Asymptotic Benchmark Lab: Profiling Growth Rates in Real Time",
      deliverables: ["CLI script benchmarking O(1), O(log n), O(n), O(n log n), and O(n^2) routines across n=10^2 to 10^6", "Asymptotic analysis worksheet verifying bounds for 5 complex algorithms"],
      definitionOfDone: ["Benchmarked execution curves accurately match theoretical mathematical growth slopes", "Space complexity accounted for including call-stack memory allocation", "Recurrence relation analysis validated via Master Theorem"],
      estimatedStudyHours: 12,
      recommendedPacing: "1 week (1.5h/day)",
    },
    {
      stage: 2,
      title: "Static & Dynamic Arrays, Amortized Analysis & Two-Pointer Patterns",
      skillFocus: "Array Memory Contiguity, Amortized Geometric Resizing & Two Pointers",
      objective: "Understand continuous memory allocation, cache locality, amortized dynamic growth, and two-pointer traversal strategies.",
      prerequisites: ["Stage 1 completion"],
      keyCompetencies: ["Memory contiguous cache lines vs pointer indirection", "Amortized constant-time dynamic array doubling analysis", "Opposite-direction two pointers (Two Sum II, Container With Most Water)", "Same-direction fast/slow pointers (Remove Duplicates, Move Zeroes)"],
      projectTitle: "Custom Dynamic Array Implementation with Amortized Cost Auditor",
      deliverables: ["Custom DynamicArray class implementing push, pop, insertAt, and resize with geometric factor 2.0", "Suite of verified two-pointer solutions passing edge-case suites"],
      definitionOfDone: ["Amortized O(1) push proved with operation counter logging resize spikes", "All edge cases (empty arrays, duplicate elements, large n) pass in O(n) time and O(1) space"],
      estimatedStudyHours: 14,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 3,
      title: "String Algorithms, Sliding Window & Frequency Hashing",
      skillFocus: "Fixed & Dynamic Sliding Window, Frequency Counters & Substring Search",
      objective: "Solve complex contiguous subarray and substring problems in optimal linear time using sliding window and frequency map invariants.",
      prerequisites: ["Stage 2 completion"],
      keyCompetencies: ["Fixed-size sliding window (Maximum Sum Subarray of Size K)", "Dynamic-size sliding window with expansion and contraction criteria (Longest Substring Without Repeating Characters, Minimum Window Substring)", "Character frequency hashing and anagram detection in O(n)"],
      projectTitle: "High-Performance Substring Search & Frequency Analyzer Engine",
      deliverables: ["Sliding window algorithm suite handling variable constraints with O(n) guarantee", "Automated test harness verifying window expansion/contraction invariants"],
      definitionOfDone: ["Minimum Window Substring solved in O(n) time and O(k) auxiliary space", "Zero redundant nested lookups within the sliding window loop"],
      estimatedStudyHours: 14,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 4,
      title: "Linked Lists: Singly/Doubly Lists, Fast & Slow Pointers & Cycle Detection",
      skillFocus: "Pointer Mutation, Dummy Sentinel Nodes & Floyd's Cycle Detection",
      objective: "Implement and manipulate dynamic pointer node chains, preventing memory leaks, pointer loss, and cycle infinite loops.",
      prerequisites: ["Stage 2 completion"],
      keyCompetencies: ["Singly and Doubly Linked List node architecture", "In-place reversal of linked lists and sub-lists (O(1) memory)", "Floyd's Cycle-Finding Algorithm (Tortoise and Hare) and cycle start detection", "Dummy head sentinel nodes for clean edge-case insertion and deletion"],
      projectTitle: "LRU (Least Recently Used) Cache Memory Subsystem",
      deliverables: ["Production-grade LRUCache using Doubly Linked List + Hash Map providing O(1) get and O(1) put", "Linked list mutation suite (reversal, merge sorted lists, palindrome validation)"],
      definitionOfDone: ["LRU cache satisfies strict O(1) time complexity for both get and put operations", "Cycle detection algorithm correctly isolates cycle entry points in O(n) time and O(1) space"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 5,
      title: "Stacks, Queues, Deques & Monotonic Stack Patterns",
      skillFocus: "LIFO/FIFO Abstract Data Types, Monotonic Stacks & Sliding Window Deques",
      objective: "Harness stack and queue mechanics to solve structural validation, expression evaluation, and monotonic range queries in linear time.",
      prerequisites: ["Stage 4 completion"],
      keyCompetencies: ["LIFO Stack & FIFO Queue implementations via arrays and linked nodes", "Parentheses and delimiter matching validation", "Monotonic increasing and decreasing stack patterns (Next Greater Element, Daily Temperatures, Largest Rectangle in Histogram)", "Sliding Window Maximum via Monotonic Double-Ended Queue (Deque) in O(n)"],
      projectTitle: "Arithmetic Expression Parser & Monotonic Range Query Engine",
      deliverables: ["Shunting-Yard algorithm implementation converting infix expressions to postfix and evaluating them", "Monotonic stack challenge suite with 0 regressions"],
      definitionOfDone: ["Next Greater Element and Largest Rectangle in Histogram execute in strict O(n) time", "Expression evaluator gracefully reports syntax errors and invalid tokens"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 6,
      title: "Recursion Mechanics, Recurrence Relations & Divide-and-Conquer",
      skillFocus: "Call-Stack Frames, Base Cases, Merge Sort & Quick Sort Mechanics",
      objective: "Master recursive problem decomposition, call stack trace analysis, and optimal O(n log n) divide-and-conquer sorting algorithms.",
      prerequisites: ["Stage 1, 2 completion"],
      keyCompetencies: ["Base case identification and call-stack overflow prevention", "Divide-and-Conquer paradigm: Divide, Conquer, Combine", "Merge Sort implementation with stability and O(n log n) time guarantee", "Quick Sort: Lomuto vs Hoare partitioning schemes, pivot selection strategies, and worst-case mitigation (Dutch National Flag)"],
      projectTitle: "Recursive Sort Engine & Recurrence Profiler Lab",
      deliverables: ["Complete implementations of Merge Sort and Randomized Quick Sort", "Performance benchmark comparing O(n^2) Bubble Sort vs O(n log n) Merge/Quick Sort"],
      definitionOfDone: ["Merge Sort maintains stable ordering of equivalent keys", "Quick Sort implements random pivot selection eliminating O(n^2) sorted input degradation", "Memory overhead of call stack measured and documented"],
      estimatedStudyHours: 14,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 7,
      title: "Binary Trees, Tree Traversals (BFS/DFS) & Binary Search Trees (BST)",
      skillFocus: "Recursive DFS, Level-Order BFS, BST Invariants & Tree Height Balancing",
      objective: "Navigate hierarchical non-linear tree structures, applying depth-first and breadth-first traversals to query and mutate binary search trees.",
      prerequisites: ["Stage 4, 6 completion"],
      keyCompetencies: ["Binary Tree representation, height, depth, and diameter", "Depth-First Search traversals: Pre-order, In-order (BST sorted property), Post-order", "Breadth-First Search (Level-Order) traversal using FIFO queues", "Binary Search Tree operations: O(h) search, insert, and delete with predecessor/successor replacement", "Lowest Common Ancestor (LCA) in Binary Trees and BSTs"],
      projectTitle: "Hierarchical BST File System Directory Indexer",
      deliverables: ["Robust BinarySearchTree class with search, insert, delete, and balancing checks", "Suite of tree challenge solutions (Diameter, Max Path Sum, Serialize & Deserialize)"],
      definitionOfDone: ["BST deletion handles all 3 cases (0 children, 1 child, 2 children) cleanly", "Level-order traversal produces correct row-by-row representations", "Tree serialization/deserialization achieves lossless round-trip reconstruction"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 8,
      title: "Priority Queues, Binary Heaps & Top-K Elements Pattern",
      skillFocus: "Min/Max Binary Heaps, Heapify Sift-Up/Sift-Down & Continuous Streams",
      objective: "Construct priority queue abstractions using binary heaps in array representations, executing O(log n) insertions and extracts to track extremes.",
      prerequisites: ["Stage 7 completion"],
      keyCompetencies: ["Array-backed complete binary tree indexing (2i+1, 2i+2, floor((i-1)/2))", "Sift-Up and Sift-Down mechanics for O(log n) push/pop", "Linear-time O(n) Build-Heap / Heapify algorithm", "Top-K Frequent Elements and Kth Largest Element in an Array using size-K min-heaps", "Find Median from Data Stream using paired Max-Heap / Min-Heap balance"],
      projectTitle: "Real-Time Streaming Metrics & Median Finder Subsystem",
      deliverables: ["Custom MinHeap and MaxHeap classes written from scratch without library dependencies", "Dual-heap MedianFinder class supporting O(log n) addNum and O(1) findMedian"],
      definitionOfDone: ["Custom heap implementation passes randomized stress tests matching standard library heaps", "Median finder accurately reports medians across 100,000 continuous stream inputs"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 9,
      title: "Hashing Architecture: Hash Tables, Collisions & Disjoint Set Union (DSU)",
      skillFocus: "Hash Functions, Separate Chaining vs Open Addressing & Union-Find",
      objective: "Explore internal hash table mechanics, collision resolution, and implement Disjoint Set Union with path compression and union by rank.",
      prerequisites: ["Stage 2, 4 completion"],
      keyCompetencies: ["Hash function design, distribution uniformity, and load factor thresholding", "Collision resolution: Separate Chaining (Linked Lists / Red-Black Trees) vs Open Addressing (Linear Probing)", "Disjoint Set Union (Union-Find) architecture: Find with Path Compression, Union by Rank", "Cycle detection in undirected graphs using DSU in near-constant O(alpha(n)) time"],
      projectTitle: "High-Performance HashMap & Dynamic Connected Components Tracker",
      deliverables: ["Custom HashTable implementation with dynamic rehashing when load factor > 0.75", "DisjointSetUnion class solving connected components and Redundant Connection"],
      definitionOfDone: ["Custom HashMap handles collisions with 100% key-value integrity", "DSU path compression achieves inverse Ackermann O(alpha(n)) time complexity"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 10,
      title: "Graph Fundamentals: Representations, BFS, DFS & Connectivity",
      skillFocus: "Adjacency Lists, Graph Traversals, Connected Components & Bipartiteness",
      objective: "Model relational networks as graphs, performing iterative and recursive graph searches to discover paths, cycles, and topological groupings.",
      prerequisites: ["Stage 5, 7, 9 completion"],
      keyCompetencies: ["Graph representations: Adjacency List vs Adjacency Matrix vs Edge List", "Graph BFS for unweighted shortest path and level exploration", "Graph DFS for cycle detection in directed graphs (Three-color states: White/Gray/Black)", "Connected Components, Flood Fill, Number of Islands, and Bipartite graph validation"],
      projectTitle: "Network Topology & Island Graph Traversal Engine",
      deliverables: ["Graph traversal library supporting both directed and undirected graphs", "Island cluster analyzer solving 2D grid matrix problems (Number of Islands, Rotting Oranges)"],
      definitionOfDone: ["Cycle detection distinguishes directed back-edges from undirected parent edges", "Breadth-first search guarantees minimum step count on unweighted graphs"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 11,
      title: "Advanced Graphs: Shortest Paths, Minimum Spanning Trees & Topological Sort",
      skillFocus: "Dijkstra's Algorithm, Bellman-Ford, Kruskal/Prim MST & Kahn's DAG Sort",
      objective: "Solve weighted network optimization problems, calculating shortest paths, minimum spanning trees, and dependency resolution orders.",
      prerequisites: ["Stage 8, 10 completion"],
      keyCompetencies: ["Dijkstra's Shortest Path algorithm using Min-Heap priority queues in O((V + E) log V)", "Bellman-Ford algorithm for negative edge weights and negative cycle detection", "Topological Sort on Directed Acyclic Graphs (DAGs): Kahn's Algorithm (in-degrees) and DFS post-order", "Minimum Spanning Tree (MST): Kruskal's (Greedy + DSU) vs Prim's Algorithm"],
      projectTitle: "Dependency Resolver & Optimal Route Navigation Engine",
      deliverables: ["Package dependency scheduler using Topological Sort (Course Schedule I & II)", "Dijkstra-powered shortest path network router calculating minimum cost paths"],
      definitionOfDone: ["Topological sort detects circular dependencies and outputs valid linear ordering", "Dijkstra algorithm executes in optimal O((V + E) log V) with zero infinite loops"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 12,
      title: "Backtracking, Pruning & Combinatorial State-Space Search",
      skillFocus: "Decision Trees, Choice/Constraint/Goal Invariant & Branch Pruning",
      objective: "Explore combinatorial state spaces systematically, employing aggressive branch pruning to solve constraint satisfaction puzzles.",
      prerequisites: ["Stage 6 completion"],
      keyCompetencies: ["Backtracking template: Choose, Explore, Unchoose (Backtrack)", "Subsets, Combinations, and Permutations (handling unique elements and duplicates)", "State pruning to avoid exponential explosion", "Classic puzzles: N-Queens, Sudoku Solver, Word Search in 2D grid"],
      projectTitle: "Sudoku Constraint Solver & Combinatorial Generator",
      deliverables: ["SudokuSolver executing complete board resolution with pruning under 50ms", "Combinatorial generator suite passing duplicate-elimination edge cases"],
      definitionOfDone: ["Backtracking template properly restores state upon backtracking (no memory leak/mutation)", "Pruning rules eliminate invalid branches prior to recursive descent"],
      estimatedStudyHours: 15,
      recommendedPacing: "1 week (2h/day)",
    },
    {
      stage: 13,
      title: "Dynamic Programming Foundations: 1D DP, Memoization & Tabulation",
      skillFocus: "Optimal Substructure, Overlapping Subproblems & State Transitions",
      objective: "Identify overlapping subproblems, formulating recursive relations with top-down memoization and bottom-up iterative tabulation.",
      prerequisites: ["Stage 6, 12 completion"],
      keyCompetencies: ["Distinguishing DP from Divide-and-Conquer and Greedy", "Top-Down DP (Recursion + Hash/Array Cache) vs Bottom-Up DP (Iterative Table)", "1D DP state transition formulation (Climbing Stairs, House Robber, Coin Change)", "State compression: reducing O(n) space to O(1) space when only previous k states are required", "Kadane's Algorithm for Maximum Subarray Sum in O(n) time and O(1) space"],
      projectTitle: "Financial Optimization & Coin Change Dynamic Programming Lab",
      deliverables: ["Coin Change I & II solutions demonstrating both Top-Down and Bottom-Up approaches", "Benchmarked comparison showing exponential 2^n reduction to linear O(n) via memoization"],
      definitionOfDone: ["Recurrence relation explicitly documented in code comments before implementation", "Space optimization applied reducing array storage to O(1) where applicable"],
      estimatedStudyHours: 16,
      recommendedPacing: "1.5 weeks (2h/day)",
    },
    {
      stage: 14,
      title: "Advanced Dynamic Programming: Multi-Dimensional DP, Subsequences & Capstone",
      skillFocus: "2D/3D DP Grids, 0/1 Knapsack, LCS, LIS, Interval DP & Coding Interview Mastery",
      objective: "Master multi-dimensional state transitions, string subsequences, intervals, and tackle complex hard-tier technical interview challenges.",
      prerequisites: ["All prior stages completed"],
      keyCompetencies: ["0/1 Knapsack and Unbounded Knapsack problem patterns", "Longest Common Subsequence (LCS) and Edit Distance 2D grid table DP", "Longest Increasing Subsequence (LIS) in O(n^2) DP and O(n log n) Binary Search", "Interval DP and Partitioning patterns (Matrix Chain Multiplication, Burst Balloons)", "Strategic pattern recognition playbook for technical coding interviews"],
      projectTitle: "Comprehensive Technical Interview Capstone & Algorithm Portfolio",
      deliverables: ["Verified repository of 50+ classic algorithmic challenges categorized by pattern", "Simulated mock technical interview assessment passing 5 hard-tier problems under timed conditions"],
      definitionOfDone: ["All capstone solutions include rigorous Big-O time and space proofs", "Zero memory limits exceeded or time limit exceeded (TLE) errors across benchmark test cases"],
      estimatedStudyHours: 20,
      recommendedPacing: "2 weeks (2h/day)",
    },
  ],
};

export function buildDSAStageContent(stage: number): StageContentDetail {
  switch (stage) {
    case 1:
      return {
        topics: [
          {
            id: "dsa_1_1",
            title: "Asymptotic Notation: Big-O, Big-Omega, Big-Theta & Formal Limits",
            completed: false,
            subtopics: [
              "Mathematical definitions: f(n) = O(g(n)) upper bound, Omega lower bound, Theta tight bound",
              "Common growth hierarchies: O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)",
              "Constant factors and lower-order terms: when asymptotic theory differs from hardware reality",
            ],
            explanation: "Asymptotic analysis abstracts away hardware clock speeds to evaluate how an algorithm's resource consumption scales as input size n approaches infinity.",
          },
          {
            id: "dsa_1_2",
            title: "Time & Space Complexity Rules & Recurrence Relations",
            completed: false,
            subtopics: [
              "Counting operations across sequential steps, nested loops, and dependent inner loops",
              "Auxiliary space vs total space complexity (including recursive call stack frames)",
              "Solving recurrence relations using the Master Theorem: T(n) = aT(n/b) + f(n)",
            ],
            explanation: "Accurate analysis requires evaluating both the primary loop counters and memory footprints, including recursive stack frames that consume physical call-stack space.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: "Assuming O(1) auxiliary space when recursion depth is O(n)",
            consequence: "StackOverflow exceptions or hidden O(n) memory allocation during large inputs.",
            solutionOrFix: "Always count the maximum depth of the recursive call stack toward space complexity.",
          },
          {
            mistake: "Confusing worst-case time with average-case time (e.g. Quick Sort O(n log n) average vs O(n^2) worst case)",
            consequence: "Submitting solutions that fail competitive coding platforms with Time Limit Exceeded (TLE).",
            solutionOrFix: "Design for the worst-case scenario or implement randomized pivots to guarantee expected bounds.",
          },
        ],
        knowledgeCheck: [
          {
            question: "What is the time complexity of a loop where i starts at 1 and multiplies by 2 each iteration until reaching n?",
            answerOrExplanation: "O(log n). Since the loop variable doubles on each iteration (1, 2, 4, 8, ..., 2^k >= n), the loop executes k = ceil(log2(n)) times.",
            solutionRubric: "Calculates the number of iterations as logarithmic in n with base 2.",
          },
        ],
        completionCriteria: [
          "Can mathematically prove Big-O bounds for single, nested, and dependent loop structures",
          "Can apply the Master Theorem to divide-and-conquer recurrences",
          "Completed asymptotic analysis lab benchmark script",
        ],
        practicalExercises: [
          {
            id: "dsa_ex_1",
            title: "Asymptotic Loop Profiler Challenge",
            prompt: "Write a script that benchmarks three algorithms: Linear Search O(n), Binary Search O(log n), and Nested Pair Search O(n^2). Profile execution time across array sizes n = 1,000, 10,000, and 100,000.",
            starterCode: `// Big-O Profiler\nfunction linearSearch(arr: number[], target: number): boolean {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return true;\n  }\n  return false;\n}\n\nfunction binarySearch(arr: number[], target: number): boolean {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return true;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return false;\n}\n\n// Run benchmark and verify growth curves\nexport { linearSearch, binarySearch };`,
            instructions: [
              "Generate sorted arrays of increasing magnitude.",
              "Benchmark and log elapsed microseconds for searching the last element.",
              "Observe how Binary Search remains <1ms while Linear Search scales linearly.",
            ],
            expectedOutcome: "Accurate microsecond timestamps demonstrating logarithmic vs linear scaling.",
          },
        ],
        freeResources: [
          {
            title: "Big-O Cheat Sheet & Complexity Chart",
            url: "https://www.bigocheatsheet.com/",
            platform: "Big-O Cheat Sheet",
            type: "docs",
            isFree: true,
          },
          {
            title: "MIT 6.006: Introduction to Algorithms",
            url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
            platform: "MIT OpenCourseWare",
            type: "docs",
            isFree: true,
          },
        ],
      };

    case 2:
      return {
        topics: [
          {
            id: "dsa_2_1",
            title: "Dynamic Arrays & Amortized Geometric Resizing",
            completed: false,
            subtopics: [
              "Contiguous array storage, pointer arithmetic, and CPU cache line locality",
              "Amortized O(1) push analysis: accounting method vs potential method",
              "Why a growth factor of 2.0 (or 1.5) provides amortized O(1) while fixed-increment +K is O(n)",
            ],
            explanation: "Dynamic arrays allocate a fixed buffer. When full, they allocate a buffer twice as large, copy elements over, and free the old buffer. Because copies happen exponentially less frequently, the amortized cost per append is O(1).",
          },
          {
            id: "dsa_2_2",
            title: "Two-Pointer Strategy: Inward vs Outward vs Fast-Slow",
            completed: false,
            subtopics: [
              "Inward two-pointer approach on sorted arrays (Two Sum II, 3Sum, Valid Palindrome)",
              "Fast and slow pointers for in-place array mutation (Remove Duplicates from Sorted Array)",
              "Container With Most Water: Greedy proof of optimal pointer convergence",
            ],
            explanation: "Two-pointer techniques reduce O(n^2) nested search problems to O(n) single passes by exploiting sorted order or monotonic invariant boundaries.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: "Mutating array length or shifting elements inside a loop (e.g. array.splice(i, 1))",
            consequence: "Turns an O(n) algorithm into an accidental O(n^2) bottleneck because every shift requires moving n-i elements in memory.",
            solutionOrFix: "Use a slow-pointer write index to overwrite elements in place without shifting.",
          },
        ],
        knowledgeCheck: [
          {
            question: "Why does dynamic array resizing by doubling the capacity result in amortized O(1) append time, whereas resizing by adding a constant 10 slots results in O(n) append time?",
            answerOrExplanation: "With doubling, inserting n elements incurs copies at 1, 2, 4, 8, ..., n. The sum of copies is 1 + 2 + 4 + ... + n < 2n = O(n) total work for n insertions, which is O(1) amortized per insert. With fixed +10 resizing, an array of size n requires n/10 resizes, doing 10 + 20 + 30 + ... + n = O(n^2) total work, which is O(n) per insert.",
            solutionRubric: "Demonstrates geometric series summation leading to O(n)/n = O(1) versus arithmetic series O(n^2)/n = O(n).",
          },
        ],
        completionCriteria: [
          "Implemented custom dynamic array class with automated resize logging",
          "Solved Two Sum II and Container With Most Water in O(n) time and O(1) space",
          "Passes all boundary test cases with zero runtime regressions",
        ],
        practicalExercises: [
          {
            id: "dsa_ex_2",
            title: "Two-Pointer Water Container Challenge",
            prompt: "Given n non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can contain using two pointers in O(n) time and O(1) space.",
            starterCode: `function maxArea(height: number[]): number {\n  let left = 0;\n  let right = height.length - 1;\n  let maxWater = 0;\n  while (left < right) {\n    const width = right - left;\n    const h = Math.min(height[left], height[right]);\n    maxWater = Math.max(maxWater, width * h);\n    if (height[left] < height[right]) {\n      left++;\n    } else {\n      right--;\n    }\n  }\n  return maxWater;\n}\nexport { maxArea };`,
            instructions: [
              "Initialize pointers at left and right boundaries.",
              "Calculate area and update global maximum.",
              "Advance the pointer pointing to the shorter vertical line.",
              "Verify solution against heights [1,8,6,2,5,4,8,3,7] resulting in 49.",
            ],
            expectedOutcome: "O(n) time and O(1) space execution passing all test assertions.",
          },
        ],
        freeResources: [
          {
            title: "NeetCode Two Pointer Roadmap",
            url: "https://neetcode.io/roadmap",
            platform: "NeetCode",
            type: "docs",
            isFree: true,
          },
        ],
      };

    default:
      return {
        topics: [
          {
            id: `dsa_${stage}_1`,
            title: DSA_BLUEPRINT.stages[stage - 1]?.title || `Stage ${stage} Data Structures & Algorithms`,
            completed: false,
            subtopics: [
              "Core mathematical invariants and structural properties",
              "Optimal traversal, search, insertion, and deletion algorithms",
              "Time and space complexity bounds across best, average, and worst cases",
            ],
            explanation: `Mastering Stage ${stage} unlocks foundational problem-solving patterns that translate directly to elite technical interview performance.`,
          },
          {
            id: `dsa_${stage}_2`,
            title: "Pattern Recognition & Interview Edge Cases",
            completed: false,
            subtopics: [
              "Recognizing when to apply this data structure or algorithmic paradigm",
              "Defensive handling of boundary values: empty inputs, singletons, overflow, cycles",
              "Tradeoffs between recursion stack space, iterative tables, and in-place mutations",
            ],
            explanation: "Engineering high-performance algorithmic solutions requires balancing asymptotic optimality with clean, robust edge-case handling.",
          },
        ],
        commonMistakesAndTroubleshooting: [
          {
            mistake: `Overlooking boundary conditions and off-by-one errors in Stage ${stage}`,
            consequence: "IndexOutOfBounds, NullPointerException, or infinite loops on extreme inputs.",
            solutionOrFix: "Always write explicit tests for n=0, n=1, duplicates, negative numbers, and maximum integer bounds.",
          },
        ],
        knowledgeCheck: [
          {
            question: `What is the core algorithmic tradeoff introduced in Stage ${stage}: ${DSA_BLUEPRINT.stages[stage - 1]?.skillFocus}?`,
            answerOrExplanation: "Balancing time efficiency against auxiliary memory consumption, using structural invariants to eliminate redundant computation.",
            solutionRubric: "Articulates time versus space tradeoffs and explains why this specific pattern outperforms brute force.",
          },
        ],
        completionCriteria: [
          `Satisfy all practical problem-solving requirements for Stage ${stage}`,
          "Solutions adhere to optimal time complexity with zero unhandled edge cases",
          "Pass stage knowledge check and complexity self-assessment",
        ],
        practicalExercises: [
          {
            id: `dsa_ex_${stage}`,
            title: DSA_BLUEPRINT.stages[stage - 1]?.projectTitle || `Stage ${stage} Algorithmic Lab`,
            prompt: `Implement an optimal solution for the core challenge of Stage ${stage}, ensuring worst-case time complexity meets the theoretical optimum.`,
            starterCode: `// Stage ${stage}: ${DSA_BLUEPRINT.stages[stage - 1]?.title}\nfunction solveProblem(input: any): any {\n  // Implement optimal algorithmic solution\n  return input;\n}\nexport { solveProblem };`,
            instructions: [
              "Formulate your algorithmic approach and state the target Big-O time and space complexity.",
              "Implement the routine with defensive boundary checks.",
              "Assert correctness across test fixtures including null/empty and large inputs.",
            ],
            expectedOutcome: "Passing all test assertions with optimal asymptotic runtime.",
          },
        ],
        freeResources: [
          {
            title: "NeetCode Algorithms & Data Structures",
            url: "https://neetcode.io/",
            platform: "NeetCode",
            type: "docs",
            isFree: true,
          },
          {
            title: "Visualgo: Visualising Data Structures and Algorithms",
            url: "https://visualgo.net/en",
            platform: "VisuAlgo",
            type: "interactive",
            isFree: true,
          },
        ],
      };
  }
}
