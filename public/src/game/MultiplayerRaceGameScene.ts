import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Socket } from "socket.io-client";
import { PerspectiveCamera } from "three";
import { IGameSettings } from "../classes/localGameSettings";
import { IUserSettings } from "../classes/User";
import { RaceCourse } from "../course/RaceCourse";
import { m_fs_game_countdown, m_fs_game_starting, m_fs_room_info, m_fs_vehicles_position_info, m_ts_game_socket_ready, m_ts_player_ready, m_ts_pos_rot, IVehiclePositionInfo } from "../shared-backend/multiplayer-shared-stuff";
import { IPlayerInfo, VehicleControls } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { addKeyboardControls, driveVehicleWithKeyboard } from "../utils/controls";
import { GhostVehicle, GhostVehicleConfig, IGhostVehicle } from "../vehicles/GhostVehicle";
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle";
import { loadSphereModel, SphereVehicle } from "../vehicles/SphereVehicle";
import { IVehicleClassConfig } from "../vehicles/Vehicle";
import { getVehicleClassFromType } from "../vehicles/VehicleConfigs";
import { GameTime } from "./GameTimeClass";
import { MyScene } from "./MyScene";

export interface IMultiplayergameSceneConfig {
    socket: Socket
    gameSettings: IGameSettings
    userSettings: IUserSettings
    vehicleSetup: VehicleSetup
    player: IPlayerInfo
    players: IPlayerInfo[]
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

    constructor() {
        super()
        this.isReady = false
        this.vehiclesPositionInfo = {}
        this.vehicleControls = new VehicleControls()
        addKeyboardControls(this.vehicleControls)
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
    }

    windowResize() {

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
            const vehicleType = this.config.userSettings.vehicleSettings.vehicleType
            const vehicleConfig: IVehicleClassConfig = {
                id: this.config.player.id,
                scene: this,
                vehicleType,
                useSoundEffects: this.gameSettings.useSound,
                name: this.config.player.playerName,
                vehicleNumber: 0,
                vehicleSetup: this.config.vehicleSetup
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

    handleGoalCrossed(vehicle: ExtendedObject3D) {

    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D, checkpointNumber: number) {

    }

    setSocket(socket: Socket) {
        console.log("setting soket")
        this.socket = socket
        this.socket.emit(m_ts_game_socket_ready, {})
        this.setupPlayersInfoListener()
        this.setupCountdownListener()
        this.setupStartGameListener()
        this.setupVehiclesPositionInfo()
    }

    sendPlayerReady() {
        console.log("sending ready")
        this.isReady = true
        this.socket.emit(m_ts_player_ready, {})
    }

    setupCountdownListener() {
        this.socket.on(m_fs_game_countdown, ({ countdown }) => {
            console.log("count down", countdown)
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
            // start count down?
            // or do the count down on the backend
            this.showImportantInfo(`Race starting in ${countdown} seconds`, true)
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
        this.socket.on(m_fs_room_info, ({ players, gameSettings }) => {
            // setup players
            console.log("got players info but not doing anything", players, gameSettings)
        })
    }


    setGameSceneConfig(gameSceneConfig: IMultiplayergameSceneConfig) {
        this.config = gameSceneConfig
        this.setSocket(this.config.socket)
        this.setGameSettings(this.config.gameSettings)
    }

    restartGame() {
        // restart game with sockets
    }

    updateScoreTable(delta: number) {
        this.totalTimeDiv.textContent = this.gameTime.getTotalTime().toFixed(2)
        this.kmhInfo.textContent = `${this.vehicle.getCurrentSpeedKmHour(delta).toFixed(0)} km/h`
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

        driveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
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

