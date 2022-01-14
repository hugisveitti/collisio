// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, FacebookAuthProvider, getAuth, getRedirectResult, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, updateProfile } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { toast } from "react-toastify";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getFirebaseConfig } from "./firebaseConfig";
import { inDevelopment } from "../utils/settings";
import { getStorage } from "@firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(getFirebaseConfig())

// const analytics = getAnalytics(app);

export const database = getDatabase(app)
export const storage = getStorage(app)


const getMyFirestore = () => {
    if (inDevelopment) {
        return getFirestore()
    }
    return getFirestore(app)
}

export const firestore = getMyFirestore()
if (inDevelopment) {

    connectFirestoreEmulator(firestore, "localhost", 8000)
}

export const auth = getAuth(app)
getRedirectResult(auth).then(res => {
    // console.log("redirect res", res)
}).catch(err => {
    console.warn("error getting redirect res", err)
})

type SignInStatus = "success" | "error"

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()



export const signInWithGoogle = (usePopup?: boolean) => {
    if (usePopup) {
        signInWithPopup(auth, googleProvider).then(user => {

        }).catch((err) => {
            toast.error("Error logging in with Google.")
            console.warn("error logging in", err)
        })
    } else {


        signInWithRedirect(auth, googleProvider).then(user => {

        }).catch((err) => {
            toast.error("Error logging in with Google.")
            console.warn("error logging in", err)
        })
    }
}

export const signInWithFacebook = () => {

    signInWithRedirect(auth, facebookProvider).then(user => {

    }).catch((err) => {
        toast.error("Error logging in with Facebook. " + err.message)
        console.warn("error logging in", err)
    })
}

export const createAccountWithEmail = (email: string, password: string, displayName: string) => {
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {

        const userInfo = { displayName, uid: userCredential.user.uid, email }

        updateProfile(auth.currentUser, { displayName })
        setTimeout(() => {
            /**
             * This reload is because the display name wont show in the appcontainer and this is an easy fix
             */
            window.location.reload()
        }, 200)
    }).catch((err) => {
        toast.error("Error creating account with email " + err.message)
        console.warn("Error creating account with email", err)
    })
}

export const signInWithEmail = (email: string, password: string, callback: (status: SignInStatus, message: string) => void) => {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            // ...
            callback("success", "Successfully signed in.")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            callback("error", errorMessage)
            console.warn("error signing in with email", error)
        });
}

export const signOut = (callback: () => void) => {
    auth.signOut().then(() => {
        callback()
    })
}