const Player = require("./Player")


class GameMaster {
    rooms
    io

    constructor(io) {
        this.rooms = {}
        this.io = io
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
            console.log("connection from", deviceType)
        })

        socket.once("room-connection", ({ roomName: _roomName, playerName: _playerName }) => {
            playerName = _playerName
            roomName = _roomName
            console.log("joining", roomName, playerName)

            socket.join(roomName)
            const player = new Player(playerName, socket, roomName)
            if (!this.roomExists(roomName)) {
                this.rooms[roomName] = new Game(roomName, this.io, player)
            }

            this.rooms[roomName].addPlayer(player)
        })

        // The user simply puts his name in again
        socket.on("mobile-room-connection", ({ roomName, playerName }) => {
            if (this.roomExists(roomName)) {

                const players = this.rooms[roomName].players

                for (let i = 0; i < players.length; i++) {
                    if (playerName === players[i].playerName) {
                        this.rooms[roomName].players[i].setMobileSocket(socket)
                        player = this.rooms[roomName].players[i]

                    }
                }
                if (player) {
                    socket.join(roomName)
                    socket.emit("room-connected", { roomName, isLeader: player.isLeader })
                    this.rooms[roomName].alertWaitingRoom()
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
    roomName
    io
    leader
    gameStarted
    team1Goals
    team2Goals
    maxGoals
    ballPosition
    constructor(roomName, io, leader) {
        this.players = []
        this.roomName = roomName
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
        player.desktopSocket.emit("room-connected", { roomName: player.roomName, isLeader: player.isLeader })
        this.alertWaitingRoom()
    }

    alertWaitingRoom() {
        this.io.to(this.roomName).emit("player-joined", { players: this.getPlayersInfo(), canStartGame: this.canStartGame() })
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
            this.io.to(this.roomName).emit("get-controls", { players: this.getPlayersInfo() })
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
