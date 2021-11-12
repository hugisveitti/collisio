import { VehicleType } from "../shared-backend/shared-stuff"
import { stringInArray } from "../utils/utilFunctions"
import { SimpleVector } from "./IVehicle"


// #FF8000 is orange
// #08B0000 is red
//  0x1d8a47 is green
export const possibleVehicleColors = [0x1d8a47, "#8B0000", "#FF8000", 0x61f72a, "#FF8000", "black", "white"]


export const allVehicleTypes: { name: string, type: VehicleType }[] = [
    { name: "Normal", type: "normal" },
    { name: "Tractor", type: "tractor" },
    { name: "F1", type: "f1" },
    // { name: "Monster truck", type: "monsterTruck" },
    { name: "test", type: "test" },
    { name: "Off roader", type: "offRoader" }
]

export const nonactiveVehcileTypes: VehicleType[] = ["test"]

export const activeVehicleTypes: { name: string, type: VehicleType }[] = allVehicleTypes.filter(vehicle => !stringInArray(vehicle.type, nonactiveVehcileTypes))

export interface IVehicleConfig {
    wheelAxisBackPosition: number
    wheelRadiusBack: number
    wheelHalfTrackBack: number
    wheelAxisHeightBack: number

    wheelAxisFrontPosition: number
    wheelRadiusFront: number
    wheelHalfTrackFront: number
    wheelAxisHeightFront: number

    is4x4: boolean

    path: string

    mass: number
    engineForce: number
    breakingForce: number
    suspensionStiffness: number
    suspensionDamping: number
    suspensionCompression: number
    suspensionRestLength: number
    maxSuspensionTravelCm: number
    maxSuspensionForce: number
    frictionSlip: number
    rollInfluence: number

    inertia: SimpleVector

    maxSpeed: number
}

export const defaultVehicleConfig: IVehicleConfig = {
    wheelAxisBackPosition: -1,
    wheelRadiusBack: 1,
    wheelHalfTrackBack: 1,
    wheelAxisHeightBack: -1,

    wheelAxisFrontPosition: 1,
    wheelRadiusFront: 1,
    wheelHalfTrackFront: 1,
    wheelAxisHeightFront: -1,

    is4x4: false,

    path: "",

    mass: 1000,
    engineForce: 5000,
    breakingForce: 200,
    suspensionStiffness: 100,
    suspensionDamping: 4,
    suspensionCompression: 2.4,
    suspensionRestLength: 1.1,
    maxSuspensionTravelCm: 1500,
    maxSuspensionForce: 50000,
    frictionSlip: 8.5,
    rollInfluence: .01,
    inertia: { x: 12000, y: 2000, z: 12000 },

    maxSpeed: 300,
}


export const vehicleConfigs = {
    normal: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -3.5,
        wheelRadiusBack: 1 / 2,
        wheelHalfTrackBack: 1.5,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 1.35,
        wheelRadiusFront: 1 / 2,
        wheelHalfTrackFront: 1.5,
        wheelAxisHeightFront: 0,

        mass: 800,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: false,

        path: "simple-car.gltf",


    },
    tractor: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.8,
        wheelRadiusBack: 2.4 / 2,
        wheelHalfTrackBack: 1.6,
        wheelAxisHeightBack: -.2,

        wheelAxisFrontPosition: 2.1,
        wheelRadiusFront: 1.6 / 2,
        wheelHalfTrackFront: 1.36,
        wheelAxisHeightFront: -.5,

        suspensionRestLength: 1.6,
        mass: 1600,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: true,

        path: "tractor.gltf"
    },
    monsterTruck: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.9,
        wheelRadiusBack: 1.5 / 2,
        wheelHalfTrackBack: 1.2,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 1.55,
        wheelRadiusFront: 1.5 / 2,
        wheelHalfTrackFront: 1.2,
        wheelAxisHeightFront: 0,

        mass: 1000,
        engineForce: 9000,
        breakingForce: 200,
        is4x4: true,
        inertia: { x: 3000, y: 2000, z: 3000 },
        suspensionRestLength: 1.5,

        maxSuspensionTravelCm: 1500,
        suspensionStiffness: 65,
        suspensionDamping: 10,



        path: "low-poly-monster-truck.gltf"
    },
    offRoader: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.85,
        wheelRadiusBack: 1.8 / 2,
        wheelHalfTrackBack: 1.25,
        wheelAxisHeightBack: -.2,

        wheelAxisFrontPosition: 1.95,
        wheelRadiusFront: 1.8 / 2,
        wheelHalfTrackFront: 1.25,
        wheelAxisHeightFront: -0.2,


        mass: 800,
        engineForce: 4500,
        breakingForce: 100,
        is4x4: true,
        inertia: { x: 3000, y: 2000, z: 3000 },
        suspensionRestLength: 1.6,

        maxSuspensionTravelCm: 100,
        suspensionStiffness: 200,
        suspensionDamping: 10,
        suspensionCompression: 20,



        path: "off-roader.gltf"
    },
    f1: {
        ...defaultVehicleConfig,
        path: "F1-car.gltf",

        wheelAxisBackPosition: -2.65,
        wheelRadiusBack: 0.95 / 2,
        wheelHalfTrackBack: 1.3,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 2.85,
        wheelRadiusFront: 0.95 / 2,
        wheelHalfTrackFront: 1.3,
        wheelAxisHeightFront: 0,

        suspensionRestLength: .4,


        mass: 1000,
        engineForce: 10000,
        breakingForce: 200,
        is4x4: false,

        inertia: { x: 3000, y: 2000, z: 4000 },



    },
    test: {
        ...defaultVehicleConfig,
        path: "low-poly-test-vehicle.gltf",
        wheelAxisBackPosition: -2.5,
        wheelRadiusBack: 0.85 / 2,
        wheelHalfTrackBack: 3.75,
        wheelAxisHeightBack: -1.25,

        wheelAxisFrontPosition: 2,
        wheelRadiusFront: 0.85 / 2,
        wheelHalfTrackFront: 2.75,
        wheelAxisHeightFront: -1.25,
        mass: 800,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: false,
    },

} as { [key: string]: IVehicleConfig }

// deep copy
/** TODO: not this */
export const initialVehicleConfigs = JSON.parse(JSON.stringify(vehicleConfigs)) as { [key: string]: IVehicleConfig }