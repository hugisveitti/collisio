const { VehicleControls, MobileControls } = require("../utils/controls")

class Player {
    playerName
    desktopSocket
    mobileSocket
    roomName
    team
    isLeader
    bothConnected
    position
    teamNumber
    game
    playerNumber
    vehicleControls
    mobileControls
    isDektopConnected
    isMobileConnected

    constructor(playerName, desktopSocket, roomName) {
        this.playerName = playerName
        this.desktopSocket = desktopSocket
        this.roomName = roomName

        this.vehicleControls = new VehicleControls()
        this.mobileControls = new MobileControls()

        this.bothConnected = false
        this.isLeader = false
        this.position = {
            x: 0,
            y: 0,
            z: 0
        }
        this.teamNumber = 1

        this.setupPlayerPositionListener()
        this.isDektopConnected = true
    }

    getIsConnected() {
        return this.isDektopConnected || this.isMobileConnected
    }

    leaderStartsGame() {
        console.log("leader started game")
        this.game.startGame()
    }

    setupLeaderStartGameListener() {
        if (this.mobileSocket) {
            this.mobileSocket.once("leader-start-game", () => this.leaderStartsGame())
        }
        this.desktopSocket.once("leader-start-game", () => this.leaderStartsGame())
    }

    setLeader() {
        this.isLeader = true
        this.setupLeaderStartGameListener()
    }

    setGame(game) {
        this.game = game
        this.playerNumber = game.players.length - 1
        this.setupTeamChangeListener()
    }

    setMobileSocket(socket) {
        this.mobileSocket = socket
        this.bothConnected = true
        if (this.isLeader) {
            this.setupLeaderStartGameListener()
        }
        this.isMobileConnected = true
    }

    getPlayerInfo() {
        return {
            playerName: this.playerName,
            isLeader: this.isLeader,
            position: this.position,
            bothConnected: this.bothConnected,
            teamNumber: this.teamNumber,
            teamName: this.teamNumber,
            mobileControls: this.mobileControls,
            playerNumber: this.playerNumber
        }
    }

    setupControler() {
        this.mobileSocket.on("send-controls", (mobileControls) => {
            this.mobileControls = mobileControls
        })
    }


    setupTeamChangeListener() {
        if (this.desktopSocket) {

            this.desktopSocket.on("team-change", (newTeamNumber) => {
                this.teamNumber = newTeamNumber
                this.game.alertWaitingRoom()
            })
        }
        if (this.mobileSocket) {
            this.mobileSocket.on("team-change", (newTeamNumber) => {
                this.teamNumber = newTeamNumber
                this.game.alertWaitingRoom()
            })
        }
    }

    // Players "server" position is just where the leader sees their position
    setupPlayerPositionListener() {
        this.desktopSocket.on("player-position", (data) => {
            const { playersPositions } = data
            this.game.setPlayersPositions(playersPositions)
        })
    }

    setPosition(pos) {
        this.pos = pos
        this.desktopSocket.emit("server-position", { position: pos })
    }

    startGame() {
        this.setupControler()
        this.mobileSocket.emit("start-game", { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber })
        this.desktopSocket.emit("start-game", { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber })
    }

}

module.exports = Player