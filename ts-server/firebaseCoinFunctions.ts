import { increment, updateDoc, doc, DocumentReference } from "firebase/firestore"
import { adminFirestore, firestore } from "./firebase-config"
import { defaultTokenData, getMedalAndTokens, ITokenData } from "../public/src/shared-backend/medalFuncions"
import { TrackName } from "../public/src/shared-backend/shared-stuff"

const tokenRefPath = "tokens"

interface IEndOfRaceInfoPlayerServer {
    totalTime: number
    lapTimes: number[]
    trackName: TrackName
    numberOfLaps: number
    gameTicks: number
    roomTicks: number
    isAuthenticated: boolean
    playerId: string
}

/**
 * Trying to eliminate cheaters, don't know if that will work
 * Do just some obvious shit for now
 */
const isValidRace = (run: IEndOfRaceInfoPlayerServer): boolean => {
    if (run.gameTicks < 10) {
        return false
    }
    if (run.roomTicks < 10) {
        return false
    }
    if (run.numberOfLaps !== run.lapTimes.length) {
        return false
    }
    // no map can be beat under 10 sec?
    if (run.totalTime < 4) {
        return false
    }

    for (let lapTime of run.lapTimes) {
        // lap time under 3 sec is very fast
        if (lapTime < 3) {
            return false
        }
    }

    if (!run.isAuthenticated) return false


    return true
}




/**
 * This might be vaunerable since playerId isn't verified with admin.auth().verifyIdToken(userTokenId)
 */
export const updatePlayersTokens = (data: IEndOfRaceInfoPlayerServer) => {
    console.log("is valid race", isValidRace(data))
    if (isValidRace(data)) {
        const { medal, XP, coins } = getMedalAndTokens(data.trackName, data.numberOfLaps, data.totalTime)
        console.log("medal", medal, "XP:", XP, "coins:", coins)


        const ref = adminFirestore.doc(tokenRefPath + "/" + data.playerId) //doc(firestore, tokenRefPath, data.playerId) as FirebaseFirestore.DocumentReference<any>

        ref.get().then(snap => {
            let update: ITokenData
            if (snap.exists) {
                update = {
                    ...defaultTokenData,
                    ...snap.data()
                }

                update.XP += XP
                update.coins += coins
                update[medal] += 1

            } else {
                update = {
                    ...defaultTokenData,
                    XP,
                    coins
                }
                update[medal] = 1
            }

            console.log("update", update)
            // at least 10 secs later then the last update
            if (!update.lastUpdate || Date.now() > update.lastUpdate * 1000 * 10) {
                update.lastUpdate = Date.now()
                try {
                    ref.set(update).then(() => {
                        console.log("Updated coins!")
                    }).catch(err => {
                        console.warn("Error updating tokens:", err)
                    })
                } catch (err) {
                    console.warn("Error updating tokens:", err)
                }
            } else {
                console.warn("Less then 10 secs since last update of coins by", data.playerId)
            }
        })
    }
}

// setTimeout(() => {
//     updatePlayersTokens({
//         playerId: "test2",
//         trackName: "farm-track",
//         numberOfLaps: 2,
//         totalTime: 100,
//         lapTimes: [50, 50],
//         isAuthenticated: true,
//         roomTicks: 100,
//         gameTicks: 100,
//     })
// }, 500)