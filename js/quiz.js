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

/**
 * Обновление отображения статистики
 */
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

/**
 * Получение правильного ответа для текущего вопроса
 */
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

/**
 * Генерация вариантов ответов
 */
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

/**
 * Показать результат ответа
 */
function showResult(isCorrect, message) {
    const feedbackEl = document.getElementById('quizFeedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = isCorrect ? `✅ ${message}` : `❌ ${message}`;
    }
}

/**
 * Переход к следующему вопросу
 */
function nextQuestion() {
    quizState.currentIndex++;
    quizState.answered = false;
    
    // Скрываем режим рисования, если он был активен
    const drawingMode = document.getElementById('drawingMode');
    const quizContainerEl = document.getElementById('quizContainer');
    
    if (drawingMode) drawingMode.style.display = 'none';
    if (quizContainerEl) quizContainerEl.style.display = 'block';
    
    renderQuiz();
}

/**
 * Завершение квиза
 */
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
    
    // Сохраняем результат
    if (appState.currentUser && quizState.pointsEarned > 0) {
        updateUserStats(quizState.pointsEarned, quizState.correct * 2);
    }
}

/**
 * Отображение обычного вопроса (выбор из вариантов)
 */
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
    
    // Обработчики выбора ответа
    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.onclick = () => handleAnswer(opt, correctAnswer);
    });
    
    // Обработчик кнопки "Следующий"
    const nextBtn = document.getElementById('nextQuizBtn');
    if (nextBtn) {
        nextBtn.onclick = () => nextQuestion();
    }
}

/**
 * Обработка ответа пользователя (обычный режим)
 */
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
        
        // Подсветить правильный ответ
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

/**
 * Инициализация режима рисования
 */
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
            document.getElementById('checkDrawingBtn').disabled = true;
            document.getElementById('clearCanvasBtn').disabled = true;
            
            setTimeout(() => nextQuestion(), 1500);
        });
    }
    
    // Обработчики кнопок
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
    
    // Очищаем холст при новом вопросе
    drawingTest?.clear();
}

/**
 * Показать режим рисования
 */
function showDrawingMode() {
    const drawingMode = document.getElementById('drawingMode');
    const quizContainerEl = document.getElementById('quizContainer');
    
    if (drawingMode) drawingMode.style.display = 'block';
    if (quizContainerEl) quizContainerEl.style.display = 'none';
    
    initDrawingMode();
    
    // Обновляем информацию о текущем радикале
    if (quizState.currentIndex < quizState.questions.length) {
        const current = quizState.questions[quizState.currentIndex];
        const titleEl = drawingMode?.querySelector('h3');
        if (titleEl) {
            titleEl.innerHTML = `✍️ Напишите иероглиф: <span style="color:#e94560">${current.meaning || current.symbol}</span>`;
        }
    }
}

/**
 * Показать обычный режим тестирования
 */
function showRegularMode() {
    const drawingMode = document.getElementById('drawingMode');
    const quizContainerEl = document.getElementById('quizContainer');
    
    if (drawingMode) drawingMode.style.display = 'none';
    if (quizContainerEl) quizContainerEl.style.display = 'block';
    
    renderQuiz();
}

/**
 * Отображение текущего вопроса (выбор режима)
 */
function renderQuiz() {
    if (quizState.currentIndex >= quizState.questions.length) {
        finishQuiz();
        return;
    }
    
    if (quizState.mode === CONFIG.QUIZ_MODES.WRITING) {
        showDrawingMode();
    } else {
        showRegularMode();
    }
}

// ========== НАЧАЛО НОВОГО КВИЗА ==========

/**
 * Начало нового квиза
 */
function startNewQuiz() {
    if (!appState.radicals.length) return;
    
    quizState.questions = shuffleArray([...appState.radicals]);
    quizState.currentIndex = 0;
    quizState.correct = 0;
    quizState.total = 0;
    quizState.answered = false;
    quizState.pointsEarned = 0;
    
    // Сброс режима рисования
    if (drawingTest) {
        drawingTest.clear();
    }
    
    updateStatsDisplay();
    renderQuiz();
}

// ========== ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ ==========

/**
 * Переключение режима тестирования
 */
function switchQuizMode(mode) {
    quizState.mode = mode;
    quizState.answered = false;
    startNewQuiz();
}

/**
 * Инициализация кнопок переключения режимов
 */
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

/**
 * Инициализация квиза
 */
export function initQuiz() {
    quizContainer = document.getElementById('quizContainer');
    if (!quizContainer) return;
    
    initModeButtons();
    
    // Подписка на изменения радикалов
    appState.subscribe(() => {
        const quizPanel = document.getElementById('quizPanel');
        if (quizPanel && quizPanel.classList.contains('active-panel')) {
            startNewQuiz();
        }
    });
    
    startNewQuiz();
}