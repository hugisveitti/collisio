import { doc, getDoc, setDoc } from "@firebase/firestore"
import { AllOwnership, getDefaultOwnership, getDefaultVehicleOwnership, } from "../shared-backend/ownershipFunctions"
import { VehicleType } from "../shared-backend/shared-stuff"
import { getDefaultItemsOwnership, ItemOwnership } from "../shared-backend/vehicleItems"
import { defaultVehiclesSetup, VehicleSetup, VehiclesSetup } from "../vehicles/VehicleSetup"
import { firestore } from "./firebaseInit"

// Structure:
// ownership/{userId}/{vehicleType}/listOfItemsOwned
const ownershipPath = "ownership"
const vehicleSetupPath = "vehicleSetup"
const itemOwnershipPath = "itemOwnership"


const setDefaultOwnership = (userId: string) => {
    console.log("set default ownershipt", userId)
    const options: RequestInit = {
        method: "POST",
        mode: "same-origin",
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
            userId
        })
    }
    fetch(`/defaultownership`, options)
}


/**
 * 
 * @param userId user to look up
 * @returns a key value of all vehicle types, where the value is a boolean of if user owns it
 */
export const getOwnership = (userId: string): Promise<AllOwnership> => {
    return new Promise<AllOwnership>(async (resolve, reject) => {
        let ownership: AllOwnership = getDefaultOwnership()
        console.log("user id own", userId)
        const ref = doc(firestore, ownershipPath, userId)
        try {
            const res = await getDoc(ref)
            if (res.exists()) {
                console.log("Res of ownership", res.data())


                ownership = {
                    ...ownership,
                    ...res.data()
                }

            } else {
                // set ownership to default
                setDefaultOwnership(userId)
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
                console.log("Res of vehicle setup", res.data)
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
            console.log("set db vehicles setup")
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

// export const buyVehicleItem = (userId: string, vehicleType: VehicleType, item: string): Promise<BuyCallback> => {
//     return new Promise<BuyCallback>((resolve, reject) => {

//         const options: RequestInit = {
//             method: "POST",
//             mode: "same-origin",
//             headers: {
//                 'Content-Type': 'application/json'
//                 // 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//             body: JSON.stringify({
//                 userId,
//                 item,
//                 vehicleType
//             })
//         }
//         fetch("/buyitem", options).then(res => res.json()).then(data => {
//             resolve(data)
//         })
//     })
// }

