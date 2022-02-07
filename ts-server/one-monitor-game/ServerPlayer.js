"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var firebaseCoinFunctions_1 = require("../firebaseCoinFunctions");
var Player = /** @class */ (function () {
    function Player(socket, playerName, id, isAuthenticated, photoURL, userSettings, vehicleSetup) {
        var _a, _b;
        this.playerName = playerName;
        this.teamNumber = 1;
        this.vehicleType = (_b = (_a = userSettings === null || userSettings === void 0 ? void 0 : userSettings.vehicleSettings) === null || _a === void 0 ? void 0 : _a.vehicleType) !== null && _b !== void 0 ? _b : "normal2";
        this.vehicleSetup = vehicleSetup;
        this.id = id;
        this.isAuthenticated = isAuthenticated;
        this.isLeader = false;
        this.mobileControls = new shared_stuff_1.MobileControls();
        this.VehicleControls = new shared_stuff_1.VehicleControls();
        this.isConnected = true;
        this.photoURL = photoURL;
        this.userSettings = userSettings;
        this.setSocket(socket);
    }
    /**
     * idea: turn off some of these listeners when the game has started TODO
     *
     * @param newSocket Socket
     */
    Player.prototype.setSocket = function (newSocket) {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.socket = newSocket;
        this.isConnected = true;
        this.setupControler();
        this.setupGameDataInfoListener();
        this.setupPlayerInfoListener();
        this.setupDisconnectListener();
        this.setupUserSettingsListener();
        this.setupReconnectListener();
        this.setupWaitingRoomListener();
        this.setupGameSettingsListener();
        this.setupGameStartedListener();
        this.setupGameActionsListener();
        this.setupPingListener();
        this.setupLeftWaitingRoomListener();
        this.setupQuitGameListener();
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
            if (!((_a = _this.game) === null || _a === void 0 ? void 0 : _a.gameStarted)) {
                (_b = _this.game) === null || _b === void 0 ? void 0 : _b.playerDisconnected(_this.playerName, _this.id);
            }
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
                    _this.game.sendGameSettings(data.gameSettings);
                }
            }
        });
    };
    Player.prototype.sendGameSettings = function (gameSettings) {
        this.socket.emit(shared_stuff_1.stmd_game_settings_changed, { gameSettings: gameSettings });
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
        this.socket.emit(shared_stuff_1.stm_desktop_disconnected, {});
    };
    Player.prototype.setGame = function (game) {
        this.game = game;
    };
    Player.prototype.setupReconnectListener = function () {
        // this.socket.on("player-reconnect", () => {
        //  //   console.log("player reconnected not implemented")
        // })
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
            vehicleSetup: this.vehicleSetup
        };
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
            var userSettings = _a.userSettings, vehicleSetup = _a.vehicleSetup;
            if (userSettings) {
                _this.userSettings = userSettings;
            }
            if (vehicleSetup) {
                _this.vehicleSetup = vehicleSetup;
            }
            // TODO: check if user owns vehicleType
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (_this.game) {
                _this.game.userSettingsChanged({ userSettings: _this.userSettings, playerNumber: _this.playerNumber, vehicleSetup: _this.vehicleSetup });
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
    Player.prototype.toString = function () {
        return this.playerName + ": number: " + this.teamNumber + ", vehicletype:" + this.vehicleType;
    };
    return Player;
}());
exports.Player = Player;
