import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import {
    dts_create_room,
    dts_game_finished,
    mdts_game_settings_changed,
    mdts_left_waiting_room,
    dts_ping_test,
    dts_player_finished,
    dts_vehicles_ready,
    IPlayerInfo,
    mdts_device_type,
    mdts_players_in_room,
    mts_player_connected,
    std_controls,
    std_game_data_info,
    std_ping_test_callback,
    std_player_disconnected,
    std_room_created_callback,
    std_start_game_callback,
    std_user_settings_changed,
    stmd_players_in_room_callback,
    stmd_socket_ready,
    stmd_waiting_room_alert,
    stmd_game_starting,
    stm_player_connected_callback,
    stmd_game_settings_changed,
    mdts_start_game,
    std_send_game_actions,
    dts_game_settings_changed_callback,
    stm_game_settings_changed_ballback
} from "../../public/src/shared-backend/shared-stuff";
import { Player } from "./ServerPlayer";
import TestRoom from "./TestRoom";

const successStatus = "success"
const errorStatus = "error"


export default class RoomMaster {
    rooms: { [roomId: string]: Room }
    io
    testRoom
    allSocketIds: string[]


    constructor(io: Socket) {
        this.io = io
        this.rooms = {}
        /** only one test room */
        this.testRoom = new TestRoom()

        this.allSocketIds = []
    }

    roomExists = (roomId: string) => {
        const roomIds = Object.keys(this.rooms)
        for (let i = 0; i < roomIds.length; i++) {
            if (roomId === roomIds[i]) {
                return true
            }
        }
        return false
    }


    setupPlayerConnectedListener(mobileSocket: Socket) {
        interface IPlayerConnectedData {
            roomId: string
            playerName: string
            playerId: string
            isAuthenticated: boolean
            photoURL: string
            isStressTest?: boolean
        }

        mobileSocket.on(mts_player_connected, ({ roomId, playerName, playerId, isAuthenticated, photoURL, isStressTest }: IPlayerConnectedData) => {

            if (!this.roomExists(roomId)) {
                mobileSocket.emit(stm_player_connected_callback, { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus })
            } else if (!isStressTest && this.rooms[roomId].isFull()) {
                mobileSocket.emit(stm_player_connected_callback, { message: "Room is full.", status: errorStatus })
            } else {
                const player = new Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL)
                this.rooms[roomId].addPlayer(player)
            }
        })
    }


    createRoom(socket: Socket, roomId: string, data: any) {
        this.rooms[roomId] = new Room(roomId, this.io, socket, data, () => {
            /** delete room callback */
            delete this.rooms[roomId]
        })
        console.log("creating room, all rooms", Object.keys(this.rooms))
        // console.log(`creating room ${roomId}, rooms: ${Object.keys(this.rooms)}`)
        socket.join(roomId)
        socket.emit(std_room_created_callback, { status: successStatus, message: "Successfully created a room.", data: { roomId } })
    }


    addSocket(socket: Socket) {
        let roomId: string
        let isTestMode = false
        let onMobile: boolean

        this.allSocketIds.push(socket.id)

        socket.once(mdts_device_type, ({ deviceType, mode }) => {
            isTestMode = mode === "test"
            onMobile = deviceType === "mobile"
            if (isTestMode) {

                if (onMobile) {
                    this.testRoom.setMobileSocket(socket)
                } else {
                    this.testRoom.setDesktopSocket(socket)
                }
            } else {

                if (deviceType === "desktop") {
                    socket.on(dts_create_room, (req: any) => {
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = uuid().slice(0, 4)
                        this.createRoom(socket, roomId, req.data)

                    })

                    socket.on("disconnect", () => {

                        if (roomId && this.rooms[roomId]) {
                            this.rooms[roomId].isConnected = false
                            delete this.rooms[roomId]
                        }

                    })
                } else {

                    this.setupPlayerConnectedListener(socket)

                }

                socket.on(mdts_players_in_room, ({ roomId }) => {
                    let message, status, players: IPlayerInfo[]
                    if (this.rooms[roomId]) {
                        players = this.rooms[roomId].getPlayersInfo()
                        message = "Players in room fetched"
                        status = successStatus
                    } else {
                        players = []
                        message = "Room with given id does not exist"
                        status = errorStatus
                    }
                    socket.emit(stmd_players_in_room_callback, { message, status, data: { players } })
                })

            }

            socket.emit(stmd_socket_ready, {})
            socket.on("disconnect", () => {
                const idx = this.allSocketIds.indexOf(socket.id)
                this.allSocketIds.splice(idx, 1)

            })
        })
    }
}




export class Room {
    players: Player[]
    roomId
    io
    socket!: Socket
    gameStarted


    gameSettings
    isConnected
    deleteRoomCallback

    constructor(roomId: string, io: Socket, socket: Socket, data: any, deleteRoomCallback: () => void) {
        this.players = []
        this.gameSettings = {}
        this.roomId = roomId
        this.io = io
        this.gameStarted = false

        this.isConnected = true
        this.deleteRoomCallback = deleteRoomCallback

        this.setSocket(socket)

        const dataKeys = Object.keys(data)

        for (let key of dataKeys) {
            // @ts-ignore
            this[key] = data[key]
        }
    }


    setSocket(socket: Socket) {
        this.socket = socket
        this.setupStartGameListener()
        this.setupGameSettingsListener()
        this.setupLeftWaitingRoomListener()
        this.setupPlayerFinishedListener()
        this.setupGameFinishedListener()
        this.setupPingListener()
        this.setupVechilesReadyListener()
        this.setupLeftWebsiteListener()
    }


    setupLeftWaitingRoomListener() {
        this.socket.on(mdts_left_waiting_room, () => {
            /** if game hasnt started delete game */
            if (!this.gameStarted) {
                for (let player of this.players) {
                    player.desktopDisconnected()
                }
                this.deleteRoomCallback()
            }
        })
    }

    setupLeftWebsiteListener() {

        this.socket.on("disconnect", () => {
            for (let player of this.players) {
                player.desktopDisconnected()
            }
            this.deleteRoomCallback()
        })
    }

    setupVechilesReadyListener() {
        this.socket.on(dts_vehicles_ready, () => {
            for (let player of this.players) {
                if (player.userSettings) {
                    this.userSettingsChanged({ userSettings: player.userSettings, playerNumber: player.playerNumber })
                }
            }
        })
    }


    setupPingListener() {
        this.socket.on(dts_ping_test, () => {
            this.socket.emit(std_ping_test_callback, { ping: "ping" })
        })
    }

    addPlayer(player: Player) {
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players[i].setSocket(player.socket)

                playerExists = true
            }
        }

        if (this.gameStarted) {
            if (!playerExists) {
                player.socket.emit(stm_player_connected_callback, { status: errorStatus, message: "The game you are trying to connect to has already started." })


            } else {
                player.socket.emit(stm_player_connected_callback, { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId, gameSettings: this.gameSettings } })
                player.socket.emit(stmd_game_starting)
            }
            return
        }


        this.players.push(player)
        player.setGame(this)
        player.playerNumber = this.players.length - 1
        if (this.players.length === 1) {
            player.setLeader()
        }


        player.socket.emit(stm_player_connected_callback, { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId, gameSettings: this.gameSettings } })
        player.socket.join(this.roomId)
        this.alertWaitingRoom()
        if (this.gameStarted) {
            player.startGame()
        }
    }

    alertWaitingRoom() {
        this.io.to(this.roomId).emit(stmd_waiting_room_alert, { players: this.getPlayersInfo() })
    }

    setupGameSettingsListener() {
        this.socket.on(mdts_game_settings_changed, (data: any) => {
            this.gameSettings = data.gameSettings
            for (let player of this.players) {
                player.sendGameSettings(this.gameSettings)
            }
        })

        this.socket.on(dts_game_settings_changed_callback, () => {
            for (let player of this.players) {
                if (player.isLeader) {

                    player.gameSettingsChangedCallback()
                }
            }
        })
    }

    startGameFromLeader() {
        this.startGame()
        this.socket.emit(stmd_game_starting)
    }

    sendGameActions(data: any) {
        this.socket.emit(std_send_game_actions, data)
    }

    sendGameSettings(gameSettings: any) {
        this.gameSettings = gameSettings
        for (let player of this.players) {
            if (!player.isLeader) {
                player.sendGameSettings(this.gameSettings)
            }
        }
        this.socket.emit(stmd_game_settings_changed, { gameSettings })
    }

    setupControlsListener() {
        setInterval(() => {
            this.socket.emit(std_controls, { players: this.getPlayersControls() })
            // set fps
        }, 1000 / 120)
    }

    getPlayersControls() {
        const playersControls = []
        for (let i = 0; i < this.players.length; i++) {
            playersControls.push(this.players[i].getPlayerControls())
        }
        return playersControls
    }

    getPlayersInfo() {
        const playersInfo = []
        for (let i = 0; i < this.players.length; i++) {
            playersInfo.push(this.players[i].getPlayerInfo())
        }
        return playersInfo
    }

    setupStartGameListener() {
        this.socket.once(mdts_start_game, () => {
            if (this.players.length === 0) {
                this.socket.emit(std_start_game_callback, {
                    message: "No players connected, cannot start game",
                    status: errorStatus
                })
                setTimeout(() => {

                    this.setupStartGameListener()
                }, 50)
            } else {
                this.socket.emit(std_start_game_callback, {
                    message: "Game starting",
                    status: successStatus
                })
                this.startGame()
            }
        })
    }

    startGame() {
        this.setupControlsListener()
        this.gameStarted = true
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].startGame()
        }
    }


    // if game hasn't started, remove player from game
    playerDisconnected(playerName: string, playerId: string) {
        this.socket.emit(std_player_disconnected, { playerName })

        if (!this.gameStarted) {
            let wasLeader = false
            for (let i = 0; i < this.players.length; i++) {
                // change to id's and give un auth players id's
                if (this.players[i].id === playerId) {
                    wasLeader = this.players[i].isLeader
                    this.players.splice(i, 1)
                }
            }
            if (wasLeader) {
                if (this.players.length > 0) {
                    this.players[0].setLeader()
                }
            }
        }

        this.alertWaitingRoom()
    }

    userSettingsChanged(data: any) {
        this.socket.emit(std_user_settings_changed, data)
    }

    setupPlayerFinishedListener() {
        this.socket.on(dts_player_finished, (data: any) => {
            console.log("player finehsd", data.playerId)
            for (let player of this.players) {

                if (player.id === data.playerId) {
                    console.log("player found!")
                    player.playerFinished(data)
                }
            }
        })
    }

    setupGameFinishedListener() {
        this.socket.on(dts_game_finished, (data: any) => {
            for (let players of this.players) {
                players.gameFinished(data)
            }
        })
    }

    sendGameDataInfo(data: any) {
        this.socket.emit(std_game_data_info, data)
    }

    isFull() {
        // max number of players
        return this.players.length >= 4
    }

    toString() {
        let playersString = ""
        for (let player of this.players) {
            playersString += player.toString() + ", "
        }
        return this.roomId + ": " + playersString
    }
}
