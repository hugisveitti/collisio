import { FieldValue } from "firebase-admin/firestore"
import { defaultTokenData, getMedalAndTokens, ITokenData, MedalType } from "../public/src/shared-backend/medalFuncions"
import { allCosts, AllOwnableItems, getDefaultOwnership } from "../public/src/shared-backend/ownershipFunctions"
import { getItemName, TrackName, VehicleType } from "../public/src/shared-backend/shared-stuff"
import { getDefaultItemsOwnership, vehicleItems } from "../public/src/shared-backend/vehicleItems"
import { adminFirestore } from "./firebase-config"

const tokenRefPath = "tokens"
const medalsRefPath = "medals"
const ownershipPath = "ownership"
const vehicleSetupPath = "vehicleSetup"
const itemOwnershipPath = "itemOwnership"

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
        console.log("not valid race, gameTicks:", run.gameTicks)
        return false
    }
    if (run.roomTicks < 10) {
        console.log("not valid race, roomTicks:", run.roomTicks)

        return false
    }
    if (run.numberOfLaps !== run.lapTimes.length) {
        console.log("not run.numberOfLaps and lapTimes don't match:", run.numberOfLaps, run.lapTimes.length)
        return false
    }
    // no map can be beat under 10 sec?
    if (run.totalTime < 4) {
        console.log("Total time under 4 seconds", run.totalTime)
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


const updateTrackNumberOfLapsMedal = (userId: string, trackName: string, numberOfLaps: number, medal: MedalType) => {
    const ref = adminFirestore.collection(medalsRefPath).doc(userId)//.collection(trackName).doc(numberOfLaps.toString())
    // want to keep all the medals of a track together
    // will be max og like 30 fields, if each numberoflaps and medal is a field
    // this will give the possibility of searching without going into subcollections
    // I will just have to parse the results myself
    //  const medalString = `${numberOfLaps}-${medal}`



    const update: any = {}
    update[trackName] = {}
    update[trackName][numberOfLaps] = {}
    update[trackName][numberOfLaps][medal] = FieldValue.increment(1)


    ref.set(update, { merge: true }
    ).then(() => {
        console.log("updated medals")
    }).catch((err) => {
        console.warn("Error updating medals", err)
    })
}

/**
 * This might be vaunerable since playerId isn't verified with admin.auth().verifyIdToken(userTokenId)
 */
export const updatePlayersTokens = (data: IEndOfRaceInfoPlayerServer) => {
    console.log("is valid race", isValidRace(data))
    if (isValidRace(data)) {
        const { medal, XP, coins } = getMedalAndTokens(data.trackName, data.numberOfLaps, data.totalTime)
        console.log("medal", medal, "XP:", XP, "coins:", coins)

        updateTrackNumberOfLapsMedal(data.playerId, data.trackName, data.numberOfLaps, medal)
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
            if (!update.lastUpdate || Date.now() > update.lastUpdate + (1000 * 10)) {
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


interface BuyCallback {
    completed: boolean
    message: string
}



/**
 * Get user coins, get user items, see if user already owns item, see if user has enough coins
 * If user has enough coins and does not own the item, the item will be bought
 * @param userId 
 * @param item, item to buy
 * @param vehicleType, if defined then we assume the item to be a vehicle item 
 *  and search for costs and ownership in different places
 * @returns object with {completed, message}
 */
export const buyItem = (userId: string, item: AllOwnableItems, vehicleType?: VehicleType): Promise<BuyCallback> => {
    return new Promise<BuyCallback>(async (resolve, reject) => {
        console.log("User buying item", userId, item)
        const tokenRef = adminFirestore.doc(tokenRefPath + "/" + userId)
        const tokensRes = await tokenRef.get()
        let tokenData = defaultTokenData
        let coins = 0
        if (tokensRes.exists) {
            tokenData = {
                ...defaultTokenData,
                ...tokensRes.data()
            }
            coins = tokenData.coins
        }


        // TODO , item name 
        let itemName = vehicleType ? vehicleItems[vehicleType][item].name : getItemName(item)
        const itemCost = vehicleType ? vehicleItems[vehicleType][item].cost : allCosts[item]

        console.log("item cost", itemCost)
        if (itemCost === undefined) {
            resolve({
                completed: false,
                message: `Unknown item ${item}`
            })
            return
        }

        if (coins < itemCost) {
            resolve({
                completed: false,
                message: `Not enough money, you need ${Math.ceil(itemCost - coins)} coins to buy this item`
            })
            return
        }

        // see if owned
        const ownershipRef = vehicleType ?
            adminFirestore.doc(ownershipPath + "/" + userId + "/" + itemOwnershipPath + "/" + vehicleType)
            : adminFirestore.doc(ownershipPath + "/" + userId)
        let owned = await ownershipRef.get()
        let ownership = vehicleType ? getDefaultItemsOwnership(vehicleType) : getDefaultOwnership()
        if (owned.exists) {
            ownership = {
                ...ownership,
                ...owned.data()
            }
        }

        if (ownership[item]) {
            resolve({
                completed: false,
                message: `Item ${itemName} is already owned`
            })
            return
        }

        // this should be atomic
        // can buy
        ownership[item] = true
        const newTokens = {
            ...tokenData,
            coins: coins - itemCost
        }

        const batch = adminFirestore.batch()


        if (owned.exists) {
            batch.update(ownershipRef, ownership)
        } else {
            console.log("owner ship does not exist")
            batch.set(ownershipRef, ownership)

        }
        batch.update(tokenRef, newTokens)

        // think this needs to be changed for item

        batch.commit().then(() => {
            resolve({
                completed: true,
                message: `Item ${itemName} was bought!`
            })
        }).catch(err => {
            console.warn("Error committing buy batch", err)
            resolve({
                completed: false,
                message: "Unknow error buying item"
            })
        })
    })
}

/**
 * Set default owner ship,
 * use merge, otherwise users could destroy accounts of each other
 */
export const setDefaultOwnership = (userId: string): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {

        const ref = adminFirestore.doc(ownershipPath + "/" + userId) //doc(firestore, tokenRefPath, data.playerId) as FirebaseFirestore.DocumentReference<any>
        console.log("setting default ownership")
        const defaultOwnership = getDefaultOwnership()
        try {

            await ref.set(defaultOwnership)
            resolve()
        } catch (err) {
            console.warn("error setting default ownership", err)
            resolve()
        }
    })

}