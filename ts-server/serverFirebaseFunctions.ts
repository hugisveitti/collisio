/**
 * Here should only be functions that cannot be executed on the client for some reason
 */

import { deleteDoc, doc, setDoc } from "@firebase/firestore"
import { adminFirestore, firestore } from "./firebase-config"
import * as geoip from "geoip-lite"

const availableRoomsRefPath = "availableRooms"
const createdRoomsPath = "created-rooms"

export const removeAvailableRoom = (userId: string) => {
    const roomRef = doc(firestore, availableRoomsRefPath, userId)
    deleteDoc(roomRef).catch(err => {
        console.warn("Error removing room:", err)
    })
}

export const addCreatedRooms = (ip: string, roomId: string, userId: string) => {
    if (!userId) {
        console.log("No user id, not saving room")
        return
    }
    const ref = adminFirestore.collection(createdRoomsPath).doc()
    const geo = geoip.lookup(ip)
    if (geo) {
        ref.set({
            geo,
            ip, roomId, userId
        }).then(() => {
            console.log("Saved created room with geo")
        }).catch((err) => {
            console.warn("Error saving created room with geo", err)
        })
    } else {
        ref.set({
            ip, roomId, userId
        }).then(() => {
            console.log("Saved created room without geo")
        }).catch((err) => {
            console.warn("Error saving created room without geo", err)
        })
    }

}