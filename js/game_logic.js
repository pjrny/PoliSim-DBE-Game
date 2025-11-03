// game_logic.js - The PoliSim-DBE Core Engine

import { INITIAL_STATE, DBE_CONSTANTS, ECONOMIC_MODEL, QUIZ_BANK } from './db_data.js';

// --- Global State and Initialization ---
let gameState = {};
let availableQuestions = [...QUIZ_BANK]; // Copy for the session
const LOCAL_STORAGE_KEY = 'poliSimDbeGame';

document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
    loadGame();
    setupEventListeners();
    updateUI();
    showQuizArea();
}

// --- 1. Persistence (Save/Load) ---
function loadGame() {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
        gameState = JSON.parse(savedState);
    } else {
        gameState = INITIAL_STATE;
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

    for (const rank of DBE_CONSTANTS.POLITICAL_RANKS) {
        if (totalXP >= rank.min_xp) {
            currentRank = rank.rank;
            newScore = rank.score;
        }
    }
    
    gameState.politicalLevel = currentRank;
    gameState.politicalLevelScore = newScore;
}

function updateVotingWeight() {
    const totalXP = calculateTotalXP();
    const maxPossibleXP = Object.keys(gameState.expertise).length * DBE_CONSTANTS.VOTE_GATE * 2; // Arbitrary max to show ratio
    
    // Expertise Multiplier: Sum of all XP / (Max XP possible at Level 10)
    const expertiseMultiplier = totalXP / maxPossibleXP;

    // Wealth Factor: ln(NetWorth) / ln(1 Trillion)
    const wealthFactor = Math.log(gameState.netWorth) / DBE_CONSTANTS.TRILLION_LOG_BASE;

    // Total Weight: Political Score * (Expertise Multiplier + Wealth Factor)
    const votingWeight = gameState.politicalLevelScore * (expertiseMultiplier + wealthFactor);
    
    return votingWeight.toFixed(2);
}

function advanceTime() {
    if (gameState.currentYear >= gameState.maxYear) return;

    // 1. Advance Year
    gameState.currentYear++;

    // 2. Compound Wealth (The Trillionaire Goal)
    gameState.netWorth *= (1 + gameState.wealthGrowthRate);
    
    // 3. Run Economic Simulation (Integrate DBE impacts)
    runEconomicSimulation();

    // 4. Update UI and Save
    updateUI();
    saveGame();
}

function runEconomicSimulation() {
    const model = ECONOMIC_MODEL;
    const state = gameState;
    const impact = model.dbe_impact;
    
    for (const metricKey in model.metrics) {
        let metric = model.metrics[metricKey];
        let drift = metric.historical_drift; // Start with historical trend
        
        // Apply permanent DBE deployment impacts as compounding annual multipliers
        for (const dbeKey in state.dbe_deployment) {
            if (state.dbe_deployment[dbeKey] && impact[dbeKey][metricKey]) {
                drift *= impact[dbeKey][metricKey];
            }
        }

        // Apply final drift (historical + DBE impact)
        metric.current *= drift;

        // Special handling for GDP (percentage needs to be reset yearly if we track rate)
        if (metricKey === 'gdp_growth') {
             // For simplicity, we assume GDP Growth rate carries over the DBE multiplier influence but not historical drift after a deployment.
             if (Object.values(state.dbe_deployment).some(d => d)) {
                 metric.current = metric.initial * drift; // Re-calculate based on initial + accumulated multiplier
             }
        }

        // Update main state metric
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
    
    // Expertise & Deployment Status
    const expertiseList = document.getElementById('expertise-status');
    expertiseList.innerHTML = '';
    for (const field in gameState.expertise) {
        const xp = gameState.expertise[field];
        const isDeployed = gameState.dbe_deployment[field + '_deployed'];
        const deployStatus = isDeployed ? '✅ Deployed' : (xp >= DBE_CONSTANTS.VOTE_GATE ? '🗳️ Ready to Vote' : '❌ Researching');
        
        const li = document.createElement('li');
        li.textContent = `${field.replace(/_/g, ' ')} (XP: ${xp}) - ${deployStatus}`;
        expertiseList.appendChild(li);

        // Show vote button if ready
        const buttonId = `vote-${field}`;
        const existingButton = document.getElementById(buttonId);
        if (xp >= DBE_CONSTANTS.VOTE_GATE && !isDeployed && !existingButton) {
            const voteButton = document.createElement('button');
            voteButton.id = buttonId;
            voteButton.textContent = `VOTE: Deploy ${field.replace(/_/g, ' ')}`;
            voteButton.onclick = () => attemptDeployment(field);
            document.getElementById('dbe-deployment-area').appendChild(voteButton);
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
}


// --- 4. Quiz Engine ---
function showQuizArea() {
    const quizArea = document.getElementById('quiz-area');
    if (availableQuestions.length === 0) {
        quizArea.innerHTML = '<p>No more new quiz questions for now! Try advancing time or deploying more systems.</p>';
        return;
    }

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    const [question, correct, wrongs, field] = availableQuestions[questionIndex];
    
    quizArea.dataset.currentQuestionIndex = questionIndex;
    quizArea.dataset.correctAnswer = correct;
    quizArea.dataset.associatedField = field;

    // Combine and shuffle answers
    const answers = [correct, ...wrongs].sort(() => Math.random() - 0.5);

    let html = `
        <h3>PHD Curriculum Quiz (Field: ${field.replace(/_/g, ' ')})</h3>
        <p>${question}</p>
        <div id="answers-container">
            ${answers.map(ans => `<button class="answer-button">${ans}</button>`).join('')}
        </div>
        <p id="quiz-feedback" class="feedback-neutral"></p>
    `;
    quizArea.innerHTML = html;
    
    document.querySelectorAll('.answer-button').forEach(button => {
        button.addEventListener('click', handleAnswerClick);
    });
}

function handleAnswerClick(event) {
    const selectedAnswer = event.target.textContent;
    const quizArea = document.getElementById('quiz-area');
    const correctAnswer = quizArea.dataset.correctAnswer;
    const field = quizArea.dataset.associatedField;
    const questionIndex = parseInt(quizArea.dataset.currentQuestionIndex);
    const feedback = document.getElementById('quiz-feedback');

    document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = true);

    if (selectedAnswer === correctAnswer) {
        feedback.textContent = `Correct! Gained ${DBE_CONSTANTS.XP_PER_ANSWER} XP in ${field.replace(/_/g, ' ')}.`;
        feedback.className = 'feedback-correct';
        
        // 1. Grant XP and Wealth
        gameState.expertise[field] += DBE_CONSTANTS.XP_PER_ANSWER;
        gameState.netWorth += DBE_CONSTANTS.XP_PER_ANSWER * 10000; // $10k per XP as starting investment
        
        // 2. Remove question to prevent repetition in this session
        availableQuestions.splice(questionIndex, 1);
        
        // 3. Update Progression
        updatePoliticalRank();
        
        // 4. Queue next quiz and update UI
        setTimeout(() => {
            showQuizArea();
            updateUI();
            saveGame();
        }, 1500);

    } else {
        feedback.textContent = `Incorrect. The correct answer was: ${correctAnswer}. Study the DBE documents!`;
        feedback.className = 'feedback-incorrect';
        
        // Allow user to try another quiz
        setTimeout(() => {
            showQuizArea();
            document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = false);
        }, 3000);
    }
}

// --- 5. Deployment/Voting System ---
function attemptDeployment(field) {
    const deploymentStatus = gameState.dbe_deployment[field + '_deployed'];
    if (deploymentStatus) return; // Already deployed

    const requiredXP = DBE_CONSTANTS.VOTE_GATE;
    const userXP = gameState.expertise[field];

    if (userXP < requiredXP) {
        alert(`You need ${requiredXP} XP in ${field.replace(/_/g, ' ')} to initiate the vote.`);
        return;
    }
    
    // Simulated Vote Outcome
    const requiredWeight = 2.0; // Arbitrary difficulty target
    const userWeight = parseFloat(updateVotingWeight());
    const passProbability = Math.min(1, userWeight / requiredWeight); // Higher weight = higher probability

    if (Math.random() < passProbability) {
        // Vote Passed!
        gameState.dbe_deployment[field + '_deployed'] = true;
        alert(`VOTE SUCCESSFUL! The ${field.replace(/_/g, ' ')} Subsystem is now deployed. This will have a permanent positive impact on the US economy and society.`);
        
        // Advance time to see immediate impact
        advanceTime(); 
    } else {
        // Vote Failed (but deployment ability remains)
        alert(`VOTE FAILED. Your current influence (Weight: ${userWeight.toFixed(2)}) was not enough. Required success probability was ${passProbability.toFixed(2)}. Gain more expertise and wealth to increase your weight!`);
    }
    
    updateUI();
    saveGame();
}

// --- 6. Event Listeners and Setup ---
function setupEventListeners() {
    document.getElementById('advance-time-button').addEventListener('click', advanceTime);
    document.getElementById('reset-game-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress?')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            window.location.reload();
        }
    });
}
