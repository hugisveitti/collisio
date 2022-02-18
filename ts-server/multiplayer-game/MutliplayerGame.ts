import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import { IUserSettings } from "../../public/src/classes/User";
import { IMultPlayerInfo, m_fs_connect_to_room_callback, m_fs_game_settings_changed, m_fs_game_starting, m_fs_room_info, m_fs_start_game_from_leader_callback, m_ts_connect_to_room, m_ts_game_settings_changed, m_ts_in_waiting_room, m_ts_start_game_from_leader } from "../../public/src/shared-backend/multiplayer-shared-stuff";
import { mts_user_settings_changed, stmd_socket_ready } from "../../public/src/shared-backend/shared-stuff";
import { VehicleSetup } from "../../public/src/shared-backend/vehicleItems";



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
                    this.deleteRoomCallback(this.roomId)
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
                this.deleteRoomCallback(this.roomId)
            }
        }
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
    startGameFromLeader(): boolean {
        for (let player of this.players) {
            player.sendGameStarting()
        }

        return true
    }

    userSettingsChanged(data: any) {
        //  const data = { userId, vehicleSetup, userSettings }
        // send to other players?
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

        this.setupSocket()
    }

    setupSocket() {
        this.setupDisconnectedListener()
        this.setupInWaitingRoomListener()
        this.setupUserSettingChangedListener()
    }

    setLeader() {
        this.isLeader = true
        this.setupGameSettingsChangedListener()
        this.setupStartGameListener()
    }



    setupStartGameListener() {
        this.desktopSocket.on(m_ts_start_game_from_leader, () => {
            const canStart = this.room?.startGameFromLeader()

            let status = "error"
            let message = "Cannot start game"
            if (canStart) {
                status = "success"
                message = "Can start game"
            }
            this.desktopSocket.emit(m_fs_start_game_from_leader_callback, { status, message })
        })
    }

    sendGameStarting() {
        this.desktopSocket.emit(m_fs_game_starting, {})
    }


    copyPlayer(player: MulitplayerPlayer) {
        console.log("copying player", player.toString())
        if (player.vehicleSetup) {
            for (let key of Object.keys(player.vehicleSetup)) {
                // @ts-ignore
                this.vehicleSetup[key] = player.vehicleSetup[key]
            }
        }

        if (player.userSettings) {

            for (let key of Object.keys(player.userSettings)) {
                // @ts-ignore
                this.userSettings[key] = player.userSettings[key]
            }
        }


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
            if (this.vehicleSetup) {
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
        } as IMultPlayerInfo
    }

    toString() {
        return `Player ${this.displayName}, vehicleType:${this.userSettings?.vehicleSettings.vehicleType}`
    }
}


const roomMaster = new MultiplayerRoomMaster()

export const handleMutliplayerSocket = (io: Socket, socket: Socket, userId: string) => {
    roomMaster.addSocket(io, socket, userId)
}
