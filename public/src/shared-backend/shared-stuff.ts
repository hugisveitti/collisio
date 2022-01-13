/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which 
 * is useless to the front end.
 * So this limits the .js to one file.
 */

import { IUserSettings } from "../classes/User"

/** trackName.gltf */
export type TrackName =
    "farm-track"
    | "f1-track"
    | "test-course"
    | "sea-side-track"
    | "simple-tag-course"
    | "town-track"
    | "f1-track-2"
    | "monaco-track"
    | "russia-track"
    | "ferrari-track"
    | "skii-map"
    | "farmers-little-helper-map"
    | "speed-test-track"
    | "small-track"
    | "small-jump-track"

export type VehicleType = "normal"
    | "tractor"
    | "f1"
    | "test"
    | "offRoader"
    | "sportsCar"
    | "normal2"
    | "simpleSphere"
    | "gokart"
    | "future"

export const defaultVehicleType: VehicleType = "normal2"

export type GameType = "ball" | "race" | "tag" | "story"

export interface VehicleColor {
    name: string, value: string
}
export const vehicleColors: VehicleColor[] = [
    {
        name: "Green", value: "#1d8a47",
    },
    {
        name: "Red", value: "#8b0000"
    },
    {
        name: "Blue", value: "#185676",
    },
    {
        name: "Orange", value: "#fda000"
    },
    {
        name: "Light green", value: "#61f72a"
    },
    {
        name: "Gray", value: "#97b0ba"
    },

]

export interface IPlayerConnectedData {
    roomId: string
    playerName: string
    playerId: string
    isAuthenticated: boolean
    photoURL: string
    isStressTest?: boolean
    userSettings: IUserSettings
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
    teamName: string
    teamNumber: number
    playerNumber: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL: string
}


export interface IPlayerInfo extends IPreGamePlayerInfo {
    mobileControls: MobileControls
    vehicleControls?: VehicleControls
    isConnected: boolean,
    isLeader: boolean
}

export const playerInfoToPreGamePlayerInfo = (playerInfo: IPlayerInfo): IPreGamePlayerInfo => {
    const { playerName,
        teamName,
        teamNumber,
        playerNumber,
        id,
        isAuthenticated,
        vehicleType,
        photoURL, } = playerInfo

    return {
        playerName: playerName ?? "undefined",
        teamName: teamName ?? "undefined",
        teamNumber: teamNumber ?? -1,
        playerNumber: playerNumber ?? -1,
        id: id ?? "undefined",
        isAuthenticated: isAuthenticated ?? false,
        vehicleType: vehicleType ?? "test",
        photoURL: photoURL ?? "",
    }
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

// not implmented yet
export const stm_back_to_waiting_room = "stm_back_to_waiting_room"

export const mdts_game_settings_changed = "mdts_game_settings_changed"
export const stmd_game_settings_changed = "stmd_game_settings_changed"
export const dts_game_settings_changed_callback = "mts_game_settings_changed_callback"
export const stm_game_settings_changed_callback = "stm_game_settings_changed_callback"

export const mts_send_game_actions = "mts_send_game_actions"
export const std_send_game_actions = "std_send_game_actions"



/** FPS on emit */

export const STD_SENDINTERVAL_MS = 1000 / 60
export const MTS_SENDINTERVAL_MS = 1000 / 60