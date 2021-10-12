const { VehicleControls, MobileControls } = require("../utils/controls")

class Player {

    playerName
    isLeader
    isConnected
    teamNumber
    teamName
    /** socket is a mobile socket */
    socket
    game
    mobileControls
    VehicleControls
    playerNumber
    id



    constructor(socket, playerName, id) {
        this.socket = socket
        this.playerName = playerName
        this.teamNumber = 1
        this.id = id

        this.mobileControls = new MobileControls()
        this.VehicleControls = new VehicleControls()
        this.isConnected = true

        this.setupControler()
        this.setupTeamChangeListener()
    }

    leaderStartsGame() {
        console.log("leader started game")
        this.game.startGame()
    }

    setupLeaderStartGameListener() {
        this.socket.once("leader-start-game", () => this.leaderStartsGame())
    }

    setLeader() {
        this.isLeader = true
        this.setupLeaderStartGameListener()
    }

    setGame(game) {
        this.game = game
    }

    setupControler() {
        this.socket.on("send-controls", (mobileControls) => {
            this.mobileControls = mobileControls
        })
    }

    getPlayerInfo() {
        return {
            playerName: this.playerName,
            isLeader: this.isLeader,
            isConnected: this.isConnected,
            teamNumber: this.teamNumber,
            teamName: this.teamNumber,
            mobileControls: this.mobileControls,
            playerNumber: this.playerNumber,
            id: this.id
        }
    }

    startGame() {
        this.setupControler()
        if (this.game) {
            this.socket.emit("handle-game-starting", { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber })
        }
    }

    setupTeamChangeListener() {
        this.socket.on("team-change", ({ newTeamNumber }) => {
            this.teamNumber = newTeamNumber
            this.game.alertWaitingRoom()
        })
    }

    toString() {

        return `${this.playerName} in team: ${this.teamNumber}`
    }
}


module.exports = Player