"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dts_vehicles_ready = exports.std_ping_test_callback = exports.dts_ping_test = exports.stm_ping_test_callback = exports.mts_ping_test = exports.mts_user_settings_changed = exports.std_user_settings_changed = exports.std_game_data_info = exports.mts_game_data_info = exports.stm_game_finished = exports.dts_game_finished = exports.stm_player_finished = exports.dts_player_finished = exports.mts_controls = exports.std_controls = exports.stm_game_starting = exports.std_start_game_callback = exports.dts_start_game = exports.stm_player_connected_callback = exports.mts_player_connected = exports.stmd_players_in_room_callback = exports.mdts_players_in_room = exports.mdts_device_type = exports.dts_create_room = exports.std_room_created_callback = exports.dts_game_highscore = exports.stmd_socket_ready = exports.playerInfoToPreGamePlayerInfo = exports.VehicleControls = exports.MobileControls = void 0;
var MobileControls = /** @class */ (function () {
    function MobileControls(data) {
        this.beta = 0;
        this.gamma = 0;
        this.alpha = 0;
        this.f = false;
        this.b = false;
        this.resetVehicle = false;
        this.pause = false;
        if (data) {
            var keys = Object.keys(data);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                // @ts-ignore
                this[key] = data[key];
            }
        }
    }
    return MobileControls;
}());
exports.MobileControls = MobileControls;
var VehicleControls = /** @class */ (function () {
    function VehicleControls() {
        this.left = false;
        this.right = false;
        this.f = false;
        this.b = false;
        this.steerValue = 0;
    }
    return VehicleControls;
}());
exports.VehicleControls = VehicleControls;
var playerInfoToPreGamePlayerInfo = function (playerInfo) {
    var playerName = playerInfo.playerName, teamName = playerInfo.teamName, teamNumber = playerInfo.teamNumber, playerNumber = playerInfo.playerNumber, id = playerInfo.id, isAuthenticated = playerInfo.isAuthenticated, vehicleType = playerInfo.vehicleType, photoURL = playerInfo.photoURL;
    return {
        playerName: playerName,
        teamName: teamName !== null && teamName !== void 0 ? teamName : "undefined",
        teamNumber: teamNumber,
        playerNumber: playerNumber,
        id: id,
        isAuthenticated: isAuthenticated,
        vehicleType: vehicleType,
        photoURL: photoURL,
    };
};
exports.playerInfoToPreGamePlayerInfo = playerInfoToPreGamePlayerInfo;
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
exports.stmd_socket_ready = "stmd_socket_ready";
exports.dts_game_highscore = "dts_game_highscore";
exports.std_room_created_callback = "std_room_created_callback";
exports.dts_create_room = "dts_create_room";
exports.mdts_device_type = "mdts_device_type";
exports.mdts_players_in_room = "mdts_players_in_room";
exports.stmd_players_in_room_callback = "stmd_players_in_room_callback";
exports.mts_player_connected = "mts_player_connected";
exports.stm_player_connected_callback = "stm_player_connected_callback";
exports.dts_start_game = "dts_start_game";
exports.std_start_game_callback = "std_start_game_callback";
exports.stm_game_starting = "stm_game_starting";
exports.std_controls = "std_controls";
exports.mts_controls = "mts_controls";
/** save highscore */
exports.dts_player_finished = "dts_player_finished";
exports.stm_player_finished = "stm_player_finished";
exports.dts_game_finished = "dts_game_finished";
exports.stm_game_finished = "stm_game_finished";
exports.mts_game_data_info = "mts_game_data_info";
exports.std_game_data_info = "std_game_data_info";
/** end save highscore */
exports.std_user_settings_changed = "std_user_settings_changed";
exports.mts_user_settings_changed = "mts_user_settings_changed";
exports.mts_ping_test = "mts_ping_test";
exports.stm_ping_test_callback = "stm_ping_test_callback";
exports.dts_ping_test = "dts_ping_test";
exports.std_ping_test_callback = "std_ping_test_callback";
/** when vehicles are ready, stuff like settings can be sent */
exports.dts_vehicles_ready = "dts_vehicles_ready";
