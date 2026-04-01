import { CONFIG } from './constants.js';
import { calcLevel } from './utils.js';

/**
 * Глобальное состояние приложения
 */
class AppState {
    constructor() {
        this.currentUser = null;
        this.userData = {
            uid: null,
            name: 'Гость',
            level: 1,
            xp: 0,
            points: 0
        };
        this.studyProgress = { studied: {} };
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.radicals = [];
        this.listeners = [];
    }
    
    /**
     * Добавление слушателя изменений
     * @param {Function} listener - Функция для вызова при изменении
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    /**
     * Уведомление всех слушателей
     */
    notify() {
        this.listeners.forEach(listener => listener(this));
    }
    
    /**
     * Установка данных пользователя
     * @param {Object} userData - Данные пользователя
     */
    setUserData(userData) {
        this.currentUser = userData.uid ? userData : null;
        this.userData = {
            uid: userData.uid || null,
            name: userData.name || 'Гость',
            level: userData.level || 1,
            xp: userData.xp || 0,
            points: userData.points || 0
        };
        this.notify();
    }
    
    /**
     * Обновление статистики пользователя
     * @param {number} pointsGain - Добавленные баллы
     * @param {number} xpGain - Добавленный опыт
     */
    updateStats(pointsGain, xpGain) {
        if (!this.currentUser) return;
        
        this.userData.points += pointsGain;
        this.userData.xp += xpGain;
        this.userData.level = calcLevel(this.userData.xp);
        this.notify();
    }
    
    /**
     * Отметка радикала как изученного
     * @param {number} radicalNum - Номер радикала
     */
    markStudied(radicalNum) {
        if (!this.studyProgress.studied[radicalNum]) {
            this.studyProgress.studied[radicalNum] = true;
            this.saveProgress();
            this.notify();
        }
    }
    
    /**
     * Сохранение прогресса в localStorage
     */
    saveProgress() {
        localStorage.setItem('radicalsStudyProgress', JSON.stringify(this.studyProgress.studied));
    }
    
    /**
     * Загрузка прогресса из localStorage
     */
    loadProgress() {
        const saved = localStorage.getItem('radicalsStudyProgress');
        if (saved) {
            try {
                this.studyProgress.studied = JSON.parse(saved);
            } catch (e) {
                console.warn('Ошибка загрузки прогресса', e);
            }
        }
        this.notify();
    }
    
    /**
     * Сброс прогресса изучения
     */
    resetProgress() {
        this.studyProgress.studied = {};
        localStorage.removeItem('radicalsStudyProgress');
        this.notify();
    }
    
    /**
     * Получение количества изученных радикалов
     * @returns {number}
     */
    getStudiedCount() {
        return Object.keys(this.studyProgress.studied).length;
    }
    
    /**
     * Установка фильтра
     * @param {string} filter - Значение фильтра
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.notify();
    }
    
    /**
     * Установка поискового запроса
     * @param {string} term - Поисковый запрос
     */
    setSearchTerm(term) {
        this.searchTerm = term;
        this.notify();
    }
    
    /**
     * Установка списка радикалов
     * @param {Array} radicals - Массив радикалов
     */
    setRadicals(radicals) {
        this.radicals = radicals;
        this.notify();
    }
}

// Создаём единственный экземпляр состояния
export const appState = new AppState();