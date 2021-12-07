/**
 * Here should only be functions that cannot be executed on the client for some reason
 */

import { deleteDoc, doc } from "@firebase/firestore"
import { firestore } from "./firebase-config"

const availableRoomsRefPath = "availableRooms"

export const removeAvailableRoom = (userId: string) => {
    const roomRef = doc(firestore, availableRoomsRefPath, userId)
    deleteDoc(roomRef).catch(err => {
        console.log("Error removing room:", err)
    })
}