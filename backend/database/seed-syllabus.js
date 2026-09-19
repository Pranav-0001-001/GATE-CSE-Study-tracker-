const db = require('./db');

const syllabusData = [
  {
    name: 'General Aptitude',
    code: 'GA',
    description: 'Verbal, Quantitative, Analytical and Spatial Aptitude for GATE CSE',
    display_order: 1,
    topics: [
      'Verbal Aptitude: English grammar, vocabulary, reading comprehension, narrative sequencing',
      'Quantitative Aptitude: Data interpretation, numerical computation and estimation',
      'Quantitative Aptitude: Ratios, percentages, powers, exponents and logarithms',
      'Quantitative Aptitude: Permutations, combinations, series and progressions',
      'Analytical Aptitude: Logic, deduction and induction, analogy, numerical reasoning',
      'Spatial Aptitude: Transformation of shapes, translation, rotation, mirroring, paper folding'
    ]
  },
  {
    name: 'Engineering Mathematics',
    code: 'EM',
    description: 'Discrete Mathematics, Linear Algebra, Calculus, and Probability & Statistics',
    display_order: 2,
    topics: [
      'Discrete Math: Propositional and first order logic, set theory, relations, functions',
      'Discrete Math: Partial orders, lattices, groups and boolean algebra',
      'Discrete Math: Combinatorics, counting, recurrence relations, generating functions',
      'Discrete Math: Graph theory: connectivity, matching, coloring, planar graphs',
      'Linear Algebra: Matrices, determinants, system of linear equations',
      'Linear Algebra: Eigenvalues and eigenvectors, LU decomposition',
      'Calculus: Limits, continuity, differentiability, maxima and minima',
      'Calculus: Mean value theorem, evaluation of definite and improper integrals',
      'Probability: Random variables, uniform, normal, exponential, Poisson, binomial distributions',
      'Probability: Mean, median, mode, standard deviation, conditional probability and Bayes theorem'
    ]
  },
  {
    name: 'Digital Logic',
    code: 'DL',
    description: 'Boolean algebra, combinational and sequential circuits, number representations',
    display_order: 3,
    topics: [
      'Boolean algebra, minimization of Boolean functions, logic gates',
      'Number representations and computer arithmetic: fixed and floating point',
      'Combinational circuits: multiplexers, decoders, encoders, code converters',
      'Arithmetic circuits: adders, subtractors, magnitude comparators, ALU design',
      'Sequential circuits: latches, flip-flops, master-slave flip-flops',
      'Registers and counters: synchronous and asynchronous counters, shift registers',
      'Finite State Machines: Mealy and Moore models, state minimization and equivalence'
    ]
  },
  {
    name: 'Computer Organization & Architecture',
    code: 'COA',
    description: 'Machine instructions, addressing modes, ALU, pipelining, memory hierarchy, I/O',
    display_order: 4,
    topics: [
      'Machine instructions and addressing modes, instruction cycle and execution',
      'ALU, data-path, control unit design: hardwired and micro-programmed control',
      'Instruction pipelining: pipeline hazards, data hazards, branch prediction and speedup',
      'Memory hierarchy: Cache memory mapping (direct, associative, set-associative)',
      'Cache performance, miss penalties, write policies, multi-level caches',
      'Main memory: RAM, ROM chips, memory interleaving, DRAM refresh',
      'Secondary storage: HDD, SSD, disk scheduling algorithms (FCFS, SSTF, SCAN, C-SCAN)',
      'I/O interface: programmed I/O, interrupt driven I/O, direct memory access (DMA)'
    ]
  },
  {
    name: 'Programming and Data Structures',
    code: 'PDS',
    description: 'Programming in C, recursion, linear and non-linear data structures',
    display_order: 5,
    topics: [
      'Programming in C: Functions, recursion, parameter passing, scope and binding',
      'Arrays, pointers, strings, structures, dynamic memory allocation',
      'Stacks: operations, array and linked implementations, applications (postfix evaluation, recursion)',
      'Queues: linear, circular, priority queues, double-ended queues',
      'Linked Lists: singly, doubly, and circular linked lists, pointer manipulation',
      'Trees: binary trees, tree traversals (preorder, inorder, postorder, level order)',
      'Binary Search Trees (BST): insertion, deletion, search, AVL trees and balance factor',
      'Binary Heaps: min-heap, max-heap, heapify, priority queue operations',
      'Graphs: representations (adjacency matrix, adjacency list), vertex degrees'
    ]
  },
  {
    name: 'Algorithms',
    code: 'ALGO',
    description: 'Asymptotic analysis, algorithm design paradigms, graph algorithms, NP-completeness',
    display_order: 6,
    topics: [
      'Asymptotic notation (Big-O, Omega, Theta), recurrence relations and Master Theorem',
      'Searching and sorting: Bubble, Selection, Insertion, Merge, Quick, Heap sort and lower bounds',
      'Hashing: hash functions, collision resolution (chaining, open addressing)',
      'Divide and conquer: analysis and design, Strassen matrix multiplication',
      'Greedy algorithms: fractional knapsack, Huffman coding, activity selection',
      'Dynamic programming: 0/1 knapsack, matrix chain multiplication, longest common subsequence',
      'Graph algorithms: Breadth-First Search (BFS) and Depth-First Search (DFS)',
      'Minimum Spanning Trees: Kruskal and Prim algorithms with Disjoint Set Union',
      'Shortest paths: Dijkstra algorithm, Bellman-Ford algorithm, Floyd-Warshall algorithm',
      'Introduction to complexity: P, NP, NP-complete and NP-hard classes'
    ]
  },
  {
    name: 'Theory of Computation',
    code: 'TOC',
    description: 'Automata theory, regular expressions, context-free languages, Turing machines',
    display_order: 7,
    topics: [
      'Regular languages: DFA, NFA, equivalence of DFA and NFA, minimization of DFA',
      'Regular expressions: regular grammars, conversion between FA and RE',
      'Pumping Lemma for regular languages and closure properties',
      'Context-Free Grammars (CFG) and parse trees, ambiguity in grammars',
      'Pushdown Automata (PDA): deterministic and non-deterministic PDA, acceptance criteria',
      'Pumping Lemma for Context-Free Languages and closure properties of CFLs',
      'Chomsky hierarchy of languages and grammars',
      'Turing Machines: definition, models, multi-tape TM, universal TM',
      'Computability and Undecidability: Halting problem, Post Correspondence Problem, Rice theorem'
    ]
  },
  {
    name: 'Compiler Design',
    code: 'CD',
    description: 'Lexical analysis, parsing, syntax-directed translation, code generation, optimization',
    display_order: 8,
    topics: [
      'Lexical analysis: tokens, lexemes, patterns, regular expressions, lex tool',
      'Parsing: Top-down parsing, recursive descent, LL(1) grammars, First and Follow computation',
      'Bottom-up parsing: Shift-Reduce, Operator precedence, LR(0), SLR(1), LALR(1), CLR(1)',
      'Syntax-Directed Translation (SDT): synthesized and inherited attributes, S-attributed and L-attributed definitions',
      'Intermediate code generation: 3-address code, quadruples, triples, indirect triples',
      'Runtime environments: activation records, stack allocation, parameter passing mechanisms',
      'Code optimization: basic blocks, flow graphs, loop optimization, common subexpression elimination',
      'Data flow analysis: live variable analysis, reaching definitions'
    ]
  },
  {
    name: 'Operating Systems',
    code: 'OS',
    description: 'Processes, CPU scheduling, synchronization, deadlocks, memory management, file systems',
    display_order: 9,
    topics: [
      'OS structure, system calls, dual mode operation, interrupt handling',
      'Processes and threads: process control block, thread models, kernel vs user threads',
      'CPU Scheduling: FCFS, SJF, SRTF, Round Robin, Priority scheduling, multi-level queue',
      'Process Synchronization: critical-section problem, Peterson solution, hardware instructions (TestAndSet)',
      'Semaphores, Mutex locks, classical synchronization problems (Producer-Consumer, Readers-Writers, Dining Philosophers)',
      'Deadlock: conditions for deadlock, resource allocation graphs, deadlock prevention, avoidance (Banker algorithm)',
      'Deadlock detection and recovery algorithms',
      'Memory Management: contiguous allocation, paging, page table structures, segmentation',
      'Virtual Memory: demand paging, page fault handling, page replacement (FIFO, LRU, Optimal, Clock)',
      'Thrashing, working set model, page fault frequency',
      'File systems: directory structures, file allocation methods (contiguous, linked, indexed), free-space management'
    ]
  },
  {
    name: 'Databases',
    code: 'DBMS',
    description: 'ER model, Relational model, SQL, Normalization, Transactions and Concurrency Control',
    display_order: 10,
    topics: [
      'ER model: entities, attributes, relationships, cardinality ratios, ER-to-relational mapping',
      'Relational model: relational algebra operations (selection, projection, join, set operations)',
      'Tuple Relational Calculus (TRC) and Domain Relational Calculus (DRC)',
      'SQL: DDL, DML, subqueries, correlated queries, joins, aggregate functions, views',
      'Integrity constraints: primary key, foreign key, referential integrity, check constraints',
      'Functional dependencies, Armstrong axioms, attribute closure and candidate keys',
      'Normalization: 1NF, 2NF, 3NF, BCNF, lossless join decomposition, dependency preservation',
      'File organization and indexing: primary, secondary, clustering indexes, B and B+ trees',
      'Transactions: ACID properties, states of transactions, serializability (conflict and view)',
      'Concurrency control: lock-based protocols (2PL, Strict 2PL), timestamp ordering, deadlock handling'
    ]
  },
  {
    name: 'Computer Networks',
    code: 'CN',
    description: 'Layering, data link layer, network layer, routing, transport layer, application layer',
    display_order: 11,
    topics: [
      'Concept of layering: OSI model and TCP/IP protocol suite functions and comparisons',
      'Data Link Layer: Framing, error detection (Parity, Checksum, CRC) and correction (Hamming code)',
      'Flow and error control: Stop-and-Wait, Go-Back-N, Selective Repeat ARQ protocols',
      'Medium Access Control: Pure ALOHA, Slotted ALOHA, CSMA, CSMA/CD, CSMA/CA',
      'Ethernet (IEEE 802.3), switching, bridges, collision and broadcast domains',
      'Network Layer: IPv4 addressing, subnetting, supernetting, CIDR, classful vs classless addressing',
      'IPv6 basics, packet formats, comparison with IPv4',
      'Routing algorithms: Distance Vector Routing (Bellman-Ford, count to infinity), Link State Routing (Dijkstra)',
      'Routing protocols: RIP, OSPF, BGP, router architecture and fragmentation',
      'Transport Layer: Connectionless (UDP) vs connection-oriented (TCP) services',
      'TCP flow control, 3-way handshake, connection termination, TCP timers',
      'TCP Congestion control: slow start, congestion avoidance, fast retransmit, fast recovery',
      'Application Layer protocols: DNS, SMTP, POP3, IMAP, FTP, HTTP, HTTPS, sockets'
    ]
  }
];

const badgeData = [
  // Streak Badges
  {
    key: 'streak_3',
    name: 'Getting Started',
    description: 'Maintained a 3-day study streak',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 3
  },
  {
    key: 'streak_7',
    name: 'One Week Strong',
    description: 'Maintained a 7-day study streak',
    icon: '⚡',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 7
  },
  {
    key: 'streak_14',
    name: 'Consistency',
    description: 'Maintained a 14-day study streak',
    icon: '🎯',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 14
  },
  {
    key: 'streak_30',
    name: 'Discipline',
    description: 'Maintained a 30-day study streak',
    icon: '🛡️',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 30
  },
  {
    key: 'streak_50',
    name: 'Unstoppable',
    description: 'Maintained a 50-day study streak',
    icon: '🚀',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 50
  },
  {
    key: 'streak_100',
    name: 'Legend',
    description: 'Maintained a 100-day study streak',
    icon: '👑',
    category: 'streak',
    requirement_type: 'streak_days',
    requirement_value: 100
  },
  // Study Time Badges
  {
    key: 'hours_10',
    name: 'First 10 Hours',
    description: 'Completed 10 hours of focused study',
    icon: '⏱️',
    category: 'study_time',
    requirement_type: 'total_hours',
    requirement_value: 10
  },
  {
    key: 'hours_50',
    name: 'Study Warrior',
    description: 'Completed 50 hours of focused study',
    icon: '⚔️',
    category: 'study_time',
    requirement_type: 'total_hours',
    requirement_value: 50
  },
  {
    key: 'hours_100',
    name: 'Century',
    description: 'Completed 100 hours of focused study',
    icon: '💯',
    category: 'study_time',
    requirement_type: 'total_hours',
    requirement_value: 100
  },
  {
    key: 'hours_250',
    name: 'Deep Work',
    description: 'Completed 250 hours of deep study',
    icon: '🧠',
    category: 'study_time',
    requirement_type: 'total_hours',
    requirement_value: 250
  },
  {
    key: 'hours_500',
    name: 'GATE Machine',
    description: 'Completed 500 hours of intense preparation',
    icon: '🤖',
    category: 'study_time',
    requirement_type: 'total_hours',
    requirement_value: 500
  },
  // Syllabus Badges
  {
    key: 'syllabus_first',
    name: 'First Step',
    description: 'Completed your first GATE CSE topic',
    icon: '🌱',
    category: 'syllabus',
    requirement_type: 'topics_completed',
    requirement_value: 1
  },
  {
    key: 'syllabus_halfway',
    name: 'Halfway Mark',
    description: 'Covered 50% of the GATE CSE syllabus',
    icon: '🧗',
    category: 'syllabus',
    requirement_type: 'syllabus_percentage',
    requirement_value: 50
  },
  {
    key: 'syllabus_complete',
    name: 'Syllabus Champion',
    description: 'Completed 100% of the entire GATE CSE syllabus',
    icon: '🏆',
    category: 'syllabus',
    requirement_type: 'syllabus_percentage',
    requirement_value: 100
  }
];

function seed() {
  console.log('🌱 Seeding GATE CSE Syllabus and Badges...');

  const insertSubject = db.prepare(`
    INSERT INTO subjects (name, code, description, display_order)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      display_order = excluded.display_order
  `);

  const insertTopic = db.prepare(`
    INSERT INTO topics (subject_id, name, display_order)
    VALUES (?, ?, ?)
  `);

  const getSubjectByCode = db.prepare('SELECT id FROM subjects WHERE code = ?');
  const countTopicsForSubject = db.prepare('SELECT COUNT(*) as count FROM topics WHERE subject_id = ?');

  // Insert subjects and topics
  for (const subj of syllabusData) {
    insertSubject.run(subj.name, subj.code, subj.description, subj.display_order);
    const subjectRow = getSubjectByCode.get(subj.code);
    const subjectId = subjectRow.id;

    const topicCount = countTopicsForSubject.get(subjectId).count;
    if (topicCount === 0) {
      subj.topics.forEach((topicName, idx) => {
        insertTopic.run(subjectId, topicName, idx + 1);
      });
    }
  }

  // Insert badges
  const insertBadge = db.prepare(`
    INSERT INTO badges (key, name, description, icon, category, requirement_type, requirement_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      requirement_type = excluded.requirement_type,
      requirement_value = excluded.requirement_value
  `);

  for (const b of badgeData) {
    insertBadge.run(b.key, b.name, b.description, b.icon, b.category, b.requirement_type, b.requirement_value);
  }

  const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
  const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topics').get().count;
  const totalBadges = db.prepare('SELECT COUNT(*) as count FROM badges').get().count;

  console.log(`✅ Seed complete: ${totalSubjects} Subjects, ${totalTopics} Topics, ${totalBadges} Badges in database.`);
}

if (require.main === module) {
  seed();
}

module.exports = seed;
