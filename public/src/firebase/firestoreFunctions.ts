import { addDoc, deleteDoc, doc, getDoc, getDocs, where } from "@firebase/firestore"
import { collection, onSnapshot, query, setDoc } from "firebase/firestore"
import { IFollower, IPrivateUser, IPublicUser, IUser, IUserSettings } from "../classes/User"
import { v4 as uuid } from "uuid"

import { firestore } from "./firebaseInit"
import { IRoomInfo } from "../classes/Game"
import { ids } from "webpack"

const usersCollectionRefPath = "users"
const publicUserCollectionPath = "profiles"
/** for followers and following */
const socialsCollectionPath = "socials"
const followersPath = "followers"
const followingsPath = "followings"

const roomDataRefPath = "roomData"
const availableRoomsRefPath = "availableRooms"

const userSettingsRefPath = "settings"


type CallbackStatus = "success" | "error"
export interface IFirestoreCallback<T> {
    status: CallbackStatus
    message: string
    data: T
}

export const setFirestorePrivateUser = async (user: IPrivateUser) => {
    try {
        await setDoc(doc(firestore, usersCollectionRefPath, user.uid), user, { merge: true })
    } catch (e) {
        console.warn("Error adding document:", e)
    }
}

export const setFirestorePublicUser = async (user: IPublicUser) => {

    try {
        await setDoc(doc(firestore, publicUserCollectionPath, user.uid), user, { merge: true, mergeFields: ["latestLogin"] })
    } catch (e) {
        console.warn("Error adding document:", e)
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
        console.warn("Error adding following:", e)
    }

    try {
        await setDoc(doc(firestore, socialsCollectionPath, followingId, followersPath, userId), userData)
    } catch (e) {
        console.warn("Error adding follower:", e)
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
        console.warn("Error deleting following:", e)
    }

    try {
        await deleteDoc(doc(firestore, socialsCollectionPath, followingId, followersPath, userId),)
    } catch (e) {
        console.warn("Error deleting follower:", e)
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
    try {

        const followersDocSnap = await getDocs(followersDocRef)
        const arr = []
        followersDocSnap.forEach((doc) => {
            arr.push(doc.data())
        })
        followersCallback(arr as IFollower[])
    } catch (e) {
        console.warn("Error getting user followers:", e)
    }
}

export const getUserFollowings = async (userId: string, followingsCallback: (followings: IFollower[]) => void) => {
    const followingsDocRef = collection(firestore, socialsCollectionPath, userId, followingsPath)
    const arr: IFollower[] = []
    try {

        const followingsDocSnap = await getDocs(followingsDocRef)
        followingsDocSnap.forEach((doc) => {
            arr.push(doc.data() as IFollower)
        })
        followingsCallback(arr)
    } catch (e) {
        console.warn("Error getting user followings:", e)
    }
    return arr
}

/**
 * 
 * @param userId 
 * @returns list of followers that are online
 */
export const getOnlineFollowings = async (userId: string): Promise<IFollower[]> => {
    console.warn("GET ONLINE FOLLOWINGS NOT IMPLEMENTED")
    return new Promise<IFollower[]>((resolve, reject) => {

    })
}


/**
 * I don't expect users to follow many users
 */
export const getUserSocials = async (userId: string, followersCallback: (followers: IFollower[]) => void, followingsCallback: (followings: IFollower[]) => void) => {
    getUserFollowers(userId, (followers) => followersCallback(followers))
    getUserFollowings(userId, (followings) => followingsCallback(followings))
}

/**
 * Save data about game that is started
 * So we can keep track of games started and not finished
 * @param gameInfo 
 */
export const saveRoom = (roomInfo: IRoomInfo) => {
    const roomKey = uuid()
    const roomRef = doc(firestore, roomDataRefPath, roomKey)
    setDoc(roomRef, roomInfo).catch(err => {
        console.warn("Error saving room:", err)
    })
}


export interface AvailableRoomsFirebaseObject {
    roomId: string
    displayName: string
    userId: string
}

export const addToAvailableRooms = async (userId: string, object: AvailableRoomsFirebaseObject) => {
    const roomRef = doc(firestore, availableRoomsRefPath, userId)
    try {
        await setDoc(roomRef, object)
    } catch (e) {
        console.warn("Error adding available room:", e)
    }

}

export const removeFromAvailableRooms = (userId: string) => {
    const roomRef = doc(firestore, availableRoomsRefPath, userId)
    deleteDoc(roomRef)
}


export const getAllAvailableRooms = async (userId: string): Promise<AvailableRoomsFirebaseObject[]> => {
    return new Promise(async (resolve, reject) => {
        const followings = await getUserFollowings(userId, (followings) => { })
        let fIds = followings.map(f => f.uid)
        fIds = fIds.concat(userId)

        const collectionPath = collection(firestore, availableRoomsRefPath)

        let batches = []
        try {

            while (fIds.length) {
                const batch = fIds.splice(0, 10)

                batches.push(new Promise(async (res) => {

                    const docs = await getDocs(query(collectionPath, where("userId", "in", batch)))
                    const rooms = []
                    docs.forEach(d => rooms.push(d.data()))
                    res(rooms)
                }
                ))
            }


            Promise.all(batches).then(content => {

                resolve(content.flat())
            })
        } catch (err) {
            console.warn("Error getting rooms:", err)
        }

    })
}

export const create10AvailableRoomsListeners = async (userId: string, callback: (rooms: AvailableRoomsFirebaseObject[]) => void) => {

    const followings = await getUserFollowings(userId, (followings) => { })
    let fIds = followings.map(f => f.uid)
    fIds = fIds.concat(userId)

    // const collectionPath = collection(firestore, availableRoomsRefPath)

    // let batches = []
    // while (fIds.length) {
    //     const batch = fIds.splice(0, 10)
    //     batches.push(new Promise(res => {
    //         const q = query(collectionPath, where("userId", "in", fIds))
    //     }))
    // }
    console.warn("fids length needs a fix createAvailableRoomsListeners")
    if (fIds.length > 10) {
        fIds = fIds.slice(fIds.length - 10, fIds.length)
    }
    // fIds can be at most 10, need to fix this
    const q = query(collection(firestore, availableRoomsRefPath), where("userId", "in", fIds))
    const unsub = onSnapshot(
        q,
        (qSnap) => {

            const rooms = []
            qSnap.forEach(doc => {
                rooms.push(doc.data() as AvailableRoomsFirebaseObject)
            })
            callback(rooms)
        });

    return (unsub)
}

/**
 * 
 * settings is a collection with documents such as 
 * - IVehicleSettings
 * 
 * @param userId 
 * @param settings 
 */

export const setDBUserSettings = async (userId: string, settings: IUserSettings) => {
    const userSettingsRef = doc(firestore, usersCollectionRefPath, userId)

    setDoc(userSettingsRef, { settings }, { merge: true })
}



export const getDBUserSettings = async (userId: string, callback: (settings: IUserSettings | undefined) => void) => {


    const userSettingsRef = doc(firestore, usersCollectionRefPath, userId)

    const data = await getDoc(userSettingsRef)
    if (data.exists()) {

        const settings = data.data()["settings"]

        callback(settings as IUserSettings)
    } else {
        callback(undefined)
    }
}


