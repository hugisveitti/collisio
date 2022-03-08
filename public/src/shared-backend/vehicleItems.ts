import { VehicleColorType, VehicleType } from "./shared-stuff"

export type ItemType = "exhaust" | "spoiler" | "wheelGuards"
export const possibleVehicleItemTypes: ItemType[] = ["exhaust", "spoiler", "wheelGuards"]
export const getVehicleItemNameFromType = (type: ItemType) => {
    switch (type) {
        case "exhaust":
            return "Exhaust"
        case "spoiler":
            return "Spoiler"
        case "wheelGuards":
            return "Wheel guards"
        default:
            return type
    }
}

/** an item can modify the config of a car */
interface IVehicleProps {
    mass?: number
    engineForce?: number
    frictionSlip?: number
    suspensionStiffness?: number
    suspensionRestLength?: number
    maxSpeed?: number
}

const defaultVehicleProps: IVehicleProps = {
    mass: 0,
    engineForce: 0,
    frictionSlip: 0,
    suspensionRestLength: 0,
    suspensionStiffness: 0
}

export interface ItemProperties extends IVehicleProps {
    /** path of item */
    path: string
    id: string
    name: string
    cost: number
    type: ItemType
    physicalObject?: boolean
}

type VehicleProps = "engineForce" | "mass" | "frictionSlip" | "suspensionStiffness" | "suspensionRestLength" | "maxSpeed"

export const possibleVehicleMods: { name: string, type: VehicleProps, max: number, min: number }[] = [
    {
        name: "Acceleration", type: "engineForce", max: 14000, min: 3000,
    },
    {
        name: "Speed", type: "maxSpeed", max: 400, min: 100,
    },
    {
        name: "Mass", type: "mass", max: 1500, min: 0
    },
    {
        name: "Handling", type: "frictionSlip", max: 22, min: 0
    },
    {
        name: "Suspension stiffness", type: "suspensionStiffness", max: 180, min: 30
    },
    {
        name: "Suspension Rest Length", type: "suspensionRestLength", min: 0, max: 2
    }
];

export interface VehicleSetup {
    vehicleType: VehicleType
    vehicleColor: VehicleColorType
    exhaust?: ItemProperties // filename or id
    spoiler?: ItemProperties
    wheelGuards?: ItemProperties
}


interface CarItems {
    [itempath: string]: ItemProperties
}
// have to have some kind of low tier, mid tier and high tier items

const sportsCarItems: CarItems = {
    exhaust1: {
        path: "exhaust1",
        id: "sportsCar-exhaust1",
        name: "Willie",
        type: "exhaust",
        cost: 10,
        engineForce: 100,
        maxSpeed: 10,
    },
    exhaust2: {
        path: "exhaust2",
        id: "sportsCar-exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 200,
        cost: 200,
        maxSpeed: 11
    },
    exhaust3: {
        id: "sportsCar-exhaust3",
        path: "exhaust3",
        name: "Executive",
        type: "exhaust",
        cost: 800,
        engineForce: 300,
        mass: 110,
        frictionSlip: -1,
        maxSpeed: -5
    },
    exhaust4: {
        id: "sportsCar-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Ernie Johnson",
        engineForce: 350,
        mass: 80,
        maxSpeed: -5,
        cost: 1000,
    },
    exhaust5: {
        id: "sportsCar-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Sad Charlie",
        engineForce: 380,
        frictionSlip: -0.5,
        maxSpeed: -1,
        mass: 100,
        cost: 200000
    },
    spoiler1: {
        id: "sportsCar-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: .5,
        mass: 100,
        engineForce: -100,
        maxSpeed: -15
    },
    spoiler2: {
        id: "sportsCar-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 0.8, //3.2,
        mass: -120,
        engineForce: -100,
        maxSpeed: -10
    },
    spoiler3: {
        id: "sportsCar-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 0.7, ////2.3,
        mass: -130,
        engineForce: -80,
        maxSpeed: 2
    },
    spoiler4: {
        id: "sportsCar-spoiler4",
        path: "spoiler4",
        type: "spoiler",
        name: "Sarah",
        cost: 2500,
        frictionSlip: 0.8, //3,
        mass: 230,
        engineForce: -120,
        maxSpeed: -2
    },
    spoiler5: {
        id: "sportsCar-spoiler5",
        path: "spoiler5",
        type: "spoiler",
        name: "Sylvester",
        cost: 5000,
        frictionSlip: 0.8,//3,
        mass: 80,
        engineForce: 150,
    },
    wheelGuards1: {
        id: "sportsCar-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 0.8,//2,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
}

const f1Items: CarItems = {
    exhaust1: {
        id: "f1-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 25,
        maxSpeed: 2
    },
    exhaust2: {
        id: "f1-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200,
        maxSpeed: 4
    },
    exhaust3: {
        id: "f1-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
        maxSpeed: 8
    },
    exhaust4: {
        id: "f1-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 400,
        frictionSlip: -1,
        suspensionRestLength: -.05,
        maxSpeed: 12

    },
    exhaust5: {
        id: "f1-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Everlyn",
        cost: 5000,
        engineForce: 600,
        frictionSlip: -2,
        maxSpeed: 25
    },
    spoiler1: {
        id: "f1-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 0.7,//2,
        mass: 100
    },
    spoiler2: {
        id: "f1-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 0.7,//2.2,
        mass: 120
    },
    spoiler3: {
        id: "f1-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 0.7,//2.3,
        mass: 130
    },
    spoiler4: {
        id: "f1-spoiler4",
        path: "spoiler4",
        type: "spoiler",
        name: "Sarah",
        cost: 2500,
        frictionSlip: 0.7,//3,
        mass: 230,
        engineForce: 250
    },
    wheelGuards1: {
        id: "f1-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 0.7,//1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        id: "f1-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Wendy",
        cost: 20000,
        frictionSlip: 0.7,//1.5,
        mass: -100,
        engineForce: 25,
        suspensionRestLength: .2
    },
}

const normalItems: CarItems = {

}

const testItems: CarItems = {

}

const tractorItems: CarItems = {
    exhaust1: {
        path: "exhaust1",
        id: "tractor-exhaust1",
        name: "Willie",
        type: "exhaust",
        cost: 10,
        engineForce: 100,
        maxSpeed: 10,
    },
    exhaust2: {
        path: "exhaust2",
        id: "tractor-exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 200,
        cost: 200,
        maxSpeed: 11
    },
    exhaust3: {
        id: "tractor-exhaust3",
        path: "exhaust3",
        name: "Executive",
        type: "exhaust",
        cost: 800,
        engineForce: 300,
        mass: 110,
        frictionSlip: -1,
        maxSpeed: -5
    },
    exhaust4: {
        id: "tractor-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Ernie Johnson",
        engineForce: 350,
        mass: 80,
        maxSpeed: -5,
        cost: 1000,
    },
    exhaust5: {
        id: "tractor-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Sad Charlie",
        engineForce: 380,
        frictionSlip: -0.5,
        maxSpeed: -1,
        mass: 100,
        cost: 200000
    },
    spoiler1: {
        id: "tractor-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: .5,
        mass: 100,
        engineForce: -100,
        maxSpeed: -15
    },
    spoiler2: {
        id: "tractor-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Stonie",
        cost: 2500,
        frictionSlip: .6,
        mass: 80,
        engineForce: -50,
        maxSpeed: 10
    },
    spoiler3: {
        id: "tractor-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Stonie",
        cost: 5000,
        frictionSlip: .6,
        mass: -80,
        engineForce: -75,
        maxSpeed: 25
    },
    wheelGuards1: {
        id: "tractor-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 500,
        frictionSlip: 0.8,//2,
        mass: -75,
        engineForce: -150,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        id: "tractor-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Billis",
        cost: 2500,
        frictionSlip: 0.8,//2,
        mass: -100,
        engineForce: -50,
        suspensionRestLength: .2
    },
}

const normal2Items: CarItems = {
    exhaust1: {
        id: "normal2-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100,
        maxSpeed: 40
    },
    exhaust2: {
        id: "normal2-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200,
        maxSpeed: 35
    },
    exhaust3: {
        id: "normal2-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
        maxSpeed: 30
    },
    exhaust4: {
        id: "normal2-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Cofefe",
        cost: 2000,
        engineForce: 500,
        frictionSlip: -1,
        mass: 50,
        suspensionRestLength: -.05,
        maxSpeed: 100
    },
    exhaust5: {
        id: "normal2-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Crazy Cofefe",
        cost: 10000,
        engineForce: 800,
        frictionSlip: -1,
        suspensionRestLength: -.05,
        mass: 25,
        maxSpeed: 110
    },
    spoiler1: {
        id: "normal2-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 0.7,//2,
        mass: 100,
        engineForce: -1000
    },
    spoiler2: {
        id: "normal2-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 0.8,//3.2,
        mass: -120,
        engineForce: -1500
    },
    spoiler3: {
        id: "normal2-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 0.7,// 2.3,
        mass: 130
    },
    spoiler4: {
        id: "normal2-spoiler4",
        path: "spoiler4",
        type: "spoiler",
        name: "Spike",
        cost: 40000,
        frictionSlip: 0.7,// 3.3,
        engineForce: 100,
        maxSpeed: 10,
        mass: 50
    },
    spoiler5: {
        id: "normal2-spoiler5",
        path: "spoiler5",
        type: "spoiler",
        name: "Spike",
        cost: 60000,
        frictionSlip: 1.2,
        engineForce: 120,
        maxSpeed: 11,
        mass: 100
    },
    wheelGuards1: {
        id: "normal2-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        cost: 20000,
        name: "Wonkie",
        frictionSlip: 0.8,// 3,
        engineForce: 1000,
        mass: -50
    },
    wheelGuards2: {
        id: "normal2-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        cost: 25000,
        name: "Bonkie",
        frictionSlip: -2,
        engineForce: 1200,
        mass: -150
    },
    wheelGuards3: {
        id: "normal2-wheelGuards3",
        path: "wheelGuards3",
        type: "wheelGuards",
        cost: 35000,
        name: "Schlonkie",
        frictionSlip: 0.97,//3.8,
        engineForce: 1500,
        mass: 120,
        suspensionRestLength: .1,
        suspensionStiffness: 20
    }
}

const offRoaderItems: CarItems = {
    spoiler1: {
        id: "offRoader-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 0.7,// 2,
        mass: 10,
        engineForce: 100
    },
    spoiler2: {
        id: "offRoader-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Fry",
        cost: 500,
        frictionSlip: 0.7,//2.5,
        mass: 20,
        engineForce: 120
    },
    exhaust1: {
        id: "offRoader-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100
    },
    exhaust2: {
        id: "offRoader-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        id: "offRoader-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        id: "offRoader-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 200,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
}

const simpleSphereItems: CarItems = {
    spoiler1: {
        id: "simpleSphere-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Lincon",
        cost: 5000,
        engineForce: 50,
        mass: 18
    },
    spoiler2: {
        id: "simpleSphere-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Peter",
        cost: 7500,
        engineForce: 75,
        mass: 12
    },
    exhaust1: {
        id: "simpleSphere-exhaust1",
        path: "exhaust1",
        name: "Oogle",
        type: "exhaust",
        cost: 1500,
        engineForce: 50,
        mass: 10
    },
}

const gokartItems: CarItems = {
    spoiler1: {
        id: "gokart-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 0.7,// 2,
        mass: 10,
        engineForce: 100
    },
    spoiler2: {
        id: "gokart-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Fry",
        cost: 500,
        frictionSlip: 0.7,//2.5,
        mass: 20,
        engineForce: 120
    },
    exhaust1: {
        id: "gokart-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100
    },
    exhaust2: {
        id: "gokart-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        id: "gokart-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        id: "gokart-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 200,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
    wheelGuards1: {
        id: "gokart-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 0.5,//1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        id: "gokart-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Billis",
        cost: 2500,
        frictionSlip: 0.5,// 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
}

const futureItems: CarItems = {
    exhaust1: {
        name: "Ellie",
        path: "exhaust1",
        id: "future-exhaust1",
        type: "exhaust",
        cost: 1000,
        mass: 10,
        maxSpeed: 5
    },
    spoiler1: {
        name: "Steve",
        path: "spoiler1",
        id: "future-spolier1",
        type: "spoiler",
        cost: 1000,
        mass: 5,
        maxSpeed: 5,
        frictionSlip: 0.7,// 2,
        engineForce: 100
    },
    spoiler2: {
        name: "Stoney",
        path: "spoiler2",
        id: "future-spolier2",
        type: "spoiler",
        cost: 20000,
        mass: 25,
        maxSpeed: 15,
        frictionSlip: 0.7,// 2.2,
        engineForce: 150
    },
    wheelGuards1: {
        id: "future-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Wendy",
        cost: 2500,
        frictionSlip: 0.7,//1,
        mass: -75,
        engineForce: 50,
        suspensionRestLength: .2,
        physicalObject: true
    },
    wheelGuards2: {
        id: "future-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Wonkie",
        cost: 10000,
        frictionSlip: 0.7,//1.1,
        mass: -100,
        engineForce: -50,
        maxSpeed: 10,
        suspensionRestLength: .2,
        physicalObject: true
    },
    wheelGuards3: {
        id: "future-wheelGuards3",
        path: "wheelGuards3",
        type: "wheelGuards",
        name: "Wromby",
        cost: 20000,
        frictionSlip: 0.7,// 1.1,
        mass: -120,
        engineForce: 80,
        maxSpeed: -10,
        suspensionRestLength: .1,
        physicalObject: true
    },
    wheelGuards4: {
        id: "future-wheelGuards4",
        path: "wheelGuards4",
        type: "wheelGuards",
        name: "Whip",
        cost: 20000,
        frictionSlip: 0.7,//1.5,
        mass: -130,
        engineForce: 50,
        maxSpeed: 25,
        suspensionRestLength: .23,
        physicalObject: true
    },

}

const simpleCylindarItems: CarItems = {

}


type VehiclesItems = {
    [vehicleType in VehicleType]: CarItems
}

export const vehicleItems: VehiclesItems = {
    normal: normalItems,
    tractor: tractorItems,
    f1: f1Items,
    test: testItems,
    offRoader: offRoaderItems,
    sportsCar: sportsCarItems,
    normal2: normal2Items,
    simpleSphere: simpleSphereItems,
    simpleCylindar: simpleCylindarItems,
    gokart: gokartItems,
    future: futureItems
}


export const getDefaultItemsOwnership = (vehicleType: VehicleType): { [itemPath: string]: boolean } => {
    const keys = Object.keys(vehicleItems[vehicleType])
    const obj = {}
    for (let key of keys) {
        // @ts-ignore
        obj[key] = false
    }
    return obj
}


export type ItemOwnership = {
    [itemPath: string]: boolean
}

type ItemsOwnership = {
    [vehicleType in VehicleType]: ItemOwnership | undefined
}



export const defaultItemsOwnership: ItemsOwnership = {
    normal: undefined,
    tractor: undefined,
    f1: undefined,
    test: undefined,
    offRoader: undefined,
    sportsCar: undefined,
    normal2: undefined,
    simpleSphere: undefined,
    simpleCylindar: undefined,
    gokart: undefined,
    future: undefined
}



export const getStatsFromSetup = (setup: VehicleSetup) => {
    if (!setup) return {}
    const stats: IVehicleProps = {}

    for (let item of possibleVehicleItemTypes) {
        if (setup[item]) {
            for (let mod of possibleVehicleMods) {
                if (stats[mod.type] === undefined) {
                    stats[mod.type] = 0
                }
                if (setup?.[item]?.[mod.type]) {
                    // @ts-ignore
                    stats[mod.type] += (setup[item]?.[mod.type] ?? 0)
                }
            }
        }
    }

    return stats
}
