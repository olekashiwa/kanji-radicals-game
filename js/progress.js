import { appState } from './state.js';
import { CONFIG } from './constants.js';

let progressStats = null;

/**
 * Инициализация панели прогресса
 */
export function initProgress() {
    progressStats = document.getElementById('progressStats');
    
    appState.subscribe(() => updateProgressPanel());
    
    document.getElementById('resetAllProgress').onclick = () => resetProgress();
    
    updateProgressPanel();
}

/**
 * Обновление панели прогресса
 */
function updateProgressPanel() {
    if (!progressStats) return;
    
    const studiedCount = appState.getStudiedCount();
    const studiedPercent = (studiedCount / CONFIG.TOTAL_RADICALS) * 100;
    
    progressStats.innerHTML = `
        <div class="progress-card">
            <h4>📖 Изучение</h4>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${studiedPercent}%;"></div>
            </div>
            <p>${studiedCount} / ${CONFIG.TOTAL_RADICALS}</p>
        </div>
        <div class="progress-card">
            <h4>🎯 Значение</h4>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%;"></div>
            </div>
            <p>Пройдите тесты</p>
        </div>
        <div class="progress-card">
            <h4>🔊 Чтение</h4>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%;"></div>
            </div>
            <p>Пройдите тесты</p>
        </div>
        <div class="progress-card">
            <h4>✍️ Написание</h4>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 0%;"></div>
            </div>
            <p>Пройдите тесты</p>
        </div>
    `;
}

/**
 * Сброс прогресса изучения
 */
function resetProgress() {
    if (confirm(CONFIG.MESSAGES.CONFIRM_RESET)) {
        appState.resetProgress();
        showToast(CONFIG.MESSAGES.PROGRESS_RESET, 'success');
    }
}

/**
 * Вспомогательная функция для уведомлений (импортируется из utils)
 */
function showToast(message, type) {
    // Временно добавляем toast здесь, чтобы не создавать циклическую зависимость
    const toast = document.createElement('div');
    toast.className = `toast-${type}`;
    toast.textContent = type === 'error' ? `❌ ${message}` : `✅ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}