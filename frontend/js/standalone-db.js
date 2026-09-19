/**
 * GATETrack - Standalone Client-Side Database & Offline Fallback Engine
 * Allows GATETrack to run 100% offline and standalone (e.g. direct file://, mobile APK, offline PWA)
 * without requiring an active Node.js server.
 */

const StandaloneDB = {
  initialized: false,

  syllabusData: [
    {
      id: 1, name: 'General Aptitude', code: 'GA',
      description: 'Verbal, Quantitative, Analytical and Spatial Aptitude for GATE CSE',
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
      id: 2, name: 'Engineering Mathematics', code: 'EM',
      description: 'Discrete Mathematics, Linear Algebra, Calculus, and Probability & Statistics',
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
      id: 3, name: 'Digital Logic', code: 'DL',
      description: 'Boolean algebra, combinational and sequential circuits, number representations',
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
      id: 4, name: 'Computer Organization & Architecture', code: 'COA',
      description: 'Machine instructions, addressing modes, ALU, pipelining, memory hierarchy, I/O',
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
      id: 5, name: 'Programming and Data Structures', code: 'PDS',
      description: 'Programming in C, recursion, linear and non-linear data structures',
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
      id: 6, name: 'Algorithms', code: 'ALGO',
      description: 'Asymptotic analysis, algorithm design paradigms, graph algorithms, NP-completeness',
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
      id: 7, name: 'Theory of Computation', code: 'TOC',
      description: 'Automata theory, regular expressions, context-free languages, Turing machines',
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
      id: 8, name: 'Compiler Design', code: 'CD',
      description: 'Lexical analysis, parsing, syntax-directed translation, code generation, optimization',
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
      id: 9, name: 'Operating Systems', code: 'OS',
      description: 'Processes, CPU scheduling, synchronization, deadlocks, memory management, file systems',
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
      id: 10, name: 'Databases', code: 'DBMS',
      description: 'ER model, Relational model, SQL, Normalization, Transactions and Concurrency Control',
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
      id: 11, name: 'Computer Networks', code: 'CN',
      description: 'Layering, data link layer, network layer, routing, transport layer, application layer',
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
  ],

  badgesData: [
    { id: 1, key: 'streak_3', name: 'Getting Started', description: 'Maintained a 3-day study streak', icon: '🔥', requirement_type: 'streak_days', requirement_value: 3 },
    { id: 2, key: 'streak_7', name: 'One Week Strong', description: 'Maintained a 7-day study streak', icon: '⚡', requirement_type: 'streak_days', requirement_value: 7 },
    { id: 3, key: 'streak_14', name: 'Consistency', description: 'Maintained a 14-day study streak', icon: '🎯', requirement_type: 'streak_days', requirement_value: 14 },
    { id: 4, key: 'streak_30', name: 'Discipline', description: 'Maintained a 30-day study streak', icon: '🛡️', requirement_type: 'streak_days', requirement_value: 30 },
    { id: 5, key: 'hours_10', name: 'First 10 Hours', description: 'Completed 10 hours of focused study', icon: '⏱️', requirement_type: 'total_hours', requirement_value: 10 },
    { id: 6, key: 'hours_50', name: 'Study Warrior', description: 'Completed 50 hours of focused study', icon: '⚔️', requirement_type: 'total_hours', requirement_value: 50 },
    { id: 7, key: 'hours_100', name: 'Century', description: 'Completed 100 hours of focused study', icon: '💯', requirement_type: 'total_hours', requirement_value: 100 },
    { id: 8, key: 'syllabus_first', name: 'First Step', description: 'Completed your first GATE CSE topic', icon: '🌱', requirement_type: 'topics_completed', requirement_value: 1 },
    { id: 9, key: 'syllabus_halfway', name: 'Halfway Mark', description: 'Covered 50% of the GATE CSE syllabus', icon: '🧗', requirement_type: 'syllabus_percentage', requirement_value: 50 },
    { id: 10, key: 'syllabus_complete', name: 'Syllabus Champion', description: 'Completed 100% of the entire GATE CSE syllabus', icon: '🏆', requirement_type: 'syllabus_percentage', requirement_value: 100 }
  ],

  defaultHabits: [
    { id: 1, name: 'Study 6 hours', description: 'Core GATE preparation time', icon: '⏱️', frequency: 'daily', target: '6 Hours', is_active: 1 },
    { id: 2, name: 'Solve 30 PYQs', description: 'Practice Previous Year Questions', icon: '📝', frequency: 'daily', target: '30 Questions', is_active: 1 },
    { id: 3, name: 'Revise Formulas & Notes', description: 'Quick revision of key formulas', icon: '🧠', frequency: 'daily', target: '30 Minutes', is_active: 1 },
    { id: 4, name: 'Physical Exercise / Walk', description: 'Keep mind and body fresh', icon: '🏃', frequency: 'daily', target: '30 Minutes', is_active: 1 }
  ],

  getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  init() {
    if (this.initialized) return;

    // Seed User if missing
    if (!localStorage.getItem('gatetrack_db_user')) {
      const defaultUser = {
        id: 1,
        name: 'GATE Aspirant',
        email: 'student@gatetrack.local',
        daily_target_hours: 6.0,
        theme: localStorage.getItem('gatetrack_theme') || 'dark',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('gatetrack_db_user', JSON.stringify(defaultUser));
    }

    // Seed Habits if missing
    if (!localStorage.getItem('gatetrack_db_habits')) {
      localStorage.setItem('gatetrack_db_habits', JSON.stringify(this.defaultHabits));
    }

    // Seed Empty Tables
    if (!localStorage.getItem('gatetrack_db_topic_progress')) {
      localStorage.setItem('gatetrack_db_topic_progress', JSON.stringify({}));
    }
    if (!localStorage.getItem('gatetrack_db_sessions')) {
      localStorage.setItem('gatetrack_db_sessions', JSON.stringify([]));
    }
    if (!localStorage.getItem('gatetrack_db_habit_completions')) {
      localStorage.setItem('gatetrack_db_habit_completions', JSON.stringify([]));
    }
    if (!localStorage.getItem('gatetrack_db_checkins')) {
      localStorage.setItem('gatetrack_db_checkins', JSON.stringify([]));
    }
    if (!localStorage.getItem('gatetrack_db_unlocked_badges')) {
      localStorage.setItem('gatetrack_db_unlocked_badges', JSON.stringify([]));
    }

    this.initialized = true;
  },

  // Mock Request Handler
  handleRequest(endpoint, options = {}) {
    this.init();
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const url = endpoint.split('?')[0];
    const queryStr = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    const queryParams = new URLSearchParams(queryStr);

    // /api/auth/me
    if (url === '/api/auth/me') {
      const user = JSON.parse(localStorage.getItem('gatetrack_db_user'));
      return { user };
    }

    // /api/auth/login or register
    if (url === '/api/auth/login' || url === '/api/auth/register') {
      let user = JSON.parse(localStorage.getItem('gatetrack_db_user'));
      if (body.name) user.name = body.name;
      if (body.email) user.email = body.email;
      localStorage.setItem('gatetrack_db_user', JSON.stringify(user));
      return { message: 'Logged in successfully (Offline Mode)', token: 'standalone_jwt_token', user };
    }

    // /api/auth/logout
    if (url === '/api/auth/logout') {
      return { message: 'Logged out successfully.' };
    }

    // /api/profile
    if (url === '/api/profile') {
      let user = JSON.parse(localStorage.getItem('gatetrack_db_user'));
      if (method === 'PUT') {
        if (body.name) user.name = body.name;
        if (body.daily_target_hours) user.daily_target_hours = parseFloat(body.daily_target_hours);
        if (body.theme) user.theme = body.theme;
        localStorage.setItem('gatetrack_db_user', JSON.stringify(user));
        return { message: 'Profile updated!', user };
      }

      const sessions = JSON.parse(localStorage.getItem('gatetrack_db_sessions') || '[]');
      const totalSecs = sessions.reduce((a, b) => a + (b.duration_seconds || 0), 0);
      const totalHours = Number((totalSecs / 3600).toFixed(1));

      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      const completedTopics = Object.values(progressMap).filter(s => s === 'completed').length;
      const totalTopics = 101;
      const syllabusPercentage = Math.round((completedTopics / totalTopics) * 100);

      const unlockedBadges = JSON.parse(localStorage.getItem('gatetrack_db_unlocked_badges') || '[]');

      return {
        user,
        stats: {
          totalHours,
          totalSessions: sessions.length,
          currentStreak: this.calculateStudyStreak(),
          bestStreak: this.calculateStudyStreak(),
          syllabusPercentage,
          completedTopics,
          totalTopics,
          unlockedBadgesCount: unlockedBadges.length,
          totalBadgesCount: this.badgesData.length
        }
      };
    }

    // /api/syllabus
    if (url === '/api/syllabus') {
      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      let overallTotal = 0, overallCompleted = 0, overallInProgress = 0;
      let topicGlobalId = 1;

      const subjects = this.syllabusData.map(s => {
        const topics = s.topics.map(tName => {
          const tId = topicGlobalId++;
          const status = progressMap[tId] || 'not_started';
          if (status === 'completed') overallCompleted++;
          else if (status === 'in_progress') overallInProgress++;
          overallTotal++;

          return { id: tId, subject_id: s.id, name: tName, status };
        });

        const completed = topics.filter(t => t.status === 'completed').length;
        const inProgress = topics.filter(t => t.status === 'in_progress').length;
        const notStarted = topics.length - completed - inProgress;
        const percentage = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0;

        return {
          id: s.id, name: s.name, code: s.code, description: s.description,
          totalTopics: topics.length, completedTopics: completed,
          inProgressTopics: inProgress, notStartedTopics: notStarted,
          percentage, topics
        };
      });

      const overallNotStarted = overallTotal - overallCompleted - overallInProgress;
      const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

      return {
        summary: {
          totalTopics: overallTotal,
          completedTopics: overallCompleted,
          inProgressTopics: overallInProgress,
          notStartedTopics: overallNotStarted,
          percentage: overallPercentage
        },
        subjects
      };
    }

    // /api/syllabus/progress
    if (url === '/api/syllabus/progress') {
      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      const totalTopics = 101;
      const completed = Object.values(progressMap).filter(s => s === 'completed').length;
      const inProgress = Object.values(progressMap).filter(s => s === 'in_progress').length;
      const notStarted = totalTopics - completed - inProgress;
      const percentage = Math.round((completed / totalTopics) * 100);

      return { totalTopics, completedTopics: completed, inProgressTopics: inProgress, notStartedTopics: notStarted, percentage };
    }

    // /api/syllabus/topics/:id
    if (url.startsWith('/api/syllabus/topics/')) {
      const topicId = parseInt(url.split('/').pop(), 10);
      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      progressMap[topicId] = body.status;
      localStorage.setItem('gatetrack_db_topic_progress', JSON.stringify(progressMap));

      // Evaluate badges
      const unlocked = this.evaluateBadges();

      return { message: 'Progress updated', topicId, status: body.status, unlockedBadges: unlocked };
    }

    // /api/study-sessions
    if (url === '/api/study-sessions') {
      let sessions = JSON.parse(localStorage.getItem('gatetrack_db_sessions') || '[]');

      if (method === 'POST') {
        const newSession = {
          id: Date.now(),
          subject_id: body.subject_id,
          topic_id: body.topic_id,
          duration_seconds: body.duration_seconds,
          notes: body.notes || '',
          started_at: new Date(Date.now() - body.duration_seconds * 1000).toISOString(),
          ended_at: new Date().toISOString()
        };

        // Find subject and topic names
        if (body.subject_id) {
          const s = this.syllabusData.find(sub => sub.id === body.subject_id);
          if (s) newSession.subject_name = s.name;
        }

        sessions.unshift(newSession);
        localStorage.setItem('gatetrack_db_sessions', JSON.stringify(sessions));

        const unlocked = this.evaluateBadges();
        return { message: 'Study session saved! 🎉', session: newSession, unlockedBadges: unlocked };
      }

      // GET with filter
      const filter = queryParams.get('filter') || 'all';
      const today = this.getTodayDate();

      let filtered = sessions;
      if (filter === 'today') {
        filtered = sessions.filter(s => s.started_at && s.started_at.startsWith(today));
      }

      const totalSecs = filtered.reduce((a, b) => a + (b.duration_seconds || 0), 0);
      return { filter, totalSessions: filtered.length, totalDurationSeconds: totalSecs, sessions: filtered };
    }

    // /api/study-sessions/stats
    if (url === '/api/study-sessions/stats') {
      const sessions = JSON.parse(localStorage.getItem('gatetrack_db_sessions') || '[]');
      const today = this.getTodayDate();

      const todaySessions = sessions.filter(s => s.started_at && s.started_at.startsWith(today));
      const todaySeconds = todaySessions.reduce((a, b) => a + (b.duration_seconds || 0), 0);
      const totalSeconds = sessions.reduce((a, b) => a + (b.duration_seconds || 0), 0);
      const streak = this.calculateStudyStreak();

      return {
        todaySeconds,
        weekSeconds: todaySeconds,
        totalSeconds,
        totalSessions: sessions.length,
        currentStreak: streak,
        bestStreak: streak
      };
    }

    // /api/habits
    if (url === '/api/habits') {
      let habits = JSON.parse(localStorage.getItem('gatetrack_db_habits') || '[]');

      if (method === 'POST') {
        const newHabit = {
          id: Date.now(),
          name: body.name,
          description: body.description || '',
          icon: body.icon || '🎯',
          frequency: 'daily',
          target: body.target || 'Once a day',
          is_active: 1
        };
        habits.push(newHabit);
        localStorage.setItem('gatetrack_db_habits', JSON.stringify(habits));
        return { message: 'Habit created!', habit: newHabit };
      }

      const today = this.getTodayDate();
      const completions = JSON.parse(localStorage.getItem('gatetrack_db_habit_completions') || '[]');

      const habitsWithStatus = habits.map(h => {
        const isDone = completions.some(c => c.habit_id === h.id && c.date === today);
        const streak = completions.filter(c => c.habit_id === h.id).length;
        return { ...h, is_completed_today: isDone, currentStreak: streak, bestStreak: streak };
      });

      const total = habitsWithStatus.length;
      const completedCount = habitsWithStatus.filter(h => h.is_completed_today).length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      return {
        todayDate: today,
        summary: { total, completedToday: completedCount, percentageToday: pct },
        habits: habitsWithStatus
      };
    }

    // /api/habits/:id/toggle
    if (url.includes('/api/habits/') && url.endsWith('/toggle')) {
      const habitId = parseInt(url.split('/')[3], 10);
      const today = this.getTodayDate();
      let completions = JSON.parse(localStorage.getItem('gatetrack_db_habit_completions') || '[]');

      const idx = completions.findIndex(c => c.habit_id === habitId && c.date === today);
      let isCompleted = false;

      if (idx >= 0) {
        completions.splice(idx, 1);
        isCompleted = false;
      } else {
        completions.push({ habit_id: habitId, date: today });
        isCompleted = true;
      }

      localStorage.setItem('gatetrack_db_habit_completions', JSON.stringify(completions));
      const habits = JSON.parse(localStorage.getItem('gatetrack_db_habits') || '[]');
      const doneCount = habits.filter(h => completions.some(c => c.habit_id === h.id && c.date === today)).length;
      const pct = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;

      return {
        message: isCompleted ? 'Habit completed!' : 'Habit marked incomplete.',
        isCompleted,
        streakInfo: { currentStreak: 1, bestStreak: 1 },
        summary: { total: habits.length, completedToday: doneCount, percentageToday: pct },
        unlockedBadges: []
      };
    }

    // /api/habits/:id (DELETE)
    if (url.startsWith('/api/habits/') && method === 'DELETE') {
      const habitId = parseInt(url.split('/').pop(), 10);
      let habits = JSON.parse(localStorage.getItem('gatetrack_db_habits') || '[]');
      habits = habits.filter(h => h.id !== habitId);
      localStorage.setItem('gatetrack_db_habits', JSON.stringify(habits));
      return { message: 'Habit deleted.' };
    }

    // /api/checkins
    if (url === '/api/checkins') {
      let checkins = JSON.parse(localStorage.getItem('gatetrack_db_checkins') || '[]');
      if (method === 'POST') {
        const today = this.getTodayDate();
        const existingIdx = checkins.findIndex(c => c.date === today);
        const item = { date: today, rating: body.rating, accomplishments: body.accomplishments, tomorrow_focus: body.tomorrow_focus };

        if (existingIdx >= 0) checkins[existingIdx] = item;
        else checkins.unshift(item);

        localStorage.setItem('gatetrack_db_checkins', JSON.stringify(checkins));
        return { message: 'Check-in saved!', checkin: item };
      }
      return { checkins };
    }

    // /api/checkins/today
    if (url === '/api/checkins/today') {
      const today = this.getTodayDate();
      const checkins = JSON.parse(localStorage.getItem('gatetrack_db_checkins') || '[]');
      const item = checkins.find(c => c.date === today);
      return { today, hasCheckedIn: Boolean(item), checkin: item || null };
    }

    // /api/badges
    if (url === '/api/badges') {
      const unlocked = JSON.parse(localStorage.getItem('gatetrack_db_unlocked_badges') || '[]');
      const badges = this.badgesData.map(b => ({
        ...b,
        is_unlocked: unlocked.includes(b.id) ? 1 : 0
      }));
      return { badges };
    }

    // /api/analytics/overview
    if (url === '/api/analytics/overview') {
      const sessions = JSON.parse(localStorage.getItem('gatetrack_db_sessions') || '[]');
      const totalSecs = sessions.reduce((a, b) => a + (b.duration_seconds || 0), 0);
      const totalHours = Number((totalSecs / 3600).toFixed(1));
      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      const completed = Object.values(progressMap).filter(s => s === 'completed').length;
      const syllabusPercentage = Math.round((completed / 101) * 100);

      const insights = [
        { icon: '🚀', title: 'Preparation Underway', message: `You have logged ${totalHours} hours of focused GATE preparation.` },
        { icon: '🎯', title: 'Syllabus Progress', message: `You have completed ${completed} out of 101 GATE CSE topics (${syllabusPercentage}%).` }
      ];

      return {
        metrics: {
          totalHours, totalSeconds: totalSecs, totalSessions: sessions.length,
          avgDailyHours: totalHours, currentStreak: this.calculateStudyStreak(),
          bestStreak: this.calculateStudyStreak(), syllabusPercentage,
          completedTopics: completed, totalTopics: 101,
          habitCompletionToday: 50, totalHabits: 4
        },
        insights
      };
    }

    // /api/analytics/study
    if (url === '/api/analytics/study') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const past7Days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = dayNames[d.getDay()];
        past7Days.push({
          date: d.toISOString().split('T')[0],
          dayName: dayStr,
          label: dayStr,
          hours: i === 0 ? 1.5 : 0
        });
      }

      const subjectStats = this.syllabusData.map(s => ({
        id: s.id, name: s.name, code: s.code, hours: s.id === 1 ? 1.5 : 0, percentage: s.id === 1 ? 100 : 0
      }));

      return { past7Days, subjectStats };
    }

    // /api/analytics/habits
    if (url === '/api/analytics/habits') {
      const past7Days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => ({
        label: d, completionPercentage: 75
      }));
      return { past7Days };
    }

    // /api/analytics/syllabus
    if (url === '/api/analytics/syllabus') {
      const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
      let tCounter = 1;
      const subjectProgress = this.syllabusData.map(s => {
        let comp = 0;
        s.topics.forEach(() => {
          if (progressMap[tCounter++] === 'completed') comp++;
        });
        const pct = s.topics.length > 0 ? Math.round((comp / s.topics.length) * 100) : 0;
        return { id: s.id, name: s.name, code: s.code, totalTopics: s.topics.length, completedTopics: comp, percentage: pct };
      });

      return { subjectProgress };
    }

    // Fallback default response
    return { status: 'ok' };
  },

  calculateStudyStreak() {
    const sessions = JSON.parse(localStorage.getItem('gatetrack_db_sessions') || '[]');
    if (sessions.length === 0) return 0;
    return 1; // Active today
  },

  evaluateBadges() {
    let unlocked = JSON.parse(localStorage.getItem('gatetrack_db_unlocked_badges') || '[]');
    const progressMap = JSON.parse(localStorage.getItem('gatetrack_db_topic_progress') || '{}');
    const completed = Object.values(progressMap).filter(s => s === 'completed').length;
    const newlyUnlocked = [];

    // Badge 8: First Step
    if (completed >= 1 && !unlocked.includes(8)) {
      unlocked.push(8);
      newlyUnlocked.push(this.badgesData.find(b => b.id === 8));
    }

    localStorage.setItem('gatetrack_db_unlocked_badges', JSON.stringify(unlocked));
    return newlyUnlocked.filter(Boolean);
  }
};

window.StandaloneDB = StandaloneDB;
