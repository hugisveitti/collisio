import { SimpleVector } from "./IVehicle"

interface IVehicleConfig {
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
}

const defaultVehicleConfig: IVehicleConfig = {
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
    breakingForce: 100,
    suspensionStiffness: 100,
    suspensionDamping: 5,
    suspensionCompression: 2.4,
    suspensionRestLength: 0.35,
    maxSuspensionTravelCm: 300,
    maxSuspensionForce: 50000,
    frictionSlip: 3.5,
    rollInfluence: .01,
    inertia: { x: 15000, y: 10000, z: 50000 }
}


export type VehicleType = "normal" | "tractor" | "f1" | "test" | "monsterTruck"

export const vehicleConfigs = {
    normal: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.65,
        wheelRadiusBack: 0.63 / 2,
        wheelHalfTrackBack: .9,
        wheelAxisHeightBack: -.75,

        wheelAxisFrontPosition: 1.35,
        wheelRadiusFront: 0.63 / 2,
        wheelHalfTrackFront: .9,
        wheelAxisHeightFront: -.75,

        mass: 800,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: false,

        path: "simple-low-poly-car.gltf",

        suspensionRestLength: 0.4,
    },
    tractor: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.8,
        wheelRadiusBack: 2.4 / 2,
        wheelHalfTrackBack: 1.6,
        wheelAxisHeightBack: -1.8,

        wheelAxisFrontPosition: 2.1,
        wheelRadiusFront: 1.6 / 2,
        wheelHalfTrackFront: 1.36,
        wheelAxisHeightFront: -2.1,

        mass: 1600,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: true,

        path: "low-poly-tractor.gltf"
    },
    monsterTruck: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.9,
        wheelRadiusBack: 1.5 / 2,
        wheelHalfTrackBack: 1.2,
        wheelAxisHeightBack: -.8,

        wheelAxisFrontPosition: 1.55,
        wheelRadiusFront: 1.5 / 2,
        wheelHalfTrackFront: 1.2,
        wheelAxisHeightFront: -.8,

        mass: 1000,
        engineForce: 5000,
        breakingForce: 100,
        is4x4: true,

        suspensionStiffness: 100,
        suspensionDamping: 4.6,
        suspensionCompression: 8.8,
        suspensionRestLength: 0.8,

        path: "low-poly-monster-truck.gltf"
    },
    f1: {
        ...defaultVehicleConfig,
        path: "low-poly-f1-car.gltf",

        wheelAxisBackPosition: -2.65,
        wheelRadiusBack: 0.95 / 2,
        wheelHalfTrackBack: 1.3,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 2.75,
        wheelRadiusFront: 0.95 / 2,
        wheelHalfTrackFront: 1.3,
        wheelAxisHeightFront: 0,

        suspensionRestLength: .6,


        frictionSlip: 2,

        mass: 1000,
        engineForce: 10000,
        breakingForce: 200,
        is4x4: false,

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
