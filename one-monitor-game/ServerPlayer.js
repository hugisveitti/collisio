const { VehicleControls, MobileControls, UserSettings } = require("../utils/controls")

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
    userSettings
    isAuthenticated
    vehicleType
    photoURL

    constructor(socket, playerName, id, isAuthenticated, photoURL) {
        this.socket = socket
        this.playerName = playerName
        this.teamNumber = 1
        this.vehicleType = "normal"
        this.id = id
        this.isAuthenticated = isAuthenticated

        this.mobileControls = new MobileControls()
        this.VehicleControls = new VehicleControls()
        this.userSettings = new UserSettings()
        this.isConnected = true
        this.photoURL = photoURL

        this.setupControler()

        this.setupPlayerInfoListener()

        this.setupQuitGameListener()
        this.setupUserSettingsListener()
        this.setupReconnectListener()
        this.setupWaitingRoomListener

    }


    setSocket(newSocket) {
        this.socket = newSocket
        this.setupControler()
    }

    setupWaitingRoomListener() {
        this.socket.on("in-waiting-room", () => {
            this.game.alertWaitingRoom()
        })
    }

    sendGameSettings(gameSettings) {
        this.socket.emit("game-settings-changed", { gameSettings })
    }

    setupQuitGameListener() {
        this.socket.on("quit-game", () => {
            this.game.playerDisconnected(this.playerName, this.id)
        })
    }

    leaderStartsGame() {
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
        this.socket.on("disconnect", () => {
            this.game.playerDisconnected(this.playerName, this.id)
            this.isConnected = false
        })
    }

    setupReconnectListener() {
        this.socket.on("player-reconnect", () => {
            console.log("player reconnected not implemented")
        })
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
            id: this.id,
            isAuthenticated: this.isAuthenticated,
            vehicleType: this.vehicleType,
            photoURL: this.photoURL
        }
    }

    getPlayerControls() {
        return { mobileControls: this.mobileControls, playerNumber: this.playerNumber }

    }

    setupUserSettingsListener() {
        this.socket.on("settings-changed", (newUserSettings) => {
            this.userSettings = newUserSettings
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (this.game) {
                this.game.userSettingsChanged({ userSettings: this.userSettings, playerNumber: this.playerNumber })
            }
        })
    }

    startGame() {
        this.setupControler()
        if (this.game) {
            this.socket.emit("handle-game-starting", { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber })
        }
    }

    setupPlayerInfoListener() {
        this.socket.on("player-info-changed", (playerData) => {
            const keys = Object.keys(playerData)

            for (let key of keys) {
                if (playerData[key] !== undefined) {
                    this[key] = playerData[key]
                }
            }
            this.game.alertWaitingRoom()
        })
    }

    // setupTeamChangeListener() {
    //     this.socket.on("team-change", ({ newTeamNumber }) => {
    //         this.teamNumber = newTeamNumber
    //     })
    // }

    toString() {
        return `${this.playerName} in team: ${this.teamNumber}`
    }
}


module.exports = Player