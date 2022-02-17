import { Socket } from "socket.io"
import { IUserSettings } from "../../public/src/classes/User"
import {
    IPlayerInfo,
    mdts_game_settings_changed,
    mdts_left_waiting_room,
    mdts_start_game,
    MobileControls,
    mts_quit_game,
    mts_connected_to_waiting_room,
    mts_controls,
    mts_game_data_info,
    mts_ping_test,
    mts_send_game_actions,
    mts_user_settings_changed,
    stmd_game_settings_changed,
    stmd_game_starting,
    stm_desktop_disconnected,
    stm_game_finished,
    stm_game_settings_changed_callback,
    stm_ping_test_callback,
    stm_player_finished,
    stm_player_info,
    VehicleControls
} from "../../public/src/shared-backend/shared-stuff"
import { VehicleSetup } from "../../public/src/shared-backend/vehicleItems"
import { updatePlayersTokens } from "../firebaseCoinFunctions"
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
    vehicleSetup

    constructor(socket: Socket, playerName: string, id: string, isAuthenticated: boolean, photoURL: string, userSettings: IUserSettings, vehicleSetup: VehicleSetup) {

        this.playerName = playerName
        this.teamNumber = 1
        this.vehicleType = userSettings?.vehicleSettings?.vehicleType ?? "normal2"
        this.vehicleSetup = vehicleSetup
        this.id = id
        this.isAuthenticated = isAuthenticated
        this.isLeader = false

        this.mobileControls = new MobileControls()
        this.VehicleControls = new VehicleControls()
        this.isConnected = true
        this.photoURL = photoURL
        this.userSettings = userSettings

        this.setSocket(socket)
    }

    /**
     * idea: turn off some of these listeners when the game has started TODO
     * 
     * @param newSocket Socket 
     */
    setSocket(newSocket: Socket) {

        this.socket?.disconnect()
        this.socket = newSocket
        this.isConnected = true
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
        this.setupQuitGameListener()
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

    setupQuitGameListener() {
        this.socket.once(mts_quit_game, () => {
            this.game?.quitGame()
        })
    }

    /**
     * use e.g. is one player quits being leader
     */
    sendPlayerInfo() {
        // only allow leader?
        this.socket.emit(stm_player_info, { player: this.getPlayerInfo() })
    }

    gameSettingsChangedCallback() {
        this.socket.emit(stm_game_settings_changed_callback, {})
    }

    setupLeftWaitingRoomListener() {
        this.socket.on(mdts_left_waiting_room, () => {
            if (!this.game?.gameStarted) {
                // this.game?.playerDisconnected(this.playerName, this.id)
                this.socket.disconnect()
            }
            // disconnect from game handled in another function
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
            console.log("Player Socket disconnected", this.playerName)
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
        // this.socket.on("player-reconnect", () => {
        //  //   console.log("player reconnected not implemented")
        // })
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
            vehicleSetup: this.vehicleSetup
        } as IPlayerInfo
    }

    getPlayerControls() {
        return { mobileControls: this.mobileControls, playerNumber: this.playerNumber }

    }

    onReconnection() {
        if (this.game) {
            this.game.userSettingsChanged({ userSettings: this.userSettings, playerNumber: this.playerNumber, vehicleSetup: this.vehicleSetup })
        }
    }

    setupUserSettingsListener() {
        this.socket.on(mts_user_settings_changed, ({ userSettings, vehicleSetup }) => {
            if (userSettings) {
                this.userSettings = userSettings
            }
            if (vehicleSetup) {
                console.log("vehiclesetup changed", vehicleSetup.vehicleType, vehicleSetup.exhaust?.id, vehicleSetup.wheelGuards?.id, vehicleSetup.spoiler?.id)

                this.vehicleSetup = vehicleSetup
            }
            // TODO: check if user owns vehicleType
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?
            if (this.game) {
                this.game.userSettingsChanged({ userSettings: this.userSettings, playerNumber: this.playerNumber, vehicleSetup: this.vehicleSetup })
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

    // data: IEndOfRaceInfoPlayer
    playerFinished(data: any) {
        this.socket.emit(stm_player_finished, data)
        updatePlayersTokens(data)
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

    vehicleSetupString() {
        return `vehicleType:${this.vehicleSetup.vehicleType}, exhaust: ${this.vehicleSetup?.exhaust?.id}, spoiler: ${this.vehicleSetup?.spoiler?.id}, wheel guards: ${this.vehicleSetup?.wheelGuards?.id}`
    }

    toString() {
        return `${this.playerName}: number: ${this.teamNumber}, vehicletype:${this.vehicleType}, vehicleSetup:${this.vehicleSetupString()}`
    }
}

