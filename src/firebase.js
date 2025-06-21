import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcuSiFzgdO5EE35J4Br6A1wiS0mzUfgX8",
  authDomain: "cloudtasker-bdfcb.firebaseapp.com",
  projectId: "cloudtasker-bdfcb",
  storageBucket: "cloudtasker-bdfcb.appspot.com",
  messagingSenderId: "731629987076",
  appId: "1:731629987076:web:1ce157d6395a9aa6f35c51",
  measurementId: "G-N3VM0NGVGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Requests permission to receive push notifications and returns the token.
 * @param {string} vapidKey Your VAPID key from Firebase Cloud Messaging.
 * @returns {Promise<string|null>} The FCM token or null if permission is denied.
 */
export const requestForToken = (vapidKey) => {
  return getToken(messaging, { vapidKey: vapidKey })
    .then((currentToken) => {
      if (currentToken) {
        console.log('FCM Registration Token:', currentToken);
        // This token needs to be sent to your server to send notifications
        return currentToken;
      } else {
        // User has not granted permission
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token. ', err);
      return null;
    });
}; 