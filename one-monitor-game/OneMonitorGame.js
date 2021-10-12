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

    roomExists = (roomName) => {
        const roomNames = Object.keys(this.rooms)
        for (let i = 0; i < roomNames.length; i++) {
            if (roomName === roomNames[i]) {
                return true
            }
        }
        return false
    }

    addSocket(socket) {
        let deviceType
        let playerName
        let roomName
        let player

        socket.once("device-type", (_deviceType) => {
            deviceType = _deviceType
            console.log("In one monitor game connection from", deviceType)

            if (deviceType === "desktop") {
                socket.on("room-created", ({ roomName: _roomName }) => {
                    if (this.roomExists(_roomName)) {
                        socket.emit("room-created-callback", { status: errorStatus, message: "Room exists" })
                    } else {
                        roomName = _roomName
                        this.rooms[roomName] = new Game(roomName, this.io, socket)
                        socket.join(roomName)
                        socket.emit("room-created-callback", { status: successStatus, message: "Successfully connected to room." })
                    }
                })
            } else {
                socket.on("player-connected", ({ roomName: _roomName, playerName: _playerName, id }) => {
                    if (!this.roomExists(_roomName)) {
                        socket.emit("player-connected-callback", { message: "Room does not exist, please connect to a desktop first.", status: errorStatus })
                    } else {
                        roomName = _roomName
                        playerName = _playerName
                        player = new Player(socket, playerName, id)
                        this.rooms[roomName].addPlayer(player)
                        socket.emit("player-connected-callback", { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo() } })
                        socket.join(roomName)
                    }
                })
            }

            socket.on("in-waiting-room", () => {
                this.rooms[roomName].alertWaitingRoom()
            })

            socket.on("disconnect", () => {
                if (deviceType === "desktop") {
                    console.log("disconnected from desktop")
                    delete this.rooms[roomName]
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
    roomName
    io
    socket
    gameStarted
    team1Goals
    team2Goals
    maxGoals

    constructor(roomName, io, socket) {
        this.players = []
        this.roomName = roomName
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
        player.socket.emit("room-connected", { roomName: player.roomName, isLeader: player.isLeader })
        this.alertWaitingRoom()
        if (this.gameStarted) {
            player.startGame()
        }

    }

    alertWaitingRoom() {
        this.io.to(this.roomName).emit("player-joined", { players: this.getPlayersInfo() })
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

    toString() {
        let playersString = ""
        for (let player of this.players) {
            playersString += player.toString() + ", "
        }
        return this.roomName + ": " + playersString
    }
}

module.exports = GameMaster
