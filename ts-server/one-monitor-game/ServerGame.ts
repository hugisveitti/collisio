import { Socket } from "socket.io";
import { v4 as uuid } from 'uuid';
import { dts_create_room, dts_game_finished, dts_player_finished, IPlayerInfo, mdts_device_type, mdts_players_in_room, mts_player_connected, std_game_data_info, std_room_created_callback, stmd_players_in_room_callback, stmd_socket_ready, stm_player_connected_callback } from "../../public/src/shared-backend/shared-stuff";
import { Player } from "./ServerPlayer"
import TestRoom from "./TestRoom"

const successStatus = "success"
const errorStatus = "error"


export default class RoomMaster {
    rooms: { [roomId: string]: Room }
    io
    testRoom


    constructor(io: Socket) {
        this.io = io
        this.rooms = {}
        /** only one test room */
        this.testRoom = new TestRoom()
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
        }

        mobileSocket.on(mts_player_connected, ({ roomId, playerName, playerId, isAuthenticated, photoURL }: IPlayerConnectedData) => {
            console.log("connecting player", roomId, playerName)
            if (!this.roomExists(roomId)) {
                mobileSocket.emit(stm_player_connected_callback, { message: "Room does not exist, please create a game on a desktop first.", status: errorStatus })
            } else {
                const player = new Player(mobileSocket, playerName, playerId, isAuthenticated, photoURL)
                this.rooms[roomId].addPlayer(player)
            }
        })
    }


    createRoom(socket: Socket, roomId: string) {
        this.rooms[roomId] = new Room(roomId, this.io, socket, () => {
            /** delete room callback */

            delete this.rooms[roomId]
        })
        socket.join(roomId)
        socket.emit(std_room_created_callback, { status: successStatus, message: "Successfully created a room.", data: { roomId } })
    }


    addSocket(socket: Socket) {
        let roomId: string
        let isTestMode = false
        let onMobile: boolean
        console.log("adding socket, games", Object.keys(this.rooms))

        socket.once(mdts_device_type, ({ deviceType, mode }) => {
            isTestMode = mode === "test"
            onMobile = deviceType === "mobile"
            if (isTestMode) {
                console.log("In testmode from", deviceType)
                if (onMobile) {
                    this.testRoom.setMobileSocket(socket)
                } else {
                    this.testRoom.setDesktopSocket(socket)
                }
            } else {
                console.log("Connection from", deviceType)
                if (deviceType === "desktop") {
                    socket.on(dts_create_room, () => {
                        // increadably unlikly two games get same uuid
                        // one room can play many games
                        roomId = uuid().slice(0, 4)
                        this.createRoom(socket, roomId)
                    })

                    socket.on("disconnect", () => {
                        console.log("disconnected from desktop", roomId)
                        if (roomId) {
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

    constructor(roomId: string, io: Socket, socket: Socket, deleteRoomCallback: () => void) {
        this.players = []
        this.gameSettings = {}
        this.roomId = roomId
        this.io = io
        this.gameStarted = false

        this.isConnected = true
        this.deleteRoomCallback = deleteRoomCallback

        this.setSocket(socket)

    }

    setupLeftWaitingRoomListener() {
        this.socket.on("left-waiting-room", () => {
            /** if game hasnt started delete game */
            if (!this.gameStarted) {
                for (let player of this.players) {
                    player.gameDisconnected()
                }
                this.deleteRoomCallback()
            }
        })
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.setupStartGameListener()
        this.setupGameSettingsListener()
        this.setupLeftWaitingRoomListener()
        this.setupPlayerFinishedListener()
        this.setupGameFinishedListener()
    }

    addPlayer(player: Player) {
        let playerExists = false

        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.players[i].setSocket(player.socket)

                playerExists = true
            }
        }
        console.log("adding player")

        if (this.gameStarted) {
            if (!playerExists) {
                player.socket.emit(stm_player_connected_callback, { status: errorStatus, message: "The game you are trying to connect to has already started." })

            } else {
                player.socket.emit(stm_player_connected_callback, { status: successStatus, message: "You have been reconnected!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } })
                player.socket.emit("handle-game-starting")
            }
            return
        }


        this.players.push(player)
        player.setGame(this)
        player.playerNumber = this.players.length - 1
        if (this.players.length === 1) {
            player.setLeader()
        }


        player.socket.emit(stm_player_connected_callback, { status: successStatus, message: "Successfully connected to room!", data: { player: player.getPlayerInfo(), players: this.getPlayersInfo(), roomId: this.roomId } })
        player.socket.join(this.roomId)
        player.socket.emit("room-connected", { roomId: this.roomId, isLeader: player.isLeader })
        this.alertWaitingRoom()
        if (this.gameStarted) {
            player.startGame()
        }

    }

    alertWaitingRoom() {
        this.io.to(this.roomId).emit("waiting-room-alert", { players: this.getPlayersInfo() })
    }

    setupGameSettingsListener() {
        this.socket.on("game-settings-changed", (data) => {
            this.gameSettings = data.gameSettings
            for (let player of this.players) {
                player.sendGameSettings(this.gameSettings)
            }
        })
    }

    setupControlsListener() {
        setInterval(() => {
            this.socket.emit("get-controls", { players: this.getPlayersControls() })
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
        this.socket.once("handle-start-game", () => {
            if (this.players.length === 0) {
                this.socket.emit("handle-start-game-callback", {
                    message: "No players connected, cannot start game",
                    status: errorStatus
                })
                setTimeout(() => {

                    this.setupStartGameListener()
                }, 50)
            } else {
                this.socket.emit("handle-start-game-callback", {
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
        this.socket.emit("player-disconnected", { playerName })

        if (!this.gameStarted) {
            for (let i = 0; i < this.players.length; i++) {
                // change to id's and give un auth players id's
                if (this.players[i].id === playerId) {
                    this.players.splice(i, 1)

                }
            }
        }

        this.alertWaitingRoom()
    }

    userSettingsChanged(data: any) {
        this.socket.emit("user-settings-changed", data)
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

    toString() {
        let playersString = ""
        for (let player of this.players) {
            playersString += player.toString() + ", "
        }
        return this.roomId + ": " + playersString
    }
}
