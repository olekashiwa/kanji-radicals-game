import { appState } from './state.js';
import { getDb } from './firebase.js';
import { updateUserStats } from './auth.js';
import { showToast, shuffleArray } from './utils.js';
import { CONFIG } from './constants.js';

let battleState = {
    active: false,
    battleId: null,
    opponent: null,
    question: null,
    correctAnswer: null,
    options: [],
    answered: false
};

/**
 * Инициализация битвы
 */
export function initBattle() {
    document.getElementById('findBattleBtn').onclick = () => findBattle();
}

/**
 * Поиск соперника и создание вызова
 */
async function findBattle() {
    const opponentName = document.getElementById('opponentName').value.trim();
    
    if (!opponentName) {
        showToast('Введите имя соперника', 'error');
        return;
    }
    
    if (!appState.currentUser) {
        showToast('Сначала войдите в аккаунт', 'error');
        return;
    }
    
    const db = getDb();
    if (!db) {
        showToast('База данных не подключена', 'error');
        return;
    }
    
    try {
        // Поиск пользователя
        const usersRef = db.collection(CONFIG.FIRESTORE_COLLECTIONS.USERS);
        const snapshot = await usersRef.where('name', '==', opponentName).get();
        
        if (snapshot.empty) {
            showToast('Игрок не найден', 'error');
            return;
        }
        
        const opponent = snapshot.docs[0];
        const battleId = `${appState.currentUser.uid}_${opponent.id}_${Date.now()}`;
        
        // Выбор случайного радикала для вопроса
        const randomRadical = appState.radicals[Math.floor(Math.random() * appState.radicals.length)];
        const correctAnswer = randomRadical.meaning;
        
        // Генерация вариантов
        let options = [correctAnswer];
        while (options.length < 4) {
            const r = appState.radicals[Math.floor(Math.random() * appState.radicals.length)];
            if (!options.includes(r.meaning)) {
                options.push(r.meaning);
            }
        }
        options = shuffleArray(options);
        
        // Создание битвы
        await db.collection(CONFIG.FIRESTORE_COLLECTIONS.BATTLES).doc(battleId).set({
            id: battleId,
            player1: appState.currentUser.uid,
            player1Name: appState.userData.name,
            player2: opponent.id,
            player2Name: opponent.data().name,
            question: randomRadical.symbol,
            correctAnswer: correctAnswer,
            options: options,
            status: 'waiting',
            winner: null,
            createdAt: new Date()
        });
        
        showToast(`Вызов отправлен игроку ${opponentName}!`, 'success');
        
        // Начинаем слушать битву
        listenBattle(battleId);
        
    } catch (error) {
        console.error('Ошибка создания битвы:', error);
        showToast('Ошибка создания вызова', 'error');
    }
}

/**
 * Прослушивание обновлений битвы
 * @param {string} battleId - ID битвы
 */
function listenBattle(battleId) {
    const db = getDb();
    if (!db) return;
    
    db.collection(CONFIG.FIRESTORE_COLLECTIONS.BATTLES).doc(battleId).onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const data = doc.data();
        
        if (data.status === 'active' && !battleState.active) {
            startBattle(data);
        } else if (data.status === 'finished' && battleState.active) {
            endBattle(data);
        }
    });
}

/**
 * Начало битвы
 * @param {Object} data - Данные битвы
 */
function startBattle(data) {
    battleState.active = true;
    battleState.battleId = data.id;
    battleState.opponent = data.player1 === appState.currentUser.uid ? data.player2Name : data.player1Name;
    battleState.question = data.question;
    battleState.correctAnswer = data.correctAnswer;
    battleState.options = data.options;
    battleState.answered = false;
    
    // Отображаем вопрос
    document.getElementById('battleStatus').innerHTML = `
        <div style="background: #fef5e8; border-radius: 30px; padding: 20px; margin-bottom: 20px;">
            ⚔️ Битва против <strong>${battleState.opponent}</strong>! Кто быстрее ответит? ⚔️
        </div>
    `;
    
    document.getElementById('battleQuestionArea').innerHTML = `
        <div class="battle-question" style="font-size: 4rem; margin: 20px 0;">${battleState.question}</div>
        <div class="battle-options" id="battleOptions">
            ${battleState.options.map(opt => `
                <div class="battle-option" style="background: #f5efe8; padding: 12px; border-radius: 50px; margin: 8px 0; cursor: pointer;">
                    ${opt}
                </div>
            `).join('')}
        </div>
    `;
    
    // Обработчики выбора ответа
    document.querySelectorAll('.battle-option').forEach(opt => {
        opt.onclick = () => handleBattleAnswer(opt);
    });
}

/**
 * Обработка ответа в битве
 * @param {HTMLElement} element - Выбранный вариант
 */
async function handleBattleAnswer(element) {
    if (battleState.answered) return;
    battleState.answered = true;
    
    const isCorrect = element.innerText === battleState.correctAnswer;
    
    if (isCorrect) {
        element.classList.add('correct');
        document.getElementById('battleStatus').innerHTML = `
            <div style="background: #b8d9b0; border-radius: 30px; padding: 20px;">
                ✅ Правильно! Победа!
            </div>
        `;
    } else {
        element.classList.add('wrong');
        document.getElementById('battleStatus').innerHTML = `
            <div style="background: #f0c4c4; border-radius: 30px; padding: 20px;">
                ❌ Неправильно. Правильный ответ: ${battleState.correctAnswer}
            </div>
        `;
    }
    
    const db = getDb();
    if (!db) return;
    
    const battleRef = db.collection(CONFIG.FIRESTORE_COLLECTIONS.BATTLES).doc(battleState.battleId);
    const battleDoc = await battleRef.get();
    
    if (battleDoc.exists && battleDoc.data().status === 'active') {
        if (isCorrect) {
            await battleRef.update({ winner: appState.currentUser.uid, status: 'finished' });
        } else {
            const data = battleDoc.data();
            const winner = data.player1 === appState.currentUser.uid ? data.player2 : data.player1;
            await battleRef.update({ winner: winner, status: 'finished' });
        }
    }
}

/**
 * Завершение битвы
 * @param {Object} data - Данные битвы
 */
function endBattle(data) {
    const isWinner = data.winner === appState.currentUser.uid;
    
    if (isWinner) {
        showToast('🎉 ПОБЕДА! +50 очков!', 'success');
        updateUserStats(CONFIG.BATTLE_WIN_POINTS, CONFIG.BATTLE_WIN_XP);
    } else {
        showToast('😔 Поражение! +10 очков', 'error');
        updateUserStats(CONFIG.BATTLE_LOSE_POINTS, CONFIG.BATTLE_LOSE_XP);
    }
    
    // Сброс состояния битвы
    battleState.active = false;
    document.getElementById('battleStatus').innerHTML = '';
    document.getElementById('battleQuestionArea').innerHTML = '';
}