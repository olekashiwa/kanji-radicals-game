/**
 * Конфигурация Firebase (загружается из переменных окружения)
 * В production значения должны быть установлены через Netlify Environment Variables
 */


export const firebaseConfig = {
    apiKey: "AIzaSyCkqnhA0D-cl6L3ehWelOtmjrv7mbAjjzE",
    authDomain: "o777kashiwa.firebaseapp.com",
    projectId: "o777kashiwa",
    storageBucket: "o777kashiwa.firebasestorage.app",
    messagingSenderId: "433092942031",
    appId: "1:433092942031:web:4cdede417e41ab38f03fba"
};

/**
 * Проверка наличия конфигурации
 */
export function isFirebaseConfigured() {
    const hasApiKey = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here';
    const hasProjectId = firebaseConfig.projectId && firebaseConfig.projectId !== 'your_project_id';
    return hasApiKey && hasProjectId;
}