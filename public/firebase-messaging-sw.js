// This service worker handles background push notifications for Firebase.
// NOTE: It is essential that this file is named 'firebase-messaging-sw.js'
// and is located in the `public` directory.

// Import the Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// This configuration must be present in the service worker to initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBcuSiFzgdO5EE35J4Br6A1wiS0mzUfgX8",
  authDomain: "cloudtasker-bdfcb.firebaseapp.com",
  projectId: "cloudtasker-bdfcb",
  storageBucket: "cloudtasker-bdfcb.appspot.com",
  messagingSenderId: "731629987076",
  appId: "1:731629987076:web:1ce157d6395a9aa6f35c51",
  measurementId: "G-N3VM0NGVGV"
};

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize the notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 