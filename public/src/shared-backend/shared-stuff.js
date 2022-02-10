"use strict";
/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which
 * is useless to the front end.
 * So this limits the .js to one file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mts_quit_game = exports.std_quit_game = exports.stmd_number_connected = exports.mdts_number_connected = exports.stm_player_info = exports.dts_back_to_waiting_room = exports.stmd_waiting_room_alert = exports.mts_connected_to_waiting_room = exports.std_player_disconnected = exports.stm_desktop_disconnected = exports.mdts_left_waiting_room = exports.dts_vehicles_ready = exports.std_ping_test_callback = exports.dts_ping_test = exports.stm_ping_test_callback = exports.mts_ping_test = exports.mts_user_settings_changed = exports.std_user_settings_changed = exports.std_game_data_info = exports.mts_game_data_info = exports.stm_game_finished = exports.dts_game_finished = exports.stm_player_finished = exports.dts_player_finished = exports.mts_controls = exports.std_controls = exports.stmd_game_starting = exports.std_start_game_callback = exports.mdts_start_game = exports.stm_player_connected_callback = exports.mts_player_connected = exports.stmd_players_in_room_callback = exports.mdts_players_in_room = exports.mdts_device_type = exports.dts_create_room = exports.std_room_created_callback = exports.dts_game_highscore = exports.stmd_socket_ready = exports.GameActions = exports.playerInfoToPreGamePlayerInfo = exports.VehicleControls = exports.MobileControls = exports.getItemName = exports.getColorNameFromType = exports.vehicleColors = exports.defaultVehicleType = exports.allVehicleTypes = exports.getTrackInfos = exports.allTrackNames = exports.possibleTrackCategories = void 0;
exports.MTS_SENDINTERVAL_MS = exports.STD_SENDINTERVAL_MS = exports.std_send_game_actions = exports.mts_send_game_actions = exports.stm_game_settings_changed_callback = exports.dts_game_settings_changed_callback = exports.stmd_game_settings_changed = exports.mdts_game_settings_changed = exports.stm_back_to_waiting_room = void 0;
exports.possibleTrackCategories = [
    { category: "basic", name: "Basic" },
    { category: "long", name: "Long" },
    { category: "short", name: "Short" },
];
exports.allTrackNames = [
    {
        name: "Test", type: "test-course", gameType: "race", category: "basic"
    },
    {
        name: "Farm track", type: "farm-track", gameType: "race", category: "short"
    },
    {
        name: "Basic track", type: "basic-track1", gameType: "race", category: "basic"
    },
    {
        name: "Basic track 2", type: "basic-track2", gameType: "race", category: "basic"
    },
    {
        name: "Basic track 3", type: "basic-track3", gameType: "race", category: "basic"
    },
    {
        name: "Basic track 4", type: "basic-track4", gameType: "race", category: "basic"
    },
    {
        name: "German track", type: "nurn-track", gameType: "race", category: "short"
    },
    {
        name: "F1 track", type: "f1-track", gameType: "race", category: "short"
    },
    {
        name: "F1 track-2", type: "f1-track-2", gameType: "race", category: "short"
    },
    {
        name: "Beach track", type: "sea-side-track", gameType: "race", category: "long"
    },
    {
        name: "Tag course", type: "simple-tag-course", gameType: "tag", category: "short"
    },
    {
        name: "Town track", type: "town-track", gameType: "race", category: "long"
    },
    {
        name: "Monaco track", type: "monaco-track", gameType: "race", category: "long"
    },
    {
        name: "Mountain track", type: "russia-track", gameType: "race", category: "short"
    },
    {
        name: "Desert track", type: "spa-track", gameType: "race", hemisphereRadius: 1200, category: "long"
    },
    {
        name: "Winter track", type: "ferrari-track", gameType: "race", timeOfDay: "evening", category: "long"
    },
    {
        name: "Ski map", type: "skii-map", gameType: "race", timeOfDay: "day", category: "long"
    },
    {
        name: "Farmers little helper", type: "farmers-little-helper-map", gameType: "story", hemisphereRadius: 2000, category: "long"
    },
    {
        name: "Small track", type: "small-track", gameType: "race", category: "short"
    },
];
var getTrackInfos = function (trackNames) {
    return trackNames.map(function (t) {
        for (var _i = 0, allTrackNames_1 = exports.allTrackNames; _i < allTrackNames_1.length; _i++) {
            var at = allTrackNames_1[_i];
            if (at.type === t) {
                return at;
            }
        }
    });
};
exports.getTrackInfos = getTrackInfos;
exports.allVehicleTypes = [
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
];
exports.defaultVehicleType = "normal2";
exports.vehicleColors = [
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
];
var getColorNameFromType = function (colorType) {
    for (var _i = 0, vehicleColors_1 = exports.vehicleColors; _i < vehicleColors_1.length; _i++) {
        var c = vehicleColors_1[_i];
        if (c.value === colorType) {
            return c.name;
        }
    }
    return "Unknown color";
};
exports.getColorNameFromType = getColorNameFromType;
var getItemName = function (type) {
    for (var _i = 0, vehicleColors_2 = exports.vehicleColors; _i < vehicleColors_2.length; _i++) {
        var v = vehicleColors_2[_i];
        if (v.value === type) {
            return v.name;
        }
    }
    for (var _a = 0, allVehicleTypes_1 = exports.allVehicleTypes; _a < allVehicleTypes_1.length; _a++) {
        var v = allVehicleTypes_1[_a];
        if (v.type === type) {
            return v.name;
        }
    }
    for (var _b = 0, allTrackNames_2 = exports.allTrackNames; _b < allTrackNames_2.length; _b++) {
        var v = allTrackNames_2[_b];
        if (v.type === type) {
            return v.name;
        }
    }
    return type;
};
exports.getItemName = getItemName;
var MobileControls = /** @class */ (function () {
    function MobileControls(data) {
        this.beta = 0;
        this.gamma = 0;
        this.alpha = 0;
        this.f = false;
        this.b = false;
        this.resetVehicle = false;
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
        this.f = false;
        this.b = false;
        this.steerValue = 0;
        this.left = false;
        this.right = false;
    }
    return VehicleControls;
}());
exports.VehicleControls = VehicleControls;
var playerInfoToPreGamePlayerInfo = function (playerInfo) {
    var playerName = playerInfo.playerName, teamName = playerInfo.teamName, teamNumber = playerInfo.teamNumber, playerNumber = playerInfo.playerNumber, id = playerInfo.id, isAuthenticated = playerInfo.isAuthenticated, vehicleType = playerInfo.vehicleType, photoURL = playerInfo.photoURL, vehicleSetup = playerInfo.vehicleSetup;
    return {
        playerName: playerName !== null && playerName !== void 0 ? playerName : "undefined",
        teamName: teamName !== null && teamName !== void 0 ? teamName : "undefined",
        teamNumber: teamNumber !== null && teamNumber !== void 0 ? teamNumber : -1,
        playerNumber: playerNumber !== null && playerNumber !== void 0 ? playerNumber : -1,
        id: id !== null && id !== void 0 ? id : "undefined",
        isAuthenticated: isAuthenticated !== null && isAuthenticated !== void 0 ? isAuthenticated : false,
        vehicleType: vehicleType !== null && vehicleType !== void 0 ? vehicleType : "test",
        photoURL: photoURL !== null && photoURL !== void 0 ? photoURL : "",
        vehicleSetup: vehicleSetup !== null && vehicleSetup !== void 0 ? vehicleSetup : { vehicleType: "test" }
    };
};
exports.playerInfoToPreGamePlayerInfo = playerInfoToPreGamePlayerInfo;
var GameActions = /** @class */ (function () {
    function GameActions() {
        this.pause = false;
        this.restart = false;
    }
    return GameActions;
}());
exports.GameActions = GameActions;
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
exports.mdts_start_game = "mdts_start_game";
exports.std_start_game_callback = "stmd_start_game_callback";
exports.stmd_game_starting = "stmd_game_starting";
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
/** connection stuff */
exports.mdts_left_waiting_room = "mdts_left_waiting_room";
exports.stm_desktop_disconnected = "stm_desktop_disconnected";
exports.std_player_disconnected = "std_player_disconnected";
exports.mts_connected_to_waiting_room = "mts_connected_to_waiting_room";
exports.stmd_waiting_room_alert = "stmd_waiting_room_alert";
exports.dts_back_to_waiting_room = "dts_back_to_waiting_room";
exports.stm_player_info = "stm_player_info";
exports.mdts_number_connected = "mdts_number_connected";
exports.stmd_number_connected = "stmd_number_connected";
exports.std_quit_game = "std_quit_game";
exports.mts_quit_game = "mts_quit_game";
// not implmented yet
exports.stm_back_to_waiting_room = "stm_back_to_waiting_room";
exports.mdts_game_settings_changed = "mdts_game_settings_changed";
exports.stmd_game_settings_changed = "stmd_game_settings_changed";
exports.dts_game_settings_changed_callback = "mts_game_settings_changed_callback";
exports.stm_game_settings_changed_callback = "stm_game_settings_changed_callback";
exports.mts_send_game_actions = "mts_send_game_actions";
exports.std_send_game_actions = "std_send_game_actions";
/** FPS on emit */
exports.STD_SENDINTERVAL_MS = 1000 / 60;
exports.MTS_SENDINTERVAL_MS = 1000 / 60;
