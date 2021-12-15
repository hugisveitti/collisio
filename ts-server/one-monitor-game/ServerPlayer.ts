import { Socket } from "socket.io"
import {
    IPlayerInfo, mdts_game_settings_changed, mdts_left_waiting_room, mdts_start_game, MobileControls, mts_connected_to_waiting_room, mts_controls, mts_game_data_info, mts_ping_test, mts_send_game_actions, mts_user_settings_changed, stmd_game_settings_changed, stmd_game_starting, stm_desktop_disconnected, stm_game_finished, stm_game_settings_changed_ballback, stm_ping_test_callback, stm_player_finished, stm_player_info, VehicleControls
} from "../../public/src/shared-backend/shared-stuff"
import { Room } from "./ServerGame"



export class Player {

    playerName
    isLeader: boolean
    isConnected
    teamNumber
    teamName?: string
    /** socket is a mobile socket */
    socket!: Socket
    game?: Room
    mobileControls
    VehicleControls
    playerNumber?: number
    id: string

    isAuthenticated
    vehicleType
    photoURL
    userSettings: any

    constructor(socket: Socket, playerName: string, id: string, isAuthenticated: boolean, photoURL: string) {

        this.playerName = playerName
        this.teamNumber = 1
        this.vehicleType = "normal2"
        this.id = id
        this.isAuthenticated = isAuthenticated
        this.isLeader = false

        this.mobileControls = new MobileControls()
        this.VehicleControls = new VehicleControls()
        this.isConnected = true
        this.photoURL = photoURL
        this.userSettings = undefined

        this.setSocket(socket)
    }

    /**
     * idea: turn off some of these listeners when the game has started TODO
     * 
     * @param newSocket Socket 
     */
    setSocket(newSocket: Socket) {
        this.socket = newSocket
        this.setupControler()
        this.setupGameDataInfoListener()
        this.setupPlayerInfoListener()

        this.setupDisconnectListener()
        this.setupUserSettingsListener()
        this.setupReconnectListener()
        this.setupWaitingRoomListener()
        this.setupGameSettingsListener()
        this.setupGameStartedListener()
        this.setupGameActionsListener()
        this.setupPingListener()
        this.setupLeftWaitingRoomListener()
    }

    /**
     * actions like reset game
     * pause game
     * send from mobile on to the server
     */
    setupGameActionsListener() {
        this.socket.on(mts_send_game_actions, (gameActions: any) => {
            if (this.isLeader) {
                this.game?.sendGameActions(gameActions)
            } else {
                console.log("non leader cannot change gameActions")
            }
        })
    }

    /**
     * use e.g. is one player quits being leader
     */
    sendPlayerInfo() {
        this.socket.emit(stm_player_info, { player: this.getPlayerInfo() })
    }

    gameSettingsChangedCallback() {
        this.socket.emit(stm_game_settings_changed_ballback, {})
    }

    setupLeftWaitingRoomListener() {
        this.socket.on(mdts_left_waiting_room, () => {
            if (!this.game?.gameStarted) {
                this.game?.playerDisconnected(this.playerName, this.id)
            }
        })
    }

    setupPingListener() {
        this.socket.on(mts_ping_test, () => {
            this.socket.emit(stm_ping_test_callback, {})
        })
    }

    setupWaitingRoomListener() {
        this.socket.on(mts_connected_to_waiting_room, () => {
            if (this.game) {
                this.game.alertWaitingRoom()
            }
        })
    }

    setupGameStartedListener() {
        this.socket.on(mdts_start_game, () => {
            if (this.game && this.isLeader) {
                this.game.startGameFromLeader()

            } else if (!this.isLeader) {
                console.log("NOT LEADER trying to start game")

            }
        })
    }

    setupGameSettingsListener() {
        this.socket.on(mdts_game_settings_changed, (data: any) => {
            if (!this.isLeader) {
                console.log("not leader cannot change game settings")
            } else {

                if (this.game) {
                    this.game.sendGameSettings(data.gameSettings)
                }
            }
        })
    }

    sendGameSettings(gameSettings: any) {
        this.socket.emit(stmd_game_settings_changed, { gameSettings })
    }

    setupDisconnectListener() {
        this.socket.on("disconnect", () => {
            this.isConnected = false
            if (this.game) {
                this.game.playerDisconnected(this.playerName, this.id)
            }
        })
    }

    setLeader() {
        this.isLeader = true
    }

    desktopDisconnected() {
        this.socket.emit(stm_desktop_disconnected, {})
    }

    setGame(game: Room) {
        this.game = game
    }

    setupReconnectListener() {
        this.socket.on("player-reconnect", () => {
            console.log("player reconnected not implemented")
        })
    }

    setupControler() {
        this.socket.on(mts_controls, (mobileControls) => {
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
        this.socket.on(mts_user_settings_changed, (newUserSettings) => {
            if (newUserSettings) {
                this.userSettings = newUserSettings
            }
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (this.game) {
                this.game.userSettingsChanged({ userSettings: newUserSettings, playerNumber: this.playerNumber })
            }
        })
    }

    startGame() {
        this.setupControler()
        if (this.game) {
            this.socket.emit(stmd_game_starting, { players: this.game.getPlayersInfo(), playerNumber: this.playerNumber })
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

    playerFinished(data: any) {
        this.socket.emit(stm_player_finished, data)
    }

    gameFinished(data: any) {
        this.socket.emit(stm_game_finished, data)
    }

    setupGameDataInfoListener() {
        this.socket.on(mts_game_data_info, (data: any) => {
            if (this.game) {
                this.game.sendGameDataInfo(data)
            }
        })
    }


    toString() {
        return `${this.playerName} in team: ${this.teamNumber}`
    }
}

