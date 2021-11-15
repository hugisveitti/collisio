/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which 
 * is useless to the front end.
 * So this limits the .js to one file.
 */

export type TrackType = "low-poly-farm-track" | "low-poly-f1-track" | "test-course" | "sea-side-track"
export type VehicleType = "normal" | "tractor" | "f1" | "test" | "offRoader"

export type GameType = "ball" | "race"


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



export interface IPlayerInfo {
    playerName: string

    isLeader: boolean
    teamName: string
    playerNumber: number
    mobileControls: MobileControls
    vehicleControls?: VehicleControls
    /** only for ball game */
    teamNumber?: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL?: string
    isConnected?: boolean
}


/**
 * Socket names
 * 
 * 
 * dts is desktop to server
 * stm is server to mobile
 * mts is mobile to server
 * 
 * mdts is mobile or desktop to server
 * stmd is server to mobile or desktop
 * 
 */


export const dts_game_highscore = "dts_game_highscore";
export const std_room_created_callback = "std_room_created_callback";
export const dts_create_room = "dts_create_room"

export const mdts_device_type = "mdts_device_type"
export const mdts_players_in_room = "mdts_players_in_room"
export const stmd_players_in_room_callback = "stmd_players_in_room_callback"

export const mts_player_connected = "mts_player_connected"
export const stm_player_connected_callback = "stm_player_connected_callback"


