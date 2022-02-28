/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which 
 * is useless to the front end.
 * So this limits the .js to one file.
 */

import { IUserSettings, IVehicleSettings } from "../classes/User"

import { getMedal as _getMedal } from "./medalFuncions"
import { VehicleSetup } from "./vehicleItems"

/** trackName.gltf */
export type TrackName =
    "farm-track"
    | "f1-track"
    | "sea-side-track"
    | "f1-track-2"
    | "russia-track"
    | "ferrari-track"
    | "basic-track1"
    | "basic-track2"
    | "basic-track3"
    | "basic-track4"
    | "basic-track5"
    | "spa-track"
    | "nurn-track"
    | "speed-test-track"
    | "small-track"
    | "small-jump-track"
    | "farmers-little-helper-map"
    | "skii-map"
    | "monaco-track"
    | "town-track"
    | "simple-tag-course"
    | "basic-tag-course"
    | "test-course"

export type TrackCategory = "basic" | "long" | "short"
export const possibleTrackCategories: { category: TrackCategory, name: string }[] = [
    { category: "basic", name: "Basic" },
    { category: "long", name: "Long" },
    { category: "short", name: "Short" },

]

type TrackDifficulty = "easy" | "medium" | "hard"
export type TimeOfDay = "day" | "evening"


export type RaceSong = "desert.mp3" | "racing.mp3"

/** change name to map
 * since a racetrack is a map and the tag courses are also maps but not tracks....
 */
export interface ITrackInfo {
    name: string
    type: TrackName
    gameType: GameType
    category: TrackCategory
    timeOfDay?: TimeOfDay
    hemisphereRadius?: number
    difficulty: TrackDifficulty
    song?: RaceSong
}

export const allTrackNames: ITrackInfo[] = [
    {
        name: "Test", type: "test-course", gameType: "race", category: "basic", difficulty: "easy"
    },
    {
        name: "Farm track", type: "farm-track", gameType: "race", category: "short", difficulty: "medium"
    },
    {
        name: "Basic track", type: "basic-track1", gameType: "race", category: "basic", difficulty: "easy"
    },
    {
        name: "Basic track 2", type: "basic-track2", gameType: "race", category: "basic", difficulty: "easy"
    },
    {
        name: "Basic track 3", type: "basic-track3", gameType: "race", category: "basic", difficulty: "easy"
    },
    {
        name: "Basic track 4", type: "basic-track4", gameType: "race", category: "basic", difficulty: "medium"
    },
    {
        name: "Basic track 5", type: "basic-track5", gameType: "race", category: "basic", difficulty: "medium"
    },
    {
        name: "German track", type: "nurn-track", gameType: "race", category: "short", difficulty: "easy"
    },
    {
        name: "F1 track", type: "f1-track", gameType: "race", category: "short", difficulty: "hard"
    },
    {
        name: "F1 track-2", type: "f1-track-2", gameType: "race", category: "short", difficulty: "medium"
    },
    {
        name: "Beach track", type: "sea-side-track", gameType: "race", category: "long", difficulty: "medium",
        song: "desert.mp3"
    },
    {
        name: "Town track", type: "town-track", gameType: "race", category: "long", difficulty: "easy"
    },
    {
        name: "Monaco track", type: "monaco-track", gameType: "race", category: "long", difficulty: "easy"
    },
    {
        name: "Mountain track", type: "russia-track", gameType: "race", category: "short", difficulty: "medium"
    },
    {
        name: "Desert track", type: "spa-track", gameType: "race", hemisphereRadius: 1200, category: "long", difficulty: "hard",
        song: "desert.mp3"
    },
    {
        name: "Winter track", type: "ferrari-track", gameType: "race", timeOfDay: "evening", category: "long", difficulty: "hard",
        song: "desert.mp3"
    },
    {
        name: "Ski map", type: "skii-map", gameType: "race", timeOfDay: "day", category: "long", difficulty: "hard"
    },
    {
        name: "Farmers little helper", type: "farmers-little-helper-map", gameType: "story", hemisphereRadius: 2000, category: "long", difficulty: "hard"
    },
    {
        name: "Small track", type: "small-track", gameType: "race", category: "short", difficulty: "hard"
    },
    {
        name: "Tag course", type: "simple-tag-course", gameType: "tag", category: "short", difficulty: "easy"
    },
    {
        name: "Basic tag course", type: "basic-tag-course", gameType: "tag", category: "basic", difficulty: "easy"
    },
]

export const getTrackInfos = (trackNames: TrackName[]) => {
    return trackNames.map(t => {
        for (let at of allTrackNames) {
            if (at.type === t) {
                return at
            }
        }
    })
}

export type VehicleType =
    "normal"
    | "tractor"
    | "f1"
    | "test"
    | "offRoader"
    | "sportsCar"
    | "normal2"
    | "simpleSphere"
    | "simpleCylindar"
    | "gokart"
    | "future"

export type VehicleClass = "LowPoly" | "Sphere"

export const allVehicleTypes: { name: string, type: VehicleType, vehicleClass?: VehicleClass }[] = [
    { name: "MacNormie", type: "normal2" },
    { name: "Old Normie", type: "normal" },
    { name: "Trakkie Tractor", type: "tractor" },
    { name: "Phil the Phast", type: "f1" },
    // { name: "Monster truck", type: "monsterTruck" },
    { name: "test", type: "test" },
    { name: "Jackie", type: "future" },
    { name: "Big girl Sally", type: "offRoader" },
    { name: "Thunderparrot", type: "sportsCar" },
    { name: "Goonie", type: "gokart" },
    { name: "Round Betty", type: "simpleSphere", vehicleClass: "Sphere" },
    { name: "Cylindar Jonny", type: "simpleCylindar", vehicleClass: "Sphere" }
]

export const defaultVehicleType: VehicleType = Math.random() < .3 ? "normal2" : "f1"

export type GameType = "ball" | "race" | "tag" | "story"

export type VehicleColorType =
    "#1d8a47"
    | "#8b0000"
    | "#185676"
    | "#f07900"
    | "#61f72a"
    | "#97b0ba"
    | "#bf923b"

export interface VehicleColor {
    name: string, value: VehicleColorType
}

export const vehicleColors: VehicleColor[] = [
    {
        name: "Olive", value: "#1d8a47",
    },
    {
        name: "Ruby", value: "#8b0000"
    },
    {
        name: "Sadness", value: "#185676",
    },
    {
        name: "Rage", value: "#f07900", //"#fda000"
    },
    {
        name: "Synthetic happiness", value: "#61f72a"
    },
    {
        name: "Real happiness", value: "#97b0ba"
    },
    {
        name: "Wheat", value: "#bf923b"
    },
]

export const getColorNameFromType = (colorType: VehicleColorType) => {
    for (let c of vehicleColors) {
        if (c.value === colorType) {
            return c.name
        }
    }
    return "Unknown color"
}

export const defaultVehicleColorType: VehicleColorType = "#1d8a47"


export const getItemName = (type: string) => {
    for (let v of vehicleColors) {
        if (v.value === type) {
            return v.name
        }
    }
    for (let v of allVehicleTypes) {
        if (v.type === type) {
            return v.name
        }
    }

    for (let v of allTrackNames) {
        if (v.type === type) {
            return v.name
        }
    }
    return type
}


export interface IPlayerConnectedData {
    roomId: string
    playerName: string
    playerId: string
    isAuthenticated: boolean
    photoURL: string
    isStressTest?: boolean
    userSettings: IUserSettings
    vehicleSetup: VehicleSetup
}


export class MobileControls {

    beta: number
    alpha: number
    gamma: number

    /* two main buttons, f and b */
    /** f for forward */
    f: boolean
    /** b for break and backward */
    b: boolean

    resetVehicle: boolean



    constructor(data?: Object) {
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.f = false
        this.b = false

        this.resetVehicle = false


        if (data) {
            const keys = Object.keys(data)
            for (let key of keys) {
                // @ts-ignore
                this[key] = data[key]
            }
        }
    }
}


export class VehicleControls {
    f: boolean
    b: boolean
    right: boolean
    left: boolean
    steerValue: number

    constructor() {
        this.f = false
        this.b = false
        this.steerValue = 0
        this.left = false
        this.right = false

    }
}


export interface IPreGamePlayerInfo {
    playerName: string
    playerNumber: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL: string
    vehicleSetup: VehicleSetup
    mobileConnected?: boolean

    // need this for splitscreen
    vehicleSettings: IVehicleSettings
}


export interface IPlayerInfo extends IPreGamePlayerInfo {
    isConnected: boolean,
    isLeader: boolean
}

/**
 * these actions are sent from mobile to server to desktop
 * to e.g. pause the game from mobile or restart the game
 */
interface IGameActions {
    pause: boolean
    restart: boolean
    // changeTrack: TrackName | undefined
    // toggleSound: boolean
    // toggleShadows: boolean
    // numberOfLaps: number | undefined
}

export class GameActions implements IGameActions {
    pause: boolean
    restart: boolean

    constructor() {
        this.pause = false
        this.restart = false
    }
}

/**
 * ****************
 *  Socket names  *
 * *************** *
 * 
 * dts is desktop to server
 * stm is server to mobile
 * mts is mobile to server
 * 
 * mdts is mobile or desktop to server
 * stmd is server to mobile or desktop
 * 
 */

export const stmd_socket_ready = "stmd_socket_ready"

export const dts_game_highscore = "dts_game_highscore";
export const std_room_created_callback = "std_room_created_callback";
export const dts_create_room = "dts_create_room"

export const mdts_device_type = "mdts_device_type"
export const mdts_players_in_room = "mdts_players_in_room"
export const stmd_players_in_room_callback = "stmd_players_in_room_callback"

export const mts_player_connected = "mts_player_connected"
export const stm_player_connected_callback = "stm_player_connected_callback"

export const mdts_start_game = "mdts_start_game"
export const std_start_game_callback = "stmd_start_game_callback"
export const stmd_game_starting = "stmd_game_starting"

export const std_controls = "std_controls"
export const mts_controls = "mts_controls"

/** save highscore */
export const dts_player_finished = "dts_player_finished"
export const stm_player_finished = "stm_player_finished"

export const dts_game_finished = "dts_game_finished"
export const stm_game_finished = "stm_game_finished"

export const mts_game_data_info = "mts_game_data_info"
export const std_game_data_info = "std_game_data_info"
/** end save highscore */


export const std_user_settings_changed = "std_user_settings_changed"
export const mts_user_settings_changed = "mts_user_settings_changed"


export const mts_ping_test = "mts_ping_test"
export const stm_ping_test_callback = "stm_ping_test_callback"

export const dts_ping_test = "dts_ping_test"
export const std_ping_test_callback = "std_ping_test_callback"


/** when vehicles are ready, stuff like settings can be sent */
export const dts_vehicles_ready = "dts_vehicles_ready"



/** connection stuff */
export const mdts_left_waiting_room = "mdts_left_waiting_room"
export const stm_desktop_disconnected = "stm_desktop_disconnected"
export const std_player_disconnected = "std_player_disconnected"
export const mts_connected_to_waiting_room = "mts_connected_to_waiting_room"
export const stmd_waiting_room_alert = "stmd_waiting_room_alert"
export const dts_back_to_waiting_room = "dts_back_to_waiting_room"
export const stm_player_info = "stm_player_info"
export const mdts_number_connected = "mdts_number_connected"
export const stmd_number_connected = "stmd_number_connected"
export const std_quit_game = "std_quit_game"
export const mts_quit_game = "mts_quit_game"

// not implmented yet
export const stm_back_to_waiting_room = "stm_back_to_waiting_room"

export const mdts_game_settings_changed = "mdts_game_settings_changed"
export const stmd_game_settings_changed = "stmd_game_settings_changed"
export const dts_game_settings_changed_callback = "mts_game_settings_changed_callback"
export const stm_game_settings_changed_callback = "stm_game_settings_changed_callback"

export const mts_send_game_actions = "mts_send_game_actions"
export const std_send_game_actions = "std_send_game_actions"



/** FPS on emit */

export const STD_SENDINTERVAL_MS = 1000 / 45
export const MTS_SENDINTERVAL_MS = 1000 / 60