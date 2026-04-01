import { firebaseConfig, isFirebaseConfigured } from './config.js';
import { showToast } from './utils.js';
import { CONFIG } from './constants.js';

let db = null;
let auth = null;
let isInitialized = false;

/**
 * Инициализация Firebase
 */
export function initFirebase() {
    if (isInitialized) return { db, auth };
    
    if (!isFirebaseConfigured()) {
        console.warn('Firebase не настроен. Некоторые функции будут недоступны.');
        return { db: null, auth: null };
    }
    
    try {
        // Проверяем, инициализировано ли уже приложение
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.apps[0];
        }
        
        db = firebase.firestore();
        auth = firebase.auth();
        isInitialized = true;
        
        console.log('✅ Firebase инициализирован');
        return { db, auth };
    } catch (error) {
        console.error('❌ Firebase ошибка:', error);
        showToast(CONFIG.MESSAGES.FIREBASE_ERROR);
        return { db: null, auth: null };
    }
}

/**
 * Получение экземпляра Firestore
 */
export function getDb() {
    if (!db) initFirebase();
    return db;
}

/**
 * Получение экземпляра Auth
 */
export function getAuth() {
    if (!auth) initFirebase();
    return auth;
}

/**
 * Проверка, инициализирован ли Firebase
 */
export function isFirebaseReady() {
    return isInitialized && db !== null && auth !== null;
}