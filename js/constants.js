/**
 * Конфигурационные константы приложения
 */

export const CONFIG = {
    // Прогресс и уровни
    XP_PER_LEVEL: 100,
    
    // Баллы
    QUIZ_POINTS_PER_CORRECT: 10,
    BATTLE_WIN_POINTS: 50,
    BATTLE_WIN_XP: 30,
    BATTLE_LOSE_POINTS: 10,
    BATTLE_LOSE_XP: 10,
    
    // Интерфейс
    MAX_LEADERBOARD_ITEMS: 20,
    TOTAL_RADICALS: 214,
    
    // Firebase коллекции
    FIRESTORE_COLLECTIONS: {
        USERS: 'users',
        BATTLES: 'battles'
    },
    
    // Типы силы радикалов
    STRENGTH_TYPES: {
        STRONG: 'strong',
        MEDIUM: 'medium',
        WEAK: 'weak'
    },
    
    // Режимы квиза
    QUIZ_MODES: {
        MEANING: 'meaning',
        READING: 'reading',
        WRITING: 'writing'
    },
    
    // Сообщения
    MESSAGES: {
        NO_PLAYERS: 'Пока нет игроков',
        LOADING: 'Загрузка...',
        ENTER_NAME: 'Введите ваше имя:',
        DEFAULT_NAME: 'Игрок',
        PROGRESS_RESET: 'Прогресс сброшен!',
        CONFIRM_RESET: 'Сбросить весь прогресс?',
        EXPORT_SUCCESS: '✅ Карточки экспортированы!',
        FIREBASE_ERROR: 'Ошибка подключения к базе данных',
        LEADERBOARD_ERROR: 'Ошибка загрузки таблицы лидеров'
    }
};

/**
 * CSS классы для бейджей силы
 */
export const STRENGTH_CLASSES = {
    [CONFIG.STRENGTH_TYPES.STRONG]: 'strong-badge',
    [CONFIG.STRENGTH_TYPES.MEDIUM]: 'medium-badge',
    [CONFIG.STRENGTH_TYPES.WEAK]: 'weak-badge'
};

/**
 * Русские названия типов силы
 */
export const STRENGTH_NAMES = {
    [CONFIG.STRENGTH_TYPES.STRONG]: '💪 СИЛЬНЫЙ',
    [CONFIG.STRENGTH_TYPES.MEDIUM]: '📘 СРЕДНИЙ',
    [CONFIG.STRENGTH_TYPES.WEAK]: '🌱 СЛАБЫЙ'
};