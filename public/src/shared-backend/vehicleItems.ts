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
    },
    exhaust2: {
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 250,
        cost: 200
    },
    exhaust3: {
        path: "exhaust3",
        name: "Executive",
        type: "exhaust",
        cost: 800,
        engineForce: 400,
        frictionSlip: -5,
    },
    exhaust4: {
        path: "exhaust4",
        type: "exhaust",
        name: "Ernie Johnson",
        engineForce: 950,
        cost: 1000
    },
    exhaust5: {
        path: "exhaust5",
        type: "exhaust",
        name: "Sad Charlie",
        engineForce: 1200,
        frictionSlip: -1,
        mass: 500,
        cost: 200000
    },
    spoiler1: {
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 100,
        engineForce: -1000
    },
    spoiler2: {
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 3.2,
        mass: -120,
        engineForce: -1500
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
        engineForce: -500
    },
    spoiler5: {
        path: "spoiler5",
        type: "spoiler",
        name: "Sylvester",
        cost: 5000,
        frictionSlip: 3,
        mass: -390,
        engineForce: 500
    },
    wheelGuards1: {
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 2,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
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
        name: "Cofefe",
        cost: 2000,
        engineForce: 500,
        frictionSlip: -1,
        mass: 50,
        suspensionRestLength: -.05
    },
    exhaust5: {
        path: "exhaust5",
        type: "exhaust",
        name: "Crazy Cofefe",
        cost: 10000,
        engineForce: 800,
        frictionSlip: -1,
        suspensionRestLength: -.05,
        mass: 25
    },
}

const offRoaderItems: CarItems = {

}

const simpleSphereItems: CarItems = {

}

const gokartItems: CarItems = {
    spoiler1: {
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 10,
        engineForce: 100
    },
    spoiler2: {
        path: "spoiler2",
        type: "spoiler",
        name: "Fry",
        cost: 500,
        frictionSlip: 2.5,
        mass: 20,
        engineForce: 120
    },
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
        engineForce: 200,
        frictionSlip: -1,
        suspensionRestLength: -.05
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
        name: "Billis",
        cost: 2500,
        frictionSlip: 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
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