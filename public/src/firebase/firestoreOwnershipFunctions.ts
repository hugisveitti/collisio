import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "@firebase/firestore"
import { AllOwnership, getDefaultOwnership } from "../shared-backend/ownershipFunctions"
import { TrackName, VehicleType } from "../shared-backend/shared-stuff"
import { getDefaultItemsOwnership, ItemOwnership } from "../shared-backend/vehicleItems"
import { defaultVehiclesSetup, VehiclesSetup } from "../vehicles/VehicleSetup"
import { firestore } from "./firebaseInit"

// Structure:
// ownership/{userId}/{vehicleType}/listOfItemsOwned
const ownershipPath = "ownership"
const vehicleSetupPath = "vehicleSetup"
const itemOwnershipPath = "itemOwnership"
const medalsRefPath = "medals"




/**
 * 
 * @param userId user to look up
 * @returns a key value of all vehicle types, where the value is a boolean of if user owns it
 */
export const getOwnership = (userId: string): Promise<AllOwnership> => {
    return new Promise<AllOwnership>(async (resolve, reject) => {
        let ownership: AllOwnership = getDefaultOwnership()
        const ref = doc(firestore, ownershipPath, userId)
        try {
            const res = await getDoc(ref)
            if (res.exists()) {
                ownership = {
                    ...ownership,
                    ...res.data()
                }

            } else {
                // set ownership to default
            }
            resolve(ownership)
        } catch (err) {
            console.warn("Error getting ownership of vehicles", err)
            reject()
        }
    })
}

export const getVehicleItemsOwnership = (userId: string, vehicleType: VehicleType): Promise<ItemOwnership> => {
    return new Promise<ItemOwnership>(async (resolve, reject) => {
        let itemsOwnership = getDefaultItemsOwnership(vehicleType)
        const ref = doc(firestore, ownershipPath, userId, itemOwnershipPath, vehicleType)
        try {
            const res = await getDoc(ref)
            if (res.exists()) {
                itemsOwnership = {
                    ...itemsOwnership,
                    ...res.data()
                }
            }
            resolve(itemsOwnership)
        } catch (err) {
            console.warn("Error getting items ownership", err)
            resolve(itemsOwnership)
        }
    })
}

export const getVehiclesSetup = (userId: string): Promise<VehiclesSetup> => {
    return new Promise<VehiclesSetup>(async (resolve, reject) => {
        let setup: VehiclesSetup = defaultVehiclesSetup

        const ref = doc(firestore, vehicleSetupPath, userId)
        try {
            const res = await getDoc(ref)
            if (res.exists()) {
                setup = {
                    ...setup,
                    ...res.data()
                }
            }
            resolve(setup)
        } catch (err) {
            console.warn("Error getting vehicle setup", err)
            reject()
        }
    })
}

export const setDBVehiclesSetup = (userId: string, vehiclesSetup: VehiclesSetup): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const ref = doc(firestore, vehicleSetupPath, userId)
        setDoc(ref, vehiclesSetup).then(() => {
            resolve()
        }).catch((err) => {
            console.warn("Error setting vehicle setup", err)
        })
    })
}


interface BuyCallback {
    completed: boolean
    message: string
}

export const buyItem = (userId: string, item: string, vehicleType?: VehicleType): Promise<BuyCallback> => {
    return new Promise<BuyCallback>((resolve, reject) => {

        const options: RequestInit = {
            method: "POST",
            mode: "same-origin",
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify({
                userId,
                item,
                vehicleType
            })
        }
        fetch("/buyitem", options).then(res => res.json()).then(data => {
            resolve(data)
        })
    })
}


export interface ITrackMedals {
    [numberOfLaps: number]: {
        gold?: number
        silver?: number
        bronze?: number
        none?: number
    }
}

export interface IUserMedals {
    [trackName: string]: ITrackMedals
}
export const getUserMedals = (userId: string): Promise<IUserMedals | undefined> => {
    return new Promise<IUserMedals>(async (resolve, reject) => {
        const ref = doc(firestore, medalsRefPath, userId)
        const res = await getDoc(ref)
        if (res.exists()) {
            resolve(res.data() as IUserMedals)
        } else {
            resolve(undefined)
        }
    })
}

