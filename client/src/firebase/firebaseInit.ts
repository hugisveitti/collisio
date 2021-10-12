// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, FacebookAuthProvider, getRedirectResult, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import _analytics, { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./firebaseConfig";
import { toast } from "react-toastify";
import { getDatabase } from "firebase/database"
import { createDBUser } from "./firebaseFunctions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// const analytics = getAnalytics(app);

export const database = getDatabase(app)

export const auth = getAuth(app)
getRedirectResult(auth).then(res => {
    // console.log("redirect res", res)
}).catch(err => {
    console.log("error getting redirect res", err)
})

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

export const usersRefPath = "users"
export const highscoreRefPath = "highscore"
export const playerGameDataRefPath = "player-game-data"
export const gameDataRefPath = "game-data"
export const userGamesRefPath = "games"


export const signInWithGoogle = () => {
    signInWithRedirect(auth, googleProvider).then(user => {
        console.log("new user", user)

    }).catch((err) => {
        toast.error("Error logging in with Google.")
        console.log("error logging in", err)
    })
}

export const signInWithFacebook = () => {
    console.log("signing in with facebook")
    signInWithRedirect(auth, facebookProvider).then(user => {
        console.log("new user", user)
    }).catch((err) => {
        toast.error("Error logging in with Facebook. " + err.message)
        console.log("error logging in", err)
    })
}

export const createAccountWithEmail = (email: string, password: string, displayName: string) => {
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
        console.log("Created account with email and password, display", displayName)
        const userInfo = { displayName, uid: userCredential.user.uid, email }
        console.log("creating user", userInfo, auth.currentUser)
        updateProfile(auth.currentUser, { displayName })
    }).catch((err) => {
        toast.error("Error creating account with email " + err.message)
        console.log("Error creating account with email", err)
    })
}

export const signInWithEmail = (email: string, password: string) => {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            toast.error("Error signing in with email. " + errorMessage)
            console.log("error signing in with email", error)
        });
}

export const signOut = () => {
    auth.signOut()
}