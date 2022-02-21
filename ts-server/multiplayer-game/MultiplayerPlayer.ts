import { Socket } from "socket.io"
import { IUserSettings } from "../../public/src/classes/User"
import { m_ts_restart_game, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo, m_fs_game_finished, m_ts_go_to_game_room_from_leader, m_ts_go_to_game_room_from_leader_callback, m_fs_game_starting, m_ts_lap_done, m_ts_in_waiting_room, m_ts_game_settings_changed, m_fs_game_settings_changed, m_fs_mobile_controls, m_fs_mobile_controller_disconnected } from "../../public/src/shared-backend/multiplayer-shared-stuff"
import { dts_ping_test, std_ping_test_callback, mts_user_settings_changed, IPlayerInfo, mts_controls, mts_send_game_actions, GameActions } from "../../public/src/shared-backend/shared-stuff"
import { VehicleSetup } from "../../public/src/shared-backend/vehicleItems"
import { deleteUndefined, getGeoInfo } from "../serverFirebaseFunctions"
import { MultiplayerRoom } from "./MultiplayerGame"

export interface IPlayerDataCollection {
    numberOfReconnects: number
    numberOfVehicleChanges: number
    numberOfMobileConnections: number
    totalNumberOfLapsDone: number
    numberOfRacesFinished: number

}

export interface MultiplayPlayerConfig {
    userId: string
    displayName: string
    isAuthenticated: boolean
    // userSettings: IUserSettings
    // vehicleSetup: VehicleSetup
}

export class MulitplayerPlayer {

    desktopSocket: Socket
    mobileSocket?: Socket
    config: MultiplayPlayerConfig
    room?: MultiplayerRoom
    userId: string

    isConnected: boolean
    mobileConnected: boolean
    displayName: string
    userSettings?: IUserSettings
    vehicleSetup?: VehicleSetup
    playerNumber?: number
    isLeader: boolean
    isAuthenticated: boolean

    /** if connected desktop has loaded models */
    isReady: boolean

    vehiclePositionInfo: VehiclePositionInfo
    lapNumber: number
    latestLapTime: number
    isFinished: boolean
    totalTime: number

    mobileControls: MobileControls
    isSendingMobileControls: boolean

    dataCollection: IPlayerDataCollection
    geoIp: { ip: string, geo: any }
    posChanged: boolean

    constructor(desktopSocket: Socket, config: MultiplayPlayerConfig) {
        this.desktopSocket = desktopSocket
        this.geoIp = getGeoInfo(this.desktopSocket)
        this.config = config
        this.userId = config.userId
        this.displayName = config.displayName
        // this.vehicleSetup = config.vehicleSetup
        // this.userSettings = config.userSettings
        this.isAuthenticated = config.isAuthenticated
        this.isLeader = false
        this.isConnected = true
        this.isReady = false
        this.vehiclePositionInfo = new VehiclePositionInfo(this.userId)
        this.lapNumber = 1
        this.latestLapTime = 0
        this.isFinished = false
        this.mobileConnected = false
        this.totalTime = 0
        this.isSendingMobileControls = false

        this.mobileControls = {}

        this.dataCollection = {
            numberOfMobileConnections: 0,
            numberOfVehicleChanges: 0,
            totalNumberOfLapsDone: 0,
            numberOfReconnects: 0,
            numberOfRacesFinished: 0
        }
        this.posChanged = false

        this.setupSocket()
    }

    setLeader() {
        this.isLeader = true
        this.setupGameSettingsChangedListener()
        this.setupStartGameListener()
    }

    getVehicleInfo(): IVehiclePositionInfo {
        return this.vehiclePositionInfo
    }

    restartGame() {
        this.lapNumber = 1
        this.latestLapTime = 0
        this.isFinished = false
    }

    reloadGame() {
        this.restartGame()
    }

    /** Start desktop socket functions */

    setupSocket() {
        this.setupDisconnectedListener()
        this.setupInWaitingRoomListener()
        this.setupUserSettingChangedListener()
        this.setupPlayerReadyListener()
        this.setupPingListener()
        this.setupGetPosRotListener()
        this.setupLapDoneListener()
        this.setupRestartGameListener()
    }

    turnOffSocket() {
        if (!this.desktopSocket) return
        console.log("turn off socket")
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.desktopSocket.removeAllListeners()
        this.desktopSocket.disconnect()
    }

    gameFinished(data: any) {
        this.desktopSocket.emit(m_fs_game_finished, data)
    }

    sendGoToGameRoom() {
        // this could be done better?

        this.desktopSocket.emit(m_fs_game_starting, {
            spawnPositions: this.room?.getSpawnPosition(),
            countdown: 4,
        })

        if (this.mobileConnected) {
            this.mobileSocket?.emit(m_fs_game_starting, {})
            this.setupMobileControler()
        }
    }

    setupRestartGameListener() {
        this.desktopSocket.on(m_ts_restart_game, () => {
            // only leader?
            this.room?.restartGame()
        })
    }

    setupPingListener() {
        this.desktopSocket.on(dts_ping_test, () => {
            this.desktopSocket.emit(std_ping_test_callback, { ping: "ping" })
        })
    }

    setupPlayerReadyListener() {
        this.desktopSocket.on(m_ts_player_ready, () => {
            this.isReady = true
            this.room?.playerReady()
        })
    }

    setupGetPosRotListener() {
        this.desktopSocket.on(m_ts_pos_rot, ({ pos, rot, speed }) => {
            this.posChanged = true
            this.vehiclePositionInfo.setData(pos, rot, speed)
        })
    }

    setupStartGameListener() {
        this.desktopSocket.on(m_ts_go_to_game_room_from_leader, () => {
            const canStart = this.room?.goToGameRoomFromLeader()
            let status = "error"
            let message = "Cannot start game"
            if (canStart) {
                status = "success"
                message = "Can start game"
            }
            this.desktopSocket.emit(m_ts_go_to_game_room_from_leader_callback, { status, message })
        })
    }

    setupUserSettingChangedListener() {
        // just use this string
        this.desktopSocket.on(mts_user_settings_changed, ({
            userSettings, vehicleSetup
        }) => {
            if (userSettings) {
                if (this.userSettings?.vehicleSettings.vehicleType !== userSettings?.vehicleSettings.vehicleType) {
                    this.dataCollection.numberOfVehicleChanges += 1
                    this.room?.setNeedsReload()
                }
                this.userSettings = userSettings
            }
            if (vehicleSetup) {
                this.vehicleSetup = vehicleSetup
            }

            if (this.vehicleSetup || this.userSettings) {
                this.room?.userSettingsChanged({ userId: this.userId, vehicleSetup: this.vehicleSetup, userSettings: this.userSettings })

            }
        })
    }

    setupInWaitingRoomListener() {
        // need more than once?
        this.desktopSocket.on(m_ts_in_waiting_room, () => {
            console.log("In waiting room", this.displayName, this.room?.roomId)
            this.room?.sendRoomInfo()
        })
    }

    setupDisconnectedListener() {
        this.desktopSocket.on("disconnect", () => {
            this.isConnected = false
            console.log("muliplayer player disconencted", this.userId)
            this.room?.playerDisconnected(this.userId)
            // always disconnect mobile ?
            this.mobileSocket?.disconnect()
        })
    }

    setupGameSettingsChangedListener() {
        this.desktopSocket.on(m_ts_game_settings_changed, ({ gameSettings }) => {
            console.log("new game settings")
            this.room?.setGameSettings(gameSettings)
            this.room?.gameSettingsChanged()
        })
    }

    setupLapDoneListener() {
        this.desktopSocket.on(m_ts_lap_done, ({ totalTime, latestLapTime, lapNumber }) => {
            console.log("lap done")
            this.lapNumber = lapNumber
            this.latestLapTime = latestLapTime
            // dont know if total time should come from player or server
            this.totalTime = totalTime
            this.room?.sendRaceInfo()
            this.room?.playerFinishedLap(this)
        })
    }

    /** Mobile socket functions */

    addMobileSocket(socket: Socket) {
        console.log("added mobile socket")
        this.dataCollection.numberOfMobileConnections += 1
        this.turnOffMobileSocket()
        this.mobileConnected = true
        this.mobileSocket = socket
        this.setupMobileInWaitingRoomListener()
        this.setupMobileInWaitingRoomListener()
        this.setupMobileStartGameListener()
        this.setupMobileDisconnectedListener()
        if (this.room?.gameStarted) {
            this.setupMobileControler()
        }
    }

    turnOffMobileSocket() {
        if (!this.mobileSocket) return
        console.log("turn off mobileSocket")
        this.isSendingMobileControls = false
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.mobileSocket.removeAllListeners()
        this.mobileSocket.disconnect()
    }

    setupGameActionsListener() {
        this.mobileSocket?.on(mts_send_game_actions, (gameActions) => {
            if (gameActions?.restartGame) {
                this.room?.restartGame()
            }
        })
    }

    setupMobileControler() {
        if (this.isSendingMobileControls) {
            console.log("is already sending controls", this.displayName)
            return
        }
        this.isSendingMobileControls = true

        this.mobileSocket?.on(mts_controls, (mobileControls) => {
            this.mobileControls = mobileControls
            this.desktopSocket.emit(m_fs_mobile_controls, mobileControls)
        })
    }

    setupMobileDisconnectedListener() {
        this.mobileSocket?.on("disconnect", () => {
            this.isSendingMobileControls = false
            console.log("#####mobile socket disconnected")
            this.desktopSocket.emit(m_fs_mobile_controller_disconnected, {})
            this.mobileSocket = undefined
            this.mobileConnected = false
            this.room?.sendRoomInfo()
        })
    }

    setupMobileInWaitingRoomListener() {
        // need more than once?
        this.mobileSocket?.on(m_ts_in_waiting_room, () => {
            console.log("In waiting room", this.displayName, this.room?.roomId)
            this.room?.sendRoomInfo()
        })
    }

    setupMobileStartGameListener() {
        this.mobileSocket?.on(m_ts_go_to_game_room_from_leader, () => {
            const canStart = this.room?.goToGameRoomFromLeader()
            let status = "error"
            let message = "Cannot start game"
            if (canStart) {
                status = "success"
                message = "Can start game"
            }
            this.mobileSocket?.emit(m_ts_go_to_game_room_from_leader_callback, { status, message })
        })
    }

    /** End mobile socket functions */

    setRoom(room: MultiplayerRoom) {
        this.room = room
    }

    sendGameSettingsChanged() {
        this.desktopSocket.emit(m_fs_game_settings_changed, { gameSettings: this.room?.gameSettings })
    }

    getPlayerRaceData() {
        return {
            playerName: this.displayName,
            lapNumber: this.lapNumber,
            latestLapTime: this.latestLapTime
        }
    }

    getPlayerInfo() {
        return {
            playerName: this.displayName,
            isLeader: this.isLeader,
            playerNumber: this.playerNumber,
            id: this.userId,
            isAuthenticated: this.isAuthenticated,
            vehicleType: this.userSettings?.vehicleSettings.vehicleType,
            isConnected: this.isConnected,
            vehicleSetup: this.vehicleSetup,
            mobileConnected: this.mobileConnected
        } as IPlayerInfo
    }

    // data to collect
    getEndOfRoomInfo() {
        let obj: any = {
            ...this.getPlayerInfo(),
            dataCollection: this.dataCollection,
            ...this.geoIp
        }
        obj = deleteUndefined(obj)
        return obj
    }

    copyPlayer(player: MulitplayerPlayer) {
        player.dataCollection.numberOfReconnects += 1
        if (player.vehicleSetup) {
            // @ts-ignore
            this.vehicleSetup = {}
            for (let key of Object.keys(player.vehicleSetup)) {
                // @ts-ignore
                this.vehicleSetup[key] = player.vehicleSetup[key]
            }
        }
        if (player.userSettings) {
            // @ts-ignore
            this.userSettings = {}
            for (let key of Object.keys(player.userSettings)) {
                // @ts-ignore
                this.userSettings[key] = player.userSettings[key]
            }
        } else {
            // @ts-ignore
            this.userSettings = {}
        }
        // @ts-ignore
        this.userSettings.vehicleSettings = {}
        for (let key of Object.keys(player.userSettings?.vehicleSettings ?? {})) {
            // @ts-ignore
            this.userSettings.vehicleSettings[key] = player.userSettings.vehicleSettings[key]
        }

        let key: keyof typeof player.dataCollection
        for (key in player.dataCollection) {
            this.dataCollection[key] = player.dataCollection[key]
        }

        // only primative types? otherwise shallow copy
        this.playerNumber = player.playerNumber
        if (player.isLeader) {
            this.setLeader()
        }
        if (player.mobileConnected) {
            this.mobileConnected = true
            this.mobileSocket = player.mobileSocket
        }

        player.turnOffSocket()
    }

    toString() {
        return `Player ${this.displayName}, vehicleType:${this.userSettings?.vehicleSettings.vehicleType}`
    }
}



class VehiclePositionInfo implements IVehiclePositionInfo {
    pos: any
    rot: any
    speed: number;
    userId: string;
    constructor(userId: string) {
        this.speed = 0
        this.userId = userId
        // this.pos = { x: 0, y: 0, z: 0 }
        // this.rot = { x: 0, y: 0, z: 0, w: 0 }
    }
    setData(pos: any, rot: any, speed: number) {
        this.pos = pos
        this.rot = rot
        this.speed = speed
    }
}