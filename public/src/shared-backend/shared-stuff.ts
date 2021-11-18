/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which 
 * is useless to the front end.
 * So this limits the .js to one file.
 */
/** trackName.gltf */
export type TrackName = "low-poly-farm-track" | "f1-track" | "test-course" | "sea-side-track" | "simple-tag-course"
export type VehicleType = "normal" | "tractor" | "f1" | "test" | "offRoader"

export type GameType = "ball" | "race" | "tag"


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

    pause: boolean

    constructor(data?: Object) {
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.f = false
        this.b = false

        this.resetVehicle = false
        this.pause = false

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
    left: boolean
    f: boolean
    b: boolean
    right: boolean
    steerValue: number




    constructor() {
        this.left = false
        this.right = false
        this.f = false
        this.b = false
        this.steerValue = 0

    }
}


export interface IPreGamePlayerInfo {
    playerName: string
    teamName: string
    teamNumber?: number
    playerNumber: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL?: string

}


export interface IPlayerInfo extends IPreGamePlayerInfo {
    mobileControls: MobileControls
    vehicleControls?: VehicleControls
    isConnected: true,
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
        playerName,
        teamName: teamName ?? "undefined",
        teamNumber,
        playerNumber,
        id,
        isAuthenticated,
        vehicleType,
        photoURL,
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

export const dts_start_game = "dts_start_game"
export const std_start_game_callback = "std_start_game_callback"
export const stm_game_starting = "stm_game_starting"

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