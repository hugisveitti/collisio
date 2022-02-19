
export interface IVehiclePositionInfo {
    // Vector3
    pos: any
    // Quaternion
    rot: any
    //number 
    speed: number
    // 
    userId: string
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
export const m_ts_go_to_game_room_from_leader = "m_ts_go_to_game_room_from_leader"
export const m_ts_go_to_game_room_from_leader_callback = "m_ts_go_to_game_room_from_leader_callback"

export const m_fs_game_starting = "m_fs_game_starting"
export const m_ts_game_settings_changed = "m_ts_game_settings_changed"
export const m_fs_game_settings_changed = "m_fs_game_settings_changed"

// when this is emitted, we send info, like userSetting and vehicleSetup and we can send stuff
export const m_ts_game_socket_ready = "m_ts_game_socket_ready"

// send this when player has loaded models
export const m_ts_player_ready = "m_ts_player_ready"

// when game can start
export const m_fs_go_to_game_room = "m_fs_go_to_game_room"

// when countdown is 0 start game
export const m_fs_game_countdown = "m_fs_game_countdown"

export const m_ts_pos_rot = "f_ts_pos_rot"
export const m_fs_vehicles_position_info = "m_fs_vehicles_position_info"


