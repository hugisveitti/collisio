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

    setupCreateRoomListener(desktopSocket) {
        desktopSocket.on("create-room", () => {
            // increadably unlikly two games get same uuid
            // one room can play many games
            const roomId = uuidv4().slice(0, 4)
            this.rooms[roomId] = new Game(roomId, this.io, desktopSocket)
            desktopSocket.join(roomId)
            desktopSocket.emit("create-room-callback", { status: successStatus, message: "Successfully connected to the game.", data: { roomId } })

        })
    }

    setupPlayerConnectedListener(mobileSocket) {
        mobileSocket.on("player-connected", ({ roomId, playerName, id }) => {
            if (!this.roomExists(roomId)) {
                mobileSocket.emit("player-connected-callback", { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus })
            } else {
                const player = new Player(mobileSocket, playerName, id)
                this.rooms[roomId].addPlayer(player)
                mobileSocket.emit("player-connected-callback", { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.rooms[roomId].getPlayersInfo() } })
                mobileSocket.join(roomId)
            }
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

            socket.on("disconnect", () => {
                if (deviceType === "desktop") {
                    console.log("disconnected from desktop")
                    delete this.rooms[roomId]
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
    gameSettings

    constructor(roomId, io, socket) {
        this.players = []
        this.gameSettings = {}
        this.roomId = roomId
        this.io = io
        this.socket = socket
        this.gameStarted = false
        this.team1Goals = 0
        this.team2Goals = 0

        this.setupStartGameListener()
        this.setupGameSettingsListener()
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

    setupGameSettingsListener() {
        this.socket.on("game-settings-changed", (data) => {
            this.gameSettings = data.gameSettings
            console.log("game sett change data", data)
            for (let player of this.players) {
                player.sendGameSettings(this.gameSettings)
            }
        })
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
