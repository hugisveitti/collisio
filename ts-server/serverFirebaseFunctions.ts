/**
 * Here should only be functions that cannot be executed on the client for some reason
 */

import { deleteDoc, doc } from "@firebase/firestore"
import { Timestamp } from "firebase-admin/firestore"
import * as geoip from "geoip-lite"
import { Socket } from "socket.io"
import { europeArray } from "./europe"
import { adminFirestore, firestore, onLocalHost } from "./firebase-config"

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
        }).catch((err) => {
            console.warn("Error saving created room", err)
        })
    } catch (err) {
        console.warn("ERROR SAVING ROOM", err)
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

        ip = ip.join("")
    }
    const geo = geoip.lookup(ip)

    const inEurope = isInEurope(geo?.country)
    return { geo, ip, inEurope }
}

export const isInEurope = (country: string | undefined) => {
    if (!country) return false
    let inEurope = false
    for (let c of europeArray) {
        if (c === country) {
            inEurope = true;
            break;
        }
    }
    return inEurope
}