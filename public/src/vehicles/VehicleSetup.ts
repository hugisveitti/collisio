import { VehicleType } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";

/**
 * Layout that user has set for a vehicle
 * For example, 
 * - color
 * - exhaust
 * - Spoiler
 */

export const defaultVehicleSetup: VehicleSetup = {
    vehicleType: "normal2",

}


export type VehiclesSetup = {
    [vehicleType in VehicleType]: VehicleSetup
}

export const defaultVehiclesSetup: VehiclesSetup = {
    normal: {
        vehicleType: "normal",
    },
    tractor: {
        vehicleType: "tractor",
    },
    f1: {
        vehicleType: "f1",
    },
    test: {
        vehicleType: "test",
    },
    offRoader: {
        vehicleType: "offRoader",
    },
    sportsCar: {
        vehicleType: "sportsCar",
    },
    normal2: {
        vehicleType: "normal2",
    },
    simpleSphere: {
        vehicleType: "simpleSphere",
    },
    simpleCylindar: {
        vehicleType: "simpleCylindar",
    },
    gokart: {
        vehicleType: "gokart",
    },
    future: {
        vehicleType: "future",
    }
} 