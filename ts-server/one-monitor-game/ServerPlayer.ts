import { Socket } from "socket.io"
import { Room } from "./ServerGame"


import { MobileControls, VehicleControls, IPlayerInfo } from "../../public/src/shared-backend/shared-stuff"

export class Player {

    playerName
    isLeader: boolean
    isConnected
    teamNumber
    teamName?: string
    /** socket is a mobile socket */
    socket: Socket
    game?: Room
    mobileControls
    VehicleControls
    playerNumber?: number
    id: string

    isAuthenticated
    vehicleType
    photoURL

    constructor(socket: Socket, playerName: string, id: string, isAuthenticated: boolean, photoURL: string) {
        this.socket = socket
        this.playerName = playerName
        this.teamNumber = 1
        this.vehicleType = "normal"
        this.id = id
        this.isAuthenticated = isAuthenticated
        this.isLeader = false

        this.mobileControls = new MobileControls()
        this.VehicleControls = new VehicleControls()
        this.isConnected = true
        this.photoURL = photoURL

        this.setupControler()

        this.setupPlayerInfoListener()

        this.setupQuitGameListener()
        this.setupUserSettingsListener()
        this.setupReconnectListener()
        this.setupWaitingRoomListener

    }


    setSocket(newSocket: Socket) {
        this.socket = newSocket
        this.setupControler()
    }

    setupWaitingRoomListener() {
        this.socket.on("in-waiting-room", () => {
            if (this.game) {
                this.game.alertWaitingRoom()
            }
        })
    }

    sendGameSettings(gameSettings: any) {
        this.socket.emit("game-settings-changed", { gameSettings })
    }

    setupQuitGameListener() {
        this.socket.on("quit-game", () => {
            if (this.game) {
                this.game.playerDisconnected(this.playerName, this.id)
            }
        })
    }

    leaderStartsGame() {
        if (this.game) {
            this.game.startGame()
        }
    }

    setupLeaderStartGameListener() {
        this.socket.once("leader-start-game", () => this.leaderStartsGame())
    }

    setLeader() {
        this.isLeader = true
        this.setupLeaderStartGameListener()
    }

    gameDisconnected() {

    }

    setGame(game: Room) {
        this.game = game
        this.socket.on("disconnect", () => {
            if (this.game) {
                this.game.playerDisconnected(this.playerName, this.id)
            }
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
            teamName: this.teamName,
            playerNumber: this.playerNumber,
            mobileControls: this.mobileControls,
            teamNumber: this.teamNumber,
            id: this.id,
            isAuthenticated: this.isAuthenticated,
            vehicleType: this.vehicleType,
            photoURL: this.photoURL,
            isConnected: this.isConnected,
        } as IPlayerInfo
    }

    getPlayerControls() {
        return { mobileControls: this.mobileControls, playerNumber: this.playerNumber }

    }

    setupUserSettingsListener() {
        this.socket.on("settings-changed", (newUserSettings) => {
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (this.game) {
                this.game.userSettingsChanged({ userSettings: newUserSettings, playerNumber: this.playerNumber })
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

                    // @ts-ignore
                    this[key] = playerData[key]
                }
            }
            if (this.game) {
                this.game.alertWaitingRoom()
            }
        })
    }



    toString() {
        return `${this.playerName} in team: ${this.teamNumber}`
    }
}

