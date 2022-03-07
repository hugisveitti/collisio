import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import { IVehicleSettings } from "../../public/src/classes/User";
import { IVehiclePositionInfo, m_fs_connect_to_room_callback, m_fs_game_countdown, m_fs_game_starting, m_fs_race_info, m_fs_reload_game, m_fs_room_info, m_fs_vehicles_position_info, m_ts_connect_to_room, m_ts_game_settings_changed } from "../../public/src/shared-backend/multiplayer-shared-stuff";
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

                const player = new MulitplayerPlayer(socket, config)
                if (!roomId) {
                    const newRoom = new MultiplayerRoom(io, player, config.gameSettings, config.roomSettings, (roomId) => this.deleteRoomCallback(roomId))
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

interface IGameDataCollection {
    roomCreatedTime: number
    numberOfReloads: number
    numberOfGameStartCountdowns: number
    roomDeletedTime: number
    numberOfRoomSettingsChanges: number
    numberOfPlayersReady: number
    numberOfGamesFinshed: number
    winners: any[]
    totalNumberOfPlayerDisconnects: number
}

export class MultiplayerRoom {

    players: MulitplayerPlayer[]
    leader: MulitplayerPlayer
    gameStarted: boolean
    gameStartTime: number
    enteredGameRoom: boolean
    roomId: string
    io: Socket
    gameSettings
    roomSettings
    deleteRoomCallback

    vehiclesPosition?: { [userId: string]: IVehiclePositionInfo }

    gameInterval?: NodeJS.Timer
    countdownTimeout?: NodeJS.Timeout
    gameIntervalStarted: boolean
    countdownStarted: boolean;
    numberOfLaps: number
    needsReload: boolean
    roomCreatedDate: number


    dataCollection: IGameDataCollection

    constructor(io: Socket, leader: MulitplayerPlayer, gameSettings: any, roomSettings: any, deleteRoomCallback: (roomId: string) => void) {
        this.players = []
        this.gameSettings = gameSettings
        this.roomSettings = roomSettings
        this.deleteRoomCallback = deleteRoomCallback
        this.leader = leader
        this.leader.setLeader()
        this.leader.setRoom(this)
        this.enteredGameRoom = false
        this.gameStarted = false
        this.roomId = uuid().slice(0, 4)
        this.addPlayer(leader)
        this.io = io

        this.roomCreatedDate = Date.now()
        this.gameStartTime = 0
        this.gameIntervalStarted = false

        this.numberOfLaps = -1
        this.countdownStarted = false
        this.needsReload = false
        this.dataCollection = {

            roomCreatedTime: Date.now(),
            roomDeletedTime: 0,
            numberOfReloads: 0,
            numberOfRoomSettingsChanges: 0,
            numberOfGameStartCountdowns: 0,
            numberOfPlayersReady: 0,
            numberOfGamesFinshed: 0,
            winners: [],
            totalNumberOfPlayerDisconnects: 0
        }


        // in test mode 
        if (false) {
            const testConfig: MultiplayPlayerConfig = {
                displayName: "Test",
                userId: "test",
                isAuthenticated: false,
                gameSettings: {}
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
        this.dataCollection.numberOfReloads += 1
        for (let p of this.players) {
            p.isReady = false
        }
        this.io.to(this.roomId).emit(m_fs_reload_game, {
            players: this.getPlayersInfo(),
            roomSettings: this.roomSettings
        })
    }

    setRoomSettings(roomSettings: any) {
        if (this.roomSettings.trackName !== roomSettings.trackName) {
            this.setNeedsReload()
        }
        this.roomSettings = roomSettings
        // set number of laps when game starts
    }

    addPlayer(player: MulitplayerPlayer) {
        // check if player exists
        const idx = this.getPlayerIndex(player.userId)
        if (idx !== undefined) {
            player.copyPlayer(this.players[idx])
            if (this.vehiclesPosition) {
                player.vehiclePositionInfo.pos = this.vehiclesPosition[player.userId].pos
                player.vehiclePositionInfo.rot = this.vehiclesPosition[player.userId].rot
                this.vehiclesPosition[player.userId] = player.getVehicleInfo()
            }
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
                    roomId: this.roomId,
                    gameStarted: this.enteredGameRoom,
                    players: this.getPlayersInfo(),
                    gameSettings: this.gameSettings,
                    roomSettings: this.roomSettings
                }
            })
            return
        } else {
            player.setRoom(this)
        }


        if (this.enteredGameRoom) {
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
                    gameStarted: this.enteredGameRoom,
                    players: this.getPlayersInfo(),
                    gameSettings: this.gameSettings
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
        this.dataCollection.totalNumberOfPlayerDisconnects += 1
        // check if all players have disconnected
        if (!this.enteredGameRoom) {
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

        this.dataCollection.roomDeletedTime = Date.now()
        addCreatedRooms(this.roomId, this.leader.userId,
            {
                multiplayer: true,
                gameStarted: this.gameStarted,
                players: this.players.map(p => p.getEndOfRoomInfo()),
                gameSettings: this.gameSettings,
                roomSettings: this.roomSettings,
                dataCollection: this.dataCollection,
                enteredGameRoom: this.enteredGameRoom,
                roomCreatedDate: this.roomCreatedDate,
                roomDeletedDate: Date.now(),
            }
        )

        this.gameIntervalStarted = false
        clearInterval(this.gameInterval?.[Symbol.toPrimitive]())
        clearTimeout(this.countdownTimeout?.[Symbol.toPrimitive]())
        this.deleteRoomCallback(this.roomId)
    }

    sendRoomInfo() {
        this.io.to(this.roomId).emit(m_fs_room_info, { players: this.getPlayersInfo(), roomSettings: this.roomSettings })
    }

    getPlayersInfo() {
        return this.players.map(p => p.getPlayerInfo())
    }

    roomSettingsChanged() {
        this.dataCollection.numberOfRoomSettingsChanges += 1
        for (let p of this.players) {
            p.sendRoomSettingsChanged()
        }
    }

    /**
     * @returns true if can start game else false
     */
    goToGameRoomFromLeader(): boolean {
        this.enteredGameRoom = true
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

    async startGameInterval() {
        if (this.gameIntervalStarted) return
        this.gameIntervalStarted = true
        // dont do this if only one player
        if (this.players.length < 2) return

        this.vehiclesPosition = {}
        for (let p of this.players) {
            this.vehiclesPosition[p.userId] = p.getVehicleInfo()
        }


        this.gameInterval = setInterval(() => {

            // const arr = this.players.map(p => p.getVehicleInfo())
            if (this.hasAnyPosChanged()) {
                for (let p of this.players) {
                    p.sendPosInfo(this.vehiclesPosition)
                }
                //  this.io.to(this.roomId).emit(m_fs_vehicles_position_info, obj)
                this.setPosChanged(false)
            }

        }, 1000 / 45) // how many times?
    }

    setPosChanged(value: boolean) {
        for (let p of this.players) {
            p.posChanged = false
        }
    }

    hasAnyPosChanged() {
        for (let p of this.players) {
            if (p.posChanged) return true
        }
        return false
    }

    startGame() {
        this.gameStarted = true
        this.gameStartTime = Date.now()
        this.numberOfLaps = this.gameSettings.numberOfLaps
        this.io.to(this.roomId).emit(m_fs_game_countdown, { countdown: 0 })
        this.countdownStarted = false
    }

    restartGame() {
        this.gameStarted = false
        for (let p of this.players) {
            p.restartGame()
        }
        if (this.needsReload) {
            this.needsReload = false
            this.reloadGame()
        } else {
            this.startGameCountDown()
        }
    }

    startGameCountDown() {
        if (this.countdownStarted) return
        this.dataCollection.numberOfGameStartCountdowns += 1
        this.countdownStarted = true

        let countdown = 4


        this.io.to(this.roomId).emit(m_fs_game_starting, {
            spawnPositions: this.getSpawnPosition(),
            countdown
        })

        this.sendRaceInfo()

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
        this.dataCollection.numberOfPlayersReady += 1
        // check if all players are ready
        let everyoneReady = true
        for (let p of this.players) {
            if (!p.isReady) {
                everyoneReady = false
            }
        }
        if (this.enteredGameRoom && this.gameStarted) {
            // if player reconnects then game is started and they are in game room
            return true
        }

        if (everyoneReady && !this.gameStarted) {
            // start game
            this.startGameCountDown()
        }
    }

    sendGameFinished() {
        this.dataCollection.numberOfGamesFinshed += 1
        let winner = {
            name: "",
            totalTime: Infinity,
            id: ""
        }
        for (let p of this.players) {
            if (p.totalTime < winner.totalTime) {
                winner = {
                    name: p.displayName,
                    totalTime: p.totalTime,
                    id: p.userId
                }
            }
        }
        this.dataCollection.winners.push(winner)

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

