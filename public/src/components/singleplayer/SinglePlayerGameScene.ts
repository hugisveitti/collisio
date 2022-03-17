import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { PerspectiveCamera } from "three";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo } from "../../classes/Game";
import { IGameSettings, IRoomSettings } from "../../classes/localGameSettings";
import { IVehicleSettings } from "../../classes/User";
import { hideLoadDiv } from "../../course/loadingManager";
import { Powerup } from "../../course/PowerupBox";
import { RaceCourse } from "../../course/RaceCourse";
import { GameTime } from "../../game/GameTimeClass";
import { IGameRoomActions } from "../../game/IGameScene";
import { MyScene } from "../../game/MyScene";
import { IPlayerInfo, IPreGamePlayerInfo, VehicleColorType, VehicleControls } from "../../shared-backend/shared-stuff";
import { VehicleSetup } from "../../shared-backend/vehicleItems";
import { addMusic, removeMusic, setMusicVolume, startMusic } from "../../sounds/gameSounds";
import { addKeyboardControls, addMobileController, driveVehicleWithKeyboard, driveVehicleWithMobile } from "../../utils/controls";
import { getDeviceType } from "../../utils/settings";
import { getDateNow } from "../../utils/utilFunctions";
import { BotVehicle } from "../../vehicles/BotVehicle";
import { IVehicle } from "../../vehicles/IVehicle";
import { getVehicleNumber, loadLowPolyVehicleModels } from "../../vehicles/LowPolyVehicle";
import { IVehicleClassConfig } from "../../vehicles/Vehicle";

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

const onMobile = getDeviceType() === "mobile"

export class SingleplayerGameScene extends MyScene implements ISingleplayerGameScene {
    // config?: ISingleplayerGameSceneConfig
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
    gameId: string

    constructor() {
        super()
        this.gameId = uuid()
        this.raceCountdownTime = 5

        if (!onMobile) {
            addKeyboardControls()
        } else {
            addMobileController()
        }
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
        this.course = new RaceCourse(this, this.roomSettings.trackName, (v) => this.handleGoalCrossed(v), (v, num) => this.handleCheckpointCrossed(v, num))
        await this.course.createCourse()
        this.courseLoaded = true
        this.addLights()
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.camera.position.set(0, 50, 50)
        this.camera.rotation.set(-Math.PI / 10, Math.PI, -Math.PI / 10)

        this.vehicle = await this.createVehicle(this.player)
        this.vehicle.addCamera(this.camera)

        await this.createBot()
        this.bot.update(16)
        this.renderer.render(this.scene, this.camera)
        hideLoadDiv()

        addMusic(this.gameSettings?.musicVolume || 0, this.camera as PerspectiveCamera, this.getRaceSong(), false)
        this.gameTime = new GameTime(this.roomSettings.numberOfLaps, this.course.getNumberOfCheckpoints())

        const { position, rotation } = this.course.getGoalCheckpoint()

        this.vehicle.setCheckpointPositionRotation({ position, rotation })
        this.vehicle.resetPosition()

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

    hitPowerup(vehicle: ExtendedObject3D, powerup: Powerup) {
        const idx = getVehicleNumber(vehicle.name)

        if (idx === 0) {
            if (powerup.toOthers) {
                this.showSecondaryInfo(`${powerup.name} to others`, true, powerup.time)
                this.bot.setPowerup(powerup)
            } else {

                this.vehicle.setPowerup(powerup)
                // change background color of view?
                this.showSecondaryInfo(`${powerup.name}`, true, powerup.time)
            }
        }
    }



    async startRaceCountdown() {

        this.course.setToSpawnPostion(0, this.vehicle)
        this.vehicle.resetPosition()
        this.vehicle.setCanDrive(false)
        this.vehicle.stop()
        this.vehicle.start()


        this.vehicle.toggleSound(this.gameSettings.useSound)
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
                this.prepareEndOfGameData()
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
        this.course.restartCourse()
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
            this.currentNumberOfLaps = this.roomSettings.numberOfLaps
            this.gameTime.restart(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints())
            this.vehicle.resetPosition()
            this.bot.restartBot()
            this.startRaceCountdown()
        }
    }

    setRoomSettings(roomSettings: IRoomSettings) {
        if (roomSettings.trackName !== this.roomSettings.trackName || this.roomSettings.usePowerups !== roomSettings.usePowerups) {
            this.setNeedsReload(true)
        }
        this.roomSettings = roomSettings
    }

    toggleUseSound() {
        this.vehicle?.toggleSound(this.useSound)
    }

    setGameSettings(gameSettings: IGameSettings): void {
        if (this.courseLoaded && (gameSettings.graphics !== this.gameSettings.graphics || gameSettings.botDifficulty !== this.gameSettings.botDifficulty)) {
            this.setNeedsReload(true)
        }
        // having both config.gamesettings and this.gamesettings is stupid
        this.gameSettings = gameSettings



        for (let key of Object.keys(gameSettings)) {
            if (gameSettings[key] !== undefined) {
                this[key] = gameSettings[key]
            }
        }

        this.timeOfDay = this.getTimeOfDay()
        if (this.pLight && this.course) {
            this.pLight.castShadow = this.useShadows && this.timeOfDay !== "night"
            this.pLight.shadow.bias = 0.1
            this.course.toggleShadows(this.useShadows)
        }

        setMusicVolume(this.gameSettings.musicVolume)
        //    if (this.isReady) {
        this.toggleUseSound()
        this.startGameSong()
        //  }

        this.camera.far = this.getDrawDistance()

        if (this.targetFPS) {
            this.physics.config.fixedTimeStep = 1 / this.targetFPS
        }
    }

    setGameSceneConfig(gameSceneConfig: ISingleplayerGameSceneConfig) {
        //  this.config = gameSceneConfig


        this.player = gameSceneConfig.player

        this.setGameSettings(gameSceneConfig.gameSettings)
        this.setRoomSettings(gameSceneConfig.roomSettings)
        this.currentNumberOfLaps = gameSceneConfig.roomSettings.numberOfLaps
        this.gameRoomActions = gameSceneConfig.gameRoomActions

    }

    vehicleSettingsChanged(vehicleSettings: IVehicleSettings) {
        this.vehicle.updateVehicleSettings(vehicleSettings, this.player.vehicleSetup)
        this.player.vehicleType = vehicleSettings.vehicleType
        this.player.vehicleSettings = vehicleSettings
    }

    vehicleSetupChanged(vehicleSetup: VehicleSetup) {
        this.vehicle.updateVehicleSetup(vehicleSetup)
        this.player.vehicleSetup = vehicleSetup
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
        this.updateVehicle(_delta)

        this.updateFps(_time)

        if (!onMobile) {
            driveVehicleWithKeyboard(this.vehicle)
        } else {
            driveVehicleWithMobile(this.vehicle)
        }


        this.updateBot(_delta)
        this.checkIfVehicleIsOffCourse()
        this.updatePlayerRaceInfo(_delta)
        this.renderer?.render(this.scene, this.camera)
    }

    prepareEndOfRacePlayer() {
        const playerData: IEndOfRaceInfoPlayer = {
            totalTime: this.gameTime.getTotalTime(),
            numberOfLaps: this.currentNumberOfLaps,
            playerName: this.player.playerName,
            playerId: this.player.id,
            bestLapTime: this.gameTime.getBestLapTime(),
            trackName: this.getTrackName(),
            lapTimes: this.gameTime.getLapTimes(),
            gameId: this.gameId,
            date: getDateNow(),
            private: false,
            isAuthenticated: this.player.isAuthenticated,
            vehicleType: this.vehicle.vehicleType,
            engineForce: this.vehicle.engineForce,
            breakingForce: this.vehicle.breakingForce,
            steeringSensitivity: this.vehicle.steeringSensitivity,
            roomTicks: this.roomTicks,
            gameTicks: this.gameTicks,
            totalPing: this.totalPing,
            totalPingsGotten: this.totalPingsGotten,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks,
            vehicleSetup: this.vehicle.vehicleSetup,
            singleplayer: true,
            userAgent: window.navigator.userAgent,
        }
        if (this.gameRoomActions.playerFinished) {
            this.gameRoomActions.playerFinished(playerData)
        }
    }

    prepareEndOfGameData() {
        this.prepareEndOfRacePlayer()
        const playerGameInfos: IPlayerGameInfo[] = []

        playerGameInfos.push({
            id: this.player.id,
            name: this.player.playerName,
            totalTime: +this.gameTime.getTotalTime().toFixed(2),
            lapTimes: this.gameTime.getLapTimes(),
            vehicleType: this.player.vehicleType,
            engineForce: this.vehicle.engineForce,
            breakingForce: this.vehicle.breakingForce,
            steeringSensitivity: this.vehicle.steeringSensitivity,
            isAuthenticated: this.player.isAuthenticated
        })


        const endOfRaceInfo: IEndOfRaceInfoGame = {
            playersInfo: playerGameInfos,
            gameSettings: this.gameSettings,
            roomSettings: this.roomSettings,
            gameId: this.gameId,
            roomId: "singleplayer",
            date: getDateNow(),
            roomTicks: this.roomTicks,
            gameTicks: this.gameTicks,
            avgPing: this.totalPingsGotten === 0 ? -1 : this.totalPing / this.totalPingsGotten,
            time: this.time,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks,
            singleplayer: true
        }
        if (this.gameRoomActions.gameFinished) {
            this.gameRoomActions.gameFinished({ endOfRaceInfo })
        }
        // wa
        // if save then update gameId
        this.gameId = uuid()
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

