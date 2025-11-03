// db_data.js - The PoliSim-DBE Knowledge Base

// --- 1. INITIAL GAME & PLAYER STATE (Starting in Jan 2007, post-2006 midterms) ---
export const INITIAL_STATE = {
    // Political/Time
    currentYear: 2007,
    maxYear: 2035, // Goal is a 2-term presidency by 2025 (16 years total)
    politicalLevel: 'Mayor', // Start at lowest level
    politicalLevelScore: 1.0, 
    // Financial (The Trillionaire Goal)
    netWorth: 10000.00, // Starting net worth in dollars
    wealthGrowthRate: 0.10, // Simulated annual compounding interest (10% growth)
    // Progression & Expertise
    expertise: { // XP in each DBE-linked field (starts at 0)
        topological_q_computing: 0,
        fracton_memory: 0,
        time_crystal_sync: 0,
        fusion_mhd_control: 0,
        holographic_encoding: 0
    },
    // DBE Status
    dbe_deployment: {
        fracton_memory_deployed: false,
        holographic_encoding_deployed: false,
        fusion_mhd_control_deployed: false,
        topological_q_computing_deployed: false,
        time_crystal_sync_deployed: false
    }
};

// --- 2. DBE AND PROGRESSION MODEL PARAMETERS ---
export const DBE_CONSTANTS = {
    // Expertise Gates (Level threshold required to VOTE on a deployment)
    VOTE_GATE: 5, 
    // XP gained per correct quiz answer
    XP_PER_ANSWER: 1,
    // Political Level Progression
    POLITICAL_RANKS: [
        { rank: 'Mayor', min_xp: 0, score: 1.0 },
        { rank: 'Governor', min_xp: 15, score: 2.5 }, // Total XP needed to reach this rank
        { rank: 'President', min_xp: 30, score: 5.0 } // Total XP needed to reach this rank
    ],
    // Trillionaire Factor Multiplier for Voting Weight: ln(NetWorth) / ln(1 Trillion)
    TRILLION_LOG_BASE: Math.log(1000000000000)
};

// --- 3. ECONOMIC SIMULATION BASELINE (Starting 2006/2007 US data) ---
export const ECONOMIC_MODEL = {
    // Baseline metrics and their annual change factors (pre-DBE deployment)
    metrics: {
        debt_gdp: { initial: 65.0, current: 65.0, unit: '%', historical_drift: 1.025 }, // Rising 2.5% annually pre-crisis
        gdp_growth: { initial: 2.0, current: 2.0, unit: '%', historical_drift: 0.98 }, // Slowing 2% annually pre-crisis
        homelessness_k: { initial: 650, current: 650, unit: 'k', historical_drift: 1.03 }, // Rising 3% annually
        defense_spending_gdp: { initial: 4.0, current: 4.0, unit: '%', historical_drift: 1.005 } // Slightly rising
    },
    // Impact of DBE Deployments (applied as a permanent annual multiplier/shift)
    dbe_impact: {
        fracton_memory_deployed: { debt_gdp: 0.95, annual_wealth_boost: 0.01 }, // 5% reduction in debt increase rate
        holographic_encoding_deployed: { gdp_growth: 1.15 }, // 15% boost to annual GDP growth
        fusion_mhd_control_deployed: { defense_spending_gdp: 0.80 }, // 20% cut in defense spending (reallocation)
        topological_q_computing_deployed: { gdp_growth: 1.05, homelessness_k: 0.98 }, // 5% growth boost, 2% social stability gain
        time_crystal_sync_deployed: { homelessness_k: 0.95, gdp_growth: 1.02 } // 5% reduction in homelessness rise, 2% growth gain
    }
};

// --- 4. QUIZ QUESTION BANK (DBE Logic as Curriculum) ---

// Key: [Question, Correct_Answer, [Wrong_Answer_1, Wrong_Answer_2, Wrong_Answer_3], Associated_Field]
// db_data.js - REPLACING the old QUIZ_BANK

export const QUIZ_BANK = [
    // --- LEVEL 1: CORE FOUNDATIONS (Phase 1 Elementary Math/Logic) ---
    // Topological Q-Computing Track (Needs foundational logic/math)
    { q: "What mathematical field provides the foundation for topological quantum computing, focusing on properties preserved under continuous deformation?", "a": "Topology", "w": ["Linear Algebra", "Calculus", "Set Theory"], field: 'topological_q_computing', level: 1, hint: "It literally refers to the study of 'place' or 'surface'." },
    // Fracton Memory Track (Needs Linear Algebra / Set Theory)
    { q: "Which concept from linear algebra is essential for understanding the stability of error-correcting codes, describing vectors whose direction remains unchanged by a linear transformation?", "a": "Eigenvectors", "w": ["Basis Vectors", "Determinants", "Tensors"], field: 'fracton_memory', level: 1, hint: "It is often connected to stability and change of basis." },
    // Time Crystal Sync Track (Needs ODEs / Discrete Math)
    { q: "What type of mathematical equation describes a system's change over time based on its current state, essential for modeling the dynamics of time crystals?", "a": "Ordinary Differential Equation (ODE)", "w": ["Partial Differential Equation (PDE)", "Boolean Logic Formula", "Group Relation"], field: 'time_crystal_sync', level: 1, hint: "It involves derivatives of a function with respect to only one variable (time)." },
    // Fusion/MHD Control Track (Needs Multivariable Calculus)
    { q: "Which mathematical concept is used to describe the gradient, divergence, and curl of physical fields (like magnetic fields in plasma)?", "a": "Vector Calculus (Multivariable Calculus)", "w": ["Discrete Math", "Abstract Algebra", "Non-Euclidean Geometry"], field: 'fusion_mhd_control', level: 1, hint: "It extends single-variable calculus to multiple variables." },
    // Holographic Encoding Track (Needs Logic / Information Theory)
    { q: "What mathematical law dictates that information cannot be created or destroyed, only encoded or transferred, a base principle of holographic error correction?", "a": "Law of Conservation of Information", "w": ["AdS/CFT Correspondence", "Ryu-Takayanagi Formula", "Landauer's Principle"], field: 'holographic_encoding', level: 1, hint: "This applies to any closed system of data." },

    // --- LEVEL 2: CORE DBE CONCEPTS (Phase 2 & 3 Topics) ---
    [cite_start]{ q: "What property of Majorana zero modes is crucial for building inherently fault-tolerant qubits?", "a": "They are their own antiparticles and are encoded non-locally.", "w": ["They have a large energy gap.", "They only exist in 3D lattices.", "They obey abelian statistics."], field: 'topological_q_computing', level: 2, hint: "The information is stored in a degenerate ground state spread across the system[cite: 94]." },
    [cite_start]{ q: "The primary defense mechanism of a Fracton topological code (like Haah's cubic code) against local errors is based on:", "a": "The immobility or restricted mobility of its quasiparticle excitations.", "w": ["Its large energy gap.", "Its ability to correct errors over time.", "Its high degree of redundancy in 2D."], field: 'fracton_memory', level: 2, hint: "Isolated excitations (fractons) are strictly stuck in place[cite: 128]." },
    [cite_start]{ q: "A Floquet Time Crystal breaks which symmetry?", "a": "Discrete Time-Translation Symmetry (DTTS).", "w": ["Spatial Translation Symmetry.", "Gauge Symmetry.", "Lorentz Symmetry."], field: 'time_crystal_sync', level: 2, hint: "The observable properties oscillate with a fixed period without any external periodic drive corresponding to that frequency[cite: 164]." },
    [cite_start]{ q: "In fusion plasma control, what physical mechanism does the DBE primarily aim to predict and suppress in real-time to stabilize the reactor?", "a": "Turbulence and magnetohydrodynamic (MHD) instabilities like tearing modes.", "w": ["Thermal runaway.", "Nuclear decay of fusion products.", "Neutron absorption rates."], field: 'fusion_mhd_control', level: 2, hint: "The goal is to solve plasma's equations of motion orders of magnitude faster than classical computers, predicting instabilities before they grow[cite: 210]." },
    [cite_start]{ q: "The connection between holographic encoding and quantum error correction stems from which principle?", "a": "Information about the bulk (interior) being redundantly encoded on the boundary.", "w": ["The ability to exceed the speed of light.", "The uncertainty principle in time-space.", "The non-local nature of gravity."], field: 'holographic_encoding', level: 2, hint: "This principle mirrors how local damage on the boundary doesn't destroy the information about the bulk[cite: 269]." },

    // --- LEVEL 3: ADVANCED DBE ARCHITECTURE (Phase 4 Logic) ---
    [cite_start]{ q: "The DBE aims to improve fusion energy gain by up to 1000x through predictive reconfiguration of which physical structure?", "a": "Magnetic fields (magnetic topology).", "w": ["Fuel injection sequence.", "Reactor wall material.", "Quantum error correction codes."], field: 'fusion_mhd_control', level: 3, hint: "This involves actively controlling the 'magnetic topology' of the plasma[cite: 242]." },
    [cite_start]{ q: "Fracton memory codes evade 'no-go' theorems that limit 2D self-correcting quantum memory by instead sacrificing which particle property?", "a": "Particle mobility.", "w": ["Particle mass.", "Particle spin.", "Particle parity."], field: 'fracton_memory', level: 3, hint: "They sacrifice particle mobility to evade 2D no-go theorems[cite: 143]." },
    [cite_start]{ q: "The unitary operator for braiding two Majorana zero modes can be expressed mathematically as:", "a": "$$U_{ij}=e^{\frac{\pi}{4}\gamma_i \gamma_j}$$", "w": ["$$H\Psi = E\Psi$$", "$$F_{\mu\nu} = \partial_\mu A_\nu - \partial_\nu A_\mu$$", "$$G_{\mu\nu} = 8\pi G T_{\mu\nu}$$"], field: 'topological_q_computing', level: 3, hint: "This transformation yields a rotation in the qubit subspace rather than a simple phase[cite: 100, 105]." },
    [cite_start]{ q: "In the context of the DBE, what key feature of a topologically ordered time crystal enhances its robustness?", "a": "Its oscillations reside in non-local, logical operators, making them insensitive to local noise.", "w": ["It runs on zero power.", "It can exist at finite temperature.", "It uses only Abelian anyons."], field: 'time_crystal_sync', level: 3, hint: "The oscillation was a topologically protected pattern[cite: 185]." },
    [cite_start]{ q: "In holographic encoding (AdS/CFT inspired tensor networks), the entropy of the bulk is proportional to the:", "a": "Surface area of the boundary (Ryu-Takayanagi formula).", "w": ["Volume of the bulk.", "Total energy of the system.", "Number of qubits on the boundary."], field: 'holographic_encoding', level: 3, hint: "This result suggests a kind of data compression[cite: 278, 279]." }
];
