
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
    engineForce: number
}

export interface IUserSettings {
    vehicleSettings: IVehicleSettings
}

export const defaultVehicleSettings = {
    steeringSensitivity: 0.2,
    engineForce: 5000
} as IVehicleSettings

export const defaultUserSettings = {
    vehicleSettings: defaultVehicleSettings
} as IUserSettings