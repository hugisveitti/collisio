import { Socket } from "socket.io"
import { IUserSettings } from "../../public/src/classes/User"
import { m_ts_restart_game, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo, m_fs_game_finished, m_ts_go_to_game_room_from_leader, m_ts_go_to_game_room_from_leader_callback, m_fs_game_starting, m_ts_lap_done, m_ts_in_waiting_room, m_ts_room_settings_changed, m_fs_room_settings_changed, m_fs_mobile_controls, m_fs_mobile_controller_disconnected, m_fs_vehicles_position_info, m_fs_game_settings_changed, m_ts_game_settings_changed, m_ts_left_waiting_room, m_fs_already_started } from "../../public/src/shared-backend/multiplayer-shared-stuff"
import { dts_ping_test, std_ping_test_callback, mts_user_settings_changed, IPlayerInfo, mts_controls, mts_send_game_actions, GameActions, defaultVehicleType } from "../../public/src/shared-backend/shared-stuff"
import { VehicleSetup } from "../../public/src/shared-backend/vehicleItems"
import { deleteUndefined, getGeoInfo } from "../serverFirebaseFunctions"
import { MultiplayerRoom } from "./MultiplayerGame"

export interface IMultiPlayerDataCollection {
    numberOfReconnects: number
    numberOfVehicleChanges: number
    numberOfMobileConnections: number
    totalNumberOfLapsDone: number
    numberOfRacesFinished: number
    totalPing: number
    totalPingsGotten: number
    gameTicks: number
    roomTicks: number
    avgFps: number
}

export interface MultiplayPlayerConfig {
    userId: string
    displayName: string
    isAuthenticated: boolean
    gameSettings: any
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

    dataCollection: IMultiPlayerDataCollection
    geoIp: { ip: string, geo: any }
    posChanged: boolean
    gameSettings: any

    constructor(desktopSocket: Socket, config: MultiplayPlayerConfig) {
        this.desktopSocket = desktopSocket
        this.geoIp = getGeoInfo(this.desktopSocket)
        this.config = config
        this.gameSettings = config.gameSettings
        this.userId = config.userId
        this.displayName = config.displayName
        this.gameSettings = {}
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
            numberOfRacesFinished: 0,
            totalPing: 0,
            totalPingsGotten: 0,
            gameTicks: 0,
            roomTicks: 0,
            avgFps: 0,
        }
        this.posChanged = false

        this.setupSocket()
    }

    setLeader() {
        this.isLeader = true
        this.setupRoomSettingsChangedListener()
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
        this.setupLeftWaitingRoom()
    }

    turnOffSocket() {
        if (!this.desktopSocket) return
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.desktopSocket.removeAllListeners()
        this.desktopSocket.disconnect()
    }

    setupLeftWaitingRoom() {
        this.desktopSocket?.on(m_ts_left_waiting_room, () => {
            console.log("left waiting room multiplayer")
            if (!this.room?.enteredGameRoom) {
                this.turnOffSocket()
            }
            this.room?.playerDisconnected(this.userId)
        })
    }

    gameFinished(data: any) {
        this.dataCollection.numberOfRacesFinished += 1
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
        this.desktopSocket.on(dts_ping_test, ({ roomTicks, gameTicks, totalPing, totalPingsGotten, avgFps }) => {
            this.dataCollection.roomTicks = (roomTicks ?? 0)
            this.dataCollection.gameTicks = (gameTicks ?? 0)
            this.dataCollection.totalPing = (totalPing ?? 0)
            this.dataCollection.totalPingsGotten = (totalPingsGotten ?? 0)
            this.dataCollection.avgFps = (avgFps ?? this.dataCollection.avgFps)
            this.desktopSocket.emit(std_ping_test_callback, { ping: "ping" })
        })
    }

    setupPlayerReadyListener() {
        this.desktopSocket.on(m_ts_player_ready, () => {
            this.isReady = true
            const alreadyInGameRoom = this.room?.playerReady()
            if (alreadyInGameRoom && this.room) {
                const obj: { [userId: string]: IVehiclePositionInfo } = {}
                for (let p of this.room.players) {
                    obj[p.userId] = p.getVehicleInfo()
                }
                this.desktopSocket.emit(m_fs_already_started, {
                    players: obj,
                    msDone: Date.now() - (this.room?.gameStartTime ?? Date.now())
                })
            }
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
                    // I think this is the place
                    this.isReady = false
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
            this.room?.sendRoomInfo()
        })
    }

    setupDisconnectedListener() {
        this.desktopSocket.on("disconnect", () => {
            this.isConnected = false
            this.room?.playerDisconnected(this.userId)
            // always disconnect mobile ?
            this.mobileSocket?.disconnect()
        })
    }

    setupRoomSettingsChangedListener() {
        this.desktopSocket.on(m_ts_room_settings_changed, ({ roomSettings }) => {
            this.room?.setRoomSettings(roomSettings)
            this.room?.roomSettingsChanged()
        })
    }


    setupLapDoneListener() {
        this.desktopSocket.on(m_ts_lap_done, ({ totalTime, latestLapTime, lapNumber }) => {
            this.dataCollection.totalNumberOfLapsDone += 1
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
        this.dataCollection.numberOfMobileConnections += 1
        this.turnOffMobileSocket()
        this.mobileConnected = true
        this.mobileSocket = socket
        this.setupMobileInWaitingRoomListener()
        this.setupMobileInWaitingRoomListener()
        this.setupMobileStartGameListener()
        this.setupMobileDisconnectedListener()
        this.setupMobileLeftWaitingRoom()
        this.setupMobileGameSettingsChangedListener()
        if (this.room?.gameStarted) {
            this.setupMobileControler()
        }
    }

    turnOffMobileSocket() {
        if (!this.mobileSocket) return
        this.isSendingMobileControls = false
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.mobileSocket.removeAllListeners()
        this.mobileSocket.disconnect()
    }

    setupMobileLeftWaitingRoom() {
        this.mobileSocket?.on(m_ts_left_waiting_room, () => {
            if (!this.room?.enteredGameRoom) {
                this.turnOffMobileSocket()
            }
        })
    }

    setupGameActionsListener() {
        this.mobileSocket?.on(mts_send_game_actions, (gameActions) => {
            if (gameActions?.restartGame) {
                this.room?.restartGame()
            }
        })
    }

    setupMobileGameSettingsChangedListener() {
        this.mobileSocket?.on(m_ts_game_settings_changed, ({ gameSettings }) => {
            if (gameSettings?.graphics !== this.gameSettings.graphics || this.gameSettings.botDifficulty !== gameSettings.botDifficulty) {
                this.isReady = false
                this.room?.setNeedsReload()
            }
            this.gameSettings = gameSettings
            this.desktopSocket.emit(m_fs_game_settings_changed, { gameSettings })
        })
    }


    setupMobileControler() {
        if (this.isSendingMobileControls) {
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
            this.desktopSocket.emit(m_fs_mobile_controller_disconnected, {})
            this.mobileSocket = undefined
            this.mobileConnected = false
            this.room?.sendRoomInfo()
        })
    }

    setupMobileInWaitingRoomListener() {
        // need more than once?
        this.mobileSocket?.on(m_ts_in_waiting_room, () => {
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

    sendPosInfo(data: any) {
        this.desktopSocket.emit(m_fs_vehicles_position_info, data)
    }

    sendRoomSettingsChanged() {
        this.desktopSocket.emit(m_fs_room_settings_changed, { roomSettings: this.room?.roomSettings })
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
            vehicleType: this.userSettings?.vehicleSettings.vehicleType ?? defaultVehicleType,
            isConnected: this.isConnected,
            vehicleSetup: this.vehicleSetup,
            mobileConnected: this.mobileConnected,
            vehicleSettings: this.userSettings?.vehicleSettings
        } as IPlayerInfo
    }

    // data to collect
    getEndOfRoomInfo() {
        let obj: any = {
            ...this.getPlayerInfo(),
            dataCollection: this.dataCollection,
            ...this.geoIp,
            isReady: this.isReady,
            gameSettings: this.gameSettings
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