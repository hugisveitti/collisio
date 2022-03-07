import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d"
import { Clock, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { IGameSettings, IRoomSettings } from "../../classes/localGameSettings"
import { IUserSettings, IVehicleSettings } from "../../classes/User"
import { hideLoadDiv } from "../../course/loadingManager"
import { RaceCourse } from "../../course/RaceCourse"
import { GameTime } from "../../game/GameTimeClass"
import { IGameRoomActions } from "../../game/IGameScene"
import { MyScene } from "../../game/MyScene"
import { defaultVehicleType, IPlayerInfo, VehicleColorType, VehicleControls } from "../../shared-backend/shared-stuff"
import { VehicleSetup } from "../../shared-backend/vehicleItems"
import { addMusic, removeMusic, setMusicVolume, startMusic } from "../../sounds/gameSounds"
import { addKeyboardControls, driveVehicleWithKeyboard } from "../../utils/controls"
import { BotVehicle } from "../../vehicles/BotVehicle"
import { IVehicle } from "../../vehicles/IVehicle"
import { LowPolyVehicle, loadLowPolyVehicleModels } from "../../vehicles/LowPolyVehicle"
import { SphereVehicle, loadSphereModel } from "../../vehicles/SphereVehicle"
import { IVehicleClassConfig } from "../../vehicles/Vehicle"
import { getVehicleClassFromType } from "../../vehicles/VehicleConfigs"


export interface ISingleplayerGameSceneConfig {
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
    player: IPlayerInfo
    gameRoomActions: IGameRoomActions
}

export interface ISingleplayerGameScene {
    restartGame: () => void
    setNeedsReload: (b: boolean) => void
}

export class SingleplayerGameScene extends MyScene implements ISingleplayerGameScene {
    config?: ISingleplayerGameSceneConfig
    vehicle: IVehicle

    isReady: boolean


    vehicleControls: VehicleControls
    // everyone at least keeps their own time
    gameTime: GameTime
    course: RaceCourse

    kmhInfo: HTMLSpanElement
    lapsInfo: HTMLSpanElement

    currentNumberOfLaps: number

    bot: BotVehicle
    gameStarted: boolean
    raceCountdownTime: number
    countDownInterval: NodeJS.Timer

    constructor() {
        super()
        this.raceCountdownTime = 5
        addKeyboardControls()
        this.gameTime = new GameTime(2, 2)
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
                if (this.gameRoomActions.escPressed) {
                    this.gameRoomActions.escPressed()
                }
            }
            else if (e.key === "t") {
                this.vehicle?.resetPosition()
            } else if (e.key === "r") {
                this.restartGame()
            }
        })
    }


    _handleResizeWindow() {
        this.kmhInfo.setAttribute("style", `
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
    }


    async preload() {
        this.course = new RaceCourse(this, this.config.roomSettings.trackName, (v) => this.handleGoalCrossed(v), (v, num) => this.handleCheckpointCrossed(v, num))
        await this.course.createCourse()
        this.courseLoaded = true
        this.addLights()
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.camera.position.set(0, 50, 50)
        this.camera.rotation.set(-Math.PI / 10, Math.PI, -Math.PI / 10)

        await this.createVehicle()

        await this.createBot()
        this.renderer.render(this.scene, this.camera)
        hideLoadDiv()


        addMusic(this.gameSettings?.musicVolume || 0, this.camera as PerspectiveCamera, this.getRaceSong(), false)
        this.gameTime = new GameTime(this.roomSettings.numberOfLaps, this.course.getNumberOfCheckpoints())

        const { position, rotation } = this.course.getGoalCheckpoint()

        this.vehicle.setCheckpointPositionRotation({ position, rotation })
        this.vehicle.resetPosition()

        this.vehicle.addCamera(this.camera)

        this.vehicle.setCanDrive(true)

    }

    async create(): Promise<void> {
        this.isReady = true
        this.startRaceCountdown()
    }

    _clearTimeouts() {
        clearInterval(this.countDownInterval)
    }

    startGameSong() {
        if (this.gameSettings.musicVolume > 0) {
            startMusic()
        }
    }


    async startRaceCountdown() {

        this.course.setToSpawnPostion(0, this.vehicle)
        this.vehicle.resetPosition()
        this.vehicle.setCanDrive(false)
        this.vehicle.stop()
        this.vehicle.start()
        this.bot?.restartBot()
        this.gameStarted = false
        this.currentNumberOfLaps = this.roomSettings.numberOfLaps
        this.gameTime?.stop()
        this.gameTime = new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints())

        this.startGameSong()
        if (this.raceCountdownTime < 3) this.raceCountdownTime = 3
        // makes vehicle fall
        this.vehicle.stop()

        if (this.raceCountdownTime > 3) {
            this.showImportantInfo(`Race starting in ${this.raceCountdownTime} seconds`, true)
        }

        /** hacky way to make vehicles stopp
         * TODO: not this, find a way to make vechicles reliably start on the ground paused..
         */
        setTimeout(() => {

            //      vehicle.setToGround()
            this.vehicle.start()
            this.vehicle.zeroEngineForce()
            this.vehicle.setCanDrive(false)

        }, (.5) * 1000)

        clearTimeout(this.countDownInterval)
        this.countDownInterval = setInterval(() => {

            // while (0 <= this.raceCountdownTime) {
            if (this.raceCountdownTime < 4 && this.raceCountdownTime !== 0) {
                // dont always play beep
                this.playCountdownBeep()
            }

            this.showImportantInfo(this.raceCountdownTime + "", true)
            if (this.raceCountdownTime > 0) {

                // await this.nSecWait(1)
                // this.raceCountdownTime -= 1
            } else {
                this.playStartBeep()
                this.showImportantInfo("GO!", true)
                this.vehicle.start()
                this.gameTime.start()
                this.vehicle.setCanDrive(true)
                this.gameStarted = true
                clearInterval(this.countDownInterval)
                this.raceCountdownTime = 3

            }
            this.raceCountdownTime -= 1
            // }
        }, 1000)
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
                vehicleSetup: this.config.player.vehicleSetup,
                vehicleSettings: this.config.player.vehicleSettings
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                this.vehicle = new LowPolyVehicle(vehicleConfig)
            } else {
                this.vehicle = new SphereVehicle(vehicleConfig)
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                const [tires, chassis] = await loadLowPolyVehicleModels(vehicleType, false)//.then(([tires, chassis]) => {
                this.vehicle.addModels(tires, chassis)
                //    })
            } else {
                const [tires, chassis] = await loadSphereModel(vehicleType, false) //.then(([_, body]) => {
                this.vehicle.addModels(tires, chassis)
            }
            const p = this.vehicle.getPosition()
            this.vehicle.setPosition(p.x, p.y + 5, p.z)

            resolve()
        })
    }

    async createBot() {
        return new Promise<void>((resolve, reject) => {
            if (this.gameSettings.botDifficulty === "none") {
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

    handleGoalCrossed(vehicle: ExtendedObject3D) {
        if (this.gameTime.allCheckpointsCrossed()) {
            const cLapTime = this.gameTime.getCurrentLapTime()

            this.gameTime.lapDone()
            const { position, rotation } = this.course.getGoalCheckpoint()

            this.vehicle.setCheckpointPositionRotation({ position, rotation })

            if (this.gameTime.finished()) {
                this.gameStarted = false
                this.showSecondaryInfo(`You finished with time ${this.gameTime.getTotalTime().toFixed(2)}!`)
                // TODO: vehicle stop, some celebration sound, camera angle change, maybe some confetti
            } else {
                this.showSecondaryInfo(`Lap time: ${cLapTime.toFixed(2)}`, true)
            }

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

    updatePlayerRaceInfo(delta: number) {
        this.totalTimeDiv.textContent = this.gameTime.getTotalTime().toFixed(2)
        let kmh = this.vehicle.getCurrentSpeedKmHour(delta)
        if (kmh > -1) {
            kmh = Math.abs(kmh)
        }
        this.kmhInfo.textContent = `${kmh.toFixed(0)} km/h`
        this.lapsInfo.textContent = `${this.gameTime.lapNumber} / ${this.currentNumberOfLaps}`
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

    setNeedsReload(needsReload: boolean): void {
        this.needsReload = needsReload
    }

    restartGame() {
        this.clearImportantInfo()
        this.clearSecondaryInfo()
        this.gameStarted = false

        if (this.needsReload) {
            this.isPaused = true
            removeMusic()
            this.totalNumberOfFpsTicks = 0
            this.totalFpsTicks = 0
            this.courseLoaded = false
            this.needsReload = false
            this.vehicle.destroy()
            this.bot?.destroy()
            this.isReady = false
            this.restart()
        } else {

            this.gameTime.restart()
            this.vehicle.resetPosition()
            this.bot.restartBot()
            this.startRaceCountdown()
        }
    }

    setRoomSettings(roomSettings: IRoomSettings) {
        if (roomSettings.trackName !== this.config.roomSettings.trackName) {
            this.setNeedsReload(true)
        }
        this.roomSettings = roomSettings
        this.config.roomSettings = roomSettings
    }

    toggleUseSound() {
        this.vehicle?.toggleSound(this.useSound)
    }

    setGameSettings(gameSettings: IGameSettings): void {
        if (this.courseLoaded && (gameSettings.graphics !== this.config.gameSettings.graphics || gameSettings.botDifficulty !== this.gameSettings.botDifficulty)) {
            this.setNeedsReload(true)
        }
        // having both config.gamesettings and this.gamesettings is stupid
        this.config.gameSettings = gameSettings
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

        setMusicVolume(this.gameSettings.musicVolume)
        if (this.isReady) {
            this.toggleUseSound()
            this.startGameSong()
        }

        this.camera.far = this.getDrawDistance()

        if (this.targetFPS) {
            this.physics.config.fixedTimeStep = 1 / this.targetFPS
        }
    }

    setGameSceneConfig(gameSceneConfig: ISingleplayerGameSceneConfig) {
        this.config = gameSceneConfig

        this.setGameSettings(this.config.gameSettings)
        this.setRoomSettings(this.config.roomSettings)
        this.currentNumberOfLaps = this.config.roomSettings.numberOfLaps
        this.gameRoomActions = this.config.gameRoomActions

    }

    vehicleSettingsChanged(vehicleSettings: IVehicleSettings) {
        this.vehicle.updateVehicleSettings(vehicleSettings, this.config?.player.vehicleSetup)
        this.config.player.vehicleType = vehicleSettings.vehicleType
        this.config.player.vehicleSettings = vehicleSettings
    }

    vehicleSetupChanged(vehicleSetup: VehicleSetup) {
        this.vehicle.updateVehicleSetup(vehicleSetup)
        this.config.player.vehicleSetup = vehicleSetup
    }

    updateVehicle(delta: number) {
        if (this.vehicle.getIsReady()) {
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

    update(_time: number, _delta: number): void {
        this.time = _time
        this.renderer?.render(this.scene, this.camera)
        this.updateVehicle(_delta)

        this.updateFps(_time)

        driveVehicleWithKeyboard(this.vehicle)

        this.updateBot(_delta)
        this.checkIfVehicleIsOffCourse()
        this.updatePlayerRaceInfo(_delta)
    }


    async _destroyGame() {
        return new Promise<void>((resolve, reject) => {
            this.vehicle.destroy()


            resolve()
        })
    }
}

export const createSingleplayerGameScene = (SceneClass: typeof SingleplayerGameScene, gameSceneConfig: ISingleplayerGameSceneConfig): Promise<SingleplayerGameScene> => {
    return new Promise<SingleplayerGameScene>((resolve, reject) => {

        const config = { scenes: [SceneClass], antialias: true, autoStart: false }
        PhysicsLoader("/ammo", () => {

            const project = new Project(config)
            const key = project.scenes.keys().next().value;

            // hacky way to get the project's scene
            const gameObject = (project.scenes.get(key) as SingleplayerGameScene);
            gameObject.setGameSceneConfig(gameSceneConfig)
            resolve(gameObject)

            return project
        })
    })
}

