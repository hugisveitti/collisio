import { VehicleType } from "../shared-backend/shared-stuff"
import { defaultPreGameSettings, IPreGameSettings } from "./Game"

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
}

export const defaultVehicleSettings = {
    steeringSensitivity: 0.3,
    chaseCameraSpeed: .3,
    useChaseCamera: false,
    vehicleType: "normal"
} as IVehicleSettings

export interface IUserGameSettings {
    useSound: boolean
    useShadows: boolean
}

const defaultUserGameSettings: IUserGameSettings = {
    useShadows: false,
    useSound: true,
}

export interface IUserSettings {
    vehicleSettings: IVehicleSettings,
    userGameSettings: IUserGameSettings
    preGameSettings: IPreGameSettings
}



export const defaultUserSettings = {
    vehicleSettings: defaultVehicleSettings,
    userGameSettings: defaultUserGameSettings,
    preGameSettings: defaultPreGameSettings
} as IUserSettings