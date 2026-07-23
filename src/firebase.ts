// Firebase is loaded via CDN scripts in index.html
declare const firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyCw_mzILKhGqV-Imdwnc70Vv4RI8INAa_I",
  authDomain: "ai-studio-applet-webapp-d5673.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-d5673",
  storageBucket: "ai-studio-applet-webapp-d5673.firebasestorage.app",
  messagingSenderId: "967019944415",
  appId: "1:967019944415:web:16e606b2e2f76a83ac4c6a"
};

let auth: any = null;
let database: any = null;

export function initFirebase() {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    database = firebase.database();
  }
}

export function getAuth() { return auth; }
export function getDatabase() { return database; }
export function getFirebase() { return typeof firebase !== 'undefined' ? firebase : null; }
