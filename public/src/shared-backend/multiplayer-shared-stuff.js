"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.m_ts_restart_game = exports.m_fs_race_info = exports.m_fs_game_finished = exports.m_ts_lap_done = exports.m_fs_vehicles_position_info = exports.m_ts_pos_rot = exports.m_fs_game_countdown = exports.m_fs_go_to_game_room = exports.m_ts_player_ready = exports.m_ts_game_socket_ready = exports.m_fs_game_settings_changed = exports.m_ts_game_settings_changed = exports.m_fs_game_starting = exports.m_ts_go_to_game_room_from_leader_callback = exports.m_ts_go_to_game_room_from_leader = exports.m_ts_in_waiting_room = exports.m_fs_room_info = exports.m_fs_connect_to_room_callback = exports.m_ts_connect_to_room = void 0;
/**
 * Multiplayer stuff
 * m_ denotes that this is for multiplayer
 * ts is to server
 * fs is from server
 */
exports.m_ts_connect_to_room = "m_ts_connect_to_room";
exports.m_fs_connect_to_room_callback = "m_fs_connect_to_room_callback";
exports.m_fs_room_info = "m_fs_room_info";
exports.m_ts_in_waiting_room = "m_ts_in_waiting_room";
exports.m_ts_go_to_game_room_from_leader = "m_ts_go_to_game_room_from_leader";
exports.m_ts_go_to_game_room_from_leader_callback = "m_ts_go_to_game_room_from_leader_callback";
exports.m_fs_game_starting = "m_fs_game_starting";
exports.m_ts_game_settings_changed = "m_ts_game_settings_changed";
exports.m_fs_game_settings_changed = "m_fs_game_settings_changed";
// when this is emitted, we send info, like userSetting and vehicleSetup and we can send stuff
exports.m_ts_game_socket_ready = "m_ts_game_socket_ready";
// send this when player has loaded models
exports.m_ts_player_ready = "m_ts_player_ready";
// when game can start
exports.m_fs_go_to_game_room = "m_fs_go_to_game_room";
// when countdown is 0 start game
exports.m_fs_game_countdown = "m_fs_game_countdown";
exports.m_ts_pos_rot = "f_ts_pos_rot";
exports.m_fs_vehicles_position_info = "m_fs_vehicles_position_info";
exports.m_ts_lap_done = "m_ts_lap_done";
exports.m_fs_game_finished = "m_fs_game_finished";
exports.m_fs_race_info = "m_fs_race_info";
exports.m_ts_restart_game = "m_ts_restart_game";
