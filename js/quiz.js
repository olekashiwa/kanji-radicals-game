import { appState } from './state.js';
import { updateUserStats } from './auth.js';
import { shuffleArray, showToast } from './utils.js';
import { CONFIG } from './constants.js';

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

/**
 * Инициализация квиза
 */
export function initQuiz() {
    quizContainer = document.getElementById('quizContainer');
    
    // Настройка кнопок режимов
    document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            quizState.mode = btn.dataset.quizMode;
            startNewQuiz();
        };
    });
    
    // Подписка на изменения радикалов
    appState.subscribe(() => {
        if (quizContainer && document.getElementById('quizPanel').classList.contains('active-panel')) {
            startNewQuiz();
        }
    });
    
    startNewQuiz();
}

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
    
    updateStatsDisplay();
    renderQuiz();
}

/**
 * Обновление отображения статистики
 */
function updateStatsDisplay() {
    document.getElementById('totalCount').innerText = quizState.questions.length;
    document.getElementById('correctCount').innerText = quizState.correct;
    document.getElementById('quizPoints').innerText = quizState.pointsEarned;
    
    const progress = (quizState.total / quizState.questions.length) * 100;
    document.getElementById('quizProgressFill').style.width = `${progress}%`;
}

/**
 * Получение правильного ответа для текущего вопроса
 * @param {Object} radical - Объект радикала
 * @returns {string} Правильный ответ
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
 * @param {Object} current - Текущий радикал
 * @returns {Array} Массив вариантов
 */
function generateOptions(current) {
    const correctAnswer = getCorrectAnswer(current);
    const options = [correctAnswer];
    
    // Добавляем 3 случайных неправильных варианта
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
 * Отображение текущего вопроса
 */
function renderQuiz() {
    if (!quizContainer) return;
    
    if (quizState.currentIndex >= quizState.questions.length) {
        // Квиз завершён
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
    document.getElementById('nextQuizBtn').onclick = () => {
        quizState.currentIndex++;
        quizState.answered = false;
        renderQuiz();
    };
}

/**
 * Обработка ответа пользователя
 * @param {HTMLElement} element - Элемент с выбранным ответом
 * @param {string} correctAnswer - Правильный ответ
 */
function handleAnswer(element, correctAnswer) {
    if (quizState.answered) return;
    
    const isCorrect = element.innerText === correctAnswer;
    quizState.total++;
    
    if (isCorrect) {
        quizState.correct++;
        quizState.pointsEarned += CONFIG.QUIZ_POINTS_PER_CORRECT;
        element.classList.add('correct');
        document.getElementById('quizFeedback').innerHTML = '✅ Правильно! +10 баллов!';
    } else {
        element.classList.add('wrong');
        document.getElementById('quizFeedback').innerHTML = `❌ Неправильно. Правильный ответ: ${correctAnswer}`;
        
        // Подсветить правильный ответ
        document.querySelectorAll('.quiz-option').forEach(opt => {
            if (opt.innerText === correctAnswer) {
                opt.classList.add('correct');
            }
        });
    }
    
    quizState.answered = true;
    updateStatsDisplay();
    document.getElementById('nextQuizBtn').style.display = 'block';
}