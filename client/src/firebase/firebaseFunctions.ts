// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, FacebookAuthProvider, getRedirectResult, signInWithPopup } from "firebase/auth"
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from "./firebaseConfig";
import { toast } from "react-toastify";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
getRedirectResult(auth).then(res => {
    console.log("redirect res", res)
}).catch(err => {
    console.log("error getting redirect res", err)
})

const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

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
    signInWithPopup(auth, facebookProvider).then(user => {
        console.log("new user", user)
    }).catch((err) => {
        toast.error("Error logging in with Facebook.")
        console.log("error logging in", err)
    })
}

export const signOut = () => {
    auth.signOut()
}