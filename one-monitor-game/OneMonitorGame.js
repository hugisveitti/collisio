const { v4: uuidv4 } = require('uuid');
const Player = require("./OneMonitorPlayer")

const successStatus = "success"
const errorStatus = "error"

class GameMaster {
    rooms
    io

    constructor(io) {
        this.io = io
        this.rooms = {}
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

    setupCreateRoomListener(socket) {
        socket.on("create-room", () => {
            // increadably unlikly two games get same uuid
            // one room can play many games
            const roomId = uuidv4().slice(0, 4)
            this.rooms[roomId] = new Game(roomId, this.io, socket)
            socket.join(roomId)
            socket.emit("create-room-callback", { status: successStatus, message: "Successfully connected to room.", data: { roomId } })

        })
    }

    addSocket(socket) {
        let deviceType
        let playerName
        let roomId
        let player

        socket.once("device-type", (_deviceType) => {
            deviceType = _deviceType
            console.log("In one monitor game connection from", deviceType)

            if (deviceType === "desktop") {

                this.setupCreateRoomListener(socket)

            } else {
                socket.on("player-connected", ({ roomId: _roomId, playerName: _playerName, id }) => {
                    if (!this.roomExists(_roomId)) {
                        socket.emit("player-connected-callback", { message: "Room does not exist, please connect to a desktop first.", status: errorStatus })
                    } else {
                        roomId = _roomId
                        playerName = _playerName
                        player = new Player(socket, playerName, id)
                        this.rooms[roomId].addPlayer(player)
                        socket.emit("player-connected-callback", { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo() } })
                        socket.join(roomId)
                    }
                })
            }

            socket.once("in-waiting-room", () => {
                if (this.rooms[roomId]) {
                    this.rooms[roomId].alertWaitingRoom()
                } else {
                    console.log("There is no room with id", roomId)
                }
            })



            socket.on("disconnect", () => {
                if (deviceType === "desktop") {
                    console.log("disconnected from desktop")
                    delete this.rooms[roomId]
                } else {
                    console.log("disconnected from mobile")
                    if (player) {
                        console.log(`player ${player.playerName} disconnected`)
                        player.isConnected = false
                    }
                }
            })
        })
    }
}


class Game {
    players
    roomId
    io
    socket
    gameStarted
    team1Goals
    team2Goals
    maxGoals

    constructor(roomId, io, socket) {
        this.players = []
        this.roomId = roomId
        this.io = io
        this.socket = socket
        this.gameStarted = false
        this.team1Goals = 0
        this.team2Goals = 0

        this.setupStartGameListener()
    }

    addPlayer(player) {
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].playerName === player.playerName) {
                this.players[i].socket = player.socket
                playerExists = true
            }
        }

        if (!playerExists) {
            this.players.push(player)
            player.setGame(this)
            player.playerNumber = this.players.length - 1
            if (this.players.length === 1) {
                player.setLeader(player)
            }
        }
        player.socket.emit("room-connected", { roomId: player.roomId, isLeader: player.isLeader })
        this.alertWaitingRoom()
        if (this.gameStarted) {
            player.startGame()
        }

    }

    alertWaitingRoom() {
        this.io.to(this.roomId).emit("player-joined", { players: this.getPlayersInfo() })
    }

    setupControlsListener() {
        setInterval(() => {
            this.socket.emit("get-controls", { players: this.getPlayersInfo() })
        }, 10)
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
                this.setupStartGameListener()
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
        console.log("starting game", this.toString())
    }

    playerDisconnected(playerName) {
        this.socket.emit("player-disconnected", { playerName })
    }

    userSettingsChanged(data) {
        console.log("user settings in onemonitor game", data)
        this.socket.emit("usersettings-changed", data)
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
