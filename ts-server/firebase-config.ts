import { FirebaseOptions, initializeApp } from "firebase/app";
import { initializeApp as adminApp, } from "firebase-admin/app"
import { getDatabase } from "firebase/database";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import * as os from "os"


export const admin = require("firebase-admin");
var serviceAccount = require("./configs/service-account.json");

const aa = adminApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"
});


// const databaseURL = inDevelopment ? "http://localhost:9000?ns=emulatorui" : "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"
const databaseURL = "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"

let config = {
    apiKey: "AIzaSyA3kmeXdI7yRSig8rGsD9G4io7KuYiOweY",
    authDomain: "race-game-a4327.firebaseapp.com",
    projectId: "race-game-a4327",
    storageBucket: "race-game-a4327.appspot.com",
    messagingSenderId: "478150429920",
    appId: "1:478150429920:web:a66c473eddb7501f2c5485",
    measurementId: "G-H6VEJHFZ8H",
    databaseURL
} as FirebaseOptions;

const firebaseApp = initializeApp(config);

export const database = getDatabase(firebaseApp)
export const adminFirestore = getAdminFirestore(aa)

export const firestore = getFirestore(firebaseApp)

export const onLocalHost = os.hostname().includes("Lisa")

/** only works on my PC */
if (onLocalHost) {
    console.log("On localhost")
    connectFirestoreEmulator(firestore, "localhost", 8000)

}
