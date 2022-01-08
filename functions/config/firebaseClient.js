const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: "neogasogaeseo-9aaf5.firebaseapp.com",
    projectId: "neogasogaeseo-9aaf5",
    storageBucket: "neogasogaeseo-9aaf5.appspot.com",
    messagingSenderId: "484984894446",
    appId: "1:484984894446:web:355b29df25cdfe598f14ff",
    measurementId: "G-PLH09LNKKY"
  };


const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
