import { CONFIG } from './constants.js';

/**
 * Загрузка данных радикалов из JSON файла
 * @returns {Promise<Array>} Массив радикалов
 */
export async function loadRadicals() {
    try {
        const response = await fetch('data/radicals.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const radicals = await response.json();
        console.log(`✅ Загружено ${radicals.length} радикалов`);
        return radicals;
    } catch (error) {
        console.error('Ошибка загрузки радикалов:', error);
        return [];
    }
}

/**
 * Фильтрация радикалов по критериям
 * @param {Array} radicals - Массив радикалов
 * @param {string} filter - Тип фильтра ('all', 'strong', 'medium')
 * @param {string} searchTerm - Поисковый запрос
 * @returns {Array} Отфильтрованный массив
 */
export function filterRadicals(radicals, filter, searchTerm) {
    let filtered = [...radicals];
    
    // Фильтр по силе
    if (filter !== 'all') {
        filtered = filtered.filter(r => r.strength === filter);
    }
    
    // Поиск
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(r => {
            return r.num.toString().includes(term) ||
                   r.symbol.includes(term) ||
                   r.nameRu.toLowerCase().includes(term);
        });
    }
    
    return filtered;
}

/**
 * Получение CSS класса для бейджа силы
 * @param {string} strength - Тип силы
 * @returns {string} Название CSS класса
 */
export function getStrengthClass(strength) {
    if (strength === CONFIG.STRENGTH_TYPES.STRONG) return 'strong-badge';
    if (strength === CONFIG.STRENGTH_TYPES.MEDIUM) return 'medium-badge';
    return 'weak-badge';
}

/**
 * Получение названия типа силы на русском
 * @param {string} strength - Тип силы
 * @returns {string} Название
 */
export function getStrengthName(strength) {
    if (strength === CONFIG.STRENGTH_TYPES.STRONG) return '💪 СИЛЬНЫЙ';
    if (strength === CONFIG.STRENGTH_TYPES.MEDIUM) return '📘 СРЕДНИЙ';
    return '🌱 СЛАБЫЙ';
}