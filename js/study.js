import { appState } from './state.js';
import { filterRadicals, getStrengthClass, getStrengthName } from './radicals.js';
import { debounce } from './utils.js';
import { CONFIG } from './constants.js';

let radicalsGrid = null;

/**
 * Инициализация панели изучения
 */
export function initStudy() {
    radicalsGrid = document.getElementById('radicalsGrid');
    
    // Подписка на изменения состояния
    appState.subscribe(() => renderStudy());
    
    // Начальный рендер
    renderStudy();
}

/**
 * Рендеринг карточек радикалов
 */
function renderStudy() {
    if (!radicalsGrid) return;
    
    const filtered = filterRadicals(
        appState.radicals,
        appState.currentFilter,
        appState.searchTerm
    );
    
    if (filtered.length === 0) {
        radicalsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                😔 Ничего не найдено
            </div>
        `;
        return;
    }
    
    radicalsGrid.innerHTML = filtered.map(radical => `
        <div class="radical-card" data-num="${radical.num}">
            <div class="card-header">
                <span class="radical-symbol">${radical.symbol}</span>
                <span class="radical-number">№${radical.num}</span>
            </div>
            <div class="card-body">
                <div class="radical-name">
                    ${radical.nameRu}
                    <span class="strength-badge ${getStrengthClass(radical.strength)}">
                        ${getStrengthName(radical.strength)}
                    </span>
                </div>
                <div class="meaning">📖 ${radical.meaning}</div>
                <div class="readings">
                    <span class="reading">🔊 Он: ${radical.onYomi}</span>
                    <span class="reading">🗣️ Кун: ${radical.kunYomi}</span>
                </div>
                <div class="examples">📌 Примеры: ${radical.examples.join(' | ')}</div>
                <div class="positions">📍 Позиции: ${radical.positions}</div>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики кликов
    document.querySelectorAll('.radical-card').forEach(card => {
        card.onclick = () => {
            const num = parseInt(card.dataset.num);
            const radical = appState.radicals.find(r => r.num === num);
            if (radical) {
                showRadicalDetails(radical);
                appState.markStudied(num);
            }
        };
    });
}

/**
 * Показ детальной информации о радикале
 * @param {Object} radical - Объект радикала
 */
function showRadicalDetails(radical) {
    alert(`${radical.symbol} — ${radical.nameRu}\n\n` +
          `Он: ${radical.onYomi}\n` +
          `Кун: ${radical.kunYomi}\n\n` +
          `Значение: ${radical.meaning}\n\n` +
          `Примеры: ${radical.examples.join(', ')}\n\n` +
          `Позиции: ${radical.positions}`);
}