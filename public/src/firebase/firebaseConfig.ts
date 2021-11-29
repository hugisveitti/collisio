import { FirebaseOptions } from "firebase/app";
import { inDevelopment } from "../utils/settings";


export const getFirebaseConfig = () => {
    const databaseURL = inDevelopment ? "http://localhost:9000?ns=emulatorui" : "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"
    // const databaseURL = "https://race-game-a4327-default-rtdb.europe-west1.firebasedatabase.app"

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

    return config
}