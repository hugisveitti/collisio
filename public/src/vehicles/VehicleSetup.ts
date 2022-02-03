import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";

/**
 * Layout that user has set for a vehicle
 * For example, 
 * - color
 * - exhaust
 * - Spoiler
 */
export interface VehicleSetup {
    vehicleType: VehicleType
    color?: VehicleColorType
    exhaust?: string // filename or id
    spoiler?: string
}

export const defaultVehicleSetup: VehicleSetup = {
    vehicleType: "normal2",
    color: "#1d8a47"
}