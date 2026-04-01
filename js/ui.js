import { appState } from './state.js';
import { exportToAnki } from './utils.js';
import { CONFIG } from './constants.js';
import { updateUserStats } from './auth.js';

/**
 * Инициализация переключения вкладок
 */
export function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
}

/**
 * Переключение между вкладками
 * @param {string} tabId - ID вкладки
 */
function switchTab(tabId) {
    // Скрыть все панели
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active-panel');
    });
    
    // Показать выбранную панель
    const targetPanel = document.getElementById(`${tabId}Panel`);
    if (targetPanel) {
        targetPanel.classList.add('active-panel');
    }
    
    // Обновить активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });
    
    // Дополнительные действия при переключении
    if (tabId === 'leaderboard') {
        // Таблица лидеров обновляется в своём модуле
        const event = new CustomEvent('leaderboardRefresh');
        document.dispatchEvent(event);
    }
    
    if (tabId === 'progress') {
        const event = new CustomEvent('progressRefresh');
        document.dispatchEvent(event);
    }
}

/**
 * Инициализация поиска
 */
export function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = (e) => {
            appState.setSearchTerm(e.target.value);
        };
    }
}

/**
 * Инициализация фильтров
 */
export function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.setFilter(btn.dataset.filter);
        };
    });
}

/**
 * Инициализация экспорта в Anki
 */
export function initExport() {
    const exportBtn = document.getElementById('exportAnkiBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            exportToAnki(appState.radicals);
        };
    }
}

/**
 * Обновление интерфейса пользователя (вызывается из state)
 */
export function updateUI() {
    const userData = appState.userData;
    
    document.getElementById('playerName').innerText = userData.name;
    document.getElementById('playerLevel').innerText = userData.level;
    document.getElementById('playerPoints').innerText = userData.points;
    document.getElementById('playerXp').innerText = userData.xp;
    
    // Обновление полосы опыта
    const xpProgress = ((userData.xp - ((userData.level - 1) * CONFIG.XP_PER_LEVEL)) / CONFIG.XP_PER_LEVEL) * 100;
    document.getElementById('xpFill').style.width = `${Math.min(100, xpProgress)}%`;
}