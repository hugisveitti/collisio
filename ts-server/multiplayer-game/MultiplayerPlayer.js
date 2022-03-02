"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulitplayerPlayer = void 0;
var multiplayer_shared_stuff_1 = require("../../public/src/shared-backend/multiplayer-shared-stuff");
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var serverFirebaseFunctions_1 = require("../serverFirebaseFunctions");
var MulitplayerPlayer = /** @class */ (function () {
    function MulitplayerPlayer(desktopSocket, config) {
        this.desktopSocket = desktopSocket;
        this.geoIp = (0, serverFirebaseFunctions_1.getGeoInfo)(this.desktopSocket);
        this.config = config;
        this.gameSettings = config.gameSettings;
        this.userId = config.userId;
        this.displayName = config.displayName;
        this.gameSettings = {};
        // this.vehicleSetup = config.vehicleSetup
        // this.userSettings = config.userSettings
        this.isAuthenticated = config.isAuthenticated;
        this.isLeader = false;
        this.isConnected = true;
        this.isReady = false;
        this.vehiclePositionInfo = new VehiclePositionInfo(this.userId);
        this.lapNumber = 1;
        this.latestLapTime = 0;
        this.isFinished = false;
        this.mobileConnected = false;
        this.totalTime = 0;
        this.isSendingMobileControls = false;
        this.mobileControls = {};
        this.dataCollection = {
            numberOfMobileConnections: 0,
            numberOfVehicleChanges: 0,
            totalNumberOfLapsDone: 0,
            numberOfReconnects: 0,
            numberOfRacesFinished: 0,
            totalPing: 0,
            totalPingsGotten: 0,
            gameTicks: 0,
            roomTicks: 0,
        };
        this.posChanged = false;
        this.setupSocket();
    }
    MulitplayerPlayer.prototype.setLeader = function () {
        this.isLeader = true;
        this.setupRoomSettingsChangedListener();
        this.setupStartGameListener();
    };
    MulitplayerPlayer.prototype.getVehicleInfo = function () {
        return this.vehiclePositionInfo;
    };
    MulitplayerPlayer.prototype.restartGame = function () {
        this.lapNumber = 1;
        this.latestLapTime = 0;
        this.isFinished = false;
    };
    MulitplayerPlayer.prototype.reloadGame = function () {
        this.restartGame();
    };
    /** Start desktop socket functions */
    MulitplayerPlayer.prototype.setupSocket = function () {
        this.setupDisconnectedListener();
        this.setupInWaitingRoomListener();
        this.setupUserSettingChangedListener();
        this.setupPlayerReadyListener();
        this.setupPingListener();
        this.setupGetPosRotListener();
        this.setupLapDoneListener();
        this.setupRestartGameListener();
        this.setupLeftWaitingRoom();
    };
    MulitplayerPlayer.prototype.turnOffSocket = function () {
        if (!this.desktopSocket)
            return;
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.desktopSocket.removeAllListeners();
        this.desktopSocket.disconnect();
    };
    MulitplayerPlayer.prototype.setupLeftWaitingRoom = function () {
        var _this = this;
        var _a;
        (_a = this.desktopSocket) === null || _a === void 0 ? void 0 : _a.on(multiplayer_shared_stuff_1.m_ts_left_waiting_room, function () {
            var _a, _b;
            console.log("left waiting room multiplayer");
            if (!((_a = _this.room) === null || _a === void 0 ? void 0 : _a.enteredGameRoom)) {
                _this.turnOffSocket();
            }
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.playerDisconnected(_this.userId);
        });
    };
    MulitplayerPlayer.prototype.gameFinished = function (data) {
        this.dataCollection.numberOfRacesFinished += 1;
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_finished, data);
    };
    MulitplayerPlayer.prototype.sendGoToGameRoom = function () {
        // this could be done better?
        var _a, _b;
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_starting, {
            spawnPositions: (_a = this.room) === null || _a === void 0 ? void 0 : _a.getSpawnPosition(),
            countdown: 4,
        });
        if (this.mobileConnected) {
            (_b = this.mobileSocket) === null || _b === void 0 ? void 0 : _b.emit(multiplayer_shared_stuff_1.m_fs_game_starting, {});
            this.setupMobileControler();
        }
    };
    MulitplayerPlayer.prototype.setupRestartGameListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_restart_game, function () {
            var _a;
            // only leader?
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.restartGame();
        });
    };
    MulitplayerPlayer.prototype.setupPingListener = function () {
        var _this = this;
        this.desktopSocket.on(shared_stuff_1.dts_ping_test, function (_a) {
            var roomTicks = _a.roomTicks, gameTicks = _a.gameTicks, totalPing = _a.totalPing, totalPingsGotten = _a.totalPingsGotten;
            _this.dataCollection.roomTicks += (roomTicks !== null && roomTicks !== void 0 ? roomTicks : 0);
            _this.dataCollection.gameTicks += (gameTicks !== null && gameTicks !== void 0 ? gameTicks : 0);
            _this.dataCollection.totalPing += (totalPing !== null && totalPing !== void 0 ? totalPing : 0);
            _this.dataCollection.totalPingsGotten += (totalPingsGotten !== null && totalPingsGotten !== void 0 ? totalPingsGotten : 0);
            _this.desktopSocket.emit(shared_stuff_1.std_ping_test_callback, { ping: "ping" });
        });
    };
    MulitplayerPlayer.prototype.setupPlayerReadyListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_player_ready, function () {
            var _a, _b, _c;
            _this.isReady = true;
            var alreadyInGameRoom = (_a = _this.room) === null || _a === void 0 ? void 0 : _a.playerReady();
            if (alreadyInGameRoom && _this.room) {
                var obj = {};
                for (var _i = 0, _d = _this.room.players; _i < _d.length; _i++) {
                    var p = _d[_i];
                    obj[p.userId] = p.getVehicleInfo();
                }
                _this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_already_started, {
                    players: obj,
                    msDone: Date.now() - ((_c = (_b = _this.room) === null || _b === void 0 ? void 0 : _b.gameStartTime) !== null && _c !== void 0 ? _c : Date.now())
                });
            }
        });
    };
    MulitplayerPlayer.prototype.setupGetPosRotListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_pos_rot, function (_a) {
            var pos = _a.pos, rot = _a.rot, speed = _a.speed;
            _this.posChanged = true;
            _this.vehiclePositionInfo.setData(pos, rot, speed);
        });
    };
    MulitplayerPlayer.prototype.setupStartGameListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_go_to_game_room_from_leader, function () {
            var _a;
            var canStart = (_a = _this.room) === null || _a === void 0 ? void 0 : _a.goToGameRoomFromLeader();
            var status = "error";
            var message = "Cannot start game";
            if (canStart) {
                status = "success";
                message = "Can start game";
            }
            _this.desktopSocket.emit(multiplayer_shared_stuff_1.m_ts_go_to_game_room_from_leader_callback, { status: status, message: message });
        });
    };
    MulitplayerPlayer.prototype.setupUserSettingChangedListener = function () {
        var _this = this;
        // just use this string
        this.desktopSocket.on(shared_stuff_1.mts_user_settings_changed, function (_a) {
            var _b, _c, _d;
            var userSettings = _a.userSettings, vehicleSetup = _a.vehicleSetup;
            if (userSettings) {
                if (((_b = _this.userSettings) === null || _b === void 0 ? void 0 : _b.vehicleSettings.vehicleType) !== (userSettings === null || userSettings === void 0 ? void 0 : userSettings.vehicleSettings.vehicleType)) {
                    _this.dataCollection.numberOfVehicleChanges += 1;
                    // I think this is the place
                    _this.isReady = false;
                    (_c = _this.room) === null || _c === void 0 ? void 0 : _c.setNeedsReload();
                }
                _this.userSettings = userSettings;
            }
            if (vehicleSetup) {
                _this.vehicleSetup = vehicleSetup;
            }
            if (_this.vehicleSetup || _this.userSettings) {
                (_d = _this.room) === null || _d === void 0 ? void 0 : _d.userSettingsChanged({ userId: _this.userId, vehicleSetup: _this.vehicleSetup, userSettings: _this.userSettings });
            }
        });
    };
    MulitplayerPlayer.prototype.setupInWaitingRoomListener = function () {
        var _this = this;
        // need more than once?
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_in_waiting_room, function () {
            var _a;
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.sendRoomInfo();
        });
    };
    MulitplayerPlayer.prototype.setupDisconnectedListener = function () {
        var _this = this;
        this.desktopSocket.on("disconnect", function () {
            var _a, _b;
            _this.isConnected = false;
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.playerDisconnected(_this.userId);
            // always disconnect mobile ?
            (_b = _this.mobileSocket) === null || _b === void 0 ? void 0 : _b.disconnect();
        });
    };
    MulitplayerPlayer.prototype.setupRoomSettingsChangedListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_room_settings_changed, function (_a) {
            var _b, _c;
            var roomSettings = _a.roomSettings;
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.setRoomSettings(roomSettings);
            (_c = _this.room) === null || _c === void 0 ? void 0 : _c.roomSettingsChanged();
        });
    };
    MulitplayerPlayer.prototype.setupLapDoneListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_lap_done, function (_a) {
            var _b, _c;
            var totalTime = _a.totalTime, latestLapTime = _a.latestLapTime, lapNumber = _a.lapNumber;
            _this.dataCollection.totalNumberOfLapsDone += 1;
            _this.lapNumber = lapNumber;
            _this.latestLapTime = latestLapTime;
            // dont know if total time should come from player or server
            _this.totalTime = totalTime;
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.sendRaceInfo();
            (_c = _this.room) === null || _c === void 0 ? void 0 : _c.playerFinishedLap(_this);
        });
    };
    /** Mobile socket functions */
    MulitplayerPlayer.prototype.addMobileSocket = function (socket) {
        var _a;
        this.dataCollection.numberOfMobileConnections += 1;
        this.turnOffMobileSocket();
        this.mobileConnected = true;
        this.mobileSocket = socket;
        this.setupMobileInWaitingRoomListener();
        this.setupMobileInWaitingRoomListener();
        this.setupMobileStartGameListener();
        this.setupMobileDisconnectedListener();
        this.setupMobileLeftWaitingRoom();
        this.setupMobileGameSettingsChangedListener();
        if ((_a = this.room) === null || _a === void 0 ? void 0 : _a.gameStarted) {
            this.setupMobileControler();
        }
    };
    MulitplayerPlayer.prototype.turnOffMobileSocket = function () {
        if (!this.mobileSocket)
            return;
        this.isSendingMobileControls = false;
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.mobileSocket.removeAllListeners();
        this.mobileSocket.disconnect();
    };
    MulitplayerPlayer.prototype.setupMobileLeftWaitingRoom = function () {
        var _this = this;
        var _a;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(multiplayer_shared_stuff_1.m_ts_left_waiting_room, function () {
            var _a;
            if (!((_a = _this.room) === null || _a === void 0 ? void 0 : _a.enteredGameRoom)) {
                _this.turnOffMobileSocket();
            }
        });
    };
    MulitplayerPlayer.prototype.setupGameActionsListener = function () {
        var _this = this;
        var _a;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(shared_stuff_1.mts_send_game_actions, function (gameActions) {
            var _a;
            if (gameActions === null || gameActions === void 0 ? void 0 : gameActions.restartGame) {
                (_a = _this.room) === null || _a === void 0 ? void 0 : _a.restartGame();
            }
        });
    };
    MulitplayerPlayer.prototype.setupMobileGameSettingsChangedListener = function () {
        var _this = this;
        var _a;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(multiplayer_shared_stuff_1.m_ts_game_settings_changed, function (_a) {
            var _b;
            var gameSettings = _a.gameSettings;
            if ((gameSettings === null || gameSettings === void 0 ? void 0 : gameSettings.graphics) !== _this.gameSettings.graphics || _this.gameSettings.botDifficulty !== gameSettings.botDifficulty) {
                _this.isReady = false;
                (_b = _this.room) === null || _b === void 0 ? void 0 : _b.setNeedsReload();
            }
            _this.gameSettings = gameSettings;
            _this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_settings_changed, { gameSettings: gameSettings });
        });
    };
    MulitplayerPlayer.prototype.setupMobileControler = function () {
        var _this = this;
        var _a;
        if (this.isSendingMobileControls) {
            return;
        }
        this.isSendingMobileControls = true;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(shared_stuff_1.mts_controls, function (mobileControls) {
            _this.mobileControls = mobileControls;
            _this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_mobile_controls, mobileControls);
        });
    };
    MulitplayerPlayer.prototype.setupMobileDisconnectedListener = function () {
        var _this = this;
        var _a;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on("disconnect", function () {
            var _a;
            _this.isSendingMobileControls = false;
            _this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_mobile_controller_disconnected, {});
            _this.mobileSocket = undefined;
            _this.mobileConnected = false;
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.sendRoomInfo();
        });
    };
    MulitplayerPlayer.prototype.setupMobileInWaitingRoomListener = function () {
        var _this = this;
        var _a;
        // need more than once?
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(multiplayer_shared_stuff_1.m_ts_in_waiting_room, function () {
            var _a;
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.sendRoomInfo();
        });
    };
    MulitplayerPlayer.prototype.setupMobileStartGameListener = function () {
        var _this = this;
        var _a;
        (_a = this.mobileSocket) === null || _a === void 0 ? void 0 : _a.on(multiplayer_shared_stuff_1.m_ts_go_to_game_room_from_leader, function () {
            var _a, _b;
            var canStart = (_a = _this.room) === null || _a === void 0 ? void 0 : _a.goToGameRoomFromLeader();
            var status = "error";
            var message = "Cannot start game";
            if (canStart) {
                status = "success";
                message = "Can start game";
            }
            (_b = _this.mobileSocket) === null || _b === void 0 ? void 0 : _b.emit(multiplayer_shared_stuff_1.m_ts_go_to_game_room_from_leader_callback, { status: status, message: message });
        });
    };
    /** End mobile socket functions */
    MulitplayerPlayer.prototype.setRoom = function (room) {
        this.room = room;
    };
    MulitplayerPlayer.prototype.sendPosInfo = function (data) {
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_vehicles_position_info, data);
    };
    MulitplayerPlayer.prototype.sendRoomSettingsChanged = function () {
        var _a;
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_room_settings_changed, { roomSettings: (_a = this.room) === null || _a === void 0 ? void 0 : _a.roomSettings });
    };
    MulitplayerPlayer.prototype.getPlayerRaceData = function () {
        return {
            playerName: this.displayName,
            lapNumber: this.lapNumber,
            latestLapTime: this.latestLapTime
        };
    };
    MulitplayerPlayer.prototype.getPlayerInfo = function () {
        var _a, _b, _c;
        return {
            playerName: this.displayName,
            isLeader: this.isLeader,
            playerNumber: this.playerNumber,
            id: this.userId,
            isAuthenticated: this.isAuthenticated,
            vehicleType: (_b = (_a = this.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings.vehicleType) !== null && _b !== void 0 ? _b : shared_stuff_1.defaultVehicleType,
            isConnected: this.isConnected,
            vehicleSetup: this.vehicleSetup,
            mobileConnected: this.mobileConnected,
            vehicleSettings: (_c = this.userSettings) === null || _c === void 0 ? void 0 : _c.vehicleSettings
        };
    };
    // data to collect
    MulitplayerPlayer.prototype.getEndOfRoomInfo = function () {
        var obj = __assign(__assign(__assign(__assign({}, this.getPlayerInfo()), { dataCollection: this.dataCollection }), this.geoIp), { isReady: this.isReady, gameSettings: this.gameSettings });
        obj = (0, serverFirebaseFunctions_1.deleteUndefined)(obj);
        return obj;
    };
    MulitplayerPlayer.prototype.copyPlayer = function (player) {
        var _a, _b;
        player.dataCollection.numberOfReconnects += 1;
        if (player.vehicleSetup) {
            // @ts-ignore
            this.vehicleSetup = {};
            for (var _i = 0, _c = Object.keys(player.vehicleSetup); _i < _c.length; _i++) {
                var key_1 = _c[_i];
                // @ts-ignore
                this.vehicleSetup[key_1] = player.vehicleSetup[key_1];
            }
        }
        if (player.userSettings) {
            // @ts-ignore
            this.userSettings = {};
            for (var _d = 0, _e = Object.keys(player.userSettings); _d < _e.length; _d++) {
                var key_2 = _e[_d];
                // @ts-ignore
                this.userSettings[key_2] = player.userSettings[key_2];
            }
        }
        else {
            // @ts-ignore
            this.userSettings = {};
        }
        // @ts-ignore
        this.userSettings.vehicleSettings = {};
        for (var _f = 0, _g = Object.keys((_b = (_a = player.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings) !== null && _b !== void 0 ? _b : {}); _f < _g.length; _f++) {
            var key_3 = _g[_f];
            // @ts-ignore
            this.userSettings.vehicleSettings[key_3] = player.userSettings.vehicleSettings[key_3];
        }
        var key;
        for (key in player.dataCollection) {
            this.dataCollection[key] = player.dataCollection[key];
        }
        // only primative types? otherwise shallow copy
        this.playerNumber = player.playerNumber;
        if (player.isLeader) {
            this.setLeader();
        }
        if (player.mobileConnected) {
            this.mobileConnected = true;
            this.mobileSocket = player.mobileSocket;
        }
        player.turnOffSocket();
    };
    MulitplayerPlayer.prototype.toString = function () {
        var _a;
        return "Player " + this.displayName + ", vehicleType:" + ((_a = this.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings.vehicleType);
    };
    return MulitplayerPlayer;
}());
exports.MulitplayerPlayer = MulitplayerPlayer;
var VehiclePositionInfo = /** @class */ (function () {
    function VehiclePositionInfo(userId) {
        this.speed = 0;
        this.userId = userId;
        // this.pos = { x: 0, y: 0, z: 0 }
        // this.rot = { x: 0, y: 0, z: 0, w: 0 }
    }
    VehiclePositionInfo.prototype.setData = function (pos, rot, speed) {
        this.pos = pos;
        this.rot = rot;
        this.speed = speed;
    };
    return VehiclePositionInfo;
}());
