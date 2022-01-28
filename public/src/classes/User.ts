import { defaultVehicleType, vehicleColors, VehicleType } from "../shared-backend/shared-stuff"

export const minSteeringSensitivity = 0.1
export const maxSteeringSensitivity = 3
export const steeringSensitivityStep = 0.1

export const maxEngineForce = 20000
export const minEngineForce = 500

export interface IVehicleSettings {
    /** Number to multiply with the radian number
       *  Between 0.1 and 3
       */
    steeringSensitivity: number
    /**
     * Used for testing vehicle
     * between 500 and 50000 ?
     */

    chaseCameraSpeed: number

    /** camera stuck behind vehicle or move more smoothly */
    useChaseCamera: boolean

    /** last selected vehicleType selected by user */
    vehicleType: VehicleType


    cameraZoom: number

    vehicleColor: string

    noSteerNumber: number
}

export const defaultVehicleSettings = {
    steeringSensitivity: 0.2,
    chaseCameraSpeed: .15,
    useChaseCamera: false,
    vehicleType: defaultVehicleType,
    cameraZoom: 1,
    vehicleColor: vehicleColors[0].value,
    noSteerNumber: 4
} as IVehicleSettings

export interface IUserSettings {
    vehicleSettings: IVehicleSettings,
}

export const defaultUserSettings = {
    vehicleSettings: defaultVehicleSettings,
} as IUserSettings


export interface IUser {
    displayName: string
    email: string
    photoURL: string
    uid: string
}

type UserType = "premium" | "standard" | "basic"


export interface IFollower {
    uid: string
    displayName: string
    photoURL: string
}

export const getUserTypeName = (userType: UserType) => {
    switch (userType) {
        case "premium":
            return "Premium"
        case "standard":
            return "Standard"
        default:
            return "Basic"
    }
}

export interface IPublicUser {
    displayName: string
    photoURL: string
    uid: string
    latestLogin?: number
    latestEdit?: number
    creationDate?: number
}

export interface IPrivateUser {
    email: string
    uid: string
    photoURL: string
    latestLogin: number
    displayName: string
    creationDate?: number
}