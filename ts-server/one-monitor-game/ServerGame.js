"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
var uuid_1 = require("uuid");
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var ServerPlayer_1 = require("./ServerPlayer");
var TestRoom_1 = __importDefault(require("./TestRoom"));
var successStatus = "success";
var errorStatus = "error";
var RoomMaster = /** @class */ (function () {
    function RoomMaster(io) {
        var _this = this;
        this.roomExists = function (roomId) {
            var roomIds = Object.keys(_this.rooms);
            for (var i = 0; i < roomIds.length; i++) {
                if (roomId === roomIds[i]) {
                    return true;
                }
            }
            return false;
        };
        this.io = io;
        this.rooms = {};
        /** only one test room */
        this.testRoom = new TestRoom_1.default();
        this.allSocketIds = [];
    }
    RoomMaster.prototype.setupPlayerConnectedListener = function (mobileSocket) {
        var _this = this;
        mobileSocket.on(shared_stuff_1.mts_player_connected, function (_a) {
            var roomId = _a.roomId, playerName = _a.playerName, playerId = _a.playerId, isAuthenticated = _a.isAuthenticated, photoURL = _a.photoURL;
            // console.log("connecting player", roomId, playerName)
            if (!_this.roomExists(roomId)) {
                mobileSocket.emit(shared_stuff_1.stm_player_connected_callback, { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus });
            }
            else {
                var player = new ServerPlayer_1.Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL);
                _this.rooms[roomId].addPlayer(player);
            }
        });
    };
    RoomMaster.prototype.createRoom = function (socket, roomId) {
        var _this = this;
        this.rooms[roomId] = new Room(roomId, this.io, socket, function () {
            /** delete room callback */
            delete _this.rooms[roomId];
        });
        // console.log(`creating room ${roomId}, rooms: ${Object.keys(this.rooms)}`)
        socket.join(roomId);
        socket.emit(shared_stuff_1.std_room_created_callback, { status: successStatus, message: "Successfully created a room.", data: { roomId: roomId } });
    };
    RoomMaster.prototype.addSocket = function (socket) {
        var _this = this;
        var roomId;
        var isTestMode = false;
        var onMobile;
        // console.log("adding socket", socket.id.slice(0, 4))
        this.allSocketIds.push(socket.id);
        socket.once(shared_stuff_1.mdts_device_type, function (_a) {
            var deviceType = _a.deviceType, mode = _a.mode;
            isTestMode = mode === "test";
            onMobile = deviceType === "mobile";
            if (isTestMode) {
                console.log("In testmode from", deviceType);
                if (onMobile) {
                    _this.testRoom.setMobileSocket(socket);
                }
                else {
                    _this.testRoom.setDesktopSocket(socket);
                }
            }
            else {
                // console.log("Connection from", deviceType)
                if (deviceType === "desktop") {
                    socket.on(shared_stuff_1.dts_create_room, function () {
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = (0, uuid_1.v4)().slice(0, 4);
                        _this.createRoom(socket, roomId);
                    });
                    socket.on("disconnect", function () {
                        // console.log("disconnected from desktop", roomId)
                        if (roomId) {
                            _this.rooms[roomId].isConnected = false;
                            delete _this.rooms[roomId];
                        }
                    });
                }
                else {
                    _this.setupPlayerConnectedListener(socket);
                }
                socket.on(shared_stuff_1.mdts_players_in_room, function (_a) {
                    var roomId = _a.roomId;
                    var message, status, players;
                    if (_this.rooms[roomId]) {
                        players = _this.rooms[roomId].getPlayersInfo();
                        message = "Players in room fetched";
                        status = successStatus;
                    }
                    else {
                        players = [];
                        message = "Room with given id does not exist";
                        status = errorStatus;
                    }
                    socket.emit(shared_stuff_1.stmd_players_in_room_callback, { message: message, status: status, data: { players: players } });
                });
            }
            socket.emit(shared_stuff_1.stmd_socket_ready, {});
            socket.on("disconnect", function () {
                var idx = _this.allSocketIds.indexOf(socket.id);
                _this.allSocketIds.splice(idx, 1);
                // console.log("all connected sockets", this.allSocketIds)
            });
        });
    };
    return RoomMaster;
}());
exports.default = RoomMaster;
var Room = /** @class */ (function () {
    function Room(roomId, io, socket, deleteRoomCallback) {
        this.players = [];
        this.gameSettings = {};
        this.roomId = roomId;
        this.io = io;
        this.gameStarted = false;
        this.isConnected = true;
        this.deleteRoomCallback = deleteRoomCallback;
        this.setSocket(socket);
    }
    Room.prototype.setupLeftWaitingRoomListener = function () {
        var _this = this;
        this.socket.on("left-waiting-room", function () {
            /** if game hasnt started delete game */
            if (!_this.gameStarted) {
                for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                    var player = _a[_i];
                    player.gameDisconnected();
                }
                _this.deleteRoomCallback();
            }
        });
    };
    Room.prototype.setSocket = function (socket) {
        this.socket = socket;
        this.setupStartGameListener();
        this.setupGameSettingsListener();
        this.setupLeftWaitingRoomListener();
        this.setupPlayerFinishedListener();
        this.setupGameFinishedListener();
        this.setupPingListener();
    };
    Room.prototype.setupPingListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_ping_test, function () {
            _this.socket.emit(shared_stuff_1.std_ping_test_callback, { ping: "ping" });
        });
    };
    Room.prototype.addPlayer = function (player) {
        var playerExists = false;
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players[i].setSocket(player.socket);
                playerExists = true;
            }
        }
        if (this.gameStarted) {
            if (!playerExists) {
                player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: errorStatus, message: "The game you are trying to connect to has already started." });
            }
            else {
                player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } });
                player.socket.emit(shared_stuff_1.stm_game_starting);
            }
            return;
        }
        this.players.push(player);
        player.setGame(this);
        player.playerNumber = this.players.length - 1;
        if (this.players.length === 1) {
            player.setLeader();
        }
        player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } });
        player.socket.join(this.roomId);
        player.socket.emit("room-connected", { roomId: this.roomId, isLeader: player.isLeader });
        this.alertWaitingRoom();
        if (this.gameStarted) {
            player.startGame();
        }
    };
    Room.prototype.alertWaitingRoom = function () {
        this.io.to(this.roomId).emit("waiting-room-alert", { players: this.getPlayersInfo() });
    };
    Room.prototype.setupGameSettingsListener = function () {
        var _this = this;
        this.socket.on("game-settings-changed", function (data) {
            _this.gameSettings = data.gameSettings;
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                player.sendGameSettings(_this.gameSettings);
            }
        });
    };
    Room.prototype.setupControlsListener = function () {
        var _this = this;
        setInterval(function () {
            _this.socket.emit(shared_stuff_1.std_controls, { players: _this.getPlayersControls() });
            // set fps
        }, 1000 / 120);
    };
    Room.prototype.getPlayersControls = function () {
        var playersControls = [];
        for (var i = 0; i < this.players.length; i++) {
            playersControls.push(this.players[i].getPlayerControls());
        }
        return playersControls;
    };
    Room.prototype.getPlayersInfo = function () {
        var playersInfo = [];
        for (var i = 0; i < this.players.length; i++) {
            playersInfo.push(this.players[i].getPlayerInfo());
        }
        return playersInfo;
    };
    Room.prototype.setupStartGameListener = function () {
        var _this = this;
        this.socket.once(shared_stuff_1.dts_start_game, function () {
            if (_this.players.length === 0) {
                _this.socket.emit(shared_stuff_1.std_start_game_callback, {
                    message: "No players connected, cannot start game",
                    status: errorStatus
                });
                setTimeout(function () {
                    _this.setupStartGameListener();
                }, 50);
            }
            else {
                _this.socket.emit(shared_stuff_1.std_start_game_callback, {
                    message: "Game starting",
                    status: successStatus
                });
                _this.startGame();
            }
        });
    };
    Room.prototype.startGame = function () {
        this.setupControlsListener();
        this.gameStarted = true;
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].startGame();
        }
    };
    // if game hasn't started, remove player from game
    Room.prototype.playerDisconnected = function (playerName, playerId) {
        this.socket.emit("player-disconnected", { playerName: playerName });
        if (!this.gameStarted) {
            for (var i = 0; i < this.players.length; i++) {
                // change to id's and give un auth players id's
                if (this.players[i].id === playerId) {
                    this.players.splice(i, 1);
                }
            }
        }
        this.alertWaitingRoom();
    };
    Room.prototype.userSettingsChanged = function (data) {
        this.socket.emit(shared_stuff_1.std_user_settings_changed, data);
    };
    Room.prototype.setupPlayerFinishedListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_player_finished, function (data) {
            console.log("player finehsd", data.playerId);
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                if (player.id === data.playerId) {
                    console.log("player found!");
                    player.playerFinished(data);
                }
            }
        });
    };
    Room.prototype.setupGameFinishedListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_game_finished, function (data) {
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var players = _a[_i];
                players.gameFinished(data);
            }
        });
    };
    Room.prototype.sendGameDataInfo = function (data) {
        this.socket.emit(shared_stuff_1.std_game_data_info, data);
    };
    Room.prototype.toString = function () {
        var playersString = "";
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var player = _a[_i];
            playersString += player.toString() + ", ";
        }
        return this.roomId + ": " + playersString;
    };
    return Room;
}());
exports.Room = Room;