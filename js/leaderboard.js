import { appState } from './state.js';
import { getDb } from './firebase.js';
import { showToast } from './utils.js';
import { CONFIG } from './constants.js';

let leaderboardList = null;

/**
 * Инициализация таблицы лидеров
 */
export function initLeaderboard() {
    leaderboardList = document.getElementById('leaderboardList');
    
    // Загружаем при активации вкладки
    const leaderboardTab = document.querySelector('[data-tab="leaderboard"]');
    if (leaderboardTab) {
        leaderboardTab.addEventListener('click', () => loadLeaderboard());
    }
    
    // Начальная загрузка
    loadLeaderboard();
}

/**
 * Загрузка таблицы лидеров из Firestore
 */
async function loadLeaderboard() {
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px;">Загрузка...</div>';
    
    const db = getDb();
    if (!db) {
        leaderboardList.innerHTML = `<div style="text-align: center; padding: 40px;">${CONFIG.MESSAGES.LEADERBOARD_ERROR}</div>`;
        return;
    }
    
    try {
        const snapshot = await db.collection(CONFIG.FIRESTORE_COLLECTIONS.USERS)
            .orderBy('points', 'desc')
            .limit(CONFIG.MAX_LEADERBOARD_ITEMS)
            .get();
        
        if (snapshot.empty) {
            leaderboardList.innerHTML = `<div style="text-align: center; padding: 40px;">${CONFIG.MESSAGES.NO_PLAYERS}</div>`;
            return;
        }
        
        let html = '<h3>🏆 Топ-20 игроков</h3>';
        let rank = 1;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const isCurrentUser = appState.currentUser && doc.id === appState.currentUser.uid;
            const userClass = isCurrentUser ? 'style="background: #fff3cd; font-weight: bold;"' : '';
            
            html += `
                <div class="leaderboard-item" ${userClass}>
                    <span>${rank}. ${data.name}</span>
                    <span>⭐ ${data.points || 0} очков | 🎚️ Уровень ${data.level || 1}</span>
                </div>
            `;
            rank++;
        });
        
        leaderboardList.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки таблицы лидеров:', error);
        leaderboardList.innerHTML = `<div style="text-align: center; padding: 40px;">${CONFIG.MESSAGES.LEADERBOARD_ERROR}</div>`;
        showToast(CONFIG.MESSAGES.LEADERBOARD_ERROR, 'error');
    }
}