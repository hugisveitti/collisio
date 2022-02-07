import { VehicleType } from "./shared-stuff"

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


export interface ItemProperties {
    /** path of item */
    path: string
    name: string
    cost: number
    type: ItemType

    /** an item can modify the config of a car */
    mass?: number
    engineForce?: number
    frictionSlip?: number
    suspensionStiffness?: number
    suspensionRestLength?: number
}

type VehicleProps = "engineForce" | "mass" | "frictionSlip" | "suspensionStiffness" | "suspensionRestLength"

export const possibleVehicleMods: { name: string, type: VehicleProps }[] = [
    {
        name: "Speed", type: "engineForce"
    },
    {
        name: "Mass", type: "mass"
    },
    {
        name: "Handling", type: "frictionSlip"
    },
    {
        name: "Suspension stiffness", type: "suspensionStiffness"
    },
    {
        name: "Suspension Rest Length", type: "suspensionRestLength"
    }
];

export interface VehicleSetup {
    vehicleType: VehicleType
    exhaust?: ItemProperties // filename or id
    spoiler?: ItemProperties
    wheelGuards?: ItemProperties
}


interface CarItems {
    [itempath: string]: ItemProperties
}

const sportsCarItems: CarItems = {
    exhaust1: {
        path: "exhaust1",
        name: "Willie",
        type: "exhaust",
        cost: 10,
        engineForce: 200,
    }
}

const f1Items: CarItems = {
    exhaust1: {
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100
    },
    exhaust2: {
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 400,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
    exhaust5: {
        path: "exhaust5",
        type: "exhaust",
        name: "Everlyn",
        cost: 5000,
        engineForce: 800,
        frictionSlip: -2
    },
    spoiler1: {
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 100
    },
    spoiler2: {
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 2.2,
        mass: 120
    },
    spoiler3: {
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 2.3,
        mass: 130
    },
    spoiler4: {
        path: "spoiler4",
        type: "spoiler",
        name: "Sarah",
        cost: 2500,
        frictionSlip: 3,
        mass: 230,
        engineForce: 500
    },
    wheelGuards1: {
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Wendy",
        cost: 20000,
        frictionSlip: 1.5,
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

}

const normal2Items: CarItems = {

}

const offRoaderItems: CarItems = {

}

const simpleSphereItems: CarItems = {

}

const gokartItems: CarItems = {

}

const futureItems: CarItems = {

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