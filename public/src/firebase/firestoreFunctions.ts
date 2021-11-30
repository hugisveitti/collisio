import { addDoc, deleteDoc, doc, getDoc, getDocs } from "@firebase/firestore"
import { collection, onSnapshot, setDoc } from "firebase/firestore"
import { IFollower, IPrivateUser, IPublicUser, IUser } from "../classes/User"

import { firestore } from "./firebaseInit"

const usersCollectionRefPath = "users"
const publicUserCollectionPath = "profiles"
/** for followers and following */
const socialsCollectionPath = "socials"
const followersPath = "followers"
const followingsPath = "followings"

type CallbackStatus = "success" | "error"
export interface IFirestoreCallback<T> {
    status: CallbackStatus
    message: string
    data: T
}

export const setFirestorePrivateUser = async (user: IPrivateUser) => {
    try {
        await setDoc(doc(firestore, usersCollectionRefPath, user.uid), user)
    } catch (e) {
        console.log("Error adding document:", e)
    }
}

export const setFirestorePublicUser = async (user: IPublicUser) => {
    try {
        await setDoc(doc(firestore, publicUserCollectionPath, user.uid), user)
    } catch (e) {
        console.log("Error adding document:", e)
    }
}

export const getFirestorePublicUser = async (userId: string, callback: (res: IFirestoreCallback<IPublicUser | undefined>) => void) => {
    const publicUserDocRef = doc(firestore, publicUserCollectionPath, userId)
    const docSnap = await getDoc(publicUserDocRef)
    if (docSnap.exists()) {
        callback({
            status: "success",
            message: "Successfully got user's public profile",
            data: docSnap.data() as IPublicUser
        })
    } else {
        callback({
            status: "error",
            message: "User's public profile does not exist",
            data: undefined
        })
    }
}

/**
 * 
 * @param userId id of person that is adding a follow
 * @param followingId id of user getting followed
 */
export const addFollow = async (userId: string, userData: IFollower, followingId: string, followingData: IFollower) => {
    try {
        await setDoc(doc(firestore, socialsCollectionPath, userId, followingsPath, followingId), followingData)
    } catch (e) {
        console.log("Error adding following:", e)
    }

    try {
        await setDoc(doc(firestore, socialsCollectionPath, followingId, followersPath, userId), userData)
    } catch (e) {
        console.log("Error adding follower:", e)
    }
}
/**
 * Might want to make these thing atomic
 * @param userId 
 * @param followingId 
 */
export const removeFollow = async (userId: string, followingId: string,) => {
    try {
        await deleteDoc(doc(firestore, socialsCollectionPath, userId, followingsPath, followingId))
    } catch (e) {
        console.log("Error deleting following:", e)
    }

    try {
        await deleteDoc(doc(firestore, socialsCollectionPath, followingId, followersPath, userId),)
    } catch (e) {
        console.log("Error deleting follower:", e)
    }
}

export const isUserFollower = (userId: string, followingId: string, callback: (isFollowing: boolean) => void) => {
    const unsub = onSnapshot(
        doc(firestore, socialsCollectionPath, userId, followingsPath, followingId),
        { includeMetadataChanges: true },
        (doc) => {
            if (doc.exists()) {
                callback(true)
            } else {
                callback(false)
            }
        });
    return unsub
}

export const getUserFollowers = async (userId: string, followersCallback: (followers: IFollower[]) => void) => {
    const followersDocRef = collection(firestore, socialsCollectionPath, userId, followersPath)
    const followersDocSnap = await getDocs(followersDocRef)
    const arr = []
    followersDocSnap.forEach((doc) => {
        arr.push(doc)
    })
    followersCallback(arr as IFollower[])
}

export const getUserFollowings = async (userId: string, followingsCallback: (followings: IFollower[]) => void) => {
    const followingsDocRef = collection(firestore, socialsCollectionPath, userId, followingsPath)
    const followingsDocSnap = await getDocs(followingsDocRef)
    const arr = []
    followingsDocSnap.forEach((doc) => {
        arr.push(doc)
    })
}


/**
 * I don't expect users to follow many users
 */
export const getUserSocials = async (userId: string, followersCallback: (followers: IFollower[]) => void, followingsCallback: (followings: IFollower[]) => void) => {
    getUserFollowers(userId, (followers) => followersCallback(followers))
    getUserFollowings(userId, (followings) => followingsCallback(followings))
}