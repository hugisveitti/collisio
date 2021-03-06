import { Vector3 } from "three";
import { allVehicleTypes, VehicleClass, VehicleColor, vehicleColors, VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { degToRad, itemInArray } from "../utils/utilFunctions";
import { SimpleVector } from "./IVehicle";

export const getVehicleColorOption = (value: VehicleColorType): VehicleColor => {
    for (let option of vehicleColors) {
        if (option.value === value) return option
    }
    return {
        name: "Unknown color", value
    }
}



export const getVehicleClassFromType = (vehicleType: VehicleType): VehicleClass => {
    for (let v of allVehicleTypes) {
        if (v.type === vehicleType) {
            return v.vehicleClass ?? "LowPoly"
        }
    }
    return "LowPoly"
}

export const isVehicleType = (str: string): boolean => {
    const arr = allVehicleTypes.map(v => v.type)
    return (itemInArray(str, arr))
}

export const getVehicleNameFromType = (vehicleType: VehicleType) => allVehicleTypes.find(v => v.type === vehicleType)?.name ?? "-"

export const nonactiveVehcileTypes: VehicleType[] = ["test", "normal", "simpleCylindar"]

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

    // in radians
    maxSteeringAngle: number

    inertia: SimpleVector

    maxSpeed: number

    towPosition: Vector3
    shape?: "box" | "sphere" | "convex"
    centerOfMassOffset: number
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
    inertia: { x: 3000, y: 2000, z: 1000 },

    maxSpeed: 300,
    towPosition: new Vector3(0, -.5, -4),

    maxSteeringAngle: 35 * degToRad
    ,
    centerOfMassOffset: 0

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
        path: "simple-car.glb",

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
        suspensionStiffness: 120,
        mass: 600,
        engineForce: 8000,
        breakingForce: 200,
        is4x4: false,
        maxSpeed: 200,
        frictionSlip: 15.5,
        //  suspensionDamping: 12,
        suspensionCompression: 5,
        centerOfMassOffset: .5,

        path: "normal-car-2.glb",
        towPosition: new Vector3(0, -0.9, -4.7)

        // path: "123456.js"
    },
    tractor: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.8,
        wheelRadiusBack: 2.5 / 2,
        wheelHalfTrackBack: 1.6,
        wheelAxisHeightBack: -.2 - .6,

        wheelAxisFrontPosition: 2.1,
        wheelRadiusFront: 1.7 / 2,
        wheelHalfTrackFront: 1.36,
        wheelAxisHeightFront: -.5 - .6,

        //  suspensionDamping: 12,
        suspensionStiffness: 120,
        suspensionRestLength: 1,
        mass: 1000,
        engineForce: 8000,
        breakingForce: 400,
        is4x4: false,

        path: "tractor.glb",

        towPosition: new Vector3(0, -1.9, -3.2),
        centerOfMassOffset: 2
    },
    monsterTruck: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.9,
        wheelRadiusBack: 1.5 / 2,
        wheelHalfTrackBack: 1.2,
        wheelAxisHeightBack: 0 - .5,

        wheelAxisFrontPosition: 1.55,
        wheelRadiusFront: 1.5 / 2,
        wheelHalfTrackFront: 1.2,
        wheelAxisHeightFront: 0 - .5,

        mass: 1000,
        engineForce: 9000,
        breakingForce: 200,
        is4x4: true,
        inertia: { x: 3000, y: 2000, z: 3000 },
        suspensionRestLength: 1.5,

        maxSuspensionTravelCm: 1500,
        suspensionStiffness: 120,
        //  suspensionDamping: 15,


        path: "low-poly-monster-truck.glb"
    },
    offRoader: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -1.85,
        wheelRadiusBack: 1.8 / 2,
        wheelHalfTrackBack: 1.25,
        wheelAxisHeightBack: -.2 - .5,

        wheelAxisFrontPosition: 1.95,
        wheelRadiusFront: 1.8 / 2,
        wheelHalfTrackFront: 1.25,
        wheelAxisHeightFront: -0.2 - .5,


        mass: 1200,
        engineForce: 9000,
        breakingForce: 400,
        is4x4: true,

        suspensionRestLength: 1.6 - .5,
        frictionSlip: 15.5,
        maxSuspensionTravelCm: 100,
        suspensionStiffness: 120,
        //  suspensionDamping: 12,
        suspensionCompression: 20,

        path: "off-roader.glb",
        centerOfMassOffset: 1.5,

        towPosition: new Vector3(0, -1.35, -3.3)
    },
    sportsCar: {
        ...defaultVehicleConfig,
        wheelAxisBackPosition: -2.55,
        wheelRadiusBack: 1.2 / 2,
        wheelHalfTrackBack: 1.3,

        wheelAxisFrontPosition: 2.85,
        wheelRadiusFront: 1.2 / 2,
        wheelHalfTrackFront: 1.3,

        // wheelAxisHeightFront: 0.5,
        // wheelAxisHeightBack: 0.5,
        // suspensionRestLength: 1.4,

        wheelAxisHeightFront: 0,
        wheelAxisHeightBack: 0,
        suspensionRestLength: 0.9,


        mass: 600,
        engineForce: 12500,
        breakingForce: 300,
        is4x4: false,
        maxSpeed: 350,
        frictionSlip: 4.3, //3.5
        suspensionStiffness: 50,
        //  suspensionDamping: // 12,

        //  inertia: { x: 3000, y: 5000, z: 4000 },
        towPosition: new Vector3(0, -.5, -4),
        path: "sports-car.glb",

        centerOfMassOffset: 1
    },
    f1: {
        ...defaultVehicleConfig,
        path: "F1-car.glb",

        wheelAxisBackPosition: -2.7,
        wheelRadiusBack: 0.95 / 2,
        wheelHalfTrackBack: 1.3,
        wheelAxisHeightBack: 0.,

        wheelAxisFrontPosition: 2.95,
        wheelRadiusFront: 0.95 / 2,
        wheelHalfTrackFront: 1.3,
        wheelAxisHeightFront: 0,

        suspensionRestLength: .4,
        //  inertia: { x: 4000, y: 1000, z: 4000 },


        // maxSuspensionTravelCm: 500,
        // suspensionStiffness: 120,
        // suspensionDamping: 12,
        frictionSlip: 5.5,
        mass: 300,
        engineForce: 6500,
        breakingForce: 250,
        is4x4: false,
        towPosition: new Vector3(0, 0.5, -3.7),
        centerOfMassOffset: .5

    },
    test: {
        ...defaultVehicleConfig,
        path: "test-vehicle.glb",
        wheelAxisBackPosition: -3.5,
        wheelRadiusBack: 2 / 2,
        wheelHalfTrackBack: 3,
        wheelAxisHeightBack: -.25,

        wheelAxisFrontPosition: 2.5,
        wheelRadiusFront: 2 / 2,
        wheelHalfTrackFront: 3,
        wheelAxisHeightFront: -.25,
        mass: 200,
        engineForce: 5000,
        breakingForce: 100,
        suspensionRestLength: .7,
        is4x4: false,
        centerOfMassOffset: 1
        //   shape: "convex"
    },
    future: {
        ...defaultVehicleConfig,
        path: "future-vehicle.glb",
        wheelAxisBackPosition: -1.9, // -2.5 * .5,
        wheelRadiusBack: 1.5 / 2, // 2 / 2,
        wheelHalfTrackBack: 1.76, // 2.35,
        wheelAxisHeightBack: .41,// .55,

        wheelAxisFrontPosition: 2.75,  // 3.75,
        wheelRadiusFront: 1.5 / 2, // 2 / 2,
        wheelHalfTrackFront: 1.76, // 2.35,
        wheelAxisHeightFront: .41,// .55,

        suspensionCompression: 1,
        suspensionStiffness: 75,
        // suspensionDamping: 5,
        maxSuspensionTravelCm: 500,
        maxSpeed: 270,


        mass: 300,
        engineForce: 8500,
        breakingForce: 200,
        maxSteeringAngle: 25 * degToRad,
        suspensionRestLength: .87,
        is4x4: false,
        centerOfMassOffset: .75
    },
    gokart: {
        ...defaultVehicleConfig,

        wheelRadiusBack: 0.63 / 2,
        wheelRadiusFront: 0.63 / 2,

        wheelAxisBackPosition: -1.3,
        wheelHalfTrackBack: 1.2,
        wheelAxisHeightBack: 0,

        wheelAxisFrontPosition: 1.3,
        wheelHalfTrackFront: 1,
        wheelAxisHeightFront: 0,

        suspensionRestLength: .35,
        suspensionStiffness: 150,

        //     suspensionDamping: 20,

        maxSpeed: 250,
        mass: 200,
        engineForce: 2500,
        frictionSlip: 15.5,
        path: "gokart.glb",
        maxSteeringAngle: 20 * degToRad,
        centerOfMassOffset: .5
    },
    simpleSphere: {
        ...defaultVehicleConfig,
        path: "simple-sphere.glb",
        mass: 400,
        // this isnt engineforece but the rate angular velocity
        engineForce: 300,
        //  inertia: { x: 100000, y: 100000, z: 100000 }
    },

    simpleCylindar: {
        ...defaultVehicleConfig,
        path: "simple-cylindar.glb",
        mass: 400,
        // this isnst engineforece but the rate angular velocity
        engineForce: 300,
        inertia: { x: 100, y: 100, z: 100 }
    }

} as { [key: string]: IVehicleConfig }

// deep copy
/** TODO: not this */
export const initialVehicleConfigs = JSON.parse(JSON.stringify(vehicleConfigs)) as { [key: string]: IVehicleConfig }





