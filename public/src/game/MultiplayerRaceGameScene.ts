import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Socket } from "socket.io-client";
import { PerspectiveCamera } from "three";
import { IGameSettings } from "../classes/localGameSettings";
import { IUserSettings } from "../classes/User";
import { RaceCourse } from "../course/RaceCourse";
import { m_fs_game_countdown, m_fs_game_starting, m_fs_room_info, m_fs_vehicles_position_info, m_ts_game_socket_ready, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo, m_ts_lap_done, m_fs_game_finished, m_fs_reload_game, m_fs_mobile_controls, m_fs_mobile_controller_disconnected } from "../shared-backend/multiplayer-shared-stuff";
import { IPlayerInfo, MobileControls, mts_user_settings_changed, VehicleControls } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { addMusic, setMusicVolume, startMusic } from "../sounds/gameSounds";
import { addKeyboardControls, driveVehicle, driveVehicleWithKeyboard } from "../utils/controls";
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

    constructor() {
        super()
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
                console.log("esc pressed", this.gameRoomActions)
                if (this.gameRoomActions.escPressed) {
                    this.gameRoomActions.escPressed()
                }
            }
        })

        window.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.vehicle?.resetPosition()
            }
        })

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
        this.course = new RaceCourse(this, this.config.gameSettings.trackName, (v) => this.handleGoalCrossed(v), (v, num) => this.handleCheckpointCrossed(v, num))
        await this.course.createCourse()
        this.addLights()
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.camera.position.set(0, 50, 50)
        this.camera.rotation.set(-Math.PI / 10, Math.PI, -Math.PI / 10)
        this.otherVehicles = []
        await this.createVehicle()
        await this.createOtherVehicles()
        addMusic(this.gameSettings.musicVolume, this.camera as PerspectiveCamera, "racing.mp3")
        this.gameTime = new GameTime(this.gameSettings.numberOfLaps, this.course.getNumberOfCheckpoints())
        console.log("everything created")

        this.sendPlayerReady()
    }

    async createVehicle() {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.config) {
                console.warn("Can only create vehicle if config is set")
                reject()
                return
            }
            const vehicleType = this.config.player.vehicleType
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
            console.log("createing car", vehicleConfig)
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

            this.vehicle.addCamera(this.camera)
            resolve()
        })
    }

    async createOtherVehicles() {
        return new Promise<void>((resolve, reject) => {
            const batch = []
            for (let p of this.config.players) {
                if (p.id !== this.config.player.id) {
                    const config: GhostVehicleConfig = {
                        vehicleType: p.vehicleType,
                        color: p.vehicleSetup.vehicleColor,
                        id: p.id,
                        notOpague: true
                    }
                    const ghost = new GhostVehicle(config)
                    batch.push(ghost.loadModel())
                    this.otherVehicles.push(ghost)
                }
            }
            Promise.all(batch).then(() => {
                for (let ghost of this.otherVehicles) {
                    console.log("adding ghost to scene")
                    ghost.addToScene(this)
                    ghost.show()
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
        console.log("!!!!!!!!!!!!!!!!!setting soket!!!!!!!!!!!!!!!!!!!!!")
        this.socket = socket
        this.socket.emit(m_ts_game_socket_ready, {})
        this.setupPlayersInfoListener()
        this.setupCountdownListener()
        this.setupStartGameListener()
        this.setupVehiclesPositionInfo()
        this.setupRaceFinishedListener()
        this.setupReloadGameListener()
        this.setupUserSettingsChangedListener()
        this.setupMobileControlsListener()
        this.setupMobileControllerDisconnectedListener()
    }

    setupMobileControlsListener() {
        this.socket.on(m_fs_mobile_controls, (mobileControls: MobileControls) => {
            if (this.vehicle) {
                driveVehicle(mobileControls, this.vehicle)
                this.usingMobileController = true
            }
        })
    }

    setupMobileControllerDisconnectedListener() {
        this.socket.on(m_fs_mobile_controller_disconnected, () => {
            this.usingMobileController = false
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
        this.socket.on(m_fs_reload_game, (data: { players: IPlayerInfo[], gameSettings: IGameSettings }) => {
            const { players, gameSettings } = data
            console.log("reload", players, gameSettings, data)
            for (let p of players) {
                if (p.id === this.config.player.id) {
                    this.config.player = p
                }
            }
            this.config.players = players
            if (this.gameSettings) {
                this.gameSettings = gameSettings
                this.config.gameSettings = gameSettings
            }

            this.restartGame()
        })
    }

    setupRaceFinishedListener() {
        this.socket.on(m_fs_game_finished, (data) => {
            const { winner, raceData } = data
            this.showImportantInfo(`Race finished, ${winner.name} is the winner with total time ${winner.totalTime.toFixed(2)}`)
        })
    }

    sendPlayerReady() {
        console.log("sending ready")
        this.isReady = true
        this.socket.emit(m_ts_player_ready, {})
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
        this.startVehicle()
        this.gameTime.start()
    }

    startVehicle() {
        console.log("start vehicle")
        this.vehicle.unpause()
        this.vehicle.setCanDrive(true)
    }

    setupStartGameListener() {
        // spawnPosition is a {[userId:string]:number}
        // countdown is a number
        this.socket.on(m_fs_game_starting, ({ spawnPositions, countdown }) => {
            console.log("start game", spawnPositions, countdown)
            this.gameTime = new GameTime(this.gameSettings.numberOfLaps, this.course.getNumberOfCheckpoints())

            // start count down?
            // or do the count down on the backend
            this.showImportantInfo(`Race starting in ${countdown} seconds`, true)
            console.log("this.config.player.id", this.config.player.id)
            // the other vehicles simply set their positon them selvs and send us the position?
            this.course.setToSpawnPostion(spawnPositions[this.config.player.id], this.vehicle)
            this.vehicle.resetPosition()
            this.vehicle.setCanDrive(false)
            this.vehicle.stop()
            this.vehicle.start()
        })
    }

    setupVehiclesPositionInfo() {
        this.socket.on(m_fs_vehicles_position_info, (info: any) => {
            this.vehiclesPositionInfo = info
        })
    }

    setupPlayersInfoListener() {
        this.socket.on(m_fs_room_info, ({ players, gameSettings }: { players: IPlayerInfo[], gameSettings: IGameSettings }) => {
            // setup players
            for (let p of players) {
                if (p.id === this.config.player.id) {
                    this.config.player = p
                    console.log("updating player", p)
                    this.vehicle.updateVehicleSetup(p.vehicleSetup)
                } else {
                    // change ghostColor 
                    for (let g of this.otherVehicles) {
                        if (g.id === p.id) {
                            g.changeColor(p.vehicleSetup.vehicleColor)
                        }
                    }
                }
            }

            this.gameSettings = gameSettings
            this.config.gameSettings = gameSettings
        })
    }

    setGameSceneConfig(gameSceneConfig: IMultiplayergameSceneConfig) {
        this.config = gameSceneConfig
        this.setSocket(this.config.socket)
        this.setGameSettings(this.config.gameSettings)
        this.currentNumberOfLaps = this.config.gameSettings.numberOfLaps
        console.log("setting game room action", this.config.gameRoomActions)
        this.gameRoomActions = this.config.gameRoomActions
    }

    toggleUseSound() {
        this.vehicle?.toggleSound(this.useSound)
    }

    startGameSong() {
        // not use game song right now...
        startMusic()
    }

    setGameSettings(gameSettings: IGameSettings) {

        if (this.courseLoaded && (this.getTrackName() !== gameSettings.trackName || this.gameSettings.graphics !== gameSettings.graphics)) {
            this.setNeedsReload(true)
            console.log("needs reaload")
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
        console.log("restart game")
        // restart game with sockets
        this.clearImportantInfo()
        this.clearSecondaryInfo()

        this.isPaused = false
        this.oldTime = 0
        this.totalPing = 0
        this.totalPingsGotten = 0
        this.totalNumberOfFpsTicks = 0
        this.totalFpsTicks = 0
        if (this.gameRoomActions?.closeModals) {
            this.gameRoomActions.closeModals()
        }


        this.courseLoaded = false
        this.needsReload = false
        /** I think I need to delete ammo vecs */

        await this.vehicle.destroy()
        for (let v of this.otherVehicles) {
            v.removeFromScene(this)
        }
        this.restart().then(() => {
        })

    }

    updateScoreTable(delta: number) {
        this.totalTimeDiv.textContent = this.gameTime.getTotalTime().toFixed(2)
        this.kmhInfo.textContent = `${this.vehicle.getCurrentSpeedKmHour(delta).toFixed(0)} km/h`
        this.lapsInfo.textContent = `${this.gameTime.lapNumber} / ${this.currentNumberOfLaps}`
    }


    sendPosition() {
        if (!this.isReady) return
        const pos = this.vehicle.getPosition()

        const r = this.vehicle.getRotation()
        const rot = {
            x: r.x,
            y: r.y,
            z: r.z,
            w: r.w
        }
        const speed = this.vehicle.getCurrentSpeedKmHour()
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

    updateOtherVehicles() {
        for (let v of this.otherVehicles) {
            if (v.isReady) {

                const info = this.vehiclesPositionInfo[v.id]

                if (info?.pos) {
                    v.setPosition(info.pos)
                    v.setSimpleRotation(info.rot)
                } else {
                    console.log("no info pos", info)
                }
            }
        }
    }

    update(_time: number, _delta: number): void {
        this.time = _time
        this.renderer.render(this.scene, this.camera)
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
        this.updateScoreTable(_delta)

        if (!this.usingMobileController) {
            driveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
        }
        this.checkIfVehicleIsOffCourse()
    }

    async _destoryGame() {
        return new Promise<void>((resolve, reject) => {
            console.log("destroying game")
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
            console.log("Creating multiplayer game, config:", gameSceneConfig)
            gameObject.setGameSceneConfig(gameSceneConfig)
            resolve(gameObject)

            return project
        })
    })
}

