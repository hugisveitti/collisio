import { PhysicsLoader, Project } from "enable3d";
import { Audio, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { v4 as uuid } from "uuid";
import { getLocalStorageItem, saveLocalStorageItem } from "../classes/localStorage";
import { IVehicleSettings } from "../classes/User";
import { EndlessRunnerCourse } from "../course/EndlessRunnerCourse";
import { hideLoadDiv } from "../course/loadingManager";
import { saveEndlessRun } from "../firebase/firestoreGameFunctions";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { addMusic, getBeep } from "../sounds/gameSounds";
import { addKeyboardControls, addMobileController, driveVehicleWithKeyboard, driveVehicleWithMobile } from "../utils/controls";
import { getDeviceType } from "../utils/settings";
import { IVehicle } from "../vehicles/IVehicle";
import { vehicleConfigs } from "../vehicles/VehicleConfigs";
import { IGameSceneConfig } from "./IGameScene";
import { MyScene } from "./MyScene";

const onMobile = getDeviceType() === "mobile"

export class EndlessRunnerScene extends MyScene {

    vehicle: IVehicle
    gameId: string
    kmhInfo: HTMLSpanElement
    pointsInfo: HTMLSpanElement
    points: number = 0
    minSpeed: number = 100
    course: EndlessRunnerCourse
    isPlaying: boolean = false
    loseSound: Audio


    constructor() {
        super()
        this.course = new EndlessRunnerCourse(this)
        if (!onMobile) {
            addKeyboardControls()
        } else {
            addMobileController()
        }
        this.gameId = uuid()
        this.gameInfoDiv.classList.add("single-player-game-info")

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

        this.pointsInfo = document.createElement("span")
        this.gameInfoDiv.appendChild(this.pointsInfo)
        this.pointsInfo.classList.add("game-text")
        const fontSize = window.innerWidth < 1500 ? 32 : 82
        this.pointsInfo.setAttribute("style", `
        position:absolute;
            right:10px;
            bottom:30px;
            font-size:${fontSize}px;
    `)

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
        if (onMobile) {
            window.addEventListener("touchstart", (e) => this.restartTouchHandle(e))
        }
    }

    loadSounds() {
        getBeep("/sound/lose.ogg", this.listener, (sound) => {
            sound.setVolume(0.1)
            this.loseSound = sound
        })
    }

    _handleResizeWindow() {
        const fontSize = window.innerWidth < 1500 ? 32 : 82

        this.pointsInfo.setAttribute("style", `
        position:absolute;
        right:10px;
        bottom:30px;
        font-size:${fontSize}px;
    `)
        this.kmhInfo.setAttribute("style", `
        position:absolute;
        bottom: 30px;
        left:${window.innerWidth / 2}px;
        transform: translate(-50%, 0);
        font-size:24px;
    `)
    }

    async preload() {
        await this.course.createCourse()
        this.courseLoaded = true
        this.addLights()
        // this.physics.debug.enable()
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.camera.position.set(0, 50, 50)
        this.camera.rotation.set(-Math.PI / 10, Math.PI, -Math.PI / 10)
        this.vehicle = await this.createVehicle(this.player)
        this.vehicle.addCamera(this.camera)
        this.vehicle.start()

        hideLoadDiv()
        this.setupVehicleCollisionDetection()

        this.course.setStartPositions([this.vehicle])
        this.vehicle.setCanDrive(true)

        const position = new Vector3(0, 0, 0)
        const rotation = new Quaternion(0, 0, 0, Math.PI / 2)

        this.vehicle.setCheckpointPositionRotation({ position, rotation })
        this.vehicle.resetPosition()

        if (onMobile) {
            this.vehicle.updateVehicleSettings({
                ...this.player.vehicleSettings,
                cameraZoom: 14,

            }, this.player.vehicleSetup)
        }

        this.loadSounds()
        addMusic(this.gameSettings?.musicVolume || 0, this.camera as PerspectiveCamera, this.getRaceSong(), false)

        this.restartGame()

        this.vehicle.setOnlyForward(true)
        this.vehicle.setMaxSpeedMult(1)
    }

    setupVehicleCollisionDetection() {
        this.vehicle.vehicleBody.body.on.collision((other, ev) => {
            if (other.name.split("_")[0] === "ball") {
                this.course.deleteBallByName(other.name, true)
                this.vehicleHitBouncingObsticle("")
            }
        })
    }

    restartTouchHandle(e: TouchEvent) {
        e.preventDefault()

        if (!this.isPlaying) {
            this.restartGame()
        }
        window.removeEventListener("touchstart", (e) => this.restartTouchHandle(e))
    }

    gameOver() {
        // play game over song
        let saveKey = "best-endless-run"
        const bestScore = getLocalStorageItem<number>(saveKey)

        let info = onMobile ? "Press anywhere to restart." : "Press 'r' to restart."
        if (!bestScore || this.points > bestScore) {
            info += " You set a PB!!"
            saveLocalStorageItem(saveKey, this.points + "")
        }
        if (bestScore) {
            info += ` Previous best ${bestScore}.`
        }

        if (!this.player.isAuthenticated) {
            info += " You need to login to save to the leaderboard."
        }

        this.showImportantInfo(`Game over, you got ${this.points} points. ${info}`)
        this.isPlaying = false
        this.loseSound?.play()

        this.prepareEndOfRunData()
    }

    prepareEndOfRunData() {
        saveEndlessRun({
            playerId: this.player.id,
            playerName: this.player.playerName,
            points: this.points,
            gameTicks: this.gameTicks,
            gameId: this.gameId,
            onMobile: onMobile,
            isAuthenticated: this.player.isAuthenticated,
            vehicleType: this.vehicle.vehicleType,
        })
    }

    async create() {
        this.isReady = true
    }

    restartGame() {
        this.clearImportantInfo()
        this.showSecondaryInfo("Collect Tiles, Avoid Balls.", true)
        this.course.restart()
        this.gameTicks = 0
        this.gameId = uuid()
        this.minSpeed = 100

        this.points = 0
        this.updatePointHTML()
        this.vehicle.resetPosition()
        this.isPlaying = true
    }

    vehicleSetupChanged(vehicleSetup: VehicleSetup) {
        this.vehicle.updateVehicleSetup(vehicleSetup)
    }

    vehicleSettingsChanged(vehicleSettings: IVehicleSettings) {
        this.vehicle.updateVehicleSettings(vehicleSettings, this.vehicle.vehicleSetup)
    }

    getVehicles() {
        return [this.vehicle]
    }

    updatePointHTML() {
        this.pointsInfo.innerText = this.points + ""

    }

    vehicleHitCollectible(vehicleName: string) {
        this.points += 2
        this.updatePointHTML()
    }

    newTilePoints() {
        this.points += 1
        this.updatePointHTML()
    }


    vehicleHitBouncingObsticle(vehicleName: string) {
        this.points -= 5
        this.updatePointHTML()

        this.addPowerupColor(0, "bad")
        setTimeout(() => {
            this.removePowerupColor(0)
        }, 250)
    }

    endlessRun(delta: number) {
        if (!this.isPlaying) return


        if (this.vehicle && this.vehicle.getCurrentSpeedKmHour() < this.minSpeed) {
            this.vehicle.goForward()
        }
        this.minSpeed += .1 * (delta / (1000 / this.targetFPS))

        this.minSpeed = Math.min(this.minSpeed, 400)
    }

    checkOutOfBounds() {
        if (this.vehicle.getPosition().y < -5 && this.isPlaying) {
            this.gameOver()
        }
    }

    updateVehicle(delta: number) {
        this.vehicle.update(delta)
        if (this.isPlaying) {
            this.vehicle.cameraLookAt(this.camera, delta)
        } else {
            this.camera.lookAt(this.vehicle.vehicleBody.position.clone())
        }

        if (!this.isPlaying) return
        let kmh = this.vehicle.getCurrentSpeedKmHour(delta)
        if (kmh > -1) {
            kmh = Math.abs(kmh)
        }
        this.kmhInfo.textContent = `${kmh.toFixed(0)} km/h`
    }

    update(time: number, delta: number) {
        this.updateVehicle(delta)
        this.updateFps(time)

        if (!onMobile) {
            driveVehicleWithKeyboard(this.vehicle)
        } else {
            driveVehicleWithMobile(this.vehicle)
        }

        this.course.updateCourse()
        this.renderer.render(this.scene, this.camera)
        this.endlessRun(delta)
        const p = this.vehicle.getPosition()
        this.sky.position.set(p.x, p.y, p.z)
        this.pLight.position.setX(p.x)
        this.pLight.position.setZ(p.z)
        this.checkOutOfBounds()
    }
}

export const createEndlessRunnerScene = (SceneClass: typeof EndlessRunnerScene, gameSceneConfig: IGameSceneConfig): Promise<EndlessRunnerScene> => {
    return new Promise<EndlessRunnerScene>((resolve, reject) => {

        const config = { scenes: [SceneClass], antialias: true, autoStart: false }
        PhysicsLoader("/ammo", () => {

            const project = new Project(config)
            const key = project.scenes.keys().next().value;

            // hacky way to get the project's scene
            const gameObject = (project.scenes.get(key) as EndlessRunnerScene);
            gameObject.setGameSceneConfig(gameSceneConfig)
            resolve(gameObject)

            return project
        })
    })
}

