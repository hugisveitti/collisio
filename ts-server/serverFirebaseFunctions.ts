/**
 * Here should only be functions that cannot be executed on the client for some reason
 */

import { deleteDoc, doc, setDoc } from "@firebase/firestore"
import { adminFirestore, firestore, onLocalHost } from "./firebase-config"
import * as geoip from "geoip-lite"

const availableRoomsRefPath = "availableRooms"
const createdRoomsPath = "created-rooms"

export const removeAvailableRoom = (userId: string) => {
    const roomRef = doc(firestore, availableRoomsRefPath, userId)
    deleteDoc(roomRef).catch(err => {
        console.warn("Error removing room:", err)
    })
}

interface ICreateRoom {
    userId?: string
    roomId?: string
    ip?: string
    geo?: geoip.Lookup | null
}

export const addCreatedRooms = (ip: string, roomId: string, userId: string) => {
    if (onLocalHost) {
        console.log("on local host")
        return
    }
    const ref = adminFirestore.collection(createdRoomsPath).doc()
    const geo = geoip.lookup(ip)
    const obj: ICreateRoom = { ip, roomId, userId, geo }
    let key: keyof typeof obj
    for (key in obj) {
        if (!obj[key]) {
            delete obj[key]
        }
    }

    ref.set({
        geo,
        ip, roomId, userId
    }).then(() => {
        console.log("Saved created room")
    }).catch((err) => {
        console.warn("Error saving created room", err)
    })
}