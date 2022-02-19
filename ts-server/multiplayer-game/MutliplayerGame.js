"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMutliplayerSocket = void 0;
var uuid_1 = require("uuid");
var multiplayer_shared_stuff_1 = require("../../public/src/shared-backend/multiplayer-shared-stuff");
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var shuffleArray = function (arr) {
    var n = 4 * arr.length;
    var j = 0;
    while (j < n) {
        for (var i = 0; i < arr.length; i++) {
            var temp = arr[i];
            var ri = Math.floor(Math.random() * arr.length);
            arr[i] = arr[ri];
            arr[ri] = temp;
        }
        j += 1;
    }
};
var MultiplayerRoomMaster = /** @class */ (function () {
    function MultiplayerRoomMaster() {
        this.rooms = {};
    }
    MultiplayerRoomMaster.prototype.deleteRoomCallback = function (roomId) {
        console.log("destoying room", roomId);
        delete this.rooms[roomId];
    };
    MultiplayerRoomMaster.prototype.addSocket = function (io, socket, userId) {
        var _this = this;
        socket.on(multiplayer_shared_stuff_1.m_ts_connect_to_room, function (_a) {
            var roomId = _a.roomId, config = _a.config;
            console.log("on connect to room", roomId);
            var player = new MulitplayerPlayer(socket, config);
            if (!roomId) {
                var newRoom = new MultiplayerRoom(io, player, config.gameSettings, function (roomId) { return _this.deleteRoomCallback(roomId); });
                console.log("creating room", newRoom.roomId);
                _this.rooms[newRoom.roomId] = newRoom;
                return;
            }
            var room = _this.findRoom(roomId);
            if (room) {
                room.addPlayer(player);
            }
            else {
                socket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                    message: "Room does not exists",
                    status: "error"
                });
            }
        });
        socket.emit(shared_stuff_1.stmd_socket_ready);
    };
    MultiplayerRoomMaster.prototype.findRoom = function (roomId) {
        console.log("all mult rooms", Object.keys(this.rooms));
        for (var _i = 0, _a = Object.keys(this.rooms); _i < _a.length; _i++) {
            var key = _a[_i];
            if (key === roomId) {
                console.log("room found", roomId);
                return this.rooms[key];
            }
        }
        return undefined;
    };
    return MultiplayerRoomMaster;
}());
var MultiplayerRoom = /** @class */ (function () {
    function MultiplayerRoom(io, leader, gameSettings, deleteRoomCallback) {
        this.players = [];
        this.gameSettings = gameSettings;
        this.deleteRoomCallback = deleteRoomCallback;
        this.leader = leader;
        this.leader.setLeader();
        this.leader.setRoom(this);
        this.gameStarted = false;
        this.roomId = (0, uuid_1.v4)().slice(0, 4);
        this.addPlayer(leader);
        this.io = io;
        this.startTime = 0;
        this.isSendingVehicleInfo = false;
        this.numberOfLaps = -1;
        this.countdownStarted = false;
        // in test mode 
        if (false) {
            var testConfig = {
                displayName: "Test",
                userId: "test",
                isAuthenticated: false
            };
            var testPlayer = new MulitplayerPlayer(leader.desktopSocket, testConfig);
            this.addPlayer(testPlayer);
            var vehicleType = "tractor";
            var testVehicleSettings = {
                vehicleType: vehicleType,
                steeringSensitivity: 1,
                chaseCameraSpeed: 1,
                cameraZoom: 1,
                useChaseCamera: true,
                useDynamicFOV: true,
                noSteerNumber: 0
            };
            testPlayer.userSettings = {
                vehicleSettings: testVehicleSettings
            };
            testPlayer.vehicleSetup = {
                vehicleColor: "#61f72a",
                vehicleType: vehicleType,
            };
            testPlayer.isReady = true;
        }
    }
    MultiplayerRoom.prototype.setGameSettings = function (gameSettings) {
        this.gameSettings = gameSettings;
        // set number of laps when game starts
    };
    MultiplayerRoom.prototype.addPlayer = function (player) {
        // check if player exists
        var idx = this.getPlayerIndex(player.userId);
        console.log("idx", idx);
        if (idx !== undefined) {
            console.log("player exists");
            player.copyPlayer(this.players[idx]);
            // cannot disconnect here
            //this.players[idx].desktopSocket.disconnect()
            delete this.players[idx];
            this.players[idx] = player;
            player.setRoom(this);
            player.desktopSocket.join(this.roomId);
            player.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                message: "Successfully reconnected",
                status: "success",
                data: {
                    roomId: this.roomId
                }
            });
            return;
        }
        else {
            player.setRoom(this);
        }
        if (this.gameStarted) {
            console.log("Game started, cannot add", player.displayName);
            player.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                message: "Cannot join a game that has started",
                status: "error",
            });
            return;
        }
        this.players.push(player);
        player.playerNumber = this.players.length - 1;
        player.desktopSocket.join(this.roomId);
        player.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
            message: "Successfully connected",
            status: "success",
            data: {
                roomId: this.roomId
            }
        });
    };
    MultiplayerRoom.prototype.getPlayerIndex = function (userId) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].userId === userId) {
                return i;
            }
        }
        return undefined;
    };
    MultiplayerRoom.prototype.playerDisconnected = function (userId) {
        console.log("player disconnected in room", this.roomId);
        // check if all players have disconnected
        if (!this.gameStarted) {
            var idx = this.getPlayerIndex(userId);
            if (idx !== undefined) {
                var isLeader = this.players[idx].isLeader;
                this.players.splice(idx, 1);
                if (this.players.length > 0 && isLeader) {
                    this.players[0].setLeader();
                }
                else if (this.players.length === 0) {
                    // destroy game
                    this.deleteRoom();
                }
            }
            this.sendRoomInfo();
        }
        else {
            // just send that player disconnected to everyone
            var everyoneDisconnected = true;
            for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
                var p = _a[_i];
                if (p.isConnected) {
                    everyoneDisconnected = false;
                }
            }
            if (everyoneDisconnected) {
                this.deleteRoom();
            }
        }
    };
    MultiplayerRoom.prototype.deleteRoom = function () {
        var _a, _b;
        this.isSendingVehicleInfo = false;
        clearInterval((_a = this.gameInterval) === null || _a === void 0 ? void 0 : _a[Symbol.toPrimitive]());
        clearTimeout((_b = this.countdownTimeout) === null || _b === void 0 ? void 0 : _b[Symbol.toPrimitive]());
        this.deleteRoomCallback(this.roomId);
    };
    MultiplayerRoom.prototype.sendRoomInfo = function () {
        console.log("sending room info, player count:", this.players.length);
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_room_info, { players: this.getPlayersInfo(), gameSettings: this.gameSettings });
    };
    MultiplayerRoom.prototype.getPlayersInfo = function () {
        return this.players.map(function (p) { return p.getPlayerInfo(); });
    };
    MultiplayerRoom.prototype.gameSettingsChanged = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.sendGameSettingsChanged();
        }
    };
    /**
     * @returns true if can start game else false
     */
    MultiplayerRoom.prototype.goToGameRoomFromLeader = function () {
        this.gameStarted = true;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var player = _a[_i];
            player.sendGoToGameRoom();
        }
        return true;
    };
    MultiplayerRoom.prototype.userSettingsChanged = function (data) {
        //  const data = { userId, vehicleSetup, userSettings }
        // send to other players?
        console.log("user settings change");
        this.sendRoomInfo();
    };
    MultiplayerRoom.prototype.getSpawnPosition = function () {
        var arr = [];
        for (var i = 0; i < this.players.length; i++) {
            arr.push(i);
        }
        shuffleArray(arr);
        var pos = {};
        for (var i = 0; i < this.players.length; i++) {
            pos[this.players[i].userId] = arr[i];
        }
        return pos;
    };
    MultiplayerRoom.prototype.startGameInterval = function () {
        var _this = this;
        var _a;
        if (this.isSendingVehicleInfo)
            return;
        this.isSendingVehicleInfo = true;
        // dont do this if only one player
        var obj = {};
        for (var _i = 0, _b = this.players; _i < _b.length; _i++) {
            var p = _b[_i];
            obj[p.userId] = p.getVehicleInfo();
        }
        this.gameInterval = setInterval(function () {
            // const arr = this.players.map(p => p.getVehicleInfo())
            _this.io.to(_this.roomId).emit(multiplayer_shared_stuff_1.m_fs_vehicles_position_info, obj);
        }, (_a = 1000 / this.gameSettings.targetFPS) !== null && _a !== void 0 ? _a : 45); // how many times?
    };
    MultiplayerRoom.prototype.startGame = function () {
        this.numberOfLaps = this.gameSettings.numberOfLaps;
        console.log("countdown finished");
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_countdown, { countdown: 0 });
        this.countdownStarted = false;
        this.startTime = Date.now();
    };
    MultiplayerRoom.prototype.restartGame = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.restartGame();
        }
        //  this.startGameCountDown()
    };
    MultiplayerRoom.prototype.startGameCountDown = function () {
        var _this = this;
        if (this.countdownStarted)
            return;
        this.countdownStarted = true;
        console.log("start game countdown");
        var countdown = 4;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown: countdown
        });
        this.startGameInterval();
        var countdownTimer = function () {
            countdown -= 1;
            _this.countdownTimeout = setTimeout(function () {
                console.log("count down", countdown);
                if (countdown > 0) {
                    _this.io.to(_this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_countdown, { countdown: countdown });
                    countdownTimer();
                }
                else {
                    _this.startGame();
                }
            }, 1000);
        };
        countdownTimer();
    };
    MultiplayerRoom.prototype.playerReady = function () {
        // check if all players are ready
        var everyoneReady = true;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (!p.isReady) {
                everyoneReady = false;
            }
        }
        if (everyoneReady) {
            // start game
            console.log("every thing ready");
            this.startGameCountDown();
        }
    };
    MultiplayerRoom.prototype.sendGameFinished = function () {
        var winner = {
            name: "",
            totalTime: Infinity
        };
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.totalTime < winner.totalTime) {
                winner = {
                    name: p.displayName,
                    totalTime: p.totalTime
                };
            }
        }
        for (var _b = 0, _c = this.players; _b < _c.length; _b++) {
            var p = _c[_b];
            p.gameFinished({ raceData: this.getPlayersRaceData(), winner: winner });
        }
    };
    MultiplayerRoom.prototype.playerFinishedLap = function (player) {
        if (player.lapNumber > this.numberOfLaps) {
            player.isFinished = true;
        }
        var gameFinished = true;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (!p.isFinished) {
                gameFinished = false;
            }
        }
        if (gameFinished) {
            this.sendGameFinished();
        }
    };
    MultiplayerRoom.prototype.sendRaceInfo = function () {
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_race_info, { raceData: this.getPlayersRaceData() });
    };
    MultiplayerRoom.prototype.getPlayersRaceData = function () {
        return this.players.map(function (p) { return p.getPlayerRaceData(); });
    };
    return MultiplayerRoom;
}());
var MulitplayerPlayer = /** @class */ (function () {
    function MulitplayerPlayer(desktopSocket, config) {
        this.desktopSocket = desktopSocket;
        this.config = config;
        this.userId = config.userId;
        this.displayName = config.displayName;
        // this.vehicleSetup = config.vehicleSetup
        // this.userSettings = config.userSettings
        this.isAuthenticated = config.isAuthenticated;
        this.isLeader = false;
        this.isConnected = true;
        this.isReady = false;
        this.vehiclePositionInfo = new VehiclePositionInfo(this.userId);
        this.lapNumber = 0;
        this.latestLapTime = 0;
        this.isFinished = false;
        this.totalTime = 0;
        this.setupSocket();
    }
    MulitplayerPlayer.prototype.setupSocket = function () {
        this.setupDisconnectedListener();
        this.setupInWaitingRoomListener();
        this.setupUserSettingChangedListener();
        this.setupPlayerReadyListener();
        this.setupPingListener();
        this.setupGetPosRotListener();
        this.setupLapDoneListener();
        this.setupRestartGameListener();
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
        this.desktopSocket.on(shared_stuff_1.dts_ping_test, function () {
            _this.desktopSocket.emit(shared_stuff_1.std_ping_test_callback, { ping: "ping" });
        });
    };
    MulitplayerPlayer.prototype.setLeader = function () {
        this.isLeader = true;
        this.setupGameSettingsChangedListener();
        this.setupStartGameListener();
    };
    MulitplayerPlayer.prototype.setupPlayerReadyListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_player_ready, function () {
            var _a;
            console.log("player ready");
            _this.isReady = true;
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.playerReady();
        });
    };
    MulitplayerPlayer.prototype.setupGetPosRotListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_pos_rot, function (_a) {
            var pos = _a.pos, rot = _a.rot, speed = _a.speed;
            _this.vehiclePositionInfo.setData(pos, rot, speed);
        });
    };
    MulitplayerPlayer.prototype.getVehicleInfo = function () {
        return this.vehiclePositionInfo;
    };
    MulitplayerPlayer.prototype.restartGame = function () {
        this.lapNumber = 0;
        this.latestLapTime = 0;
        this.isFinished = false;
    };
    MulitplayerPlayer.prototype.gameFinished = function (data) {
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_finished, data);
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
    MulitplayerPlayer.prototype.sendGoToGameRoom = function () {
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_starting, {});
    };
    MulitplayerPlayer.prototype.copyPlayer = function (player) {
        var _a, _b;
        console.log("copying player", player.toString());
        if (player.vehicleSetup) {
            // @ts-ignore
            this.vehicleSetup = {};
            for (var _i = 0, _c = Object.keys(player.vehicleSetup); _i < _c.length; _i++) {
                var key = _c[_i];
                // @ts-ignore
                this.vehicleSetup[key] = player.vehicleSetup[key];
            }
        }
        if (player.userSettings) {
            // @ts-ignore
            this.userSettings = {};
            for (var _d = 0, _e = Object.keys(player.userSettings); _d < _e.length; _d++) {
                var key = _e[_d];
                // @ts-ignore
                this.userSettings[key] = player.userSettings[key];
            }
        }
        // @ts-ignore
        this.userSettings.vehicleSettings = {};
        for (var _f = 0, _g = Object.keys((_b = (_a = player.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings) !== null && _b !== void 0 ? _b : {}); _f < _g.length; _f++) {
            var key = _g[_f];
            // @ts-ignore
            this.userSettings.vehicleSettings[key] = player.userSettings.vehicleSettings[key];
        }
        // only primative types? otherwise shallow copy
        this.playerNumber = player.playerNumber;
        if (player.isLeader) {
            this.setLeader();
        }
        player.turnOffSocket();
    };
    MulitplayerPlayer.prototype.turnOffSocket = function () {
        if (!this.desktopSocket)
            return;
        console.log("turn off socket");
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.desktopSocket.removeAllListeners();
        this.desktopSocket.disconnect();
    };
    MulitplayerPlayer.prototype.setupUserSettingChangedListener = function () {
        var _this = this;
        // just use this string
        this.desktopSocket.on(shared_stuff_1.mts_user_settings_changed, function (_a) {
            var _b;
            var userSettings = _a.userSettings, vehicleSetup = _a.vehicleSetup;
            if (userSettings) {
                _this.userSettings = userSettings;
            }
            if (vehicleSetup) {
                _this.vehicleSetup = vehicleSetup;
            }
            if (_this.vehicleSetup || _this.userSettings) {
                (_b = _this.room) === null || _b === void 0 ? void 0 : _b.userSettingsChanged({ userId: _this.userId, vehicleSetup: _this.vehicleSetup, userSettings: _this.userSettings });
            }
        });
    };
    MulitplayerPlayer.prototype.setupLapDoneListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_lap_done, function (_a) {
            var _b;
            var totalTime = _a.totalTime, latestLapTime = _a.latestLapTime, lapNumber = _a.lapNumber;
            _this.lapNumber = lapNumber;
            _this.latestLapTime = latestLapTime;
            // dont know if total time should come from player or server
            _this.totalTime = totalTime;
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.playerFinishedLap(_this);
        });
    };
    MulitplayerPlayer.prototype.setRoom = function (room) {
        this.room = room;
    };
    MulitplayerPlayer.prototype.setupInWaitingRoomListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_in_waiting_room, function () {
            var _a, _b;
            console.log("In waiting room", _this.displayName, (_a = _this.room) === null || _a === void 0 ? void 0 : _a.roomId);
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.sendRoomInfo();
        });
    };
    MulitplayerPlayer.prototype.setupDisconnectedListener = function () {
        var _this = this;
        this.desktopSocket.on("disconnect", function () {
            var _a;
            _this.isConnected = false;
            console.log("muliplayer player disconencted", _this.userId);
            (_a = _this.room) === null || _a === void 0 ? void 0 : _a.playerDisconnected(_this.userId);
        });
    };
    MulitplayerPlayer.prototype.setupGameSettingsChangedListener = function () {
        var _this = this;
        this.desktopSocket.on(multiplayer_shared_stuff_1.m_ts_game_settings_changed, function (_a) {
            var _b, _c;
            var gameSettings = _a.gameSettings;
            console.log("new game settings");
            (_b = _this.room) === null || _b === void 0 ? void 0 : _b.setGameSettings(gameSettings);
            (_c = _this.room) === null || _c === void 0 ? void 0 : _c.gameSettingsChanged();
        });
    };
    MulitplayerPlayer.prototype.sendGameSettingsChanged = function () {
        var _a;
        this.desktopSocket.emit(multiplayer_shared_stuff_1.m_fs_game_settings_changed, { gameSettings: (_a = this.room) === null || _a === void 0 ? void 0 : _a.gameSettings });
    };
    MulitplayerPlayer.prototype.getPlayerRaceData = function () {
        return {
            playerName: this.displayName,
            lapNumber: this.lapNumber
        };
    };
    MulitplayerPlayer.prototype.getPlayerInfo = function () {
        var _a;
        return {
            playerName: this.displayName,
            isLeader: this.isLeader,
            playerNumber: this.playerNumber,
            id: this.userId,
            isAuthenticated: this.isAuthenticated,
            vehicleType: (_a = this.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings.vehicleType,
            isConnected: this.isConnected,
            vehicleSetup: this.vehicleSetup
        };
    };
    MulitplayerPlayer.prototype.toString = function () {
        var _a;
        return "Player " + this.displayName + ", vehicleType:" + ((_a = this.userSettings) === null || _a === void 0 ? void 0 : _a.vehicleSettings.vehicleType);
    };
    return MulitplayerPlayer;
}());
var roomMaster = new MultiplayerRoomMaster();
var handleMutliplayerSocket = function (io, socket, userId) {
    roomMaster.addSocket(io, socket, userId);
};
exports.handleMutliplayerSocket = handleMutliplayerSocket;
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
