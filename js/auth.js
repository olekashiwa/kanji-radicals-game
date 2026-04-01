import { appState } from './state.js';
import { getDb, getAuth, isFirebaseReady } from './firebase.js';
import { showToast, promptUserName } from './utils.js';
import { CONFIG } from './constants.js';

/**
 * Инициализация аутентификации
 * @param {Object} auth - Экземпляр Firebase Auth
 */
export function initAuth(auth) {
    if (!auth) return;
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Пользователь вошёл
            await loadUserData(user.uid);
        } else {
            // Пользователь вышел
            appState.setUserData({ uid: null, name: 'Гость', level: 1, xp: 0, points: 0 });
        }
    });
    
    // Настройка кнопок
    document.getElementById('loginBtn').onclick = () => handleLogin(auth);
    document.getElementById('logoutBtn').onclick = () => handleLogout(auth);
}

/**
 * Загрузка данных пользователя из Firestore
 * @param {string} uid - ID пользователя
 */
async function loadUserData(uid) {
    const db = getDb();
    if (!db) return;
    
    try {
        const docRef = db.collection(CONFIG.FIRESTORE_COLLECTIONS.USERS).doc(uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            appState.setUserData({
                uid: uid,
                name: data.name || 'Игрок',
                level: data.level || 1,
                xp: data.xp || 0,
                points: data.points || 0
            });
        } else {
            // Новый пользователь
            const name = promptUserName();
            const userData = {
                uid: uid,
                name: name,
                level: 1,
                xp: 0,
                points: 0
            };
            await docRef.set(userData);
            appState.setUserData(userData);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        showToast('Ошибка загрузки профиля', 'error');
        appState.setUserData({ uid: null, name: 'Гость', level: 1, xp: 0, points: 0 });
    }
}

/**
 * Обработка входа
 * @param {Object} auth - Экземпляр Firebase Auth
 */
async function handleLogin(auth) {
    if (!isFirebaseReady()) {
        showToast('Firebase не настроен. Проверьте конфигурацию.', 'error');
        return;
    }
    
    try {
        await auth.signInAnonymously();
        showToast('Вход выполнен!', 'success');
    } catch (error) {
        console.error('Ошибка входа:', error);
        showToast('Ошибка входа: ' + error.message, 'error');
    }
}

/**
 * Обработка выхода
 * @param {Object} auth - Экземпляр Firebase Auth
 */
async function handleLogout(auth) {
    try {
        await auth.signOut();
        showToast('Выход выполнен', 'success');
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showToast('Ошибка выхода', 'error');
    }
}

/**
 * Обновление статистики пользователя в Firestore
 * @param {number} pointsGain - Добавленные баллы
 * @param {number} xpGain - Добавленный опыт
 */
export async function updateUserStats(pointsGain, xpGain) {
    const user = appState.currentUser;
    if (!user) return;
    
    const db = getDb();
    if (!db) return;
    
    try {
        const userRef = db.collection(CONFIG.FIRESTORE_COLLECTIONS.USERS).doc(user.uid);
        const doc = await userRef.get();
        
        let newPoints = (doc.data()?.points || 0) + pointsGain;
        let newXp = (doc.data()?.xp || 0) + xpGain;
        
        await userRef.set({
            name: appState.userData.name,
            points: newPoints,
            xp: newXp,
            level: appState.userData.level
        }, { merge: true });
        
        appState.updateStats(pointsGain, xpGain);
    } catch (error) {
        console.error('Ошибка обновления статистики:', error);
    }
}