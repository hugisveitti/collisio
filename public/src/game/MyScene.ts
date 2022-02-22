import { Scene3D } from "enable3d";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { AmbientLight, BackSide, Color, Fog, HemisphereLight, Mesh, PointLight, ShaderMaterial, SphereGeometry } from "three";
import { getTimeOfDay, getTimeOfDayColors, getTrackInfo } from "../classes/Game";
import { defaultGameSettings, IGameSettings } from '../classes/localGameSettings';
import { ICourse } from "../course/ICourse";
import { dts_ping_test, std_ping_test_callback, TimeOfDay } from "../shared-backend/shared-stuff";
import { stopMusic } from "../sounds/gameSounds";
import { IVehicle } from "../vehicles/IVehicle";
import "./game-styles.css";
import { IGameRoomActions, IGameSceneConfig } from "./IGameScene";
import { skydomeFragmentShader, skydomeVertexShader } from './shaders';

const fadeSecs = 2

let wakeLock = null
export class MyScene extends Scene3D {

    socket?: Socket
    gameSettings: IGameSettings
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
    targetFPS = 60
    deltaFPS = 0
    updateDelta = 0

    isPaused: boolean

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

    constructor() {
        super()
        // wake lock

        wakeLock = navigator["wakeLock"]?.request('screen').then(w => {
            wakeLock = w
            console.log('Wake Lock is active!');
        }).catch(err => {
            console.warn("Error setting wakelock " + err.name + ": " + err.message)
        })

        this.gameSettings = defaultGameSettings

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
        this.isPaused = false
        this.needsReload = false

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

        document.body.setAttribute("style", "overflow:hidden;")
    }




    public async start(key?: string, data?: any) {

        await this.init?.(data)
        await this.preload()
        await this.create()
        // this.physics.config.maxSubSteps = 4
        // this.physics.config.fixedTimeStep = this.getGraphicsType() === "high" ? 1 / 120 : 1 / 60
        //https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=2315
        this.physics.config.maxSubSteps = 1 + 1

        this.physics.config.fixedTimeStep = 1 / this.targetFPS
        console.log("Fixed time step", this.physics.config.fixedTimeStep)

        this.renderer.setAnimationLoop(() => {
            this._myupdate()
        })
    }

    private _myupdate() {
        const currDelta = this.clock.getDelta()
        this.deltaFPS += currDelta
        this.updateDelta += currDelta
        if (this.deltaFPS > this.physics.config.fixedTimeStep && !this.isPaused) {
            const time = this.clock.getElapsedTime()
            let delta = (this.updateDelta * 1000)

            this.updateDelta = 0
            this.deltaFPS = this.deltaFPS % this.physics.config.fixedTimeStep


            // must always satisfy the equation timeStep < maxSubSteps * fixedTimeStep
            // update physics, then update models, opposite to enabled3d

            this.gameTicks += 1
            this.roomTicks += 1
            this.physics?.update(delta)
            this.physics?.updateDebugger()

            this.update?.(+(time.toFixed(8)), delta)

            this.animationMixers.update(delta)

            this.preRender()

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


    getTrackName() {
        return this.gameSceneConfig?.tournament?.trackName ?? this.gameSettings.trackName
    }

    getGraphicsType() {
        return this.gameSettings.graphics
    }

    getTimeOfDay() {
        return this.gameSettings.graphics === "low" ? "day" : getTimeOfDay(this.getTrackName())
    }

    setNeedsReload(needsReload: boolean) {
        this.needsReload = needsReload
    }

    getDrawDistance() {
        return this.gameSettings.drawDistance
    }

    setGameRoomActions(gameRoomActions: IGameRoomActions) {
        this.gameRoomActions = gameRoomActions
    }

    async addLights() {

        this.timeOfDay = this.getTimeOfDay()

        const { ambientLightColor,
            hemisphereTopColor,
            hemisphereBottomColor,
            pointLightIntesity,
            ambientLightIntesity
        } = getTimeOfDayColors(this.timeOfDay)

        // this.pLight = new PointLight(0xffffff, 1, 0, 1)
        // maybe if evening then dont show shadows?
        this.pLight = new PointLight(0xffffff, pointLightIntesity, 0, 1)
        this.pLight.position.set(100, 150, 100);
        if (this.useShadows && this.timeOfDay === "day") {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }

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
        const sky = new Mesh(skyGeo, skyMat);

        this.scene.add(sky);
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    // most likley to be overritten
    userSettingsListener() {

    }

    setGameSceneConfig(config: any) {
        this.gameSceneConfig = config
        this.setSocket(config.socket)
        this.setGameSettings(config.gameSettings)
        // this.setPlayers(config.players)
        // this.roomId = config.roomId
        // this.setGameRoomActions(config.gameRoomActions)
    }

    setGameSettings(gameSettings: IGameSettings) {
        this.gameSettings = gameSettings
    }

    updatePing() {

        const start = Date.now()

        this.socket?.off(std_ping_test_callback)

        this.socket?.emit(dts_ping_test)
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

    showSecondaryInfo(text: string, clear?: boolean) {
        clearInterval(this.secondaryInfoTimeout)
        if (this.secondaryInfoDiv) {
            this.secondaryInfoDiv.textContent = text
        }
        if (clear) {
            this.secondaryInfoTimeout = setTimeout(() => {
                this.clearSecondaryInfo()
            }, fadeSecs * 1000)
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
            if (wakeLock) {

                wakeLock.release()
                    .then(() => {
                        wakeLock = null;
                    });
            }
            stopMusic()

            document.body.removeChild(this.gameInfoDiv)
            document.body.removeChild(this.canvas)


            await this.stop()
            document.body.setAttribute("style", "overflow:auto;")
            await this._destroyGame()
            resolve()
        })
    }


}