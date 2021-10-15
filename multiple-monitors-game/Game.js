const Player = require("./Player")


class GameMaster {
    rooms
    io

    constructor(io) {
        this.rooms = {}
        this.io = io
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

    addSocket(socket) {
        let deviceType
        let playerName
        let roomId
        let player

        socket.once("device-type", (_deviceType) => {
            deviceType = _deviceType
            console.log("connection from", deviceType)
        })

        socket.once("room-connection", ({ roomId: _roomId, playerName: _playerName }) => {
            playerName = _playerName
            roomId = _roomId
            console.log("joining", roomId, playerName)

            socket.join(roomId)
            const player = new Player(playerName, socket, roomId)
            if (!this.roomExists(roomId)) {
                this.rooms[roomId] = new Game(roomId, this.io, player)
            }

            this.rooms[roomId].addPlayer(player)
        })

        // The user simply puts his name in again
        socket.on("mobile-room-connection", ({ roomId, playerName }) => {
            if (this.roomExists(roomId)) {

                const players = this.rooms[roomId].players

                for (let i = 0; i < players.length; i++) {
                    if (playerName === players[i].playerName) {
                        this.rooms[roomId].players[i].setMobileSocket(socket)
                        player = this.rooms[roomId].players[i]

                    }
                }
                if (player) {
                    socket.join(roomId)
                    socket.emit("room-connected", { roomId, isLeader: player.isLeader })
                    this.rooms[roomId].alertWaitingRoom()
                } else {
                    socket.emit("mobile-room-connection-error", { message: "Player not found", status: "error" })
                }
            } else {
                socket.emit("mobile-room-connection-error", { message: "You cannot create a room from mobile", status: "error" })
            }

        })

        socket.on("disconnect", () => {
            console.log(deviceType, "disconnected")
            if (player) {

                if (deviceType === "desktop") {
                    player.isDesktopConnected = false
                } else {
                    player.isMobileConnected = false
                }

                if (!player.getIsConnected()) {
                    console.log("delete player", player.playerName)
                }
            }
        })
    }
}


class Game {
    players
    roomId
    io
    leader
    gameStarted
    team1Goals
    team2Goals
    maxGoals
    ballPosition
    constructor(roomId, io, leader) {
        this.players = []
        this.roomId = roomId
        this.io = io

        this.maxGoals = 5
        this.gameStarted = false
        this.team1Goals = 0
        this.team2Goals = 0

        this.setLeader(leader)
    }

    setLeader(player) {
        player.setLeader()
    }

    canStartGame() {
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i].bothConnected) {
                return false
            }
        }
        return true
    }

    addPlayer(player) {
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].playerName === player.playerName) {
                if (this.players[i].isLeader) {
                    this.setLeader(this.players[i])
                }
                this.players[i] = player
                playerExists = true
                player.setGame(this)
            }
        }

        if (!playerExists) {
            this.players.push(player)
            player.setGame(this)
        }
        player.desktopSocket.emit("room-connected", { roomId: player.roomId, isLeader: player.isLeader })
        this.alertWaitingRoom()
    }

    alertWaitingRoom() {
        this.io.to(this.roomId).emit("player-joined", { players: this.getPlayersInfo(), canStartGame: this.canStartGame() })
    }

    getPlayersInfo() {
        const playersInfo = []
        for (let i = 0; i < this.players.length; i++) {
            playersInfo.push(this.players[i].getPlayerInfo())
        }
        return playersInfo
    }

    startGame() {
        console.log("start game")

        for (let i = 0; i < this.players.length; i++) {
            this.players[i].startGame()
        }
        this.sendControls()
    }

    sendControls() {
        console.log("setup controllers")
        setInterval(() => {
            this.io.to(this.roomId).emit("get-controls", { players: this.getPlayersInfo() })
        }, 1)
    }

    setPlayersPositions(playersPositions) {
        for (let i = 0; i < this.players.length; i++) {
            const position = playersPositions[this.players[i].playerNumber]
            this.players[i].setPosition(position)
        }
    }
}

module.exports = GameMaster
