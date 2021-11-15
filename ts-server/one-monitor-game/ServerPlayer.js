"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var Player = /** @class */ (function () {
    function Player(socket, playerName, id, isAuthenticated, photoURL) {
        this.playerName = playerName;
        this.teamNumber = 1;
        this.vehicleType = "normal";
        this.id = id;
        this.isAuthenticated = isAuthenticated;
        this.isLeader = false;
        this.mobileControls = new shared_stuff_1.MobileControls();
        this.VehicleControls = new shared_stuff_1.VehicleControls();
        this.isConnected = true;
        this.photoURL = photoURL;
        this.setSocket(socket);
    }
    Player.prototype.setSocket = function (newSocket) {
        this.socket = newSocket;
        this.setupControler();
        this.setupGameDataInfoListener();
        this.setupPlayerInfoListener();
        this.setupQuitGameListener();
        this.setupUserSettingsListener();
        this.setupReconnectListener();
        this.setupWaitingRoomListener;
    };
    Player.prototype.setupWaitingRoomListener = function () {
        var _this = this;
        this.socket.on("in-waiting-room", function () {
            if (_this.game) {
                _this.game.alertWaitingRoom();
            }
        });
    };
    Player.prototype.sendGameSettings = function (gameSettings) {
        this.socket.emit("game-settings-changed", { gameSettings: gameSettings });
    };
    Player.prototype.setupQuitGameListener = function () {
        var _this = this;
        this.socket.on("quit-game", function () {
            if (_this.game) {
                _this.game.playerDisconnected(_this.playerName, _this.id);
            }
        });
    };
    Player.prototype.leaderStartsGame = function () {
        if (this.game) {
            this.game.startGame();
        }
    };
    Player.prototype.setupLeaderStartGameListener = function () {
        var _this = this;
        this.socket.once("leader-start-game", function () { return _this.leaderStartsGame(); });
    };
    Player.prototype.setLeader = function () {
        this.isLeader = true;
        this.setupLeaderStartGameListener();
    };
    Player.prototype.gameDisconnected = function () {
    };
    Player.prototype.setGame = function (game) {
        var _this = this;
        this.game = game;
        this.socket.on("disconnect", function () {
            if (_this.game) {
                _this.game.playerDisconnected(_this.playerName, _this.id);
            }
            _this.isConnected = false;
        });
    };
    Player.prototype.setupReconnectListener = function () {
        this.socket.on("player-reconnect", function () {
            console.log("player reconnected not implemented");
        });
    };
    Player.prototype.setupControler = function () {
        var _this = this;
        this.socket.on("send-controls", function (mobileControls) {
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
        };
    };
    Player.prototype.getPlayerControls = function () {
        return { mobileControls: this.mobileControls, playerNumber: this.playerNumber };
    };
    Player.prototype.setupUserSettingsListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mts_user_settings_changed, function (newUserSettings) {
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (_this.game) {
                _this.game.userSettingsChanged({ userSettings: newUserSettings, playerNumber: _this.playerNumber });
            }
        });
    };
    Player.prototype.startGame = function () {
        this.setupControler();
        if (this.game) {
            this.socket.emit("handle-game-starting", { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber });
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
    Player.prototype.playerFinished = function (data) {
        console.log("##player finished");
        this.socket.emit(shared_stuff_1.stm_player_finished, data);
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
        return this.playerName + " in team: " + this.teamNumber;
    };
    return Player;
}());
exports.Player = Player;
