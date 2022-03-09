import { allVehicleTypes, allTrackNames, TrackName, vehicleColors, VehicleColorType, VehicleType } from "./shared-stuff"


function itemInArray<Type>(st: Type, arr: Type[]) {
    for (let t of arr) {
        if (t === st) return true
    }
    return false
}
export type AllItems = VehicleType | TrackName | VehicleColorType


const defaultOwnedVehicles: VehicleType[] = [
    "f1",
    "normal2",
    "offRoader",
]

type VehicleOwnership = { [vehicleType in VehicleType]: boolean }


export const getDefaultVehicleOwnership = () => {

    // @ts-ignore
    const defaultVehicleOwnership: VehicleOwnership = {}

    for (let v of allVehicleTypes) {
        defaultVehicleOwnership[v.type] = itemInArray(v.type, defaultOwnedVehicles)
    }

    return defaultVehicleOwnership
}

const vehicleCosts: { [vehicleType in VehicleType]: number } = {
    f1: 0,
    normal: 0,
    tractor: 50,
    test: 0,
    offRoader: 0,
    sportsCar: 3000,
    normal2: 0,
    simpleSphere: 500,
    simpleCylindar: 50000,
    gokart: 3000,
    future: 40000
}


export const defaultOwnedTracks: TrackName[] = [
    "farm-track",
    "nurn-track",
    "f1-track",
    "sea-side-track",
    "simple-tag-course",
    "basic-track1",
]

type TrackOwnership = { [trackName in TrackName]: boolean }


export const getDefaultTrackOwnership = () => {

    // @ts-ignore
    const defaultTrackOwnership: TrackOwnership = {}

    for (let v of allTrackNames) {
        defaultTrackOwnership[v.type] = itemInArray(v.type, defaultOwnedTracks)
    }

    return defaultTrackOwnership
}

const trackCosts: { [trackName in TrackName]: number } = {
    "farm-track": 0,
    "basic-track1": 0,
    "basic-track2": 5,
    "basic-track3": 5000,
    "basic-track4": 10000,
    "basic-track5": 40000,
    "f1-track": 0,
    "sea-side-track": 0,
    "f1-track-2": 500,
    "russia-track": 10000,
    "ferrari-track": 1000,
    "spa-track": 10000,
    "silverstone-track": 20000,
    "nurn-track": 0,
    "speed-test-track": 0,
    "small-track": 0,
    "small-jump-track": 0,
    "farmers-little-helper-map": 0,
    "skii-map": 0,
    "monaco-track": 100000000,
    "town-track": 0,
    "test-course": 0,
    "simple-tag-course": 0,
    "basic-tag-course": 40000,
}


const defaultOwnedColors: VehicleColorType[] = [
    "#1d8a47",
    "#8b0000",
]

type VehicleColorOwnership = { [vehicleColor in VehicleColorType]: boolean }


export const getDefaultVehicleColorOwnership = () => {

    // @ts-ignore
    const defaultOwnership: VehicleColorOwnership = {}

    for (let v of vehicleColors) {
        defaultOwnership[v.value] = itemInArray(v.value, defaultOwnedColors)
    }

    return defaultOwnership
}

const colorCosts: { [color in VehicleColorType]: number } = {
    "#1d8a47": 0,
    "#8b0000": 0,
    "#185676": 0,
    "#f07900": 50,
    "#61f72a": 10,
    "#bf923b": 100,
    "#97b0ba": 2 * (10 ** 6)
}


export type AllOwnership = VehicleOwnership | TrackOwnership | VehicleColorOwnership
export type AllOwnableItems = VehicleType | TrackName | VehicleColorType

export const getDefaultOwnership = () => {
    return {
        ...getDefaultVehicleOwnership(),
        ...getDefaultTrackOwnership(),
        ...getDefaultVehicleColorOwnership()
    }
}

export const allCosts = {
    ...vehicleCosts,
    ...trackCosts,
    ...colorCosts
}


