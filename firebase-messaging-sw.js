importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBaR9vwVuQph--DQ9pEAciPk21ZOgZVM2o",
    authDomain: "cubanbet-32254.firebaseapp.com",
    projectId: "cubanbet-32254",
    storageBucket: "cubanbet-32254.firebasestorage.app",
    messagingSenderId: "470616151074",
    appId: "1:470616151074:web:8624013ff21f5e3c85267b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
