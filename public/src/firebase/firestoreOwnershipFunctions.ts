import { doc, getDoc } from "@firebase/firestore"
import { AllOwnership, getDefaultOwnership, getDefaultVehicleOwnership, } from "../shared-backend/ownershipFunctions"
import { VehicleType } from "../shared-backend/shared-stuff"
import { VehicleSetup } from "../vehicles/VehicleSetup"
import { firestore } from "./firebaseInit"

// Structure:
// ownership/{userId}/{vehicleType}/listOfItemsOwned
const ownershipPath = "ownership"
const vehicleSetupPath = "vehicleSetup"


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




export const getVechileSetup = (userId: string, vehicleType: VehicleType): Promise<VehicleSetup> => {
    return new Promise<VehicleSetup>(async (resolve, reject) => {
        let setup: VehicleSetup = { vehicleType }

        const ref = doc(firestore, vehicleSetupPath, userId, vehicleType)
        try {
            const res = await getDoc(ref)
            if (res.exists) {
                console.log("Res of vehicle setup", res.data)
                setup = res.data() as VehicleSetup

            }
            resolve(setup)
        } catch (err) {
            console.warn("Error getting vehicle setup", err)
            reject()
        }
    })
}


interface BuyCallback {
    completed: boolean
    message: string
}

export const buyItem = (userId: string, item: string): Promise<BuyCallback> => {
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
                item
            })
        }
        fetch("/buyitem", options).then(res => res.json()).then(data => {
            resolve(data)
        })
    })
}