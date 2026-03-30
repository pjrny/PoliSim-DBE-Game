// js/game_logic.js - The PoliSim-DBE Core Engine

import { INITIAL_STATE, DBE_CONSTANTS, ECONOMIC_MODEL, POLICY_IMPACTS, QUIZ_BANK, RUNTIME_CONFIG } from './db_data.js';

// --- Global State and Initialization ---
let gameState = {};
const LOCAL_STORAGE_KEY = 'poliSimDbeGame';

// New global state variables for the 3-chance quiz logic
let currentQuestion = null;
let currentAttempts = 0;


async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getPolicyIntensity(value) {
    return Math.max(0, Math.min(1, Number(value || 0) / 100));
}

document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
    loadGame();
    setupEventListeners();
    updateUI();
    renderPolicyBoard();
    showQuizArea();
}

// --- 1. Persistence (Save/Load) ---
function loadGame() {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
        gameState = JSON.parse(savedState);
        if (!gameState.quiz_history) gameState.quiz_history = [];
        if (!gameState.policy_platform) gameState.policy_platform = structuredClone(INITIAL_STATE.policy_platform);
    } else {
        gameState = structuredClone(INITIAL_STATE);
        gameState.quiz_history = [];
    }
}

function saveGame() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
}

// --- 2. Core Logic and Progression ---
function calculateTotalXP() {
    return Object.values(gameState.expertise).reduce((sum, xp) => sum + xp, 0);
}

function updatePoliticalRank() {
    const totalXP = calculateTotalXP();
    let currentRank = gameState.politicalLevel;
    let newScore = gameState.politicalLevelScore;

    // Use a stable sort to prioritize ranks by XP requirement
    const sortedRanks = [...DBE_CONSTANTS.POLITICAL_RANKS].sort((a, b) => b.min_xp - a.min_xp);

    for (const rank of sortedRanks) {
        if (totalXP >= rank.min_xp) {
            currentRank = rank.rank;
            newScore = rank.score;
            break;
        }
    }
    
    gameState.politicalLevel = currentRank;
    gameState.politicalLevelScore = newScore;
}

function updateVotingWeight() {
    const totalXP = calculateTotalXP();
    const maxPossibleXP = Object.keys(gameState.expertise).length * DBE_CONSTANTS.VOTE_GATE; // Max XP needed for deployment
    
    // Expertise Multiplier: Sum of all XP / (Max XP needed for deployment)
    const expertiseMultiplier = Math.min(1.0, totalXP / maxPossibleXP);

    // Wealth Factor: ln(NetWorth) / ln(1 Trillion)
    const wealthFactor = Math.log(gameState.netWorth) / DBE_CONSTANTS.TRILLION_LOG_BASE;

    // Total Weight: Political Score * (1 + Expertise Multiplier + Wealth Factor)
    const votingWeight = gameState.politicalLevelScore * (1 + expertiseMultiplier + wealthFactor);
    
    return votingWeight.toFixed(2);
}

function runEconomicSimulation() {
    const model = ECONOMIC_MODEL;
    const state = gameState;
    const impact = model.dbe_impact;

    for (const metricKey in model.metrics) {
        const metric = model.metrics[metricKey];
        let drift = metric.historical_drift;

        // Apply permanent DBE deployment impacts as compounding annual multipliers
        for (const dbeKey in state.dbe_deployment) {
            if (state.dbe_deployment[dbeKey] && impact[dbeKey] && impact[dbeKey][metricKey]) {
                drift *= impact[dbeKey][metricKey];
            }
        }

        // Apply party-platform effects from the user-defined manifesto levers.
        for (const policyKey in state.policy_platform) {
            if (!POLICY_IMPACTS[policyKey] || !POLICY_IMPACTS[policyKey][metricKey]) continue;
            const baseImpact = POLICY_IMPACTS[policyKey][metricKey];
            const intensity = getPolicyIntensity(state.policy_platform[policyKey]);
            const chaosModifier = 1 + (state.policy_platform.chaos_factor || 0) * 0.05;
            drift *= 1 + ((baseImpact - 1) * intensity * chaosModifier);
        }

        metric.current *= drift;
        model.metrics[metricKey].current = metric.current;
    }
}


// --- 3. UI and Display Functions ---
function updateUI() {
    // Basic Game Status
    document.getElementById('current-year').textContent = gameState.currentYear;
    document.getElementById('political-level').textContent = gameState.politicalLevel;
    document.getElementById('net-worth').textContent = `$${gameState.netWorth.toFixed(2)}`;
    document.getElementById('total-xp').textContent = calculateTotalXP();
    document.getElementById('voting-weight').textContent = updateVotingWeight();
    
    checkGameEnd();

    // Expertise & Deployment Status (Updated for Progress Bars)
    const expertiseGrid = document.getElementById('expertise-status');
    expertiseGrid.innerHTML = '';
    
    // Update Rank Info
    const totalXP = calculateTotalXP();
    document.getElementById('current-rank-display').textContent = gameState.politicalLevel;
    
    const nextRank = DBE_CONSTANTS.POLITICAL_RANKS.find(r => r.min_xp > totalXP);
    if (nextRank) {
        document.getElementById('next-rank-xp').textContent = nextRank.min_xp;
    } else {
        document.getElementById('next-rank-xp').textContent = 'MAXED';
    }


    for (const field in gameState.expertise) {
        const xp = gameState.expertise[field];
        const isDeployed = gameState.dbe_deployment[field + '_deployed'];
        const deployStatus = isDeployed ? '✅ Deployed' : (xp >= DBE_CONSTANTS.VOTE_GATE ? '🗳️ Ready to Vote' : `❌ Researching (Need ${DBE_CONSTANTS.VOTE_GATE} XP)`);
        
        const progressPercent = Math.min(100, (xp / DBE_CONSTANTS.VOTE_GATE) * 100);

        const item = document.createElement('div');
        item.className = 'expertise-item';
        item.innerHTML = `
            <div class="expertise-title">
                <span>${field.replace(/_/g, ' ')} (XP: ${xp})</span>
                <span>Status: ${deployStatus}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%;"></div>
            </div>
        `;
        expertiseGrid.appendChild(item);

        // Show vote button if ready
        const buttonId = `vote-${field}`;
        const existingButton = document.getElementById(buttonId);
        const deploymentArea = document.getElementById('dbe-deployment-area');

        if (xp >= DBE_CONSTANTS.VOTE_GATE && !isDeployed) {
             if (!existingButton) {
                const voteButton = document.createElement('button');
                voteButton.id = buttonId;
                voteButton.textContent = `VOTE: Deploy ${field.replace(/_/g, ' ')}`;
                voteButton.onclick = () => attemptDeployment(field);
                deploymentArea.appendChild(voteButton);
             }
        } else if (isDeployed && existingButton) {
             existingButton.remove();
        }
    }

    // Economic Dashboard
    const econMetrics = ECONOMIC_MODEL.metrics;
    document.getElementById('debt-gdp-current').textContent = `${econMetrics.debt_gdp.current.toFixed(2)}${econMetrics.debt_gdp.unit}`;
    document.getElementById('gdp-growth-current').textContent = `${econMetrics.gdp_growth.current.toFixed(2)}${econMetrics.gdp_growth.unit}`;
    document.getElementById('homelessness-current').textContent = `${econMetrics.homelessness_k.current.toFixed(2)}${econMetrics.homelessness_k.unit}`;
    document.getElementById('defense-spending-current').textContent = `${econMetrics.defense_spending_gdp.current.toFixed(2)}${econMetrics.defense_spending_gdp.unit}`;
    document.getElementById('trust-index-current').textContent = `${econMetrics.trust_index.current.toFixed(2)}${econMetrics.trust_index.unit}`;
    document.getElementById('civil-liberties-current').textContent = `${econMetrics.civil_liberty_index.current.toFixed(2)}${econMetrics.civil_liberty_index.unit}`;
    document.getElementById('cyber-capacity-current').textContent = `${econMetrics.cyber_capacity.current.toFixed(2)}${econMetrics.cyber_capacity.unit}`;
}


// --- 4. Quiz Engine (3-Chance System) ---

function getAvailableQuestions() {
    const totalXP = calculateTotalXP();
    
    // Determine the max level the player can access (Current XP / XP_PER_LEVEL)
    const currentMaxLevel = Math.min(3, Math.floor(totalXP / DBE_CONSTANTS.XP_PER_LEVEL) + 1);

    // Filter questions: hasn't been answered correctly (not in history) AND is at or below the max level
    return QUIZ_BANK.filter(q => 
        !gameState.quiz_history.includes(q.q) && 
        q.level <= currentMaxLevel
    );
}

function showQuizArea() {
    const quizArea = document.getElementById('quiz-area');
    const questionPool = getAvailableQuestions();

    if (questionPool.length === 0) {
        quizArea.innerHTML = '<p>No new curriculum questions are available. You may need to **Advance Time (1 Year)** to unlock the next level, or increase your Total XP to unlock higher difficulty tiers!</p>';
        currentQuestion = null;
        return;
    }
    
    // Select the question
    const questionIndex = Math.floor(Math.random() * questionPool.length);
    currentQuestion = questionPool[questionIndex];
    currentAttempts = 0; // Reset attempts for the new question

    const answers = [currentQuestion.a, ...currentQuestion.w].sort(() => Math.random() - 0.5);

    let html = `
        <h3>PHD Curriculum Quiz (Level ${currentQuestion.level} - Field: ${currentQuestion.field.replace(/_/g, ' ')})</h3>
        <p>Attempt ${currentAttempts + 1} of 3</p>
        <p>${currentQuestion.q}</p>
        <div id="answers-container">
            ${answers.map(ans => `<button class="answer-button">${ans}</button>`).join('')}
        </div>
        <p id="quiz-hint" class="feedback-neutral"></p>
        <p id="quiz-feedback" class="feedback-neutral"></p>
    `;
    quizArea.innerHTML = html;
    
    document.querySelectorAll('.answer-button').forEach(button => {
        button.addEventListener('click', handleAnswerClick);
    });
}

function handleAnswerClick(event) {
    if (!currentQuestion) return; 

    const selectedAnswer = event.target.textContent;
    const feedback = document.getElementById('quiz-feedback');
    const hintArea = document.getElementById('quiz-hint');
    const field = currentQuestion.field;
    
    document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = true);
    currentAttempts++;

    if (selectedAnswer === currentQuestion.a) {
        // --- CORRECT ANSWER LOGIC ---
        feedback.textContent = `Correct! Gained ${DBE_CONSTANTS.XP_PER_ANSWER} XP in ${field.replace(/_/g, ' ')}.`;
        feedback.className = 'feedback-correct';
        
        // 1. Grant XP and Wealth (Wealth is now weighted by political score)
        gameState.expertise[field] += DBE_CONSTANTS.XP_PER_ANSWER;
        gameState.netWorth += DBE_CONSTANTS.XP_PER_ANSWER * 10000 * gameState.politicalLevelScore; 
        gameState.quiz_history.push(currentQuestion.q); // Mark as correctly answered
        
        // 2. Update Progression
        updatePoliticalRank();
        
        // 3. Queue next quiz and update UI
        setTimeout(() => {
            currentQuestion = null;
            showQuizArea();
            updateUI();
            saveGame();
        }, 2000);

    } else {
        // --- INCORRECT ANSWER LOGIC (3 CHANCES) ---
        if (currentAttempts < 3) {
            // Hint Logic
            feedback.textContent = `Incorrect. Attempt ${currentAttempts + 1} of 3 remaining.`;
            feedback.className = 'feedback-incorrect';
            hintArea.textContent = `HINT: ${currentQuestion.hint}`;
            hintArea.className = 'hint-visible';
            
            // Re-enable buttons for next try
            document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = false);
            
        } else {
            // Final Attempt Logic - Reveal Answer, No XP Granted
            feedback.textContent = `Final attempt failed. The correct answer was: ${currentQuestion.a}. Study this concept and move to the next question.`;
            feedback.className = 'feedback-failure';
            hintArea.className = 'feedback-neutral'; // Hide hint
            
            // Queue next question (marks as seen/failed, but removed from current pool)
            gameState.quiz_history.push(currentQuestion.q); 

            setTimeout(() => {
                currentQuestion = null;
                showQuizArea();
                updateUI();
                saveGame();
            }, 5000);
        }
    }
}

// --- 5. Deployment/Voting System ---
function attemptDeployment(field) {
    const isDeployed = gameState.dbe_deployment[field + '_deployed'];
    if (isDeployed) return; // Already deployed

    const requiredXP = DBE_CONSTANTS.VOTE_GATE;
    const userXP = gameState.expertise[field];

    if (userXP < requiredXP) {
        // This should not happen if the UI is correct, but kept for robustness
        alert(`You need ${requiredXP} XP in ${field.replace(/_/g, ' ')} to initiate the vote.`);
        return;
    }
    
    // Simulated Vote Outcome
    const requiredWeight = 5.0; // Base difficulty target for first deployment
    const userWeight = parseFloat(updateVotingWeight());
    const passProbability = Math.min(0.99, userWeight / requiredWeight); // Capped at 99%

    if (Math.random() < passProbability) {
        // Vote Passed!
        gameState.dbe_deployment[field + '_deployed'] = true;
        alert(`VOTE SUCCESSFUL! The ${field.replace(/_/g, ' ')} Subsystem is now deployed. This will have a permanent positive impact on the US economy and society.`);
        
        // Advance time to see immediate impact
        advanceTime(); 
    } else {
        // Vote Failed (but deployment ability remains)
        alert(`VOTE FAILED. Your current influence (Weight: ${userWeight.toFixed(2)}) resulted in a ${passProbability.toFixed(2)} probability, but the motion did not pass the Technocracy Vote. Gain more expertise and wealth to increase your weight!`);
    }
    
    updateUI();
    saveGame();
}

// --- 6. Time and Game End ---

function advanceTime() {
    if (gameState.currentYear >= gameState.maxYear) {
        checkGameEnd();
        return;
    }

    // 1. Advance Year
    gameState.currentYear++;

    // 2. Compound Wealth (The Trillionaire Goal)
    gameState.netWorth *= (1 + gameState.wealthGrowthRate);

    // 3. Dynamic Question Pool Refresh (Refresh after every year)
    // Keep a small slice of recent history, then clear the rest to reset the pool
    gameState.quiz_history = gameState.quiz_history.slice(-5); 
    
    // 4. Run Economic Simulation
    runEconomicSimulation();

    // 5. Check End Game
    checkGameEnd();

    // 6. Update UI and Save
    updateUI();
    renderPolicyBoard();
    showQuizArea();
    saveGame();
}

function checkGameEnd() {
    const isEndYear = gameState.currentYear >= gameState.maxYear;
    const allDeployed = Object.values(gameState.dbe_deployment).every(d => d);
    const isPresident = gameState.politicalLevel === 'President';
    const isTrillionaire = gameState.netWorth >= 1000000000000;
    
    if (isEndYear || (allDeployed && isPresident)) {
        let message = '';
        let title = '';
        
        if (allDeployed && isPresident) {
            title = 'COSMIC VICTORY ACHIEVED!';
            message = `You achieved the rank of President and successfully deployed all 5 DBE Subsystems by ${gameState.currentYear}. The US is now on a path to a post-scarcity future!`;
            if (isTrillionaire) {
                message += ` You also achieved the secondary goal, becoming the world's first Trillionaire Scientist!`;
            }
        } else {
            title = 'TIME ELAPSED: SIMULATION ENDED.';
            message = `The year is ${gameState.maxYear}. You did not meet the full win conditions. Final Rank: ${gameState.politicalLevel}. DBEs Deployed: ${Object.values(gameState.dbe_deployment).filter(d => d).length}/5. Net Worth: $${gameState.netWorth.toFixed(2)}`;
        }

        document.getElementById('game-over-screen').style.display = 'flex';
        document.getElementById('game-over-screen').innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
            <button onclick="window.location.reload()">Start New Simulation</button>
        `;
        return true;
    }
    return false;
}



function renderPolicyBoard() {
    const board = document.getElementById('policy-input-board');
    if (!board || !gameState.policy_platform) return;

    const labels = {
        chaos_factor: 'Chaos Factor (%)',
        vat_rate: 'VAT Shift',
        military_reallocation: 'Military → Cyber/Health/Science',
        vice_legalization: 'Legalize/Regulate Vice Markets',
        church_taxation: 'Church/Nonprofit Taxation',
        owner_occupancy_push: 'Owner-Occupancy Housing Push',
        direct_democracy: 'Direct Voting + Policy Quiz',
        technocracy_branch: '4th Technocracy Branch',
        immigration_openness: 'Open Immigration + Fast Deportation',
        welfare_cash_shift: 'Cash-Equivalent Welfare',
        apprenticeship_shift: 'Apprenticeship over Degree',
        year_round_schooling: 'Year-Round Schooling',
        civil_liberties_floor: 'Civil Liberties Safeguard'
    };

    board.innerHTML = '';
    for (const key of Object.keys(gameState.policy_platform)) {
        const value = gameState.policy_platform[key];
        const wrap = document.createElement('label');
        wrap.className = 'policy-control';
        wrap.innerHTML = `
            <span>${labels[key] || key}</span>
            <input type="range" min="0" max="100" step="5" value="${Math.round(value * (key === 'chaos_factor' ? 100 : 1))}" data-policy-key="${key}" />
            <strong id="policy-value-${key}">${Math.round(value * (key === 'chaos_factor' ? 100 : 1))}%</strong>
        `;
        board.appendChild(wrap);
    }

    board.querySelectorAll('input[data-policy-key]').forEach((input) => {
        input.addEventListener('input', (e) => {
            const key = e.target.dataset.policyKey;
            const raw = Number(e.target.value);
            gameState.policy_platform[key] = key === 'chaos_factor' ? raw / 100 : raw;
            const v = document.getElementById(`policy-value-${key}`);
            if (v) v.textContent = `${raw}%`;
            saveGame();
        });
    });
}

async function setupEnvironmentPanel() {
    const saveBtn = document.getElementById('save-env-button');
    if (!saveBtn) return;

    const status = document.getElementById('env-status');
    const local = JSON.parse(localStorage.getItem('poliSimEnvConfig') || '{}');
    if (local.OPENBB_API_KEY) {
        document.getElementById('openbb-api-key').value = local.OPENBB_API_KEY;
    }

    saveBtn.addEventListener('click', async () => {
        const openbb = document.getElementById('openbb-api-key').value.trim();
        const secureCode = document.getElementById('secure-code').value.trim();
        const secureHash = await sha256(secureCode);
        const expectedHash = local.SECURE_CODE_HASH || RUNTIME_CONFIG.SECURE_CODE_HASH || secureHash;
        const expectedApi = RUNTIME_CONFIG.OPENBB_API_KEY || local.OPENBB_API_KEY || openbb;

        const unlocked = !!openbb && !!secureCode && secureHash === expectedHash && openbb === expectedApi;
        if (unlocked) {
            status.textContent = 'Unlocked: historical calibration and admin controls are enabled.';
            status.className = 'feedback-correct';
        } else {
            status.textContent = 'Locked: check OPENBB_API_KEY and SECURE_CODE.';
            status.className = 'feedback-incorrect';
        }

        localStorage.setItem('poliSimEnvConfig', JSON.stringify({
            OPENBB_API_KEY: openbb,
            SECURE_CODE_HASH: expectedHash
        }));
    });
}

// --- 7. Event Listeners and Setup ---
function setupEventListeners() {
    document.getElementById('advance-time-button').addEventListener('click', advanceTime);
    document.getElementById('reset-game-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress? This action cannot be undone.')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            window.location.reload();
        }
    });
}
