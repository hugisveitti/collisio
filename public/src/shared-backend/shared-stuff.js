"use strict";
/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which
 * is useless to the front end.
 * So this limits the .js to one file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stm_player_connected_callback = exports.mts_player_connected = exports.stmd_players_in_room_callback = exports.mdts_players_in_room = exports.mdts_device_type = exports.dts_create_room = exports.std_room_created_callback = exports.dts_game_highscore = exports.VehicleControls = exports.MobileControls = void 0;
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
exports.dts_game_highscore = "dts_game_highscore";
exports.std_room_created_callback = "std_room_created_callback";
exports.dts_create_room = "dts_create_room";
exports.mdts_device_type = "mdts_device_type";
exports.mdts_players_in_room = "mdts_players_in_room";
exports.stmd_players_in_room_callback = "stmd_players_in_room_callback";
exports.mts_player_connected = "mts_player_connected";
exports.stm_player_connected_callback = "stm_player_connected_callback";
