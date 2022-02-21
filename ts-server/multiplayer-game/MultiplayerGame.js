"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMutliplayerSocket = exports.MultiplayerRoom = exports.MultiplayerRoomMaster = void 0;
var uuid_1 = require("uuid");
var multiplayer_shared_stuff_1 = require("../../public/src/shared-backend/multiplayer-shared-stuff");
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var serverFirebaseFunctions_1 = require("../serverFirebaseFunctions");
var MultiplayerPlayer_1 = require("./MultiplayerPlayer");
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
    MultiplayerRoomMaster.prototype.addSocket = function (io, socket, deviceType) {
        var _this = this;
        // config includes
        // userId
        // displayName
        socket.on(multiplayer_shared_stuff_1.m_ts_connect_to_room, function (_a) {
            var roomId = _a.roomId, config = _a.config;
            if (deviceType === "mobile") {
                // mobile cannot create room
                // only connect to player
                var room = _this.findRoom(roomId);
                if (room) {
                    room.addPlayerMobileSocket(socket, config.userId);
                }
                else {
                    socket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                        message: "Room does not exists",
                        status: "error"
                    });
                }
            }
            else {
                console.log("on connect to room", roomId);
                var player = new MultiplayerPlayer_1.MulitplayerPlayer(socket, config);
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
exports.MultiplayerRoomMaster = MultiplayerRoomMaster;
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
        this.needsReload = false;
        this.roomCreatedTime = Date.now();
        this.numberOfRestarts = 0;
        // in test mode 
        if (false) {
            var testConfig = {
                displayName: "Test",
                userId: "test",
                isAuthenticated: false
            };
            var testPlayer = new MultiplayerPlayer_1.MulitplayerPlayer(leader.desktopSocket, testConfig);
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
    MultiplayerRoom.prototype.setNeedsReload = function () {
        this.needsReload = true;
    };
    MultiplayerRoom.prototype.reloadGame = function () {
        this.numberOfRestarts += 1;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_reload_game, {
            players: this.getPlayersInfo(),
            gameSettings: this.gameSettings
        });
    };
    MultiplayerRoom.prototype.setGameSettings = function (gameSettings) {
        if (this.gameSettings.trackName !== gameSettings.trackName) {
            this.gameSettings = gameSettings;
            this.setNeedsReload();
        }
        else {
            this.gameSettings = gameSettings;
        }
        // set number of laps when game starts
    };
    MultiplayerRoom.prototype.addPlayer = function (player) {
        // check if player exists
        var idx = this.getPlayerIndex(player.userId);
        if (idx !== undefined) {
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
                    roomId: this.roomId,
                    gameStarted: this.gameStarted,
                    players: this.getPlayersInfo(),
                    gameSettings: this.gameSettings
                }
            });
            return;
        }
        else {
            player.setRoom(this);
        }
        if (this.gameStarted) {
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
    MultiplayerRoom.prototype.addPlayerMobileSocket = function (socket, userId) {
        var idx = this.getPlayerIndex(userId);
        if (idx === undefined) {
            // allow connecting with displayName is no account?
            socket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                message: "Desktop not connected, please connect with the same account",
                status: "error"
            });
        }
        else {
            this.players[idx].addMobileSocket(socket);
            socket.join(this.roomId);
            socket.emit(multiplayer_shared_stuff_1.m_fs_connect_to_room_callback, {
                message: "Successfully connected to player",
                status: "success",
                data: {
                    roomId: this.roomId,
                    gameStarted: this.gameStarted,
                    players: this.getPlayersInfo(),
                    gameSettings: this.gameSettings
                }
            });
        }
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
        var _a, _b, _c;
        var ip = (_a = this.leader.desktopSocket.handshake.headers['x-forwarded-for']) !== null && _a !== void 0 ? _a : this.leader.desktopSocket.conn.remoteAddress;
        if (Array.isArray(ip)) {
            console.log("ip is a list", ip);
            ip = ip.join("");
        }
        (0, serverFirebaseFunctions_1.addCreatedRooms)(this.roomId, this.leader.userId, {
            multiplayer: true,
            roomCreatedDate: this.roomCreatedTime,
            roomDeleteDate: Date.now(),
            startedGame: this.gameStarted,
            players: this.players.map(function (p) { return p.getEndOfRoomInfo(); }),
            gameSettings: this.gameSettings,
        });
        this.isSendingVehicleInfo = false;
        clearInterval((_b = this.gameInterval) === null || _b === void 0 ? void 0 : _b[Symbol.toPrimitive]());
        clearTimeout((_c = this.countdownTimeout) === null || _c === void 0 ? void 0 : _c[Symbol.toPrimitive]());
        this.deleteRoomCallback(this.roomId);
    };
    MultiplayerRoom.prototype.sendRoomInfo = function () {
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
        if (this.isSendingVehicleInfo)
            return;
        this.isSendingVehicleInfo = true;
        // dont do this if only one player
        var obj = {};
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            obj[p.userId] = p.getVehicleInfo();
        }
        this.gameInterval = setInterval(function () {
            // const arr = this.players.map(p => p.getVehicleInfo())
            _this.io.to(_this.roomId).emit(multiplayer_shared_stuff_1.m_fs_vehicles_position_info, obj);
        }, 1000 / 25); // how many times?
    };
    MultiplayerRoom.prototype.startGame = function () {
        this.numberOfLaps = this.gameSettings.numberOfLaps;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_countdown, { countdown: 0 });
        this.countdownStarted = false;
        this.startTime = Date.now();
    };
    MultiplayerRoom.prototype.restartGame = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.restartGame();
        }
        if (this.needsReload) {
            this.reloadGame();
        }
        else {
            this.startGameCountDown();
        }
    };
    MultiplayerRoom.prototype.startGameCountDown = function () {
        var _this = this;
        if (this.countdownStarted)
            return;
        this.countdownStarted = true;
        this.needsReload = false;
        var countdown = 4;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown: countdown
        });
        this.startGameInterval();
        var countdownTimer = function () {
            countdown -= 1;
            _this.countdownTimeout = setTimeout(function () {
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
exports.MultiplayerRoom = MultiplayerRoom;
var roomMaster = new MultiplayerRoomMaster();
var handleMutliplayerSocket = function (io, socket, deviceType) {
    roomMaster.addSocket(io, socket, deviceType);
};
exports.handleMutliplayerSocket = handleMutliplayerSocket;
