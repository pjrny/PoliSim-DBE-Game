// db_data.js - The PoliSim-DBE Knowledge Base

// --- 1. INITIAL GAME & PLAYER STATE (Starting in Jan 2007, post-2006 midterms) ---
export const INITIAL_STATE = {
    // Political/Time
    currentYear: 2007,
    maxYear: 2035,
    politicalLevel: 'Mayor',
    politicalLevelScore: 1.0,

    // Financial
    netWorth: 10000.00,
    wealthGrowthRate: 0.10,

    // Progression & Expertise
    expertise: {
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
    },

    // Player-controlled policy platform levers
    policy_platform: {
        chaos_factor: 0.10,
        vat_rate: 10,
        military_reallocation: 30,
        vice_legalization: 70,
        church_taxation: 50,
        owner_occupancy_push: 60,
        direct_democracy: 40,
        technocracy_branch: 60,
        immigration_openness: 70,
        welfare_cash_shift: 60,
        apprenticeship_shift: 70,
        year_round_schooling: 50,
        civil_liberties_floor: 40
    }
};

// --- 2. DBE AND PROGRESSION MODEL PARAMETERS ---
export const DBE_CONSTANTS = {
    VOTE_GATE: 5,
    XP_PER_ANSWER: 1,
    XP_PER_LEVEL: 5,
    POLITICAL_RANKS: [
        { rank: 'Mayor', min_xp: 0, score: 1.0 },
        { rank: 'Governor', min_xp: 15, score: 2.5 },
        { rank: 'President', min_xp: 30, score: 5.0 }
    ],
    TRILLION_LOG_BASE: Math.log(1000000000000)
};

// --- 3. Runtime configuration for private unlocks ---
// OPENBB_API_KEY should come from your OpenBB account portal.
// SECURE_CODE_HASH should be a SHA-256 hash of your chosen admin code.
export const RUNTIME_CONFIG = {
    OPENBB_API_KEY: '',
    SECURE_CODE_HASH: ''
};

// --- 4. ECONOMIC SIMULATION BASELINE (Starting 2006/2007 US data) ---
export const ECONOMIC_MODEL = {
    metrics: {
        debt_gdp: { initial: 65.0, current: 65.0, unit: '%', historical_drift: 1.025 },
        gdp_growth: { initial: 2.0, current: 2.0, unit: '%', historical_drift: 0.98 },
        homelessness_k: { initial: 650, current: 650, unit: 'k', historical_drift: 1.03 },
        defense_spending_gdp: { initial: 4.0, current: 4.0, unit: '%', historical_drift: 1.005 },
        trust_index: { initial: 50.0, current: 50.0, unit: '/100', historical_drift: 0.999 },
        civil_liberty_index: { initial: 70.0, current: 70.0, unit: '/100', historical_drift: 0.998 },
        cyber_capacity: { initial: 45.0, current: 45.0, unit: '/100', historical_drift: 1.01 }
    },
    dbe_impact: {
        fracton_memory_deployed: { debt_gdp: 0.95, annual_wealth_boost: 0.01 },
        holographic_encoding_deployed: { gdp_growth: 1.15 },
        fusion_mhd_control_deployed: { defense_spending_gdp: 0.80, cyber_capacity: 1.04 },
        topological_q_computing_deployed: { gdp_growth: 1.05, homelessness_k: 0.98 },
        time_crystal_sync_deployed: { homelessness_k: 0.95, gdp_growth: 1.02, trust_index: 1.01 }
    }
};

// --- 5. Party-policy impacts based on your manifesto inputs ---
export const POLICY_IMPACTS = {
    vat_rate: { debt_gdp: 0.996, gdp_growth: 0.999, trust_index: 0.999 },
    military_reallocation: { defense_spending_gdp: 0.992, cyber_capacity: 1.01, gdp_growth: 1.001 },
    vice_legalization: { trust_index: 1.002, homelessness_k: 0.999 },
    church_taxation: { debt_gdp: 0.998, trust_index: 0.998 },
    owner_occupancy_push: { homelessness_k: 0.997, gdp_growth: 0.999 },
    direct_democracy: { trust_index: 1.001, civil_liberty_index: 0.999 },
    technocracy_branch: { debt_gdp: 0.999, gdp_growth: 1.001, trust_index: 0.999 },
    immigration_openness: { gdp_growth: 1.001, trust_index: 0.999 },
    welfare_cash_shift: { homelessness_k: 0.997, debt_gdp: 1.001 },
    apprenticeship_shift: { gdp_growth: 1.001, homelessness_k: 0.999 },
    year_round_schooling: { gdp_growth: 1.001, civil_liberty_index: 0.999 },
    civil_liberties_floor: { civil_liberty_index: 1.001 }
};

export const QUIZ_BANK = [
    { q: "What mathematical field provides the foundation for topological quantum computing, focusing on properties preserved under continuous deformation?", a: "Topology", w: ["Linear Algebra", "Calculus", "Set Theory"], field: 'topological_q_computing', level: 1, hint: "It literally refers to the study of 'place' or 'surface'." },
    { q: "Which concept from linear algebra is essential for understanding the stability of error-correcting codes, describing vectors whose direction remains unchanged by a linear transformation?", a: "Eigenvectors", w: ["Basis Vectors", "Determinants", "Tensors"], field: 'fracton_memory', level: 1, hint: "It is often connected to stability and change of basis." },
    { q: "What type of mathematical equation describes a system's change over time based on its current state, essential for modeling the dynamics of time crystals?", a: "Ordinary Differential Equation (ODE)", w: ["Partial Differential Equation (PDE)", "Boolean Logic Formula", "Group Relation"], field: 'time_crystal_sync', level: 1, hint: "It involves derivatives of a function with respect to only one variable (time)." },
    { q: "Which mathematical concept is used to describe the gradient, divergence, and curl of physical fields (like magnetic fields in plasma)?", a: "Vector Calculus (Multivariable Calculus)", w: ["Discrete Math", "Abstract Algebra", "Non-Euclidean Geometry"], field: 'fusion_mhd_control', level: 1, hint: "It extends single-variable calculus to multiple variables." },
    { q: "What mathematical law dictates that information cannot be created or destroyed, only encoded or transferred, a base principle of holographic error correction?", a: "Law of Conservation of Information", w: ["AdS/CFT Correspondence", "Ryu-Takayanagi Formula", "Landauer's Principle"], field: 'holographic_encoding', level: 1, hint: "This applies to any closed system of data." },

    { q: "What property of Majorana zero modes is crucial for building inherently fault-tolerant qubits?", a: "They are their own antiparticles and are encoded non-locally.", w: ["They have a large energy gap.", "They only exist in 3D lattices.", "They obey abelian statistics."], field: 'topological_q_computing', level: 2, hint: "The information is stored in a degenerate ground state spread across the system." },
    { q: "The primary defense mechanism of a Fracton topological code (like Haah's cubic code) against local errors is based on:", a: "The immobility or restricted mobility of its quasiparticle excitations.", w: ["Its large energy gap.", "Its ability to correct errors over time.", "Its high degree of redundancy in 2D."], field: 'fracton_memory', level: 2, hint: "Isolated excitations (fractons) are strictly stuck in place." },
    { q: "A Floquet Time Crystal breaks which symmetry?", a: "Discrete Time-Translation Symmetry (DTTS).", w: ["Spatial Translation Symmetry.", "Gauge Symmetry.", "Lorentz Symmetry."], field: 'time_crystal_sync', level: 2, hint: "The observable properties oscillate with a fixed period." },
    { q: "In fusion plasma control, what physical mechanism does the DBE primarily aim to predict and suppress in real-time to stabilize the reactor?", a: "Turbulence and magnetohydrodynamic (MHD) instabilities like tearing modes.", w: ["Thermal runaway.", "Nuclear decay of fusion products.", "Neutron absorption rates."], field: 'fusion_mhd_control', level: 2, hint: "The goal is to predict instabilities before they grow." },
    { q: "The connection between holographic encoding and quantum error correction stems from which principle?", a: "Information about the bulk (interior) being redundantly encoded on the boundary.", w: ["The ability to exceed the speed of light.", "The uncertainty principle in time-space.", "The non-local nature of gravity."], field: 'holographic_encoding', level: 2, hint: "Local damage on the boundary should not erase bulk information." },

    { q: "The DBE aims to improve fusion energy gain by up to 1000x through predictive reconfiguration of which physical structure?", a: "Magnetic fields (magnetic topology).", w: ["Fuel injection sequence.", "Reactor wall material.", "Quantum error correction codes."], field: 'fusion_mhd_control', level: 3, hint: "This involves actively controlling magnetic topology." },
    { q: "Fracton memory codes evade 'no-go' theorems that limit 2D self-correcting quantum memory by instead sacrificing which particle property?", a: "Particle mobility.", w: ["Particle mass.", "Particle spin.", "Particle parity."], field: 'fracton_memory', level: 3, hint: "They sacrifice mobility to evade 2D limits." },
    { q: "The unitary operator for braiding two Majorana zero modes can be expressed mathematically as:", a: "$$U_{ij}=e^{\\frac{\\pi}{4}\\gamma_i \\gamma_j}$$", w: ["$$H\\Psi = E\\Psi$$", "$$F_{\\mu\\nu} = \\partial_\\mu A_\\nu - \\partial_\\nu A_\\mu$$", "$$G_{\\mu\\nu} = 8\\pi G T_{\\mu\\nu}$$"], field: 'topological_q_computing', level: 3, hint: "This transformation yields a qubit subspace rotation." },
    { q: "In the context of the DBE, what key feature of a topologically ordered time crystal enhances its robustness?", a: "Its oscillations reside in non-local, logical operators, making them insensitive to local noise.", w: ["It runs on zero power.", "It can exist at finite temperature.", "It uses only Abelian anyons."], field: 'time_crystal_sync', level: 3, hint: "The oscillation is topologically protected." },
    { q: "In holographic encoding (AdS/CFT inspired tensor networks), the entropy of the bulk is proportional to the:", a: "Surface area of the boundary (Ryu-Takayanagi formula).", w: ["Volume of the bulk.", "Total energy of the system.", "Number of qubits on the boundary."], field: 'holographic_encoding', level: 3, hint: "This result suggests geometric data compression." }
];
