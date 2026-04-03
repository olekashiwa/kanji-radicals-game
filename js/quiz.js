// js/quiz.js
import { appState } from './state.js';
import { updateUserStats } from './auth.js';
import { shuffleArray, showToast } from './utils.js';
import { CONFIG } from './constants.js';
import { DrawingTest } from './drawing.js';

// ========== СОСТОЯНИЕ КВИЗА ==========
let quizState = {
    mode: CONFIG.QUIZ_MODES.MEANING,
    questions: [],
    currentIndex: 0,
    correct: 0,
    total: 0,
    answered: false,
    pointsEarned: 0
};

let quizContainer = null;
let drawingTest = null;

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function updateStatsDisplay() {
    const totalCountEl = document.getElementById('totalCount');
    const correctCountEl = document.getElementById('correctCount');
    const quizPointsEl = document.getElementById('quizPoints');
    const quizProgressFill = document.getElementById('quizProgressFill');
    
    if (totalCountEl) totalCountEl.innerText = quizState.questions.length;
    if (correctCountEl) correctCountEl.innerText = quizState.correct;
    if (quizPointsEl) quizPointsEl.innerText = quizState.pointsEarned;
    
    if (quizProgressFill && quizState.questions.length > 0) {
        const progress = (quizState.total / quizState.questions.length) * 100;
        quizProgressFill.style.width = `${progress}%`;
    }
}

function getCorrectAnswer(radical) {
    switch (quizState.mode) {
        case CONFIG.QUIZ_MODES.MEANING:
            return radical.meaning;
        case CONFIG.QUIZ_MODES.READING:
            return `${radical.onYomi} / ${radical.kunYomi}`;
        case CONFIG.QUIZ_MODES.WRITING:
            return radical.symbol;
        default:
            return radical.meaning;
    }
}

function generateOptions(current) {
    const correctAnswer = getCorrectAnswer(current);
    const options = [correctAnswer];
    
    while (options.length < 4) {
        const randomRadical = quizState.questions[Math.floor(Math.random() * quizState.questions.length)];
        let wrongAnswer;
        
        switch (quizState.mode) {
            case CONFIG.QUIZ_MODES.MEANING:
                wrongAnswer = randomRadical.meaning;
                break;
            case CONFIG.QUIZ_MODES.READING:
                wrongAnswer = `${randomRadical.onYomi} / ${randomRadical.kunYomi}`;
                break;
            default:
                wrongAnswer = randomRadical.symbol;
        }
        
        if (!options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }
    
    return shuffleArray(options);
}

function showResult(isCorrect, message) {
    const feedbackEl = document.getElementById('quizFeedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = isCorrect ? `✅ ${message}` : `❌ ${message}`;
    }
}

function nextQuestion() {
    quizState.currentIndex++;
    quizState.answered = false;
    renderQuiz(); // Просто перерисовываем
}

function finishQuiz() {
    if (!quizContainer) return;
    
    quizContainer.innerHTML = `
        <div class="quiz-card">
            <h2>🎉 Тест завершён!</h2>
            <p>✅ Правильно: ${quizState.correct} / ${quizState.questions.length}</p>
            <p>⭐ Баллов: ${quizState.pointsEarned}</p>
            <button onclick="location.reload()">🔄 Пройти заново</button>
        </div>
    `;
    
    if (appState.currentUser && quizState.pointsEarned > 0) {
        updateUserStats(quizState.pointsEarned, quizState.correct * 2);
    }
}

// ========== ОБЫЧНЫЙ РЕЖИМ (ВЫБОР ИЗ ВАРИАНТОВ) ==========

function renderRegularQuiz() {
    if (!quizContainer) return;
    
    if (quizState.currentIndex >= quizState.questions.length) {
        finishQuiz();
        return;
    }
    
    const current = quizState.questions[quizState.currentIndex];
    const correctAnswer = getCorrectAnswer(current);
    const options = generateOptions(current);
    
    const questionText = {
        [CONFIG.QUIZ_MODES.MEANING]: 'Выберите правильное значение:',
        [CONFIG.QUIZ_MODES.READING]: 'Выберите правильное чтение:',
        [CONFIG.QUIZ_MODES.WRITING]: 'Выберите правильный символ:'
    };
    
    quizContainer.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-symbol">${quizState.mode === CONFIG.QUIZ_MODES.WRITING ? '?' : current.symbol}</div>
            <div class="quiz-question">${questionText[quizState.mode]}</div>
            <div class="quiz-options" id="quizOptions">
                ${options.map(opt => `<div class="quiz-option">${opt}</div>`).join('')}
            </div>
            <div id="quizFeedback" class="quiz-feedback"></div>
            <button id="nextQuizBtn" style="display: none;">Следующий →</button>
            <div style="margin-top: 15px;">${quizState.currentIndex + 1} / ${quizState.questions.length}</div>
        </div>
    `;
    
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.onclick = () => handleAnswer(opt, correctAnswer);
    });
    
    const nextBtn = document.getElementById('nextQuizBtn');
    if (nextBtn) {
        nextBtn.onclick = () => nextQuestion();
    }
}

function handleAnswer(element, correctAnswer) {
    if (quizState.answered) return;
    
    const isCorrect = element.innerText === correctAnswer;
    quizState.total++;
    
    if (isCorrect) {
        quizState.correct++;
        quizState.pointsEarned += CONFIG.QUIZ_POINTS_PER_CORRECT;
        element.classList.add('correct');
        showResult(true, 'Правильно! +10 баллов!');
    } else {
        element.classList.add('wrong');
        showResult(false, `Неправильно. Правильный ответ: ${correctAnswer}`);
        
        document.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.innerText === correctAnswer) {
                opt.classList.add('correct');
            }
        });
    }
    
    quizState.answered = true;
    updateStatsDisplay();
    
    const nextBtn = document.getElementById('nextQuizBtn');
    if (nextBtn) nextBtn.style.display = 'block';
}

// ========== РЕЖИМ РИСОВАНИЯ ==========

function initDrawingMode() {
    const drawingContainer = document.getElementById('drawingMode');
    if (!drawingContainer) return;
    
    if (!drawingTest) {
        drawingTest = new DrawingTest('drawingCanvas', (result) => {
            if (quizState.answered) return;
            quizState.answered = true;
            quizState.total++;
            
            if (result) {
                quizState.correct++;
                quizState.pointsEarned += CONFIG.QUIZ_POINTS_PER_CORRECT;
                showResult(true, 'Правильно! +10 баллов!');
            } else {
                showResult(false, 'Неправильно. Попробуйте ещё раз');
            }
            
            updateStatsDisplay();
            const checkBtn = document.getElementById('checkDrawingBtn');
            const clearBtn = document.getElementById('clearCanvasBtn');
            if (checkBtn) checkBtn.disabled = true;
            if (clearBtn) clearBtn.disabled = true;
            
            setTimeout(() => nextQuestion(), 1500);
        });
    }
    
    const clearBtn = document.getElementById('clearCanvasBtn');
    const checkBtn = document.getElementById('checkDrawingBtn');
    
    if (clearBtn) {
        clearBtn.onclick = () => drawingTest?.clear();
        clearBtn.disabled = false;
    }
    
    if (checkBtn) {
        checkBtn.onclick = () => {
            if (drawingTest && !quizState.answered) {
                const isValid = !drawingTest.isEmpty();
                drawingTest.onResult(isValid);
                drawingTest.clear();
            }
        };
        checkBtn.disabled = false;
    }
    
    drawingTest?.clear();
    
    // Обновляем заголовок с текущим радикалом
    if (quizState.currentIndex < quizState.questions.length) {
        const current = quizState.questions[quizState.currentIndex];
        const titleEl = drawingContainer.querySelector('h3');
        if (titleEl) {
            titleEl.innerHTML = `✍️ Напишите иероглиф: <span style="color:#e94560">${current.meaning || current.symbol}</span>`;
        }
    }
}

function renderDrawingMode() {
    const drawingMode = document.getElementById('drawingMode');
    const quizContainerEl = document.getElementById('quizContainer');
    
    if (drawingMode) drawingMode.style.display = 'block';
    if (quizContainerEl) quizContainerEl.style.display = 'none';
    
    initDrawingMode();
}

// ========== ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ ==========

function renderQuiz() {
    if (quizState.currentIndex >= quizState.questions.length) {
        finishQuiz();
        return;
    }
    
    if (quizState.mode === CONFIG.QUIZ_MODES.WRITING) {
        renderDrawingMode();
    } else {
        // Скрываем режим рисования, показываем обычный
        const drawingMode = document.getElementById('drawingMode');
        const quizContainerEl = document.getElementById('quizContainer');
        
        if (drawingMode) drawingMode.style.display = 'none';
        if (quizContainerEl) quizContainerEl.style.display = 'block';
        
        renderRegularQuiz();
    }
}

// ========== НАЧАЛО НОВОГО КВИЗА ==========

function startNewQuiz() {
    if (!appState.radicals.length) return;
    
    quizState.questions = shuffleArray([...appState.radicals]);
    quizState.currentIndex = 0;
    quizState.correct = 0;
    quizState.total = 0;
    quizState.answered = false;
    quizState.pointsEarned = 0;
    
    if (drawingTest) {
        drawingTest.clear();
    }
    
    updateStatsDisplay();
    renderQuiz();
}

// ========== ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ ==========

function switchQuizMode(mode) {
    quizState.mode = mode;
    quizState.answered = false;
    startNewQuiz();
}

function initModeButtons() {
    const meaningBtn = document.querySelector('[data-quiz-mode="meaning"]');
    const readingBtn = document.querySelector('[data-quiz-mode="reading"]');
    const writingBtn = document.querySelector('[data-quiz-mode="writing"]');
    
    if (meaningBtn) {
        meaningBtn.onclick = () => {
            document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.remove('active'));
            meaningBtn.classList.add('active');
            switchQuizMode(CONFIG.QUIZ_MODES.MEANING);
        };
    }
    
    if (readingBtn) {
        readingBtn.onclick = () => {
            document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.remove('active'));
            readingBtn.classList.add('active');
            switchQuizMode(CONFIG.QUIZ_MODES.READING);
        };
    }
    
    if (writingBtn) {
        writingBtn.onclick = () => {
            document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.remove('active'));
            writingBtn.classList.add('active');
            switchQuizMode(CONFIG.QUIZ_MODES.WRITING);
        };
    }
}

// ========== ПУБЛИЧНАЯ ИНИЦИАЛИЗАЦИЯ ==========

export function initQuiz() {
    quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    
    initModeButtons();
    
    appState.subscribe(() => {
        const quizPanel = document.getElementById('quizPanel');
        if (quizPanel && quizPanel.classList.contains('active-panel')) {
            startNewQuiz();
        }
    });
    
    startNewQuiz();
}