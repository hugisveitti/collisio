"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
                var player = new MultiplayerPlayer_1.MulitplayerPlayer(socket, config);
                if (!roomId) {
                    var newRoom = new MultiplayerRoom(io, player, config.gameSettings, config.roomSettings, function (roomId) { return _this.deleteRoomCallback(roomId); });
                    console.log("creating multiplayer room", newRoom.roomId);
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
    function MultiplayerRoom(io, leader, gameSettings, roomSettings, deleteRoomCallback) {
        this.players = [];
        this.gameSettings = gameSettings;
        this.roomSettings = roomSettings;
        this.deleteRoomCallback = deleteRoomCallback;
        this.leader = leader;
        this.leader.setLeader();
        this.leader.setRoom(this);
        this.enteredGameRoom = false;
        this.gameStarted = false;
        this.roomId = (0, uuid_1.v4)().slice(0, 4);
        this.addPlayer(leader);
        this.io = io;
        this.startTime = 0;
        this.gameIntervalStarted = false;
        this.raceInfoIntervalStarted = false;
        this.numberOfLaps = -1;
        this.countdownStarted = false;
        this.needsReload = false;
        this.dataCollection = {
            roomCreatedTime: Date.now(),
            roomDeletedTime: 0,
            numberOfReloads: 0,
            numberOfRoomSettingsChanges: 0,
            numberOfGameStartCountdowns: 0,
            numberOfPlayersReady: 0,
            numberOfGamesFinshed: 0,
            winners: [],
            totalNumberOfPlayerDisconnects: 0
        };
        // in test mode 
        if (false) {
            var testConfig = {
                displayName: "Test",
                userId: "test",
                isAuthenticated: false,
                gameSettings: {}
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
        this.dataCollection.numberOfReloads += 1;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.isReady = false;
        }
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_reload_game, {
            players: this.getPlayersInfo(),
            roomSettings: this.roomSettings
        });
    };
    MultiplayerRoom.prototype.setRoomSettings = function (roomSettings) {
        this.roomSettings = roomSettings;
        if (this.roomSettings.trackName !== roomSettings.trackName) {
            this.setNeedsReload();
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
                    gameStarted: this.enteredGameRoom,
                    players: this.getPlayersInfo(),
                    gameSettings: this.gameSettings
                }
            });
            return;
        }
        else {
            player.setRoom(this);
        }
        if (this.enteredGameRoom) {
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
                    gameStarted: this.enteredGameRoom,
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
        this.dataCollection.totalNumberOfPlayerDisconnects += 1;
        // check if all players have disconnected
        if (!this.enteredGameRoom) {
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
        this.dataCollection.roomDeletedTime = Date.now();
        (0, serverFirebaseFunctions_1.addCreatedRooms)(this.roomId, this.leader.userId, {
            multiplayer: true,
            startedGame: this.enteredGameRoom,
            players: this.players.map(function (p) { return p.getEndOfRoomInfo(); }),
            gameSettings: this.gameSettings,
            roomSettings: this.roomSettings,
            dataCollection: this.dataCollection,
            enteredGameRoom: this.enteredGameRoom
        });
        this.gameIntervalStarted = false;
        clearInterval((_a = this.gameInterval) === null || _a === void 0 ? void 0 : _a[Symbol.toPrimitive]());
        clearTimeout((_b = this.countdownTimeout) === null || _b === void 0 ? void 0 : _b[Symbol.toPrimitive]());
        clearTimeout((_c = this.raceInfoInterval) === null || _c === void 0 ? void 0 : _c[Symbol.toPrimitive]());
        this.deleteRoomCallback(this.roomId);
    };
    MultiplayerRoom.prototype.sendRoomInfo = function () {
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_room_info, { players: this.getPlayersInfo(), roomSettings: this.roomSettings });
    };
    MultiplayerRoom.prototype.getPlayersInfo = function () {
        return this.players.map(function (p) { return p.getPlayerInfo(); });
    };
    MultiplayerRoom.prototype.roomSettingsChanged = function () {
        this.dataCollection.numberOfRoomSettingsChanges += 1;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.sendRoomSettingsChanged();
        }
    };
    /**
     * @returns true if can start game else false
     */
    MultiplayerRoom.prototype.goToGameRoomFromLeader = function () {
        this.enteredGameRoom = true;
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
        return __awaiter(this, void 0, void 0, function () {
            var obj, _i, _a, p;
            var _this = this;
            return __generator(this, function (_b) {
                if (this.gameIntervalStarted)
                    return [2 /*return*/];
                this.gameIntervalStarted = true;
                obj = {};
                for (_i = 0, _a = this.players; _i < _a.length; _i++) {
                    p = _a[_i];
                    obj[p.userId] = p.getVehicleInfo();
                }
                this.gameInterval = setInterval(function () {
                    // const arr = this.players.map(p => p.getVehicleInfo())
                    if (_this.hasAnyPosChanged()) {
                        for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                            var p = _a[_i];
                            p.sendPosInfo(obj);
                        }
                        //  this.io.to(this.roomId).emit(m_fs_vehicles_position_info, obj)
                        _this.setPosChanged(false);
                    }
                }, 1000 / 30); // how many times?
                return [2 /*return*/];
            });
        });
    };
    MultiplayerRoom.prototype.setPosChanged = function (value) {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            p.posChanged = false;
        }
    };
    MultiplayerRoom.prototype.hasAnyPosChanged = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.posChanged)
                return true;
        }
        return false;
    };
    MultiplayerRoom.prototype.startGame = function () {
        this.gameStarted = true;
        this.numberOfLaps = this.gameSettings.numberOfLaps;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_countdown, { countdown: 0 });
        this.countdownStarted = false;
        this.startTime = Date.now();
    };
    MultiplayerRoom.prototype.restartGame = function () {
        this.gameStarted = false;
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
        this.dataCollection.numberOfGameStartCountdowns += 1;
        this.countdownStarted = true;
        this.needsReload = false;
        var countdown = 4;
        this.io.to(this.roomId).emit(multiplayer_shared_stuff_1.m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown: countdown
        });
        this.sendRaceInfo();
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
        this.dataCollection.numberOfPlayersReady += 1;
        // check if all players are ready
        var everyoneReady = true;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (!p.isReady) {
                everyoneReady = false;
            }
        }
        if (everyoneReady && !this.gameStarted) {
            // start game
            this.startGameCountDown();
        }
    };
    MultiplayerRoom.prototype.sendGameFinished = function () {
        this.dataCollection.numberOfGamesFinshed += 1;
        var winner = {
            name: "",
            totalTime: Infinity,
            id: ""
        };
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.totalTime < winner.totalTime) {
                winner = {
                    name: p.displayName,
                    totalTime: p.totalTime,
                    id: p.userId
                };
            }
        }
        this.dataCollection.winners.push(winner);
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
