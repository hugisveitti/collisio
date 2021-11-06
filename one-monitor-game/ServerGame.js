const { v4: uuidv4 } = require('uuid');
const Player = require("./ServerPlayer")
const TestRoom = require("./TestRoom")

const successStatus = "success"
const errorStatus = "error"
const maxNumberOfPlayersInRoom = 4


class GameMaster {
    rooms
    io
    testRoom


    constructor(io) {
        this.io = io
        this.rooms = {}
        /** only one test room */
        this.testRoom = new TestRoom()
    }

    roomExists = (roomId) => {
        const roomIds = Object.keys(this.rooms)
        for (let i = 0; i < roomIds.length; i++) {
            if (roomId === roomIds[i]) {
                return true
            }
        }
        return false
    }

    isRoomFull = (roomId) => {
        return this.rooms[roomId].isFull()
    }

    setupPlayerConnectedListener(mobileSocket) {
        mobileSocket.on("player-connected", ({ roomId, playerName, playerId, isAuthenticated, photoURL }) => {
            if (!this.roomExists(roomId)) {
                mobileSocket.emit("player-connected-callback", { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus })
            } else if (this.isRoomFull(roomId)) {
                mobileSocket.emit("player-connected-callback", { message: `Room is full. There can be a maximum of ${maxNumberOfPlayersInRoom} in one room.`, status: errorStatus })
            } else {
                const player = new Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL)
                this.rooms[roomId].addPlayer(player)
            }
        })
    }


    createRoom(socket, roomId) {
        this.rooms[roomId] = new Game(roomId, this.io, socket, () => {
            delete this.rooms[roomId]
            roomId = undefined
        })
        socket.join(roomId)
        socket.emit("create-room-callback", { status: successStatus, message: "Successfully connected to the game.", data: { roomId } })
    }


    addSocket(socket) {
        let roomId
        let isTestMode = false
        let onMobile
        console.log("adding socket, games", Object.keys(this.rooms))

        socket.once("device-type", ({ deviceType, mode }) => {
            isTestMode = mode === "test"
            onMobile = deviceType === "mobile"
            if (isTestMode) {
                console.log("In testmode from", deviceType)
                if (onMobile) {
                    this.testRoom.setMobileSocket(socket)
                } else {
                    this.testRoom.setDesktopSocket(socket)
                }
            } else {
                console.log("Connection from", deviceType)
                if (deviceType === "desktop") {
                    socket.on("create-room", () => {
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = uuidv4().slice(0, 4)
                        this.createRoom(socket, roomId)
                    })

                    socket.on("disconnect", () => {
                        console.log("disconnected from desktop", roomId)
                        if (roomId && !isTestMode) {
                            this.rooms[roomId].isConnected = false
                            delete this.rooms[roomId]
                        }
                    })
                } else {

                    this.setupPlayerConnectedListener(socket)

                }

                socket.on("get-players-in-room", ({ roomId }) => {
                    let message, status, players
                    if (this.rooms[roomId]) {
                        players = this.rooms[roomId].getPlayersInfo()
                        message = "Players in room fetched"
                        status = successStatus
                    } else {
                        players = []
                        message = "Room with given id does not exist"
                        status = errorStatus
                    }
                    socket.emit("get-players-in-room-callback", { message, status, data: { players } })
                })

            }
        })
    }
}




class Game {
    players
    roomId
    io
    socket
    gameStarted


    gameSettings
    isConnected
    deleteRoomCallback
    getControlsInterval

    constructor(roomId, io, socket, deleteRoomCallback) {
        this.players = []
        this.gameSettings = {}
        this.roomId = roomId
        this.io = io
        this.socket = socket
        this.gameStarted = false

        this.isConnected = true
        this.deleteRoomCallback = deleteRoomCallback

        this.setupLeftWaitingRoomListener()
        this.setupStartGameListener()
        this.setupGameSettingsListener()
    }


    setupLeftWaitingRoomListener() {
        this.socket.once("left-waiting-room", () => {
            if (!this.gameStarted) {
                /** if game hasnt started delete game */
                console.log("game disconnected in game")
                for (let player of this.players) {
                    player.gameDisconnected()
                }
                this.deleteRoomCallback()
            }
        })
    }

    setupQuitRoom() {
        this.socket.once("quit-room", () => {
            console.log("quiting room")
            clearInterval(this.getControlsInterval)
            for (let player of this.players) {
                player.gameDisconnected()
            }
            this.deleteRoomCallback()
        })
    }

    setSocket(socket) {
        this.socket = socket
        this.setupStartGameListener()
        this.setupGameSettingsListener()
    }

    addPlayer(player) {
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players[i].setSocket(player.socket)

                playerExists = true
            }
        }

        if (this.gameStarted) {
            if (!playerExists) {
                player.socket.emit("player-connected-callback", { status: errorStatus, message: "The game you are trying to connect to has already started." })
                return
            } else {
                player.socket.emit("player-connected-callback", { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } })
                player.socket.emit("handle-game-starting")
                return
            }
        }


        this.players.push(player)
        player.setGame(this)
        player.playerNumber = this.players.length - 1
        if (this.players.length === 1) {
            player.setLeader(player)
        }


        player.socket.emit("player-connected-callback", { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } })
        player.socket.join(this.roomId)
        player.socket.emit("room-connected", { roomId: this.roomId, isLeader: player.isLeader })
        this.alertWaitingRoom()
        if (this.gameStarted) {
            player.startGame()
        }

    }

    alertWaitingRoom() {
        this.io.to(this.roomId).emit("waiting-room-alert", { players: this.getPlayersInfo() })
    }

    setupGameSettingsListener() {
        this.socket.on("game-settings-changed", (data) => {
            this.gameSettings = data.gameSettings
            for (let player of this.players) {
                player.sendGameSettings(this.gameSettings)
            }
        })
    }

    setupControlsListener() {
        this.getControlsInterval = setInterval(() => {

            this.socket.emit("get-controls", { players: this.getPlayersControls() })
            // set fps
        }, 1000 / 60)
    }

    getPlayersControls() {
        const playersControls = []
        for (let i = 0; i < this.players.length; i++) {
            playersControls.push(this.players[i].getPlayerControls())
        }
        return playersControls
    }

    getPlayersInfo() {
        const playersInfo = []
        for (let i = 0; i < this.players.length; i++) {
            playersInfo.push(this.players[i].getPlayerInfo())
        }
        return playersInfo
    }

    setupStartGameListener() {
        this.socket.once("handle-start-game", () => {
            if (this.players.length === 0) {
                this.socket.emit("handle-start-game-callback", {
                    message: "No players connected, cannot start game",
                    status: errorStatus
                })
                setTimeout(() => {

                    this.setupStartGameListener()
                }, 50)
            } else {
                this.socket.emit("handle-start-game-callback", {
                    message: "Game starting",
                    status: successStatus
                })
                this.startGame()
            }
        })
    }

    startGame() {
        this.setupControlsListener()
        this.gameStarted = true
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].startGame()
        }
    }

    isFull() {
        return this.players.length >= maxNumberOfPlayersInRoom
    }


    // if game hasn't started, remove player from game
    playerDisconnected(playerName, playerId) {
        this.socket.emit("player-disconnected", { playerName })

        if (!this.gameStarted) {
            for (let i = 0; i < this.players.length; i++) {
                // change to id's and give un auth players id's
                if (this.players[i].id === playerId) {
                    this.players.splice(i, 1)
                }
            }
        }

        this.alertWaitingRoom()
    }

    userSettingsChanged(data) {
        this.socket.emit("user-settings-changed", data)
    }

    toString() {
        let playersString = ""
        for (let player of this.players) {
            playersString += player.toString() + ", "
        }
        return this.roomId + ": " + playersString
    }
}

module.exports = GameMaster
