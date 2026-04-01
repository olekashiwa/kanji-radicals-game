import { CONFIG } from './constants.js';

/**
 * Показывает временное уведомление пользователю
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип сообщения ('error' или 'success')
 */
export function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast-${type}`;
    toast.textContent = type === 'error' ? `❌ ${message}` : `✅ ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Валидация имени пользователя
 * @param {string} name - Введённое имя
 * @returns {string} Очищенное имя или null
 */
export function validateUserName(name) {
    if (!name || typeof name !== 'string') {
        return null;
    }
    
    const trimmed = name.trim();
    if (trimmed === '') {
        return null;
    }
    
    // Ограничение длины
    let result = trimmed;
    if (result.length > 20) {
        result = result.slice(0, 20);
        showToast('Имя слишком длинное, обрезано до 20 символов', 'error');
    }
    
    // Удаление недопустимых символов
    result = result.replace(/[<>/\\{}[\]|]/g, '');
    
    return result || null;
}

/**
 * Получение имени пользователя через диалог
 * @returns {string} Валидное имя или значение по умолчанию
 */
export function promptUserName() {
    const rawName = prompt(CONFIG.MESSAGES.ENTER_NAME, CONFIG.MESSAGES.DEFAULT_NAME);
    const validated = validateUserName(rawName);
    return validated || CONFIG.MESSAGES.DEFAULT_NAME;
}

/**
 * Форматирование числа с ведущим нулём
 * @param {number} num - Число
 * @returns {string} Отформатированная строка
 */
export function padNumber(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Дебаунс для оптимизации частых вызовов
 * @param {Function} func - Функция для вызова
 * @param {number} delay - Задержка в мс
 * @returns {Function} Обёрнутая функция
 */
export function debounce(func, delay = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Генерация случайного целого числа в диапазоне
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Случайное число
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Перемешивание массива (алгоритм Фишера-Йетса)
 * @param {Array} array - Исходный массив
 * @returns {Array} Перемешанный массив
 */
export function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Расчет уровня по опыту
 * @param {number} xp - Количество опыта
 * @returns {number} Уровень
 */
export function calcLevel(xp) {
    return Math.floor(xp / CONFIG.XP_PER_LEVEL) + 1;
}

/**
 * Расчет прогресса до следующего уровня (%)
 * @param {number} xp - Количество опыта
 * @returns {number} Прогресс в процентах (0-100)
 */
export function calcLevelProgress(xp) {
    const level = calcLevel(xp);
    const levelStart = (level - 1) * CONFIG.XP_PER_LEVEL;
    const levelXp = xp - levelStart;
    return (levelXp / CONFIG.XP_PER_LEVEL) * 100;
}

/**
 * Безопасное получение данных из объекта
 * @param {Object} obj - Объект
 * @param {string} path - Путь через точки
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} Значение или defaultValue
 */
export function getNestedValue(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }
    return result !== undefined ? result : defaultValue;
}

/**
 * Экспорт всех радикалов в CSV для Anki
 * @param {Array} radicals - Массив радикалов
 */
export function exportToAnki(radicals) {
    if (!radicals || radicals.length === 0) {
        showToast('Нет данных для экспорта', 'error');
        return;
    }
    
    let csv = "Передняя сторона,Задняя сторона\n";
    
    radicals.forEach(r => {
        const front = r.symbol;
        const back = `${r.nameRu} (${r.meaning})\\nОн: ${r.onYomi}\\nКун: ${r.kunYomi}\\nПримеры: ${r.examples.join(", ")}`;
        csv += `"${front}","${back.replace(/"/g, '""')}"\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anki_radicals_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(CONFIG.MESSAGES.EXPORT_SUCCESS, 'success');
}