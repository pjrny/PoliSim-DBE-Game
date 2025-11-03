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
export const QUIZ_BANK = [
    // Topological Q-Computing / Majorana Braids
    ["What property of Majorana zero modes is crucial for building inherently fault-tolerant qubits?", "They are their own antiparticles and are encoded non-locally.", ["They have a large energy gap.", "They only exist in 3D lattices.", "They obey abelian statistics."], 'topological_q_computing'],
    ["In the context of topological quantum computing, what operation performs quantum logic gates?", "Braiding of non-Abelian anyons.", ["Applying precise microwave pulses.", "Measuring collective parity instantly.", "Lowering the system temperature."], 'topological_q_computing'],
    
    // Fracton Memory / Fracton Codes
    ["The primary defense mechanism of a Fracton topological code (like Haah's cubic code) against local errors is based on:", "The immobility or restricted mobility of its quasiparticle excitations.", ["Its large energy gap.", "Its ability to correct errors over time.", "Its high degree of redundancy in 2D."], 'fracton_memory'],
    ["The logical operators in Haah's cubic code must have what type of structure?", "A fractal, self-similar pattern spanning the volume.", ["A simple closed loop on the lattice.", "A short, linear string of operators.", "A single-site Pauli operator."], 'fracton_memory'],
    
    // Time Crystal Sync / Floquet Dynamics
    ["A Floquet Time Crystal breaks which symmetry?", "Discrete Time-Translation Symmetry (DTTS).", ["Spatial Translation Symmetry.", "Gauge Symmetry.", "Lorentz Symmetry."], 'time_crystal_sync'],
    ["For the DBE, the purpose of the Time Crystal is primarily to provide a robust:", "Internal synchronization clock (metronome) for complex operations.", ["Method for temporal energy storage.", "Way to simulate black hole dynamics.", "Fault-tolerant memory layer."], 'time_crystal_sync'],
    
    // Fusion/MHD Control / Plasma Physics
    ["In fusion plasma control, what physical mechanism does the DBE primarily aim to predict and suppress in real-time to stabilize the reactor?", "Turbulence and magnetohydrodynamic (MHD) instabilities like tearing modes.", ["Thermal runaway.", "Nuclear decay of fusion products.", "Neutron absorption rates."], 'fusion_mhd_control'],
    ["The goal of Real-Time Fusion Plasma Feedback Control is to 'sculpt' the plasma by quickly adjusting which component of the reactor?", "The magnetic field topology via auxiliary coils.", ["The fuel injection rate.", "The temperature of the cryostat.", "The rotation speed of the flywheel."], 'fusion_mhd_control'],

    // Holographic Encoding / AdS/CFT Tensor Networks
    ["The connection between holographic encoding and quantum error correction stems from which principle?", "Information about the bulk (interior) being redundantly encoded on the boundary.", ["The ability to exceed the speed of light.", "The uncertainty principle in time-space.", "The non-local nature of gravity."], 'holographic_encoding'],
    ["In the L&P vision, holographic encoding could be used to compress massive data sets, such as a full human brain simulation or 3D plasma state, based on the proportionality between entropy and:", "Surface area rather than volume.", ["Information density.", "System temperature.", "Quantum wave function collapse."], 'holographic_encoding']
];
