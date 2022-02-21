import { defaultVehicleColorType, defaultVehicleType, VehicleType } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";

/**
 * Layout that user has set for a vehicle
 * For example, 
 * - color
 * - exhaust
 * - Spoiler
 */

export const defaultVehicleSetup: VehicleSetup = {
    vehicleColor: defaultVehicleColorType,
    vehicleType: defaultVehicleType,
}


export type VehiclesSetup = {
    [vehicleType in VehicleType]: VehicleSetup
}

const sharedVehicleSetup: VehicleSetup = {
    vehicleType: "f1",
    vehicleColor: defaultVehicleColorType
}

export const defaultVehiclesSetup: VehiclesSetup = {
    normal: {
        ...sharedVehicleSetup,
        vehicleType: "normal",
    },
    tractor: {
        ...sharedVehicleSetup,
        vehicleType: "tractor",
    },
    f1: {
        ...sharedVehicleSetup,
        vehicleType: "f1",
    },
    test: {
        ...sharedVehicleSetup,
        vehicleType: "test",
    },
    offRoader: {
        ...sharedVehicleSetup,
        vehicleType: "offRoader",
    },
    sportsCar: {
        ...sharedVehicleSetup,
        vehicleType: "sportsCar",
    },
    normal2: {
        ...sharedVehicleSetup,
        vehicleType: "normal2",
    },
    simpleSphere: {
        ...sharedVehicleSetup,
        vehicleType: "simpleSphere",
    },
    simpleCylindar: {
        ...sharedVehicleSetup,
        vehicleType: "simpleCylindar",
    },
    gokart: {
        ...sharedVehicleSetup,
        vehicleType: "gokart",
    },
    future: {
        ...sharedVehicleSetup,
        vehicleType: "future",
    }
} 