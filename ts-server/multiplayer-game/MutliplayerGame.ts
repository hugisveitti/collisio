import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import { IUserSettings, IVehicleSettings } from "../../public/src/classes/User";
import { m_fs_connect_to_room_callback, m_fs_game_countdown, m_fs_game_settings_changed, m_fs_game_starting, m_fs_room_info, m_fs_vehicles_position_info, m_ts_connect_to_room, m_ts_game_settings_changed, m_ts_go_to_game_room_from_leader, m_ts_go_to_game_room_from_leader_callback, m_ts_in_waiting_room, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo } from "../../public/src/shared-backend/multiplayer-shared-stuff";
import { dts_ping_test, IPlayerInfo, mts_user_settings_changed, std_ping_test_callback, stmd_socket_ready } from "../../public/src/shared-backend/shared-stuff";
import { VehicleSetup } from "../../public/src/shared-backend/vehicleItems";
import { Player } from "../one-monitor-game/ServerPlayer";

const shuffleArray = (arr: any[]) => {
    const n = 4 * arr.length;
    let j = 0;
    while (j < n) {
        for (let i = 0; i < arr.length; i++) {
            const temp = arr[i]
            const ri = Math.floor(Math.random() * arr.length)
            arr[i] = arr[ri]
            arr[ri] = temp
        }
        j += 1
    }
}

class MultiplayerRoomMaster {

    rooms: { [roomId: string]: MultiplayerRoom }
    constructor() {
        this.rooms = {}
    }

    deleteRoomCallback(roomId: string) {
        console.log("destoying room", roomId)
        delete this.rooms[roomId]
    }

    addSocket(io: Socket, socket: Socket, userId: string) {
        socket.on(m_ts_connect_to_room, ({ roomId, config }) => {
            console.log("on connect to room", roomId)
            const player = new MulitplayerPlayer(socket, config)
            if (!roomId) {
                const newRoom = new MultiplayerRoom(io, player, config.gameSettings, (roomId) => this.deleteRoomCallback(roomId))
                console.log("creating room", newRoom.roomId)
                this.rooms[newRoom.roomId] = newRoom
                return
            }
            const room = this.findRoom(roomId)

            if (room) {
                room.addPlayer(player)
            } else {
                socket.emit(m_fs_connect_to_room_callback, {
                    message: "Room does not exists",
                    status: "error"
                })
            }
        })
        socket.emit(stmd_socket_ready)
    }

    findRoom(roomId: string): MultiplayerRoom | undefined {
        console.log("all mult rooms", Object.keys(this.rooms))
        for (let key of Object.keys(this.rooms)) {
            if (key === roomId) {
                console.log("room found", roomId)
                return this.rooms[key]
            }
        }
        return undefined
    }
}

class MultiplayerRoom {

    players: MulitplayerPlayer[]
    leader: MulitplayerPlayer
    gameStarted: boolean
    roomId: string
    io: Socket
    gameSettings
    deleteRoomCallback
    startTime: number
    gameInterval?: NodeJS.Timer
    countdownTimeout?: NodeJS.Timeout
    isSendingVehicleInfo: boolean
    countdownStarted: boolean;

    constructor(io: Socket, leader: MulitplayerPlayer, gameSettings: any, deleteRoomCallback: (roomId: string) => void) {
        this.players = []
        this.gameSettings = gameSettings
        this.deleteRoomCallback = deleteRoomCallback
        this.leader = leader
        this.leader.setLeader()
        this.leader.setRoom(this)
        this.gameStarted = false
        this.roomId = uuid().slice(0, 4)
        this.addPlayer(leader)
        this.io = io
        this.startTime = 0
        this.isSendingVehicleInfo = false

        this.countdownStarted = false
        // in test mode 
        if (false) {
            const testConfig: PlayerConfig = {
                displayName: "Test",
                userId: "test",
                isAuthenticated: false
            }
            const testPlayer = new MulitplayerPlayer(leader.desktopSocket, testConfig)
            this.addPlayer(testPlayer)
            const vehicleType = "tractor"
            const testVehicleSettings: IVehicleSettings = {
                vehicleType,
                steeringSensitivity: 1,
                chaseCameraSpeed: 1,
                cameraZoom: 1,
                useChaseCamera: true,
                useDynamicFOV: true,
                noSteerNumber: 0
            }
            testPlayer.userSettings = {
                vehicleSettings: testVehicleSettings
            }
            testPlayer.vehicleSetup = {
                vehicleColor: "#61f72a",
                vehicleType,
            }
            testPlayer.isReady = true


        }
    }

    setGameSettings(gameSettings: any) {
        this.gameSettings = gameSettings
    }

    addPlayer(player: MulitplayerPlayer) {
        // check if player exists
        const idx = this.getPlayerIndex(player.userId)
        console.log("idx", idx)
        if (idx !== undefined) {
            console.log("player exists")
            player.copyPlayer(this.players[idx])
            // cannot disconnect here
            //this.players[idx].desktopSocket.disconnect()
            delete this.players[idx]
            this.players[idx] = player
            player.setRoom(this)

            player.desktopSocket.join(this.roomId)
            player.desktopSocket.emit(m_fs_connect_to_room_callback, {
                message: "Successfully reconnected",
                status: "success",
                data: {
                    roomId: this.roomId
                }
            })
            return
        } else {
            player.setRoom(this)
        }


        if (this.gameStarted) {
            console.log("Game started, cannot add", player.displayName)
            player.desktopSocket.emit(m_fs_connect_to_room_callback, {
                message: "Cannot join a game that has started",
                status: "error",

            })
            return
        }
        this.players.push(player)
        player.playerNumber = this.players.length - 1

        player.desktopSocket.join(this.roomId)

        player.desktopSocket.emit(m_fs_connect_to_room_callback, {
            message: "Successfully connected",
            status: "success",
            data: {
                roomId: this.roomId
            }
        })
    }

    getPlayerIndex(userId: string): number | undefined {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].userId === userId) {
                return i
            }
        }
        return undefined
    }

    playerDisconnected(userId: string) {
        console.log("player disconnected in room", this.roomId)
        // check if all players have disconnected
        if (!this.gameStarted) {
            const idx = this.getPlayerIndex(userId)
            if (idx !== undefined) {
                const isLeader = this.players[idx].isLeader
                this.players.splice(idx, 1)
                if (this.players.length > 0 && isLeader) {
                    this.players[0].setLeader()

                } else if (this.players.length === 0) {
                    // destroy game
                    this.deleteRoom()
                }
            }
            this.sendRoomInfo()
        } else {
            // just send that player disconnected to everyone
            let everyoneDisconnected = true
            for (let p of this.players) {
                if (p.isConnected) {
                    everyoneDisconnected = false
                }
            }
            if (everyoneDisconnected) {
                this.deleteRoom()
            }
        }
    }

    deleteRoom() {
        this.isSendingVehicleInfo = false
        clearInterval(this.gameInterval?.[Symbol.toPrimitive]())
        clearTimeout(this.countdownTimeout?.[Symbol.toPrimitive]())
        this.deleteRoomCallback(this.roomId)
    }

    sendRoomInfo() {
        console.log("sending room info, player count:", this.players.length)
        this.io.to(this.roomId).emit(m_fs_room_info, { players: this.getPlayersInfo(), gameSettings: this.gameSettings })
    }

    getPlayersInfo() {
        return this.players.map(p => p.getPlayerInfo())
    }

    gameSettingsChanged() {
        for (let p of this.players) {
            p.sendGameSettingsChanged()
        }
    }

    /**
     * @returns true if can start game else false
     */
    goToGameRoomFromLeader(): boolean {
        this.gameStarted = true
        for (let player of this.players) {
            player.sendGoToGameRoom()
        }

        return true
    }

    userSettingsChanged(data: any) {
        //  const data = { userId, vehicleSetup, userSettings }
        // send to other players?
        console.log("user settings change")
        this.sendRoomInfo()

    }

    getSpawnPosition(): { [userId: string]: number } {
        const arr = []
        for (let i = 0; i < this.players.length; i++) {
            arr.push(i)
        }
        shuffleArray(arr)

        const pos: any = {}
        for (let i = 0; i < this.players.length; i++) {
            pos[this.players[i].userId] = arr[i]
        }
        return pos
    }

    startGameInterval() {
        if (this.isSendingVehicleInfo) return
        this.isSendingVehicleInfo = true
        // dont do this if only one player
        const obj: { [userId: string]: IVehiclePositionInfo } = {}
        for (let p of this.players) {
            obj[p.userId] = p.getVehicleInfo()
        }
        this.gameInterval = setInterval(() => {

            // const arr = this.players.map(p => p.getVehicleInfo())
            this.io.to(this.roomId).emit(m_fs_vehicles_position_info, obj)
        }, 1000 / 60) // how many times?
    }

    startGameCountDown() {
        if (this.countdownStarted) return
        this.countdownStarted = true
        console.log("start game countdown")
        let countdown = 4

        this.io.to(this.roomId).emit(m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown
        })

        this.startGameInterval()

        const countdownTimer = () => {

            countdown -= 1
            this.countdownTimeout = setTimeout(() => {
                console.log("count down", countdown)
                if (countdown > 0) {
                    this.io.to(this.roomId).emit(m_fs_game_countdown, { countdown })
                    countdownTimer()
                } else {
                    console.log("countdown finished")
                    this.io.to(this.roomId).emit(m_fs_game_countdown, { countdown: 0 })
                    this.countdownStarted = false
                    this.startTime = Date.now()
                }
            }, 1000)
        }
        countdownTimer()
    }



    playerReady() {
        // check if all players are ready
        let everyoneReady = true
        for (let p of this.players) {
            if (!p.isReady) {
                everyoneReady = false
            }
        }
        if (everyoneReady) {
            // start game
            console.log("every thing ready")
            this.startGameCountDown()
        }
    }
}



interface PlayerConfig {
    userId: string
    displayName: string
    isAuthenticated: boolean
    // userSettings: IUserSettings
    // vehicleSetup: VehicleSetup
}

class MulitplayerPlayer {

    desktopSocket: Socket
    config: PlayerConfig
    room?: MultiplayerRoom
    userId: string
    isConnected: boolean
    displayName: string
    userSettings?: IUserSettings
    vehicleSetup?: VehicleSetup
    playerNumber?: number
    isLeader: boolean
    isAuthenticated: boolean

    /** if connected desktop has loaded models */
    isReady: boolean

    vehiclePositionInfo: VehiclePositionInfo

    constructor(desktopSocket: Socket, config: PlayerConfig) {
        this.desktopSocket = desktopSocket
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

        this.setupSocket()
    }

    setupSocket() {
        this.setupDisconnectedListener()
        this.setupInWaitingRoomListener()
        this.setupUserSettingChangedListener()
        this.setupPlayerReadyListener()
        this.setupPingListener()
        this.setupGetPosRotListener()
    }

    setupPingListener() {
        this.desktopSocket.on(dts_ping_test, () => {
            this.desktopSocket.emit(std_ping_test_callback, { ping: "ping" })
        })
    }
    setLeader() {
        this.isLeader = true
        this.setupGameSettingsChangedListener()
        this.setupStartGameListener()
    }

    setupPlayerReadyListener() {
        this.desktopSocket.on(m_ts_player_ready, () => {
            console.log("player ready")
            this.isReady = true
            this.room?.playerReady()
        })
    }

    setupGetPosRotListener() {
        this.desktopSocket.on(m_ts_pos_rot, ({ pos, rot, speed }) => {
            this.vehiclePositionInfo.setData(pos, rot, speed)
        })
    }

    getVehicleInfo(): IVehiclePositionInfo {
        return this.vehiclePositionInfo
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

    sendGoToGameRoom() {
        this.desktopSocket.emit(m_fs_game_starting, {})
    }


    copyPlayer(player: MulitplayerPlayer) {
        console.log("copying player", player.toString())
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
        }
        // @ts-ignore
        this.userSettings.vehicleSettings = {}
        for (let key of Object.keys(player.userSettings?.vehicleSettings ?? {})) {
            // @ts-ignore
            this.userSettings.vehicleSettings[key] = player.userSettings.vehicleSettings[key]
        }

        // only primative types? otherwise shallow copy
        this.playerNumber = player.playerNumber
        if (player.isLeader) {
            this.setLeader()
        }

        player.turnOffSocket()
    }

    turnOffSocket() {
        if (!this.desktopSocket) return
        console.log("turn off socket")
        // this.desktopSocket.emit(stm_desktop_disconnected, {})
        this.desktopSocket.removeAllListeners()
        this.desktopSocket.disconnect()
    }

    setupUserSettingChangedListener() {
        // just use this string
        this.desktopSocket.on(mts_user_settings_changed, ({
            userSettings, vehicleSetup
        }) => {
            if (userSettings) {
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

    setRoom(room: MultiplayerRoom) {
        this.room = room
    }

    setupInWaitingRoomListener() {
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
        })
    }

    setupGameSettingsChangedListener() {
        this.desktopSocket.on(m_ts_game_settings_changed, ({ gameSettings }) => {
            this.room?.setGameSettings(gameSettings)
            this.room?.gameSettingsChanged()
        })
    }

    sendGameSettingsChanged() {
        this.desktopSocket.emit(m_fs_game_settings_changed, { gameSettings: this.room?.gameSettings })
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
            vehicleSetup: this.vehicleSetup
        } as IPlayerInfo
    }

    toString() {
        return `Player ${this.displayName}, vehicleType:${this.userSettings?.vehicleSettings.vehicleType}`
    }
}


const roomMaster = new MultiplayerRoomMaster()

export const handleMutliplayerSocket = (io: Socket, socket: Socket, userId: string) => {
    roomMaster.addSocket(io, socket, userId)
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