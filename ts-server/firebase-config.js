"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLocalHost = exports.firestore = exports.adminFirestore = exports.database = exports.admin = void 0;
var app_1 = require("firebase/app");
var app_2 = require("firebase-admin/app");
var database_1 = require("firebase/database");
var firestore_1 = require("firebase-admin/firestore");
var firestore_2 = require("firebase/firestore");
exports.admin = require("firebase-admin");
var serviceAccount = require("./configs/race-game-a4327-firebase-adminsdk-jw2qt-30f56f1644.json");
var aa = (0, app_2.initializeApp)({
    credential: exports.admin.credential.cert(serviceAccount),
    databaseURL: "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"
});
// const databaseURL = inDevelopment ? "http://localhost:9000?ns=emulatorui" : "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"
var databaseURL = "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app";
var config = {
    apiKey: "AIzaSyA3kmeXdI7yRSig8rGsD9G4io7KuYiOweY",
    authDomain: "race-game-a4327.firebaseapp.com",
    projectId: "race-game-a4327",
    storageBucket: "race-game-a4327.appspot.com",
    messagingSenderId: "478150429920",
    appId: "1:478150429920:web:a66c473eddb7501f2c5485",
    measurementId: "G-H6VEJHFZ8H",
    databaseURL: databaseURL
};
var firebaseApp = (0, app_1.initializeApp)(config);
exports.database = (0, database_1.getDatabase)(firebaseApp);
exports.adminFirestore = (0, firestore_1.getFirestore)(aa);
exports.firestore = (0, firestore_2.getFirestore)(firebaseApp);
exports.onLocalHost = false; // os.hostname().includes("Lisa")
/** only works on my PC */
if (exports.onLocalHost) {
    console.log("On localhost");
    (0, firestore_2.connectFirestoreEmulator)(exports.firestore, "localhost", 8000);
}
