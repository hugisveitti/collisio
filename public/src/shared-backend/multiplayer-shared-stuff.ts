import { VehicleType } from "./shared-stuff";
import { VehicleSetup } from "./vehicleItems";

export interface IMultPreGamePlayerInfo {
    playerName: string
    teamName: string
    teamNumber: number
    playerNumber: number
    id: string
    isAuthenticated: boolean
    vehicleType: VehicleType
    photoURL: string
    vehicleSetup: VehicleSetup
}


export interface IMultPlayerInfo extends IMultPreGamePlayerInfo {
    isConnected: boolean,
    isLeader: boolean
}

/** 
 * Multiplayer stuff
 * m_ denotes that this is for multiplayer
 * ts is to server
 * fs is from server
 */
export const m_ts_connect_to_room = "m_ts_connect_to_room"
export const m_fs_connect_to_room_callback = "m_fs_connect_to_room_callback"
export const m_fs_room_info = "m_fs_room_info"
export const m_ts_in_waiting_room = "m_ts_in_waiting_room"
export const m_ts_start_game_from_leader = "m_ts_start_game_from_leader"
export const m_fs_start_game_from_leader_callback = "m_fs_start_game_from_leader_callback"

export const m_fs_game_starting = "m_fs_game_starting"
export const m_ts_game_settings_changed = "m_ts_game_settings_changed"
export const m_fs_game_settings_changed = "m_fs_game_settings_changed"


