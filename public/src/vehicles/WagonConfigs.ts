export type WagonType = "smallWagon" | "tractorWagon"

export const allWagonTypes: { name: string, type: WagonType }[] = [
    {
        type: "smallWagon",
        name: "Small wagon"
    },
    {
        type: "tractorWagon",
        name: "Tractor Wagon"
    }
]

export interface IWagonConfig {
    path: string
    mass: number

    wheelAxisPosition: number
    wheelRadius: number
    wheelHalfTrack: number
    wheelAxisHeight: number

    suspensionStiffness: number
    suspensionDamping: number
    suspensionCompression: number
    suspensionRestLength: number
    maxSuspensionTravelCm: number
    maxSuspensionForce: number

    frictionSlip: number
    rollInfluence: number
}


const defaultWagonConfig: IWagonConfig = {
    wheelAxisPosition: -1.15,
    wheelRadius: 0.93,
    wheelHalfTrack: 3.5,
    wheelAxisHeight: -.76,
    mass: 100,

    suspensionStiffness: 100,
    suspensionDamping: 4,
    suspensionCompression: 2.4,
    suspensionRestLength: 1.1,
    maxSuspensionTravelCm: 1500,
    maxSuspensionForce: 50000,
    frictionSlip: 8.5,
    rollInfluence: .01,

    path: ""
}

export const wagonConfigs = {
    smallWagon: {
        ...defaultWagonConfig,
        path: "small-wagon.glb"
    },
    tractorWagon: {
        ...defaultWagonConfig,
        path: "tractor-wagon.glb"
    }

}