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
    stm_game_settings_changed_callback,
    dts_back_to_waiting_room,
    STD_SENDINTERVAL_MS,
    IPlayerConnectedData,
    std_quit_game
} from "../../public/src/shared-backend/shared-stuff";
import { addCreatedRooms, removeAvailableRoom } from "../serverFirebaseFunctions";
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

    getStatsString() {
        const {
            numberOfRooms,
            numberOfPlayers,
            numberOfRoomsNotSendingControls,
            numberOfRoomsSendingControls
        } = this.getStats()

        const stats: string[] = []
        stats.push(`Stats begin: ${new Date().toISOString()}`)
        stats.push(`Number of rooms ${numberOfRooms}`)
        stats.push(`Number of players in game ${numberOfPlayers}`)
        stats.push(`Number rooms not sending controlls ${numberOfRoomsNotSendingControls}`)
        stats.push(`Number rooms sending controlls ${numberOfRoomsSendingControls}`)
        stats.push("--------------")
        return stats.join("\n")
    }

    getStats() {
        let numNotSendingControls = 0
        let numSendingControls = 0

        let numPlayers = 0
        for (let roomId of Object.keys(this.rooms)) {
            if (!this.rooms[roomId].sendingControls) {
                numNotSendingControls += 1
            } else {
                numSendingControls += 1
                numPlayers += this.rooms[roomId].players.length
            }
        }

        return {
            numberOfRooms: numSendingControls + numNotSendingControls,
            numberOfPlayers: numPlayers,
            numberOfRoomsNotSendingControls: numNotSendingControls,
            numberOfRoomsSendingControls: numSendingControls
        }
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
        console.log("setting player connected listener", mobileSocket.id)
        mobileSocket.on(mts_player_connected, ({ roomId, playerName, playerId, isAuthenticated, photoURL, isStressTest, userSettings, vehicleSetup }: IPlayerConnectedData) => {
            console.log("connecting to room", roomId, playerName)
            if (!this.roomExists(roomId)) {
                console.log("room does not exist", roomId, mobileSocket.id, stm_player_connected_callback)
                mobileSocket.emit(stm_player_connected_callback, { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus })
            } else if (!isStressTest && this.rooms[roomId].isFull() && !this.rooms[roomId].gameStarted && !this.rooms[roomId].playerIsInRoom(playerId)) {
                mobileSocket.emit(stm_player_connected_callback, { message: "Room is full.", status: errorStatus })
            } else {
                const player = new Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL, userSettings, vehicleSetup)
                this.rooms[roomId].addPlayer(player)
            }

        })
    }

    socketHasRoom(socket: Socket) {
        for (let roomId of Object.keys(this.rooms)) {
            if (socket === this.rooms[roomId].socket) {
                return true
            }
        }
        return false
    }

    createRoom(socket: Socket, roomId: string, data: any, userId: string) {
        console.log("Creating room", roomId, socket.handshake.address, socket.conn.remoteAddress, socket.handshake.headers['x-forwarded-for'])
        const ip = socket.handshake.headers['x-forwarded-for'] ?? socket.conn.remoteAddress
        // @ts-ignore
        addCreatedRooms(ip?.length > 0 ? ip.join("") : ip, roomId, userId)

        const { numberOfRoomsSendingControls } = this.getStats()
        if (numberOfRoomsSendingControls > 25) {
            console.warn("Too many rooms, so not creating room")
            socket.emit(std_room_created_callback, {
                status: errorStatus,
                message: "Number of active rooms is full. Consider donaiting to help support this project which will allow us to buy better servers."
            })
            return
        }

        if (this.socketHasRoom(socket)) {
            console.warn("Socket already has room")
            socket.emit(std_room_created_callback, {
                status: errorStatus,
                message: "Socket alread has room."
            })
            return
        }
        this.rooms[roomId] = new Room(roomId, this.io, socket, data, () => {
            /** delete room callback */
            delete this.rooms[roomId]
        })
        console.log("room created", roomId, this.getStatsString())
        socket.join(roomId)
        socket.emit(std_room_created_callback, { status: successStatus, message: "Successfully created a room.", data: { roomId } })
    }


    addSocket(socket: Socket) {
        let roomId: string
        let isTestMode = false
        let onMobile: boolean

        //   this.allSocketIds.push(socket.id)

        socket.once(mdts_device_type, ({ deviceType, mode, userId }) => {
            console.log("socket connected", deviceType)
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
                        console.log("creating room")
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = uuid().slice(0, 4)
                        this.createRoom(socket, roomId, req.data, userId)
                    })

                    socket.on("disconnect", () => {
                        if (roomId && this.rooms[roomId]) {
                            this.rooms[roomId].isConnected = false
                            delete this.rooms[roomId]
                        }
                    })
                    socket.emit(stmd_socket_ready, {})
                } else {

                    this.setupPlayerConnectedListener(socket)
                    socket.emit(stmd_socket_ready, {})
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


            // socket.on("disconnect", () => {
            //     const idx = this.allSocketIds.indexOf(socket.id)
            //     this.allSocketIds.splice(idx, 1)
            // })
        })
    }
}




export class Room {
    players: Player[]
    roomId: string
    io
    socket!: Socket
    gameStarted: boolean


    gameSettings
    isConnected
    deleteRoomCallback

    desktopUserId: string | undefined
    sendControlsInterval?: NodeJS.Timer

    sendingControls: boolean

    constructor(roomId: string, io: Socket, socket: Socket, data: any, deleteRoomCallback: () => void) {
        this.players = []
        this.gameSettings = {}
        this.roomId = roomId
        this.io = io
        this.gameStarted = false
        this.sendingControls = false
        this.desktopUserId = undefined

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
        this.setupBackToWaitingRoomListener()
    }

    setupBackToWaitingRoomListener() {
        this.gameStarted = false
        this.socket.on(dts_back_to_waiting_room, () => {
            for (let player of this.players) {
                player.desktopDisconnected()
            }
        })
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
            console.log("disconnected", this.roomId)
            for (let player of this.players) {
                player.desktopDisconnected()
            }
            this.deleteRoomCallback()
            if (this.desktopUserId) {
                removeAvailableRoom(this.desktopUserId)
            }
        })
    }

    setupVechilesReadyListener() {
        this.socket.on(dts_vehicles_ready, () => {
            for (let player of this.players) {
                if (player.userSettings) {
                    this.userSettingsChanged({ userSettings: player.userSettings, playerNumber: player.playerNumber, vehicleSetup: player.vehicleSetup })
                }
            }
        })
    }


    setupPingListener() {
        this.socket.on(dts_ping_test, () => {
            this.socket.emit(std_ping_test_callback, { ping: "ping" })
        })
    }

    playerIsInRoom(playerId: string) {
        for (let p of this.players) {
            if (p.id === playerId) return true
        }
        return false
    }

    addPlayer(player: Player) {
        console.log("adding player", player.toString())
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                // disconnect old socket always
                //   this.players[i].socket.disconnect()
                playerExists = true
                console.log("player exists!, disconnecting old socket, i:", i, "isLeader:", this.players[i].isLeader)

                // this.players[i].setSocket(player.socket)
                // player = this.players[i]
                player.copyPlayer(this.players[i])

                this.players[i].turnOffSocket()
                let isLeader = this.players[i].isLeader
                delete this.players[i]
                this.players[i] = player
                this.players[i].setGame(this)
            }
        }

        if (this.gameStarted) {
            if (!playerExists) {
                console.log("game started and player does not exist")
                player.socket.emit(stm_player_connected_callback, { status: errorStatus, message: "The game you are trying to connect to has already started." })
            } else {
                console.log("Player reconnected", player.playerName)
                player.socket.emit(stm_player_connected_callback, { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId, gameSettings: this.gameSettings, gameStarted: true } })
                // player.socket.emit(stmd_game_starting)
                this.playerReconnected()
                player.onReconnection()
            }
            return
        }

        if (this.players.length === 0) {
            player.setLeader()
        }

        if (!playerExists) {
            this.players.push(player)
            player.setGame(this)
            player.playerNumber = this.players.length - 1
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
        this.sendingControls = true
        this.sendControlsInterval = setInterval(() => {
            this.socket.emit(std_controls, { players: this.getPlayersControls() })
            // set fps
        }, STD_SENDINTERVAL_MS)
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
                // TODO: do some check to see if player owns vehicle
                this.socket.emit(std_start_game_callback, {
                    message: "Game starting",
                    status: successStatus
                })
                this.startGame()
            }
        })
    }

    startGame() {
        console.log("starting game, roomId:", this.roomId)
        if (this.gameStarted) return
        this.gameStarted = true
        this.setupControlsListener()

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
                if (this.players[i].id === playerId && !this.players[i].isConnected) {
                    wasLeader = this.players[i].isLeader
                    this.players.splice(i, 1)
                }
            }
            if (wasLeader) {
                if (this.players.length > 0) {
                    this.players[0].setLeader()
                    this.players[0].sendPlayerInfo()
                }
            }
        }

        this.alertWaitingRoom()
        if (this.gameStarted && this.everyoneDisconnected()) {

            if (this.sendControlsInterval) {
                this.sendingControls = false
                clearInterval(this.sendControlsInterval)
            }
        }
    }

    playerReconnected() {


        if (this.players.length === 1) {
            this.players[0].setLeader()
        }

        if (!this.sendingControls) {
            this.setupControlsListener()
        }

    }

    everyoneDisconnected() {

        for (let p of this.players) {
            if (p.isConnected) {
                return false
            }
        }
        return true
    }

    userSettingsChanged(data: any) {
        this.socket.emit(std_user_settings_changed, data)
    }

    setupPlayerFinishedListener() {
        this.socket.on(dts_player_finished, (data: any) => {
            console.log("player finished", data.playerId)
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

    quitGame() {
        console.log("Quit game with mobile")
        this.socket.emit(std_quit_game, {})

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
