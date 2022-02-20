"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
var uuid_1 = require("uuid");
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var MultiplayerGame_1 = require("../multiplayer-game/MultiplayerGame");
var serverFirebaseFunctions_1 = require("../serverFirebaseFunctions");
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
    RoomMaster.prototype.getStatsString = function () {
        var _a = this.getStats(), numberOfRooms = _a.numberOfRooms, numberOfPlayers = _a.numberOfPlayers, numberOfRoomsNotSendingControls = _a.numberOfRoomsNotSendingControls, numberOfRoomsSendingControls = _a.numberOfRoomsSendingControls;
        var stats = [];
        stats.push("Stats begin: " + new Date().toISOString());
        stats.push("Number of rooms " + numberOfRooms);
        stats.push("Number of players in game " + numberOfPlayers);
        stats.push("Number rooms not sending controlls " + numberOfRoomsNotSendingControls);
        stats.push("Number rooms sending controlls " + numberOfRoomsSendingControls);
        stats.push("--------------");
        return stats.join("\n");
    };
    RoomMaster.prototype.getStats = function () {
        var numNotSendingControls = 0;
        var numSendingControls = 0;
        var numPlayers = 0;
        for (var _i = 0, _a = Object.keys(this.rooms); _i < _a.length; _i++) {
            var roomId = _a[_i];
            if (!this.rooms[roomId].sendingControls) {
                numNotSendingControls += 1;
            }
            else {
                numSendingControls += 1;
                numPlayers += this.rooms[roomId].players.length;
            }
        }
        return {
            numberOfRooms: numSendingControls + numNotSendingControls,
            numberOfPlayers: numPlayers,
            numberOfRoomsNotSendingControls: numNotSendingControls,
            numberOfRoomsSendingControls: numSendingControls
        };
    };
    RoomMaster.prototype.setupPlayerConnectedListener = function (mobileSocket) {
        var _this = this;
        console.log("setting player connected listener", mobileSocket.id);
        mobileSocket.on(shared_stuff_1.mts_player_connected, function (_a) {
            var roomId = _a.roomId, playerName = _a.playerName, playerId = _a.playerId, isAuthenticated = _a.isAuthenticated, photoURL = _a.photoURL, isStressTest = _a.isStressTest, userSettings = _a.userSettings, vehicleSetup = _a.vehicleSetup;
            console.log("connecting to room", roomId, playerName);
            if (!_this.roomExists(roomId)) {
                console.log("room does not exist", roomId, mobileSocket.id, shared_stuff_1.stm_player_connected_callback);
                mobileSocket.emit(shared_stuff_1.stm_player_connected_callback, { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus });
            }
            else if (!isStressTest && _this.rooms[roomId].isFull() && !_this.rooms[roomId].gameStarted && !_this.rooms[roomId].playerIsInRoom(playerId)) {
                mobileSocket.emit(shared_stuff_1.stm_player_connected_callback, { message: "Room is full.", status: errorStatus });
            }
            else {
                var player = new ServerPlayer_1.Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL, userSettings, vehicleSetup);
                _this.rooms[roomId].addPlayer(player);
            }
        });
    };
    RoomMaster.prototype.socketHasRoom = function (socket) {
        for (var _i = 0, _a = Object.keys(this.rooms); _i < _a.length; _i++) {
            var roomId = _a[_i];
            if (socket === this.rooms[roomId].socket) {
                return true;
            }
        }
        return false;
    };
    RoomMaster.prototype.createRoom = function (socket, roomId, data, userId) {
        var _this = this;
        var _a;
        console.log("Creating room", roomId, socket.handshake.address, socket.conn.remoteAddress, socket.handshake.headers['x-forwarded-for']);
        var ip = (_a = socket.handshake.headers['x-forwarded-for']) !== null && _a !== void 0 ? _a : socket.conn.remoteAddress;
        if (Array.isArray(ip)) {
            console.log("ip is a list", ip);
            ip = ip.join("");
        }
        (0, serverFirebaseFunctions_1.addCreatedRooms)(ip, roomId, userId);
        var numberOfRoomsSendingControls = this.getStats().numberOfRoomsSendingControls;
        if (numberOfRoomsSendingControls > 25) {
            console.warn("Too many rooms, so not creating room");
            socket.emit(shared_stuff_1.std_room_created_callback, {
                status: errorStatus,
                message: "Number of active rooms is full. Consider donaiting to help support this project which will allow us to buy better servers."
            });
            return;
        }
        if (this.socketHasRoom(socket)) {
            console.warn("Socket already has room");
            socket.emit(shared_stuff_1.std_room_created_callback, {
                status: errorStatus,
                message: "Socket alread has room."
            });
            return;
        }
        this.rooms[roomId] = new Room(roomId, this.io, socket, data, function () {
            /** delete room callback */
            delete _this.rooms[roomId];
        });
        console.log("room created", roomId, this.getStatsString());
        socket.join(roomId);
        socket.emit(shared_stuff_1.std_room_created_callback, { status: successStatus, message: "Successfully created a room.", data: { roomId: roomId } });
    };
    RoomMaster.prototype.addSocket = function (socket) {
        var _this = this;
        var roomId;
        var isTestMode = false;
        var onMobile;
        //   this.allSocketIds.push(socket.id)
        socket.once(shared_stuff_1.mdts_device_type, function (_a) {
            var deviceType = _a.deviceType, mode = _a.mode, userId = _a.userId;
            console.log("socket connected", deviceType, ", mode", mode);
            isTestMode = mode === "test";
            onMobile = deviceType === "mobile";
            if (mode === "multiplayer") {
                console.log("multiplayer socket");
                (0, MultiplayerGame_1.handleMutliplayerSocket)(_this.io, socket, deviceType);
                return;
            }
            if (isTestMode) {
                if (onMobile) {
                    _this.testRoom.setMobileSocket(socket);
                }
                else {
                    _this.testRoom.setDesktopSocket(socket);
                }
            }
            else {
                if (deviceType === "desktop") {
                    socket.on(shared_stuff_1.dts_create_room, function (req) {
                        console.log("creating room");
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = (0, uuid_1.v4)().slice(0, 4);
                        _this.createRoom(socket, roomId, req.data, userId);
                    });
                    socket.on("disconnect", function () {
                        if (roomId && _this.rooms[roomId]) {
                            _this.rooms[roomId].isConnected = false;
                            delete _this.rooms[roomId];
                        }
                    });
                    socket.emit(shared_stuff_1.stmd_socket_ready, {});
                }
                else {
                    _this.setupPlayerConnectedListener(socket);
                    socket.emit(shared_stuff_1.stmd_socket_ready, {});
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
            // socket.on("disconnect", () => {
            //     const idx = this.allSocketIds.indexOf(socket.id)
            //     this.allSocketIds.splice(idx, 1)
            // })
        });
    };
    return RoomMaster;
}());
exports.default = RoomMaster;
var Room = /** @class */ (function () {
    function Room(roomId, io, socket, data, deleteRoomCallback) {
        this.players = [];
        this.gameSettings = {};
        this.roomId = roomId;
        this.io = io;
        this.gameStarted = false;
        this.sendingControls = false;
        this.desktopUserId = undefined;
        this.isConnected = true;
        this.deleteRoomCallback = deleteRoomCallback;
        this.setSocket(socket);
        var dataKeys = Object.keys(data);
        for (var _i = 0, dataKeys_1 = dataKeys; _i < dataKeys_1.length; _i++) {
            var key = dataKeys_1[_i];
            // @ts-ignore
            this[key] = data[key];
        }
    }
    Room.prototype.setSocket = function (socket) {
        this.socket = socket;
        this.setupStartGameListener();
        this.setupGameSettingsListener();
        this.setupLeftWaitingRoomListener();
        this.setupPlayerFinishedListener();
        this.setupGameFinishedListener();
        this.setupPingListener();
        this.setupVechilesReadyListener();
        this.setupLeftWebsiteListener();
        this.setupBackToWaitingRoomListener();
    };
    Room.prototype.setupBackToWaitingRoomListener = function () {
        var _this = this;
        this.gameStarted = false;
        this.socket.on(shared_stuff_1.dts_back_to_waiting_room, function () {
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                player.desktopDisconnected();
            }
        });
    };
    Room.prototype.setupLeftWaitingRoomListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mdts_left_waiting_room, function () {
            /** if game hasnt started delete game */
            if (!_this.gameStarted) {
                for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                    var player = _a[_i];
                    player.desktopDisconnected();
                }
                _this.deleteRoomCallback();
            }
        });
    };
    Room.prototype.setupLeftWebsiteListener = function () {
        var _this = this;
        this.socket.on("disconnect", function () {
            console.log("disconnected", _this.roomId);
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                player.desktopDisconnected();
            }
            _this.deleteRoomCallback();
            if (_this.desktopUserId) {
                (0, serverFirebaseFunctions_1.removeAvailableRoom)(_this.desktopUserId);
            }
        });
    };
    Room.prototype.setupVechilesReadyListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_vehicles_ready, function () {
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                if (player.userSettings) {
                    _this.userSettingsChanged({ userSettings: player.userSettings, playerNumber: player.playerNumber, vehicleSetup: player.vehicleSetup });
                }
            }
        });
    };
    Room.prototype.setupPingListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_ping_test, function () {
            _this.socket.emit(shared_stuff_1.std_ping_test_callback, { ping: "ping" });
        });
    };
    Room.prototype.playerIsInRoom = function (playerId) {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.id === playerId)
                return true;
        }
        return false;
    };
    Room.prototype.addPlayer = function (player) {
        console.log("adding player", player.toString());
        var playerExists = false;
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                // disconnect old socket always
                //   this.players[i].socket.disconnect()
                playerExists = true;
                console.log("player exists!, disconnecting old socket, i:", i, "isLeader:", this.players[i].isLeader);
                // this.players[i].setSocket(player.socket)
                // player = this.players[i]
                player.copyPlayer(this.players[i]);
                this.players[i].turnOffSocket();
                var isLeader = this.players[i].isLeader;
                delete this.players[i];
                this.players[i] = player;
                this.players[i].setGame(this);
            }
        }
        if (this.gameStarted) {
            if (!playerExists) {
                console.log("game started and player does not exist");
                player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: errorStatus, message: "The game you are trying to connect to has already started." });
            }
            else {
                console.log("Player reconnected", player.playerName);
                player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId, gameSettings: this.gameSettings, gameStarted: true } });
                // player.socket.emit(stmd_game_starting)
                this.playerReconnected();
                player.onReconnection();
            }
            return;
        }
        if (this.players.length === 0) {
            player.setLeader();
        }
        if (!playerExists) {
            this.players.push(player);
            player.setGame(this);
            player.playerNumber = this.players.length - 1;
        }
        player.socket.emit(shared_stuff_1.stm_player_connected_callback, { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId, gameSettings: this.gameSettings } });
        player.socket.join(this.roomId);
        this.alertWaitingRoom();
        if (this.gameStarted) {
            player.startGame();
        }
    };
    Room.prototype.alertWaitingRoom = function () {
        this.io.to(this.roomId).emit(shared_stuff_1.stmd_waiting_room_alert, { players: this.getPlayersInfo() });
    };
    Room.prototype.setupGameSettingsListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.mdts_game_settings_changed, function (data) {
            _this.gameSettings = data.gameSettings;
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                player.sendGameSettings(_this.gameSettings);
            }
        });
        this.socket.on(shared_stuff_1.dts_game_settings_changed_callback, function () {
            for (var _i = 0, _a = _this.players; _i < _a.length; _i++) {
                var player = _a[_i];
                if (player.isLeader) {
                    player.gameSettingsChangedCallback();
                }
            }
        });
    };
    Room.prototype.startGameFromLeader = function () {
        this.startGame();
        this.socket.emit(shared_stuff_1.stmd_game_starting);
    };
    Room.prototype.sendGameActions = function (data) {
        this.socket.emit(shared_stuff_1.std_send_game_actions, data);
    };
    Room.prototype.sendGameSettings = function (gameSettings) {
        this.gameSettings = gameSettings;
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var player = _a[_i];
            if (!player.isLeader) {
                player.sendGameSettings(this.gameSettings);
            }
        }
        this.socket.emit(shared_stuff_1.stmd_game_settings_changed, { gameSettings: gameSettings });
    };
    Room.prototype.setupControlsListener = function () {
        var _this = this;
        this.sendingControls = true;
        this.sendControlsInterval = setInterval(function () {
            _this.socket.emit(shared_stuff_1.std_controls, { players: _this.getPlayersControls() });
            // set fps
        }, shared_stuff_1.STD_SENDINTERVAL_MS);
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
        this.socket.once(shared_stuff_1.mdts_start_game, function () {
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
                // TODO: do some check to see if player owns vehicle
                _this.socket.emit(shared_stuff_1.std_start_game_callback, {
                    message: "Game starting",
                    status: successStatus
                });
                _this.startGame();
            }
        });
    };
    Room.prototype.startGame = function () {
        console.log("starting game, roomId:", this.roomId);
        if (this.gameStarted)
            return;
        this.gameStarted = true;
        this.setupControlsListener();
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].startGame();
        }
    };
    // if game hasn't started, remove player from game
    Room.prototype.playerDisconnected = function (playerName, playerId) {
        this.socket.emit(shared_stuff_1.std_player_disconnected, { playerName: playerName });
        if (!this.gameStarted) {
            var wasLeader = false;
            for (var i = 0; i < this.players.length; i++) {
                // change to id's and give un auth players id's
                if (this.players[i].id === playerId && !this.players[i].isConnected) {
                    wasLeader = this.players[i].isLeader;
                    this.players.splice(i, 1);
                }
            }
            if (wasLeader) {
                if (this.players.length > 0) {
                    this.players[0].setLeader();
                    this.players[0].sendPlayerInfo();
                }
            }
        }
        this.alertWaitingRoom();
        if (this.gameStarted && this.everyoneDisconnected()) {
            if (this.sendControlsInterval) {
                this.sendingControls = false;
                clearInterval(this.sendControlsInterval);
            }
        }
    };
    Room.prototype.playerReconnected = function () {
        if (this.players.length === 1) {
            this.players[0].setLeader();
        }
        if (!this.sendingControls) {
            this.setupControlsListener();
        }
    };
    Room.prototype.everyoneDisconnected = function () {
        for (var _i = 0, _a = this.players; _i < _a.length; _i++) {
            var p = _a[_i];
            if (p.isConnected) {
                return false;
            }
        }
        return true;
    };
    Room.prototype.userSettingsChanged = function (data) {
        this.socket.emit(shared_stuff_1.std_user_settings_changed, data);
    };
    Room.prototype.setupPlayerFinishedListener = function () {
        var _this = this;
        this.socket.on(shared_stuff_1.dts_player_finished, function (data) {
            console.log("player finished", data.playerId);
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
    Room.prototype.quitGame = function () {
        console.log("Quit game with mobile");
        this.socket.emit(shared_stuff_1.std_quit_game, {});
    };
    Room.prototype.isFull = function () {
        // max number of players
        return this.players.length >= 4;
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
