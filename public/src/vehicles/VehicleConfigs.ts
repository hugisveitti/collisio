import { Vector3 } from "three";
import { green4, red1, red2 } from "../providers/theme";
import { VehicleType } from "../shared-backend/shared-stuff";
import { itemInArray } from "../utils/utilFunctions";
import { SimpleVector } from "./IVehicle";



// #FF8000 is orange
// #08B0000 is red
//  0x1d8a47 is green
export const possibleVehicleColors = [0x1d8a47, "#8B0000", "#FF8000", 0x61f72a, "#FF8000", green4]

type VehicleClass = "LowPoly" | "Sphere"

export const allVehicleTypes: { name: string, type: VehicleType, vehicleClass?: VehicleClass }[] = [
    { name: "MacNormie", type: "normal2" },
    { name: "Old Normie", type: "normal" },
    { name: "Trakkie Tractor", type: "tractor" },
    { name: "Phil the Phast", type: "f1" },
    // { name: "Monster truck", type: "monsterTruck" },
    { name: "test", type: "test" },
    { name: "Big girl Sally", type: "offRoader" },
    { name: "Thunderparrot", type: "sportsCar" },
    { name: "Round Betty", type: "simpleSphere", vehicleClass: "Sphere" }
]

export const getVehicleClassFromType = (vehicleType: VehicleType): VehicleClass => {
    for (let v of allVehicleTypes) {
        if (v.type === vehicleType) {
            return v.vehicleClass ?? "LowPoly"
        }
    }
    return "LowPoly"
}

export const defaultVehicleType: VehicleType = "normal2"

export const getVehicleNameFromType = (vehicleType: VehicleType) => allVehicleTypes.find(v => v.type === vehicleType)?.name ?? "-"

export const nonactiveVehcileTypes: VehicleType[] = ["test", "normal"]

export const activeVehicleTypes: { name: string, type: VehicleType }[] = allVehicleTypes.filter(vehicle => !itemInArray(vehicle.type, nonactiveVehcileTypes))

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

    towPosition: Vector3
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
    inertia: { x: 4000, y: 2000, z: 4000 },

    maxSpeed: 300,
    towPosition: new Vector3(0, -.5, -4)
}


export const vehicleConfigs = {
    normal: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -3.5,
        wheelRadiusBack: 1 / 2,
        wheelHalfTrackBack: 1.5,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 1.15,
        wheelRadiusFront: 1 / 2,
        wheelHalfTrackFront: 1.5,
        wheelAxisHeightFront: 0,
        suspensionStiffness: 40,
        mass: 800,
        engineForce: 5000,
        breakingForce: 200,
        is4x4: false,
        /// old car
        path: "simple-car.gltf",

        // path: "123456.js"
        towPosition: new Vector3(0, -0.5, -4.7)
    },
    normal2: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -3.30,
        wheelRadiusBack: 1.45 / 2,
        wheelHalfTrackBack: 1.35,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 3.10,
        wheelRadiusFront: 1.45 / 2,
        wheelHalfTrackFront: 1.35,
        wheelAxisHeightFront: 0,
        suspensionStiffness: 40,
        mass: 800,
        engineForce: 5000,
        breakingForce: 200,
        is4x4: false,

        path: "normal-car-2.gltf",
        towPosition: new Vector3(0, -0.9, -4.7)

        // path: "123456.js"
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

        suspensionStiffness: 40,
        suspensionRestLength: 1.6,
        mass: 1600,
        engineForce: 7500,
        breakingForce: 200,
        is4x4: false,

        path: "tractor.gltf",

        towPosition: new Vector3(0, -1.9, -3.2)
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


        mass: 1200,
        engineForce: 6000,
        breakingForce: 200,
        is4x4: true,
        inertia: { x: 3000, y: 2000, z: 3000 },
        suspensionRestLength: 1.6,
        frictionSlip: 27.5,
        maxSuspensionTravelCm: 100,
        suspensionStiffness: 50,
        suspensionDamping: 10,
        suspensionCompression: 20,

        path: "off-roader.gltf",

        towPosition: new Vector3(0, -1.35, -3.3)
    },
    sportsCar: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -2.55,
        wheelRadiusBack: 1.2 / 2,
        wheelHalfTrackBack: 1.3,
        wheelAxisHeightBack: 0.5,

        wheelAxisFrontPosition: 2.85,
        wheelRadiusFront: 1.2 / 2,
        wheelHalfTrackFront: 1.3,
        wheelAxisHeightFront: 0.5,

        suspensionRestLength: 1.4,


        mass: 600,
        engineForce: 12000,
        breakingForce: 300,
        is4x4: false,
        maxSpeed: 320,

        inertia: { x: 3000, y: 2000, z: 4000 },
        towPosition: new Vector3(0, -.5, -4),
        path: "sports-car.gltf"
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
        //  inertia: { x: 4000, y: 1000, z: 4000 },

        //   frictionSlip: 27.5,


        mass: 500,
        engineForce: 5500,
        breakingForce: 250,
        is4x4: false,
        towPosition: new Vector3(0, 0.5, -3.7)

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
    simpleSphere: {
        ...defaultVehicleConfig,
        path: "simple-sphere.gltf",
        mass: 400,
        // this isnt engineforece but the rate angular velocity
        engineForce: 30,
        //  inertia: { x: 100000, y: 100000, z: 100000 }


    }

} as { [key: string]: IVehicleConfig }

// deep copy
/** TODO: not this */
export const initialVehicleConfigs = JSON.parse(JSON.stringify(vehicleConfigs)) as { [key: string]: IVehicleConfig }