import { ExtendedObject3D, Scene3D } from "enable3d";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { Audio, AudioListener, AmbientLight, PerspectiveCamera, SpotLight, HemisphereLightHelper, BackSide, Color, Fog, HemisphereLight, Mesh, PointLight, ShaderMaterial, SphereGeometry } from "three";
import { getRaceSong, getTimeOfDay, getTimeOfDayColors, getTrackInfo } from "../classes/Game";
import { defaultGameSettings, defaultRoomSettings, IGameSettings, IRoomSettings } from '../classes/localGameSettings';
import { ICourse } from "../course/ICourse";
import { setLoaderProgress } from "../course/loadingManager";
import { Powerup, PowerupType } from "../course/PowerupBox";
import { defaultVehicleType, dts_ping_test, IPlayerInfo, IPreGamePlayerInfo, std_ping_test_callback, TimeOfDay } from "../shared-backend/shared-stuff";
import { getBeep, removeMusic, stopMusic } from "../sounds/gameSounds";
import { removeKeyboardControls } from "../utils/controls";
import { getStaticPath } from "../utils/settings";
import { BotVehicle } from "../vehicles/BotVehicle";
import { IVehicle } from "../vehicles/IVehicle";
import { LowPolyVehicle, loadLowPolyVehicleModels } from "../vehicles/LowPolyVehicle";
import { SphereVehicle, loadSphereModel } from "../vehicles/SphereVehicle";
import { IVehicleClassConfig } from "../vehicles/Vehicle";
import { getVehicleClassFromType } from "../vehicles/VehicleConfigs";
import "./game-styles.css";
import { IGameRoomActions, IGameSceneConfig } from "./IGameScene";
import { skydomeFragmentShader, skydomeVertexShader } from './shaders';

const fadeSecs = 2
const vechicleFov = 60



let wakeLock = null
export class MyScene extends Scene3D {

    socket?: Socket
    gameSettings: IGameSettings
    roomSettings: IRoomSettings
    timeOfDay: TimeOfDay
    useSound: boolean
    useShadows: boolean

    courseLoaded: boolean

    pLight: PointLight
    course: ICourse

    importantInfoTimeout: NodeJS.Timeout
    secondaryInfoTimeout: NodeJS.Timeout
    pingInfo: HTMLSpanElement
    fpsInfo: HTMLSpanElement

    pingTimeout: NodeJS.Timeout
    lastPing: number
    totalPing: number
    totalPingsGotten: number
    fpsTick: number
    totalFpsTicks: number
    totalNumberOfFpsTicks: number
    oldTime: number
    roomTicks: number
    gameTicks: number
    time: number

    // for some reason on mobile you could get much higher (100+) fps
    // but that never happened on desktop
    targetFPS = 30
    deltaFPS = 0
    updateDelta = 0

    isPaused: boolean
    isReady: boolean

    player: IPlayerInfo
    players: IPlayerInfo[]

    /**
  * all spans and divs become children of this element to easily delete
  * not calling it gameDiv since the game canvas doesnt go into this
  */
    gameInfoDiv: HTMLDivElement
    importantInfoDiv: HTMLDivElement
    secondaryInfoDiv: HTMLDivElement
    totalTimeDiv: HTMLDivElement

    gameSceneConfig: IGameSceneConfig
    needsReload: boolean

    gameRoomActions: IGameRoomActions

    bot: BotVehicle

    beepE4: Audio
    beepC4: Audio
    listener: AudioListener

    isLagging: boolean = false

    sky: Mesh

    constructor() {
        super()
        // wake lock

        wakeLock = navigator["wakeLock"]?.request('screen').then(w => {
            wakeLock = w
        }).catch(err => {
            console.warn("Error setting wakelock " + err.name + ": " + err.message)
        })

        this.gameSettings = defaultGameSettings
        this.roomSettings = defaultRoomSettings

        this.totalPing = 0
        this.lastPing = 0
        this.totalPingsGotten = 0
        this.time = 0
        this.fpsTick = 0
        this.totalFpsTicks = 0
        this.totalNumberOfFpsTicks = 0
        this.oldTime = 0

        this.roomTicks = 0
        this.gameTicks = 0

        this.timeOfDay = this.timeOfDay
        this.isPaused = true
        this.needsReload = false
        this.isReady = false

        this.gameRoomActions = {}


        this.gameInfoDiv = document.createElement("div")
        this.gameInfoDiv.setAttribute("id", "game-info")
        document.body.appendChild(this.gameInfoDiv)

        this.importantInfoDiv = document.createElement("div")
        this.importantInfoDiv.setAttribute("id", "important-info")
        this.gameInfoDiv.appendChild(this.importantInfoDiv)

        this.secondaryInfoDiv = document.createElement("div")
        this.secondaryInfoDiv.setAttribute("id", "secondary-info")
        this.gameInfoDiv.appendChild(this.secondaryInfoDiv)

        this.totalTimeDiv = document.createElement("div")
        this.gameInfoDiv.appendChild(this.totalTimeDiv)
        this.totalTimeDiv.setAttribute("id", "totalTime")

        this.pingInfo = document.createElement("span")
        this.pingInfo.setAttribute("class", "game-text")
        this.pingInfo.setAttribute("style", `
            position:absolute;
            top:25px;
            left:5px;
        `)

        this.fpsInfo = document.createElement("span")
        this.fpsInfo.setAttribute("class", "game-text")
        this.fpsInfo.setAttribute("style", `
            position:absolute;
            top:5px;
            left:5px;
        `)


        this.gameInfoDiv.appendChild(this.pingInfo)
        this.gameInfoDiv.appendChild(this.fpsInfo)


        setLoaderProgress(0)

        window.addEventListener("resize", () => this.handleResizeWindow())

        document.body.classList.add("hidden-overflow")
    }

    hitPowerup(vehicle: ExtendedObject3D, powerup: Powerup) { }

    removePowerupColor(vehicleNumber: number) {
        this.gameInfoDiv.classList.remove("bad-power")
        this.gameInfoDiv.classList.remove("good-power")
    }

    addPowerupColor(vehicleNumber: number, power: PowerupType) {
        if (power === "good") {
            this.gameInfoDiv.classList.add("good-power")
        } else {
            this.gameInfoDiv.classList.add("bad-power")
        }
    }


    async createVehicle(player: IPreGamePlayerInfo) {
        return new Promise<IVehicle>(async (resolve, reject) => {

            const vehicleType = player?.vehicleType ?? defaultVehicleType
            const vehicleConfig: IVehicleClassConfig = {
                id: player.id,
                scene: this,
                vehicleType,
                useSoundEffects: this.gameSettings.useSound,
                name: player.playerName,
                vehicleNumber: 0,
                vehicleSetup: player.vehicleSetup,
                vehicleSettings: player.vehicleSettings
            }
            let vehicle: IVehicle
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                vehicle = new LowPolyVehicle(vehicleConfig)
            } else {
                vehicle = new SphereVehicle(vehicleConfig)
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                const [tires, chassis] = await loadLowPolyVehicleModels(vehicleType, false)
                vehicle.addModels(tires, chassis)

            } else {
                const [tires, chassis] = await loadSphereModel(vehicleType, false)
                vehicle.addModels(tires, chassis)
            }
            const p = vehicle.getPosition()
            vehicle.setPosition(p.x, p.y + 5, p.z)

            resolve(vehicle)
        })
    }
    _handleResizeWindow() { }

    handleResizeWindow() {
        this._handleResizeWindow()
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        //  this.renderer.domElement.setAttribute("style", "width:100%;");

        (this.camera as PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix()
    }

    async init(data) {
        // need to do some test with performance and the draw distance
        this.camera = new PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.setPixelRatio()
        // this gravity seems to work better
        // -30 gives weird behaviour and -10 makes the vehicle fly sometimes
        this.physics.setGravity(0, -9.82, 0)
        // this.physics.setGravity(0, -2, 0)

        this.listener = new AudioListener()
        this.camera.add(this.listener)

        getBeep(getStaticPath("sound/beepC4.mp3"), this.listener, (beepC4) => {
            this.beepC4 = beepC4
        })

        getBeep(getStaticPath("sound/beepE4.mp3"), this.listener, (beepE4) => {
            this.beepE4 = beepE4
        })
    }


    async preload() { }
    async create() { }





    setPixelRatio() {
        const lowGraphics = this.gameSettings.graphics === "low"
        this.renderer.capabilities.precision = lowGraphics ? "lowp" : "highp"
        // let ratio = lowGraphics ? 4 : 1

        // if (window.devicePixelRatio < ratio && lowGraphics) {
        //     ratio = Math.floor(window.devicePixelRatio)
        // }
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    public async start(key?: string, data?: any) {

        await this.init?.(data)
        await this.preload()
        await this.create()
        this.isReady = true
        // this.physics.config.maxSubSteps = 4
        // this.physics.config.fixedTimeStep = this.getGraphicsType() === "high" ? 1 / 120 : 1 / 60
        //https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=2315
        // having maxSubStep less than 0. we get nicer behavior
        this.physics.config.maxSubSteps = 0.9//1// + 1// + 1

        this.physics.config.fixedTimeStep = (1 / this.targetFPS)

        this.isPaused = false
        setTimeout(() => {
            this.handleResizeWindow()
        }, 10)
        this.renderer.setAnimationLoop(() => {
            this._myupdate()
        })
    }

    lastTime: number

    private _myupdate() {
        const currDelta = this.clock.getDelta()
        this.deltaFPS += currDelta
        //    this.updateDelta += currDelta

        const time = this.clock.getElapsedTime()
        if (!this.lastTime) {
            this.lastTime = time
            return
        }
        const dt = (time - this.lastTime)
        // console.log("time", time, "dt", dt, "fixed time", this.physics.config.fixedTimeStep)
        if (this.deltaFPS > this.physics.config.fixedTimeStep && !this.isPaused && this.isReady) {
            let delta = dt * 1000


            // maybe a bad metric if lagging



            // must always satisfy the equation timeStep < maxSubSteps * fixedTimeStep
            // update physics, then update models, opposite to enabled3d


            this.lastTime = time

            this.deltaFPS = this.deltaFPS % this.physics.config.fixedTimeStep
            //console.log("fixed", this.physics.config.fixedTimeStep, "dt", dt)
            // this.physics.config.fixedTimeStep = dt + 0.01
            this.gameTicks += 1
            this.roomTicks += 1


            // if delta is bigger than 70 we get some weird shit
            if (delta > 70) return
            this.physics?.update(delta)
            this.physics?.updateDebugger()


            this.animationMixers.update(delta)

            this.preRender()

            this.update?.(+(time.toFixed(8)), delta)

            if (this.composer) {
                this.composer.render()
            }
            else {
                // am already rendering in updateVehicles
                //    this.renderer.render(this.scene, this.camera)
            }
            this.postRender()
        } else {

        }
    }



    playCountdownBeep() {
        if (this.useSound) {
            this.beepC4?.play()
            setTimeout(() => {
                this.beepC4?.stop()
            }, 250)
        }
    }

    playStartBeep() {
        if (this.useSound) {
            this.beepE4?.play()
        }
    }

    getTrackName() {
        return this.gameSceneConfig?.tournament?.trackName ?? this.roomSettings.trackName
    }

    getGraphicsType() {
        return this.gameSettings.graphics
    }

    getTimeOfDay() {
        return this.gameSettings.graphics === "low" ? "day" : getTimeOfDay(this.getTrackName())
    }

    getRaceSong() {
        return getRaceSong(this.roomSettings.trackName)
    }

    setNeedsReload(needsReload: boolean) {
        if (this.isReady) {
            this.needsReload = needsReload
        }
    }

    getDrawDistance() {
        return this.gameSettings.drawDistance
    }

    setGameRoomActions(gameRoomActions: IGameRoomActions) {
        this.gameRoomActions = gameRoomActions
    }

    // vehicleSettingsChangedCallback(playerNumber:number, vehicleSettings:U){

    // }

    async addLights() {

        this.timeOfDay = this.getTimeOfDay()

        const { ambientLightColor,
            hemisphereTopColor,
            hemisphereBottomColor,
            pointLightIntesity,
            ambientLightIntesity
        } = getTimeOfDayColors(this.timeOfDay)

        //  this.pLight = new PointLight(0xffffff, 1, 0, 1)
        // maybe if night then dont show shadows?
        this.pLight = new PointLight(0xffffff, pointLightIntesity, 0, 2)

        //this.pLight.position.set(100, 150, 100);
        this.pLight.position.set(100, 500, 100);
        this.pLight.shadow.camera.far = 2500


        if (this.useShadows && this.timeOfDay !== "night") {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }
        // this.pLight.shadow.mapSize.height = 2048
        // this.pLight.shadow.mapSize.width = 2048

        this.scene.add(this.pLight)


        const hLight = new HemisphereLight(hemisphereTopColor, 1)
        hLight.position.set(0, 1, 0);
        hLight.color.setHSL(0.6, 1, 0.4);

        this.scene.add(hLight)



        const aLight = new AmbientLight(ambientLightColor, ambientLightIntesity)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)

        const uniforms = {
            "topColor": { value: new Color(hemisphereTopColor) },
            "bottomColor": { value: new Color(hemisphereBottomColor) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };

        uniforms["topColor"].value.copy(hLight.color);
        this.scene.background = new Color().setHSL(0.6, 0, 1);
        this.scene.fog = new Fog(this.scene.background, 1, 5000);
        this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const trackInfo = getTrackInfo(this.getTrackName())

        const hemisphereRadius = trackInfo?.hemisphereRadius ?? 1000

        const skyGeo = new SphereGeometry(hemisphereRadius, 32, 15);
        const skyMat = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: skydomeVertexShader,
            fragmentShader: skydomeFragmentShader,
            side: BackSide
        });

        // move the sky?
        this.sky = new Mesh(skyGeo, skyMat);

        this.scene.add(this.sky);
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    // most likley to be overritten
    userSettingsListener() {

    }

    setGameSceneConfig(config: IGameSceneConfig) {
        this.gameSceneConfig = config
        this.player = config.player
        this.players = config.players
        this.setSocket(config.socket)
        this.setGameSettings(config.gameSettings)
        this.setRoomSettings(config.roomSettings)
        // this.setPlayers(config.players)
        // this.roomId = config.roomId
        this.setGameRoomActions(config.gameRoomActions)
    }

    setGameSettings(gameSettings: IGameSettings) {
        this.gameSettings = gameSettings
    }

    setRoomSettings(roomSettings: IRoomSettings) {
        this.roomSettings = roomSettings
    }

    updatePing() {
        if (this.gameSceneConfig?.onlyMobile) return
        const start = Date.now()

        this.socket?.off(std_ping_test_callback)

        this.socket?.emit(dts_ping_test, {
            roomTicks: this.roomTicks,
            gameTicks: this.gameTicks,
            totalPing: this.totalPing,
            totalPingsGotten: this.totalPingsGotten,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks
        })
        this.socket?.once(std_ping_test_callback, () => {
            clearTimeout(this.pingTimeout)
            this.lastPing = Date.now() - start
            this.pingInfo.textContent = `ping ${this.lastPing}ms`
            this.totalPing += this.lastPing
            this.totalPingsGotten += 1
        })
        this.pingTimeout = setTimeout(() => {
            //    toast.error("There seems to be some connection issue")
            this.pingInfo.textContent = `Connection issue`
        }, 2 * 1000) // 2 ses?
    }

    updateFps(time: number) {
        this.fpsTick += 1
        // counts how many ticks occure in one second
        // using the floor function we only increment if we reach the next integer
        if (Math.floor(time) > this.oldTime) {
            this.fpsInfo.textContent = `fps ${this.fpsTick}`
            this.totalFpsTicks += this.fpsTick
            this.totalNumberOfFpsTicks += 1
            this.fpsTick = 0
            this.oldTime = Math.floor(time)
        }

        // if (time > 30 && !this.hasAskedToLowerSettings) {
        //     this.hasAskedToLowerSettings = true
        //     window.localStorage.setItem("hasAskedToLowerSettings", "true")
        //     if (this.totalFpsTicks / this.totalNumberOfFpsTicks < 40) {
        //         if (this.gameSettings.graphics === "high" || this.gameSettings.useShadows) {
        //             //           toast.warn("Low fps detected, to increase fps and a more smooth game, go into settings (esc) and turn off shadows and put the graphics on low. Also close other tabs in your browser.", {})
        //         }
        //     }
        // }
    }

    showImportantInfo(text: string, clear?: boolean) {
        clearInterval(this.importantInfoTimeout)
        if (this.importantInfoDiv) {
            this.importantInfoDiv.textContent = text
        }
        if (clear) {
            this.importantInfoTimeout = setTimeout(() => {
                this.clearImportantInfo()
            }, fadeSecs * 1000)
        }
    }

    clearImportantInfo() {
        if (this.importantInfoDiv) {
            this.importantInfoDiv.textContent = ""
        }
    }

    showSecondaryInfo(text: string, clear?: boolean, secs?: number) {
        clearInterval(this.secondaryInfoTimeout)
        if (this.secondaryInfoDiv) {
            this.secondaryInfoDiv.textContent = text
        }
        if (clear) {
            this.secondaryInfoTimeout = setTimeout(() => {
                this.clearSecondaryInfo()
            }, (secs ?? fadeSecs) * 1000)
        }
    }

    clearSecondaryInfo() {
        if (this.secondaryInfoDiv) {
            this.secondaryInfoDiv.textContent = ""
        }
    }

    _clearTimeouts() { }

    clearTimeouts() {
        clearTimeout(this.importantInfoTimeout)
        this._clearTimeouts()
    }

    // to be overritten
    resetVehicleCallback(vehicleNumber: number) {

    }

    getVehicles(): IVehicle[] {
        return []
    }

    async _destroyGame() { }

    async destroyGame() {
        return new Promise<void>(async (resolve, reject) => {
            window.removeEventListener("resize", () => this.handleResizeWindow())
            document.body.classList.remove("hidden-overflow")
            if (wakeLock) {

                wakeLock.release()
                    .then(() => {
                        wakeLock = null;
                    });
            }
            removeMusic()

            document.body.removeChild(this.gameInfoDiv)
            document.body.removeChild(this.canvas)
            this.bot?.destroy()


            await this._destroyGame()
            // for some reason not wokring
            //  document.body.setAttribute("style", "")
            await this.stop()
            removeKeyboardControls()
            resolve()
        })
    }
}