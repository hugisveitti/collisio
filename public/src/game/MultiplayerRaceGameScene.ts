import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Socket } from "socket.io-client";
import { PerspectiveCamera, Clock, Vector3, Quaternion } from "three";
import { IGameSettings, IRoomSettings } from "../classes/localGameSettings";
import { IUserSettings } from "../classes/User";
import { RaceCourse } from "../course/RaceCourse";
import { m_fs_game_countdown, m_fs_game_starting, m_fs_room_info, m_fs_vehicles_position_info, m_ts_game_socket_ready, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo, m_ts_lap_done, m_fs_game_finished, m_fs_reload_game, m_fs_mobile_controls, m_fs_mobile_controller_disconnected, m_fs_race_info, m_fs_game_settings_changed, m_fs_already_started } from "../shared-backend/multiplayer-shared-stuff";
import { defaultVehicleColorType, defaultVehicleType, IPlayerInfo, MobileControls, mts_user_settings_changed, VehicleColorType, VehicleControls } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { addMusic, setMusicVolume, startMusic, stopMusic } from "../sounds/gameSounds";
import { addKeyboardControls, driveVehicle, driveVehicleWithKeyboard } from "../utils/controls";
import { BotVehicle } from "../vehicles/BotVehicle";
import { GhostVehicle, GhostVehicleConfig, IGhostVehicle } from "../vehicles/GhostVehicle";
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle";
import { loadSphereModel, SphereVehicle } from "../vehicles/SphereVehicle";
import { IVehicleClassConfig } from "../vehicles/Vehicle";
import { getVehicleClassFromType } from "../vehicles/VehicleConfigs";
import { GameTime } from "./GameTimeClass";
import { IGameRoomActions } from "./IGameScene";
import { MyScene } from "./MyScene";

export interface IMultiplayergameSceneConfig {
    socket: Socket
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
    userSettings: IUserSettings
    vehicleSetup: VehicleSetup
    player: IPlayerInfo
    players: IPlayerInfo[]
    gameRoomActions: IGameRoomActions
}

export interface IMultiplayerRaceGameScene {
    restartGame: () => void
    setNeedsReload: (b: boolean) => void

}

export class MultiplayerRaceGameScene extends MyScene implements IMultiplayerRaceGameScene {
    config?: IMultiplayergameSceneConfig
    vehicle: IVehicle

    otherVehicles: IGhostVehicle[]

    isReady: boolean

    vehiclesPositionInfo: { [userId: string]: IVehiclePositionInfo }
    vehicleControls: VehicleControls
    // everyone at least keeps their own time
    gameTime: GameTime
    course: RaceCourse

    kmhInfo: HTMLSpanElement
    lapsInfo: HTMLSpanElement

    currentNumberOfLaps: number
    usingMobileController: boolean
    updateClock: Clock
    // last other vehicles update
    lastOVUpdate: number
    /**
     * number of updates of other vehicles without updating the position from server 
     */
    numNoUpdate: number
    scoreSpans: HTMLSpanElement[]


    bot: BotVehicle
    gameStarted: boolean

    constructor() {
        super()
        this.gameStarted = false
        this.updateClock = new Clock(false)
        this.lastOVUpdate = 0.0
        this.numNoUpdate = 0
        this.currentNumberOfLaps = 2
        this.isReady = false
        this.vehiclesPositionInfo = {}
        this.vehicleControls = new VehicleControls()
        addKeyboardControls(this.vehicleControls)
        this.gameTime = new GameTime(2, 2)
        this.usingMobileController = false
        this.kmhInfo = document.createElement("span")
        this.gameInfoDiv.appendChild(this.kmhInfo)
        this.kmhInfo.classList.add("game-text")
        this.kmhInfo.setAttribute("style", `
            position:absolute;
            bottom: 30px;
            left:${window.innerWidth / 2}px;
            transform: translate(-50%, 0);
            font-size:24px;
        `)
        this.scoreSpans = []

        this.lapsInfo = document.createElement("span")
        this.gameInfoDiv.appendChild(this.lapsInfo)
        this.lapsInfo.classList.add("game-text")
        this.lapsInfo.setAttribute("style", `
        position:absolute;
        bottom: 30px;
        left:${window.innerWidth / 2}px;
        transform: translate(-50%, 0);
        font-size:24px;
    `)

        const fontSize = window.innerWidth < 1500 ? 32 : 82
        this.lapsInfo.setAttribute("style", `
            position:absolute;
            right:0;
            bottom:0;
            font-size:${fontSize}px;
        `)


        // need to add "esc" to open menu
        // no pause possible, but leader can restart
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (this.gameRoomActions.escPressed) {
                    this.gameRoomActions.escPressed()
                }
            }
            else if (e.key === "r") {
                this.vehicle?.resetPosition()
            }
        })

        this.otherVehicles = []

        window.addEventListener("resize", () => this.windowResize())
    }

    windowResize() {
        this.kmhInfo.setAttribute("style", `
        position:absolute;
        bottom: 30px;
        left:${window.innerWidth / 2}px;
        transform: translate(-50%, 0);
        font-size:24px;
    `)
    }

    async preload() {
        this.course = new RaceCourse(this, this.config.roomSettings.trackName, (v) => this.handleGoalCrossed(v), (v, num) => this.handleCheckpointCrossed(v, num))
        await this.course.createCourse()
        this.addLights()
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.camera.position.set(0, 50, 50)
        this.camera.rotation.set(-Math.PI / 10, Math.PI, -Math.PI / 10)
        this.otherVehicles = []
        await this.createVehicle()
        await this.createOtherVehicles()
        await this.createBot()

        addMusic(this.gameSettings?.musicVolume || 0, this.camera as PerspectiveCamera, this.getRaceSong())
        this.gameTime = new GameTime(this.roomSettings.numberOfLaps, this.course.getNumberOfCheckpoints())

        const { position, rotation } = this.course.getGoalCheckpoint()

        this.vehicle.setCheckpointPositionRotation({ position, rotation })
        this.vehicle.resetPosition()

        this.vehicle.addCamera(this.camera)

        this.vehicle.setCanDrive(true)
        this.showSecondaryInfo("waiting for other players")

        this.sendPlayerReady()
    }

    async createVehicle() {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.config) {
                console.warn("Can only create vehicle if config is set")
                reject()
                return
            }
            // need some backup of the vehicle type, if it doesnt load
            const vehicleType = this.config.player?.vehicleType ?? defaultVehicleType
            const vehicleConfig: IVehicleClassConfig = {
                id: this.config.player.id,
                scene: this,
                vehicleType,
                useSoundEffects: this.gameSettings.useSound,
                name: this.config.player.playerName,
                vehicleNumber: 0,
                vehicleSetup: this.config.vehicleSetup,
                vehicleSettings: this.config.userSettings.vehicleSettings
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                this.vehicle = new LowPolyVehicle(vehicleConfig)
            } else {
                this.vehicle = new SphereVehicle(vehicleConfig)
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                await loadLowPolyVehicleModels(vehicleType, false).then(([tires, chassis]) => {
                    this.vehicle.addModels(tires, chassis)
                })
            } else {
                await loadSphereModel(vehicleType, false).then((body) => {
                    this.vehicle.addModels([], body)
                })
            }


            const p = this.vehicle.getPosition()
            this.vehicle.setPosition(p.x, p.y + 5, p.z)

            resolve()
        })
    }

    async createBot() {
        return new Promise<void>((resolve, reject) => {
            if (this.gameSettings.botDifficulty === "none" || this.config.players.length > 1) {
                console.log("Not creating bot", " num players", this.config.players.length)
                resolve()
                return
            }
            const botConfig: IVehicleClassConfig = {
                name: "Bot Tamy",
                id: "bot-id",
                vehicleType: "normal2", //doesnt matter,
                vehicleSetup: {
                    vehicleColor: "#ff00ee" as VehicleColorType,
                    vehicleType: "normal2"
                },
                scene: this,
                vehicleNumber: -1,
                isBot: true
            }
            this.bot = new BotVehicle(this.gameSettings.botDifficulty, botConfig)
            loadLowPolyVehicleModels(this.bot.vehicleType, false).then(([tires, chassis]) => {
                this.bot.addModels(tires, chassis)
                this.bot.setCanDrive(true)

                this.restartBotPos()
                resolve()
            })
        })
    }

    async createOtherVehicles() {
        return new Promise<void>((resolve, reject) => {
            const batch = []
            for (let p of this.config.players) {
                if (p.id !== this.config.player.id) {

                    const config: GhostVehicleConfig = {
                        vehicleType: p?.vehicleType ?? defaultVehicleType,
                        color: p.vehicleSetup?.vehicleColor ?? defaultVehicleColorType,
                        id: p.id,
                        notOpague: true
                    }
                    const ghost = new GhostVehicle(config)
                    batch.push(ghost.loadModel())
                    this.otherVehicles.push(ghost)
                    ghost.updateVehicleSetup(p.vehicleSetup)
                }
            }
            Promise.all(batch).then(() => {

                for (let ghost of this.otherVehicles) {
                    ghost.addToScene(this)
                    ghost.show()
                    // put in air to hide haha
                    ghost.setPosition(new Vector3(100, 100, 100))
                }

                resolve()
            })
        })
    }

    sendLapDone() {
        this.socket.emit(m_ts_lap_done, {
            totalTime: this.gameTime.getTotalTime(),
            latestLapTime: this.gameTime.getLatestLapTime(),
            lapNumber: this.gameTime.getCurrentLapNumber()
        })
    }

    handleGoalCrossed(vehicle: ExtendedObject3D) {
        if (this.gameTime.allCheckpointsCrossed()) {
            const cLapTime = this.gameTime.getCurrentLapTime()

            this.gameTime.lapDone()
            const { position, rotation } = this.course.getGoalCheckpoint()

            this.vehicle.setCheckpointPositionRotation({ position, rotation })

            if (this.gameTime.finished()) {
                console.log("finished race!")
                this.gameStarted = false
            }
            this.sendLapDone()
            this.showSecondaryInfo(`Lap time: ${cLapTime.toFixed(2)}`, true)
        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D, checkpointNumber: number) {
        if (!this.gameTime.crossedCheckpoint(checkpointNumber)) {
            this.gameTime.checkpointCrossed(checkpointNumber)
            this.showSecondaryInfo(`Checkpoint ${this.gameTime.getCurrentLapTime().toFixed(2)}`, true)
            const { position, rotation } = this.course.getCheckpointPositionRotation(checkpointNumber)
            this.vehicle.setCheckpointPositionRotation({ position: { x: position.x, y: position.y + 1, z: position.z }, rotation: rotation })
        }
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.socket.emit(m_ts_game_socket_ready, {})
        this.setupPlayersInfoListener()
        this.setupCountdownListener()
        this.setupStartGameListener()
        this.setupVehiclesPositionInfo()
        this.setupRaceFinishedListener()
        this.setupReloadGameListener()
        this.setupUserSettingsChangedListener()
        this.setupGamesSettingsChangedListener()
        this.setupMobileControlsListener()
        this.setupMobileControllerDisconnectedListener()
        this.setupRaceInfoListener()
        // for reconnects
        this.setupGameStartedListener()
    }

    setupMobileControlsListener() {
        this.socket.on(m_fs_mobile_controls, (mobileControls: MobileControls) => {
            if (this.vehicle) {
                driveVehicle(mobileControls, this.vehicle)
                this.usingMobileController = true
            }
        })
    }

    setupGameStartedListener() {
        this.socket.once(m_fs_already_started, ({ players, msDone }) => {
            this.gameTime.start(msDone)
            this.showSecondaryInfo("Reconnected", true)
            const player = players[this.vehicle.id]

            this.vehicle.setPosition(player.pos.x, player.pos.y, player.z)
            this.vehicle.setRotation(new Quaternion(player.rot.x, player.rot.y, player.rot.z, player.rot.w))
            this.vehicle.setCanDrive(true)
            this.vehicle.unpause()
            this.vehicle.start()
            this.isPaused = false
            this.isReady = true
        })
    }

    setupMobileControllerDisconnectedListener() {
        this.socket.on(m_fs_mobile_controller_disconnected, () => {
            this.usingMobileController = false
        })
    }

    setupGamesSettingsChangedListener() {
        this.socket.on(m_fs_game_settings_changed, ({ gameSettings }) => {
            this.setGameSettings(gameSettings)
        })
    }

    setupUserSettingsChangedListener() {
        // this.socket.on(mts_user_settings_changed, (data: { userSettings: IUserSettings, vehicleSetup: VehicleSetup }) => {
        //     const { userSettings, vehicleSetup } = data
        //     console.log("usersettings changed", data)
        //     this.vehicle.updateVehicleSettings(userSettings.vehicleSettings, vehicleSetup)
        //     if (userSettings?.vehicleSettings.vehicleType) {
        //         this.config.userSettings = userSettings

        //         this.config.player.vehicleType = userSettings?.vehicleSettings.vehicleType
        //     }
        //     if (vehicleSetup) {

        //         this.config.player.vehicleSetup = vehicleSetup
        //     }
        // })
    }

    setupReloadGameListener() {
        this.socket.on(m_fs_reload_game, (data: { players: IPlayerInfo[], roomSettings: IRoomSettings }) => {
            const { players, roomSettings } = data
            console.log("reload", players, roomSettings)
            for (let p of players) {
                if (p.id === this.config.player.id) {
                    this.config.player = p
                }
            }
            this.config.players = players

            if (this.roomSettings) {
                this.roomSettings = roomSettings
                this.config.roomSettings = roomSettings
            }

            this.restartGame()
        })
    }

    setupRaceFinishedListener() {
        this.socket.on(m_fs_game_finished, (data) => {
            const { winner, raceData } = data
            this.showImportantInfo(`Race finished, ${winner.name} is the winner with total time ${winner.totalTime.toFixed(2)}`)
            // save race, get coins
        })
    }

    sendPlayerReady() {
        // just wait a little...
        setTimeout(() => {
            if (this.config?.gameSettings.musicVolume > 0) {
                this.startGameSong()
            }

            this.isReady = true
            this.socket.emit(m_ts_player_ready, {})
        }, 500)
    }

    setupCountdownListener() {
        this.socket.on(m_fs_game_countdown, ({ countdown }) => {
            if (+countdown <= 0) {
                this.showImportantInfo("GO!!", true)
                this.startGame()
            } else {
                this.showImportantInfo(countdown, true)
            }
        })
    }

    startGame() {
        this.gameStarted = true
        this.startVehicle()
        this.gameTime.start()
    }

    startVehicle() {
        this.vehicle.unpause()
        this.vehicle.setCanDrive(true)
    }

    setupRaceInfoListener() {
        this.socket.on(m_fs_race_info, (data: any) => {
            this.updateScoreTable(data.raceData)
        })
    }

    restartBotPos() {
        const { position, rotation } = this.course.getGoalCheckpoint()
        const alpha = 2 * Math.asin(rotation.y)
        this.bot.setCheckpointPositionRotation({
            position: {
                x: position.x + (Math.sin(alpha) * 10 * Math.sign(rotation.w)),
                y: position.y,
                z: position.z + (Math.cos(alpha) * 10)
            },
            rotation
        })
        this.bot.getNextDir()
        if (this.bot.vehicleBody?.body) {
            this.bot.resetPosition()
            //      this.bot.update(0.1)
        }
    }

    setupStartGameListener() {
        // spawnPosition is a {[userId:string]:number}
        // countdown is a number
        this.socket.on(m_fs_game_starting, ({ spawnPositions, countdown }) => {
            this.clearSecondaryInfo()
            this.updateClock.start()
            this.gameTime = new GameTime(this.roomSettings.numberOfLaps, this.course.getNumberOfCheckpoints())

            // start count down?
            // or do the count down on the backend
            this.showImportantInfo(`Race starting in ${countdown} seconds`, true)
            // the other vehicles simply set their positon them selvs and send us the position?
            this.course.setToSpawnPostion(spawnPositions[this.config.player.id], this.vehicle)
            this.vehicle.resetPosition()
            this.vehicle.setCanDrive(false)
            this.vehicle.stop()
            this.vehicle.start()
            this.gameStarted = false
            if (this.bot) {

                this.bot.restartBot()
                this.restartBotPos()
            }
        })
    }

    setupVehiclesPositionInfo() {
        this.socket.on(m_fs_vehicles_position_info, (info: any) => {
            this.vehiclesPositionInfo = info
            this.lastOVUpdate = this.updateClock.getDelta()

            //   this.lastOVUpdate = Math.max(0.01, this.lastOVUpdate)
            this.numNoUpdate = 0
            for (let o of this.otherVehicles) {
                //  console.log("saving pos", info[o.id].pos)

                o.saveCurrentPosition(info[o.id].pos)
            }
        })
    }

    setupPlayersInfoListener() {
        this.socket.on(m_fs_room_info, ({ players, roomSettings }: { players: IPlayerInfo[], roomSettings: IRoomSettings }) => {
            // setup players
            for (let p of players) {
                if (p.id === this.config.player.id) {
                    this.config.player = p
                    this.vehicle.updateVehicleSettings(p.vehicleSettings, p.vehicleSetup)
                } else {
                    // change ghostColor 
                    for (let g of this.otherVehicles) {
                        if (g.id === p.id) {
                            g.changeColor(p.vehicleSetup.vehicleColor)
                        }
                    }
                }
            }

            this.roomSettings = roomSettings
            this.config.roomSettings = roomSettings
        })
    }

    setGameSceneConfig(gameSceneConfig: IMultiplayergameSceneConfig) {
        this.config = gameSceneConfig
        this.setSocket(this.config.socket)
        this.setGameSettings(this.config.gameSettings)
        this.setRoomSettings(this.config.roomSettings)
        this.currentNumberOfLaps = this.config.roomSettings.numberOfLaps
        this.gameRoomActions = this.config.gameRoomActions
        this.createScoreTable()
    }

    toggleUseSound() {
        this.vehicle?.toggleSound(this.useSound)
    }

    startGameSong() {
        // not use game song right now...
        startMusic()
    }

    setRoomSettings(roomSettings: IRoomSettings) {
        if (this.courseLoaded && this.getTrackName() !== roomSettings.trackName) {
            this.setNeedsReload(true)
        }
        this.roomSettings = roomSettings
        for (let key of Object.keys(roomSettings)) {
            if (roomSettings[key] !== undefined) {
                this[key] = roomSettings[key]
            }
        }
    }

    setGameSettings(gameSettings: IGameSettings) {

        if (this.courseLoaded && (this.gameSettings.graphics !== gameSettings.graphics)) {
            this.setNeedsReload(true)
        }

        this.gameSettings = gameSettings


        for (let key of Object.keys(gameSettings)) {
            if (gameSettings[key] !== undefined) {
                this[key] = gameSettings[key]
            }
        }

        this.timeOfDay = this.getTimeOfDay()
        if (this.pLight && this.course) {
            this.pLight.castShadow = this.useShadows && this.timeOfDay === "day"
            this.pLight.shadow.bias = 0.1
            this.course.toggleShadows(this.useShadows)
        }

        setMusicVolume(gameSettings.musicVolume)
        if (this.isReady) {
            this.toggleUseSound()

            if (gameSettings.musicVolume > 0) {
                this.startGameSong()
            }
        }

        this.camera.far = this.getDrawDistance()

        if (this.targetFPS) {
            this.physics.config.fixedTimeStep = 1 / this.targetFPS
        }
    }

    async restartGame() {
        // restart game with sockets
        this.clearImportantInfo()
        this.clearSecondaryInfo()
        this.gameStarted = false

        this.isPaused = false
        this.oldTime = 0
        this.totalPing = 0
        this.totalPingsGotten = 0
        this.totalNumberOfFpsTicks = 0
        this.totalFpsTicks = 0
        if (this.gameRoomActions?.closeModals) {
            this.gameRoomActions.closeModals()
        }

        this.bot?.destroy()

        this.courseLoaded = false
        this.needsReload = false
        /** I think I need to delete ammo vecs */

        await this.vehicle.destroy()
        for (let v of this.otherVehicles) {
            v.removeFromScene(this)
        }
        stopMusic()
        this.restart().then(() => {
        })

    }

    createScoreTable() {
        const table = document.createElement("table")
        this.gameInfoDiv.appendChild(table)
        table.classList.add("score-table")
        table.setAttribute("style", `
            position:absolute;
            bottom:0;
            left:0;
        `)
        this.scoreSpans = []

        const head = document.createElement("thead")
        table.appendChild(head)
        const th1 = document.createElement("th")
        th1.textContent = "Player"
        head.appendChild(th1)
        const th2 = document.createElement("th")
        th2.textContent = "LT | Lap"
        th2.setAttribute("style", "float:right;")
        head.appendChild(th2)
        const tableB = document.createElement("tbody")
        table.appendChild(tableB)

        for (let p of this.config.players) {
            const scoreRow = document.createElement("tr")
            tableB.appendChild(scoreRow)
            const nameInfo = document.createElement("td")
            nameInfo.setAttribute("style", "margin-right:5px; with:120px;")
            scoreRow.appendChild(nameInfo)
            nameInfo.textContent = p.playerName.slice(0, 10)
            const scoreSpan = document.createElement("td")
            scoreSpan.setAttribute("style", "float:right;")
            scoreSpan.textContent = `- | ${1} / ${this.currentNumberOfLaps}`
            scoreRow.appendChild(scoreSpan)
            this.scoreSpans.push(scoreSpan)
        }
    }
    /**
     * 
     * @param raceData 
     * { playerName,
     *       lapNumber,
      *      latestLapTime
     *       }
     */
    updateScoreTable(raceData: any[]) {
        if (this.scoreSpans.length === 0) return
        for (let i = 0; i < raceData.length; i++) {
            this.scoreSpans[i].textContent = `${raceData[i].latestLapTime.toFixed(2)} | ${raceData[i].lapNumber} / ${this.currentNumberOfLaps}`
        }
    }

    updatePlayerRaceInfo(delta: number) {
        this.totalTimeDiv.textContent = this.gameTime.getTotalTime().toFixed(2)
        let kmh = this.vehicle.getCurrentSpeedKmHour(delta)
        if (kmh > -1) {
            kmh = Math.abs(kmh)
        }
        this.kmhInfo.textContent = `${kmh.toFixed(0)} km/h`
        this.lapsInfo.textContent = `${this.gameTime.lapNumber} / ${this.currentNumberOfLaps}`
    }
    //pres is presision
    around(x: number, pres: number = 1) {
        return +x.toFixed(pres)
    }

    sendPosition() {
        if (!this.isReady) return
        const p = this.vehicle.getPosition()
        const pos = {

            x: this.around(p.x),
            y: this.around(p.y),
            z: this.around(p.z),
        }
        const r = this.vehicle.getRotation()
        const rot = {
            x: this.around(r.x),
            y: this.around(r.y, 2),
            z: this.around(r.z),
            w: this.around(r.w, 2),
        }
        const speed = this.around(this.vehicle.getCurrentSpeedKmHour())
        this.socket.emit(m_ts_pos_rot, { pos, rot, speed })
    }


    updateVehicle(delta: number) {
        if (this.vehicle.isReady) {
            this.vehicle.update(delta)
            this.vehicle.cameraLookAt(this.camera, delta)
        }
    }
    checkIfVehicleIsOffCourse() {
        const p = this.vehicle.getPosition()
        if (p.y < -20) {
            this.vehicle.resetPosition()
        }
    }

    updateBot(delta: number) {
        if (this.bot) {

            this.bot.update(delta)
            if (this.gameStarted) {
                this.bot.driveBot()
            }
        }
    }

    updateOtherVehicles() {
        // alpha must be atleast the ping

        let alpha = this.lastOVUpdate === 0 || this.numNoUpdate === 0 ?
            0 ://  this.lastPing / 1000 :
            ((((1000 / this.targetFPS) / 1000) * this.numNoUpdate)) / this.lastOVUpdate
        if (alpha > 1) {
            alpha = 1
        }
        for (let v of this.otherVehicles) {
            if (v.isReady) {

                const info = this.vehiclesPositionInfo[v.id]

                if (info?.pos) {
                    v.setSpeed(info.speed, this.lastOVUpdate, alpha)
                    v.setPosition(info.pos)
                    v.setSimpleRotation(info.rot)
                }
            }
        }
        this.numNoUpdate += 1
    }

    update(_time: number, _delta: number): void {
        this.time = _time
        this.renderer?.render(this.scene, this.camera)
        this.updateVehicle(_delta)

        this.updateFps(_time)
        if (this.roomTicks % 90 === 0) {
            this.updatePing()
        }
        // if (this.roomTicks % 3 === 0) {
        // not send every time?
        this.sendPosition()
        // }
        this.updateOtherVehicles()
        this.updatePlayerRaceInfo(_delta)

        if (!this.usingMobileController) {
            driveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
        }
        this.updateBot(_delta)
        this.checkIfVehicleIsOffCourse()
    }

    async _destoryGame() {
        return new Promise<void>((resolve, reject) => {
            this.vehicle.destroy()
            for (let o of this.otherVehicles) {
                o.removeFromScene(this)
            }
            window.removeEventListener("resize", () => this.windowResize())
            resolve()
        })
    }
}




export const createMultiplayerGameScene = (SceneClass: typeof MultiplayerRaceGameScene, gameSceneConfig: IMultiplayergameSceneConfig): Promise<MultiplayerRaceGameScene> => {
    return new Promise<MultiplayerRaceGameScene>((resolve, reject) => {

        const config = { scenes: [SceneClass], antialias: true, autoStart: false }
        PhysicsLoader("/ammo", () => {

            const project = new Project(config)
            const key = project.scenes.keys().next().value;

            // hacky way to get the project's scene
            const gameObject = (project.scenes.get(key) as MultiplayerRaceGameScene);
            gameObject.setGameSceneConfig(gameSceneConfig)
            resolve(gameObject)

            return project
        })
    })
}

