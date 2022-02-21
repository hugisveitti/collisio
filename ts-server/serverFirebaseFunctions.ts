/**
 * Here should only be functions that cannot be executed on the client for some reason
 */

import { deleteDoc, doc, setDoc } from "@firebase/firestore"
import { adminFirestore, firestore, onLocalHost } from "./firebase-config"
import * as geoip from "geoip-lite"
import { Timestamp } from "firebase-admin/firestore"
import { Socket } from "socket.io"

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
    geo?: geoip.Lookup | null
    date?: Timestamp
    extraData: any
}

export const addCreatedRooms = (roomId: string, userId: string, extraData?: any) => {
    if (onLocalHost) {
        console.log("on local host")
        return
    }
    const ref = adminFirestore.collection(createdRoomsPath).doc()
    let obj: any = {
        roomId,
        userId,
        date: Timestamp.now(),
        extraData
    }
    obj = deleteUndefined(obj)

    try {

        ref.set(obj).then(() => {
            console.log("Saved created room")
        }).catch((err) => {
            console.warn("Error saving created room", err)
        })
    } catch (err) {
        console.log("ERROR SAVING ROOM", err)
    }
}

/**
 * recursively delete all undefined
 * @param obj 
 * @returns obj with all undefined or null removed
 */
export const deleteUndefined = (obj: Object) => {
    let key: keyof typeof obj
    for (key in obj) {
        if (obj[key] === undefined || obj[key] === null) {
            console.log("deleting key", key)
            delete obj[key]
        }
        if (typeof obj[key] === "object") {
            obj[key] = deleteUndefined(obj[key]) as any
        }
    }
    return obj
}

export const getGeoInfo = (socket: Socket) => {
    let ip = socket.handshake.headers['x-forwarded-for'] ?? socket.conn.remoteAddress
    if (Array.isArray(ip)) {
        console.log("ip is a list", ip)
        ip = ip.join("")
    }
    const geo = geoip.lookup(ip)
    return { geo, ip }
}

