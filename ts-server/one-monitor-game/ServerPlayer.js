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
exports.Player = void 0;
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var firebaseCoinFunctions_1 = require("../firebaseCoinFunctions");
var serverFirebaseFunctions_1 = require("../serverFirebaseFunctions");
var Player = /** @class */ (function () {
    function Player(socket, playerName, id, isAuthenticated, photoURL, userSettings, vehicleSetup) {
        var _a, _b;
        this.playerName = playerName;
        this.teamNumber = 1;
        this.vehicleType = (_b = (_a = userSettings === null || userSettings === void 0 ? void 0 : userSettings.vehicleSettings) === null || _a === void 0 ? void 0 : _a.vehicleType) !== null && _b !== void 0 ? _b : shared_stuff_1.defaultVehicleType;
        this.vehicleSetup = vehicleSetup;
        this.id = id;
        this.isAuthenticated = isAuthenticated;
        this.isLeader = false;
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
        this.mobileControls = new shared_stuff_1.MobileControls();
        this.VehicleControls = new shared_stuff_1.VehicleControls();
        this.isConnected = true;
        this.photoURL = photoURL;
        this.userSettings = userSettings;
        this.setSocket(socket);
    }
    Player.prototype.copyPlayer = function (player) {
        player.dataCollection.numberOfReconnects += 1;
        for (var _i = 0, _a = Object.keys(player.vehicleSetup); _i < _a.length; _i++) {
            var key_1 = _a[_i];
            // @ts-ignore
            this.vehicleSetup[key_1] = player.vehicleSetup[key_1];
        }
        for (var _b = 0, _c = Object.keys(player.userSettings); _b < _c.length; _b++) {
            var key_2 = _c[_b];
            // @ts-ignore
            this.userSettings[key_2] = player.userSettings[key_2];
        }
        for (var _d = 0, _e = Object.keys(player.userSettings.vehicleSettings); _d < _e.length; _d++) {
            var key_3 = _e[_d];
            // @ts-ignore
            this.userSettings.vehicleSettings[key_3] = player.userSettings.vehicleSettings[key_3];
        }
        var key;
        for (key in player.dataCollection) {
            this.dataCollection[key] = player.dataCollection[key];
        }
        // only primative types? otherwise shallow copy
        this.playerNumber = player.playerNumber;
        this.isLeader = player.isLeader;
        this.vehicleType = player.vehicleType;
        this.teamNumber = player.teamNumber;
    };
    /**
     * idea: turn off some of these listeners when the game has started TODO
     *
     * @param newSocket Socket
     */
    Player.prototype.setSocket = function (newSocket) {
        console.log("disconnecting old socket");
        //   this.desktopDisconnected()
        this.turnOffSocket();
        this.socket = newSocket;
        this.isConnected = true;
        this.setupControler();
        this.setupGameDataInfoListener();
        this.setupPlayerInfoListener();
        this.setupDisconnectListener();
        this.setupUserSettingsListener();
        this.setupWaitingRoomListener();
        this.setupGameSettingsListener();
        this.setupGameStartedListener();
        this.setupGameActionsListener();
        this.setupPingListener();
        this.setupLeftWaitingRoomListener();
        this.setupQuitGameListener();
    };
    Player.prototype.turnOffSocket = function () {
        if (!this.socket)
            return;
        console.log("turn off socket");
        this.socket.emit(shared_stuff_1.stm_desktop_disconnected, {});
        this.socket.removeAllListeners();
        this.socket.disconnect();
    };
    /**
     * actions like reset game
     * pause game
     * send from mobile on to the server
     */
    Player.prototype.setupGameActionsListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_send_game_actions, function (gameActions) {
            var _a;
            if (_this.isLeader) {
                (_a = _this.game) === null || _a === void 0 ? void 0 : _a.sendGameActions(gameActions);
            }
            else {
                console.log("non leader cannot change gameActions");
            }
        });
    };
    Player.prototype.setupQuitGameListener = function () {
        var _this = this;
        this.socket.once(shared_stuff_1.mts_quit_game, function () {
            var _a;
            (_a = _this.game) === null || _a === void 0 ? void 0 : _a.quitGame();
        });
    };
    /**
     * use e.g. is one player quits being leader
     */
    Player.prototype.sendPlayerInfo = function () {
        // only allow leader?
        this.socket.emit(shared_stuff_1.stm_player_info, { player: this.getPlayerInfo() });
    };
    Player.prototype.gameSettingsChangedCallback = function () {
        this.socket.emit(shared_stuff_1.stm_game_settings_changed_callback, {});
    };
    Player.prototype.setupLeftWaitingRoomListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mdts_left_waiting_room, function () {
            var _a, _b;
            console.log("left waiting room, game started:", (_a = _this.game) === null || _a === void 0 ? void 0 : _a.gameStarted);
            if (!((_b = _this.game) === null || _b === void 0 ? void 0 : _b.gameStarted)) {
                // this.game?.playerDisconnected(this.playerName, this.id)
                _this.socket.disconnect();
            }
            // disconnect from game handled in another function
        });
    };
    Player.prototype.setupPingListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_ping_test, function () {
            _this.socket.emit(shared_stuff_1.stm_ping_test_callback, {});
        });
    };
    Player.prototype.setupWaitingRoomListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_connected_to_waiting_room, function () {
            if (_this.game) {
                _this.game.alertWaitingRoom();
            }
        });
    };
    Player.prototype.setupGameStartedListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mdts_start_game, function () {
            if (_this.game && _this.isLeader) {
                _this.game.startGameFromLeader();
            }
            else if (!_this.isLeader) {
                console.log("NOT LEADER trying to start game");
            }
        });
    };
    Player.prototype.setupGameSettingsListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mdts_game_settings_changed, function (data) {
            if (!_this.isLeader) {
                console.log("not leader cannot change game settings");
            }
            else {
                if (_this.game) {
                    _this.game.sendGameSettings(data.gameSettings, data.roomSettings);
                }
            }
        });
    };
    Player.prototype.sendGameSettings = function (gameSettings, roomSettings) {
        this.socket.emit(shared_stuff_1.stmd_game_settings_changed, { gameSettings: gameSettings, roomSettings: roomSettings });
    };
    Player.prototype.setupDisconnectListener = function () {
        var _this = this;
        this.socket.on("disconnect", function () {
            console.log("Player Socket disconnected", _this.playerName);
            _this.isConnected = false;
            if (_this.game) {
                _this.game.playerDisconnected(_this.playerName, _this.id);
            }
        });
    };
    Player.prototype.setLeader = function () {
        this.isLeader = true;
    };
    Player.prototype.desktopDisconnected = function () {
        var _a;
        console.log("desktop disconnected", this.playerName);
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.emit(shared_stuff_1.stm_desktop_disconnected, {});
    };
    Player.prototype.setGame = function (game) {
        this.game = game;
    };
    Player.prototype.setupControler = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_controls, function (mobileControls) {
            _this.mobileControls = mobileControls;
        });
    };
    Player.prototype.getPlayerInfo = function () {
        return {
            playerName: this.playerName,
            isLeader: this.isLeader,
            teamName: this.teamName,
            playerNumber: this.playerNumber,
            mobileControls: this.mobileControls,
            teamNumber: this.teamNumber,
            id: this.id,
            isAuthenticated: this.isAuthenticated,
            vehicleType: this.vehicleType,
            photoURL: this.photoURL,
            isConnected: this.isConnected,
            vehicleSetup: this.vehicleSetup,
            vehicleSettings: this.userSettings.vehicleSettings
        };
    };
    Player.prototype.getEndOfRoomInfo = function () {
        var obj = __assign(__assign({}, this.getPlayerInfo()), { dataCollection: this.dataCollection });
        obj = (0, serverFirebaseFunctions_1.deleteUndefined)(obj);
        return obj;
    };
    Player.prototype.getPlayerControls = function () {
        return { mobileControls: this.mobileControls, playerNumber: this.playerNumber };
    };
    Player.prototype.onReconnection = function () {
        if (this.game) {
            this.game.userSettingsChanged({ userSettings: this.userSettings, playerNumber: this.playerNumber, vehicleSetup: this.vehicleSetup });
        }
    };
    Player.prototype.setupUserSettingsListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_user_settings_changed, function (_a) {
            var _b, _c;
            var userSettings = _a.userSettings, vehicleSetup = _a.vehicleSetup;
            if (userSettings) {
                if (((_b = userSettings.vehicleSettings) === null || _b === void 0 ? void 0 : _b.vehicleType) !== ((_c = _this.userSettings.vehicleSettings) === null || _c === void 0 ? void 0 : _c.vehicleType)) {
                    _this.dataCollection.numberOfVehicleChanges += 1;
                }
                _this.userSettings = userSettings;
            }
            if (vehicleSetup) {
                _this.vehicleSetup = vehicleSetup;
            }
            // TODO: check if user owns vehicleType
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (_this.game) {
                _this.game.userSettingsChanged({ userSettings: _this.userSettings, playerNumber: _this.playerNumber, vehicleSetup: _this.vehicleSetup });
                _this.game.alertWaitingRoom();
            }
        });
    };
    Player.prototype.startGame = function () {
        this.setupControler();
        if (this.game) {
            this.socket.emit(shared_stuff_1.stmd_game_starting, { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber });
        }
    };
    Player.prototype.setupPlayerInfoListener = function () {
        var _this = this;
        this.socket.on("player-info-changed", function (playerData) {
            var keys = Object.keys(playerData);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                if (playerData[key] !== undefined) {
                    // @ts-ignore
                    _this[key] = playerData[key];
                }
            }
            if (_this.game) {
                _this.game.alertWaitingRoom();
            }
        });
    };
    // data: IEndOfRaceInfoPlayer
    Player.prototype.playerFinished = function (data) {
        this.dataCollection.numberOfRacesFinished += 1;
        this.socket.emit(shared_stuff_1.stm_player_finished, data);
        (0, firebaseCoinFunctions_1.updatePlayersTokens)(data);
    };
    Player.prototype.gameFinished = function (data) {
        this.socket.emit(shared_stuff_1.stm_game_finished, data);
    };
    Player.prototype.setupGameDataInfoListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_game_data_info, function (data) {
            if (_this.game) {
                _this.game.sendGameDataInfo(data);
            }
        });
    };
    Player.prototype.vehicleSetupString = function () {
        var _a, _b, _c, _d, _e, _f;
        return "vehicleType:" + this.vehicleSetup.vehicleType + ", exhaust: " + ((_b = (_a = this.vehicleSetup) === null || _a === void 0 ? void 0 : _a.exhaust) === null || _b === void 0 ? void 0 : _b.id) + ", spoiler: " + ((_d = (_c = this.vehicleSetup) === null || _c === void 0 ? void 0 : _c.spoiler) === null || _d === void 0 ? void 0 : _d.id) + ", wheel guards: " + ((_f = (_e = this.vehicleSetup) === null || _e === void 0 ? void 0 : _e.wheelGuards) === null || _f === void 0 ? void 0 : _f.id);
    };
    Player.prototype.toString = function () {
        return this.playerName + ": number: " + this.playerNumber + ", id: " + this.id + ", vehicletype:" + this.vehicleType + ", vehicleSetup:" + this.vehicleSetupString();
    };
    return Player;
}());
exports.Player = Player;
