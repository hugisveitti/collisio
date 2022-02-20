import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import { IVehicleSettings } from "../../public/src/classes/User";
import { IVehiclePositionInfo, m_fs_connect_to_room_callback, m_fs_game_countdown, m_fs_game_starting, m_fs_race_info, m_fs_reload_game, m_fs_room_info, m_fs_vehicles_position_info, m_ts_connect_to_room } from "../../public/src/shared-backend/multiplayer-shared-stuff";
import { stmd_socket_ready } from "../../public/src/shared-backend/shared-stuff";
import { addCreatedRooms } from "../serverFirebaseFunctions";
import { MulitplayerPlayer, MultiplayPlayerConfig } from "./MultiplayerPlayer";

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

export class MultiplayerRoomMaster {

    rooms: { [roomId: string]: MultiplayerRoom }
    constructor() {
        this.rooms = {}
    }

    deleteRoomCallback(roomId: string) {
        console.log("destoying room", roomId)
        delete this.rooms[roomId]
    }

    addSocket(io: Socket, socket: Socket, deviceType: string) {
        // config includes
        // userId
        // displayName
        socket.on(m_ts_connect_to_room, ({ roomId, config }) => {

            if (deviceType === "mobile") {
                // mobile cannot create room
                // only connect to player
                const room = this.findRoom(roomId)
                if (room) {
                    room.addPlayerMobileSocket(socket, config.userId)
                } else {
                    socket.emit(m_fs_connect_to_room_callback, {
                        message: "Room does not exists",
                        status: "error"
                    })
                }
            } else {

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

export class MultiplayerRoom {

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
    numberOfLaps: number
    needsReload: boolean

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
        let ip = leader.desktopSocket.handshake.headers['x-forwarded-for'] ?? leader.desktopSocket.conn.remoteAddress
        if (Array.isArray(ip)) {
            console.log("ip is a list", ip)
            ip = ip.join("")
        }
        addCreatedRooms(ip, this.roomId, leader.userId, { multiplayer: true })

        this.numberOfLaps = -1
        this.countdownStarted = false
        this.needsReload = false



        // in test mode 
        if (false) {
            const testConfig: MultiplayPlayerConfig = {
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

    setNeedsReload() {
        this.needsReload = true
    }

    reloadGame() {
        this.io.to(this.roomId).emit(m_fs_reload_game, {
            players: this.getPlayersInfo(),
            gameSettings: this.gameSettings
        })
    }

    setGameSettings(gameSettings: any) {
        if (this.gameSettings.trackName !== gameSettings.trackName) {
            this.gameSettings = gameSettings
            this.setNeedsReload()
        } else {
            this.gameSettings = gameSettings
        }
        // set number of laps when game starts
    }

    addPlayer(player: MulitplayerPlayer) {
        // check if player exists
        const idx = this.getPlayerIndex(player.userId)
        if (idx !== undefined) {
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

    addPlayerMobileSocket(socket: Socket, userId: string) {
        const idx = this.getPlayerIndex(userId)
        if (idx === undefined) {
            // allow connecting with displayName is no account?
            socket.emit(m_fs_connect_to_room_callback, {
                message: "Desktop not connected, please connect with the same account",
                status: "error"
            })
        } else {
            this.players[idx].addMobileSocket(socket)

            socket.join(this.roomId)
            socket.emit(m_fs_connect_to_room_callback, {
                message: "Successfully connected to player",
                status: "success",
                data: {
                    roomId: this.roomId,
                    gameStarted: this.gameStarted
                }
            })
        }
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
        }, 1000 / this.gameSettings.targetFPS ?? 45) // how many times?
    }

    startGame() {
        this.numberOfLaps = this.gameSettings.numberOfLaps
        this.io.to(this.roomId).emit(m_fs_game_countdown, { countdown: 0 })
        this.countdownStarted = false
        this.startTime = Date.now()
    }

    restartGame() {
        for (let p of this.players) {
            p.restartGame()
        }
        if (this.needsReload) {
            this.reloadGame()
        } else {
            this.startGameCountDown()
        }
    }

    startGameCountDown() {
        if (this.countdownStarted) return
        this.countdownStarted = true
        this.needsReload = false
        let countdown = 4

        this.io.to(this.roomId).emit(m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown
        })

        this.startGameInterval()

        const countdownTimer = () => {
            countdown -= 1
            this.countdownTimeout = setTimeout(() => {
                if (countdown > 0) {
                    this.io.to(this.roomId).emit(m_fs_game_countdown, { countdown })
                    countdownTimer()
                } else {
                    this.startGame()
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
            this.startGameCountDown()
        }
    }

    sendGameFinished() {
        let winner = {
            name: "",
            totalTime: Infinity
        }
        for (let p of this.players) {
            if (p.totalTime < winner.totalTime) {
                winner = {
                    name: p.displayName,
                    totalTime: p.totalTime
                }
            }
        }

        for (let p of this.players) {
            p.gameFinished({ raceData: this.getPlayersRaceData(), winner })
        }
    }

    playerFinishedLap(player: MulitplayerPlayer) {
        if (player.lapNumber > this.numberOfLaps) {
            player.isFinished = true
        }
        let gameFinished = true
        for (let p of this.players) {
            if (!p.isFinished) {
                gameFinished = false
            }
        }
        if (gameFinished) {
            this.sendGameFinished()
        }
    }

    sendRaceInfo() {
        this.io.to(this.roomId).emit(m_fs_race_info, { raceData: this.getPlayersRaceData() })
    }

    getPlayersRaceData() {
        return this.players.map(p => p.getPlayerRaceData())
    }
}





const roomMaster = new MultiplayerRoomMaster()

export const handleMutliplayerSocket = (io: Socket, socket: Socket, deviceType: string) => {
    roomMaster.addSocket(io, socket, deviceType)
}

