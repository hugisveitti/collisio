"use strict";
exports.__esModule = true;
exports.Room = void 0;
var uuid_1 = require("uuid");
var ServerPlayer_1 = require("./ServerPlayer");
var TestRoom_1 = require("./TestRoom");
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
        this.testRoom = new TestRoom_1["default"]();
    }
    RoomMaster.prototype.setupPlayerConnectedListener = function (mobileSocket) {
        var _this = this;
        mobileSocket.on("player-connected", function (_a) {
            var roomId = _a.roomId, playerName = _a.playerName, playerId = _a.playerId, isAuthenticated = _a.isAuthenticated, photoURL = _a.photoURL;
            if (!_this.roomExists(roomId)) {
                mobileSocket.emit("player-connected-callback", { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus });
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
        socket.join(roomId);
        socket.emit("create-room-callback", { status: successStatus, message: "Successfully connected to the game.", data: { roomId: roomId } });
    };
    RoomMaster.prototype.addSocket = function (socket) {
        var _this = this;
        var roomId;
        var isTestMode = false;
        var onMobile;
        console.log("adding socket, games", Object.keys(this.rooms));
        socket.once("device-type", function (_a) {
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
                console.log("Connection from", deviceType);
                if (deviceType === "desktop") {
                    socket.on("create-room", function () {
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = (0, uuid_1.v4)().slice(0, 4);
                        _this.createRoom(socket, roomId);
                    });
                    socket.on("disconnect", function () {
                        console.log("disconnected from desktop", roomId);
                        if (roomId) {
                            _this.rooms[roomId].isConnected = false;
                            delete _this.rooms[roomId];
                        }
                    });
                }
                else {
                    _this.setupPlayerConnectedListener(socket);
                }
                socket.on("get-players-in-room", function (_a) {
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
                    socket.emit("get-players-in-room-callback", { message: message, status: status, data: { players: players } });
                });
            }
        });
    };
    return RoomMaster;
}());
exports["default"] = RoomMaster;
var Room = /** @class */ (function () {
    function Room(roomId, io, socket, deleteRoomCallback) {
        this.players = [];
        this.gameSettings = {};
        this.roomId = roomId;
        this.io = io;
        this.socket = socket;
        this.gameStarted = false;
        this.isConnected = true;
        this.deleteRoomCallback = deleteRoomCallback;
        this.setupStartGameListener();
        this.setupGameSettingsListener();
        this.setupLeftWaitingRoomListener();
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
                player.socket.emit("player-connected-callback", { status: errorStatus, message: "The game you are trying to connect to has already started." });
                return;
            }
            else {
                player.socket.emit("player-connected-callback", { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } });
                player.socket.emit("handle-game-starting");
                return;
            }
        }
        this.players.push(player);
        player.setGame(this);
        player.playerNumber = this.players.length - 1;
        if (this.players.length === 1) {
            player.setLeader();
        }
        player.socket.emit("player-connected-callback", { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } });
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
            _this.socket.emit("get-controls", { players: _this.getPlayersControls() });
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
        this.socket.once("handle-start-game", function () {
            if (_this.players.length === 0) {
                _this.socket.emit("handle-start-game-callback", {
                    message: "No players connected, cannot start game",
                    status: errorStatus
                });
                setTimeout(function () {
                    _this.setupStartGameListener();
                }, 50);
            }
            else {
                _this.socket.emit("handle-start-game-callback", {
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
        this.socket.emit("user-settings-changed", data);
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
