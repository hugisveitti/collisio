import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { AmbientLight, Audio, AudioListener, BackSide, Color, Fog, Font, HemisphereLight, Mesh, PerspectiveCamera, PointLight, ShaderMaterial, SphereGeometry } from "three";
import { v4 as uuid } from "uuid";
import { getTimeOfDay, getTimeOfDayColors, getTrackInfo, IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IScoreInfo, TimeOfDay } from "../classes/Game";
import { defaultGameSettings, IGameSettings } from '../classes/localGameSettings';
import { IUserSettings, IVehicleSettings } from "../classes/User";
import { ICourse } from "../course/ICourse";
import { dts_game_settings_changed_callback, dts_ping_test, dts_vehicles_ready, IPlayerInfo, std_controls, std_ping_test_callback, std_user_settings_changed, TrackName, VehicleControls } from "../shared-backend/shared-stuff";
import { getBeep } from "../sounds/gameSounds";
import { addControls, driveVehicle } from "../utils/controls";
import { getStaticPath } from '../utils/settings';
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle";
import { loadSphereModel, SphereVehicle } from "../vehicles/SphereVehicle";
import { getVehicleClassFromType, possibleVehicleColors } from '../vehicles/VehicleConfigs';
import { Wagon } from "../vehicles/Wagon";
import "./game-styles.css";
import { IGameScene, IGameSceneConfig } from "./IGameScene";
import { skydomeFragmentShader, skydomeVertexShader } from './shaders';



// placement of views on the screen,
// left = viewLefts[playerIndex % 2]
export const viewLefts = [0, 0.5]
export const viewBottoms = [0, 0, 0.5, 0.5]

const vechicleFov = 60


export interface IEndOfGameData {
    endOfRaceInfo?: IEndOfRaceInfoGame
}



interface IUserSettingsMessage {
    playerNumber: number
    userSettings: IUserSettings
}

interface IView {
    left: number,
    bottom: number,
    width: number,
    height: number
    up: number[],
    fov: number,
    camera: PerspectiveCamera
}


export interface IGameRoomActions {
    escPressed?: () => void
    /** have the possibity to expand this interface to include other game types */
    gameFinished?: (data: IEndOfGameData) => void
    updateScoreTable?: (data: IScoreInfo) => void
    playerFinished?: (data: IEndOfRaceInfoPlayer) => void
    closeModals?: () => void
}


export class GameScene extends Scene3D implements IGameScene {

    players: IPlayerInfo[]
    vehicles: IVehicle[]
    font: Font
    gameSettings: IGameSettings
    timeOfDay: TimeOfDay
    useSound: boolean
    useShadows: boolean
    pLight: PointLight
    course: ICourse
    roomId: string
    gameId: string
    courseLoaded: boolean
    views: IView[]
    songIsPlaying: boolean
    socket: Socket
    vehicleControls: VehicleControls
    importantInfoDiv: HTMLDivElement

    gameStarted: boolean


    private _everythingReady: boolean

    gameRoomActions: IGameRoomActions

    viewsKmhInfo: HTMLSpanElement[]
    viewsImpornantInfo: HTMLSpanElement[]
    viewsImpornantInfoClearTimeout: NodeJS.Timeout[]
    pingInfo: HTMLSpanElement
    fpsInfo: HTMLSpanElement
    playerInfosContainer: HTMLDivElement

    /**
     * when some settings change then the needsUpdate is set to true
     * e.g. when trackName is changed
     * Then we reload the map 
     */
    needsReload: boolean

    /**
     * all spans and divs become children of this element to easily delete
     * not calling it gameDiv since the game canvas doesnt go into this
     */
    gameInfoDiv: HTMLDivElement

    beepE4: Audio
    beepC4: Audio


    totalPing: number
    totalPingsGotten: number
    time: number


    fpsTick: number
    totalFpsTicks: number
    totalNumberOfFpsTicks: number
    oldTime: number

    roomTicks: number
    gameTicks: number

    hasAskedToLowerSettings: boolean

    gameSceneConfig: IGameSceneConfig

    constructor() {
        super()
        this.needsReload = false
        this.timeOfDay = this.timeOfDay
        this.players = []
        this.vehicles = []
        this.views = []
        this.useShadows = false
        this.useSound = false
        this.courseLoaded = false
        this.songIsPlaying = false
        this._everythingReady = false
        this.gameStarted = false
        this.gameId = uuid()
        this.gameSettings = defaultGameSettings
        this.gameInfoDiv = document.createElement("div")
        this.gameInfoDiv.setAttribute("id", "game-info")

        document.body.appendChild(this.gameInfoDiv)
        this.importantInfoDiv = document.createElement("div")

        this.importantInfoDiv.setAttribute("id", "important-info")
        this.gameInfoDiv.appendChild(this.importantInfoDiv)
        this.gameRoomActions = {}

        this.viewsKmhInfo = []
        this.viewsImpornantInfo = []
        this.viewsImpornantInfoClearTimeout = [] as NodeJS.Timeout[]


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

        this.playerInfosContainer = document.createElement("div")
        this.playerInfosContainer.setAttribute("style", "position:relative;")

        this.totalPing = 0
        this.totalPingsGotten = 0
        this.time = 0
        this.fpsTick = 0
        this.totalFpsTicks = 0
        this.totalNumberOfFpsTicks = 0
        this.oldTime = 0

        this.roomTicks = 0
        this.gameTicks = 0
        this.hasAskedToLowerSettings = eval(window.localStorage.getItem("hasAskedToLowerSettings")) ?? false
    }

    async addLights() {

        this.timeOfDay = getTimeOfDay(this.gameSettings.trackName)

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

        //  const hLight = new HemisphereLight(0x000000, 1)
        //const hLight = new HemisphereLight(0xffffff, 1)
        const hLight = new HemisphereLight(hemisphereTopColor, 1)
        hLight.position.set(0, 1, 0);
        hLight.color.setHSL(0.6, 1, 0.4);
        this.scene.add(hLight)

        // const aLight = new AmbientLight(0xffffff, 1)
        const aLight = new AmbientLight(ambientLightColor, ambientLightIntesity)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)



        const uniforms = {
            "topColor": { value: new Color(hemisphereTopColor) },

            // "bottomColor": { value: new Color(0xffffff) },
            "bottomColor": { value: new Color(hemisphereBottomColor) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(hLight.color);
        this.scene.background = new Color().setHSL(0.6, 0, 1);
        this.scene.fog = new Fog(this.scene.background, 1, 5000);
        this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const trackInfo = getTrackInfo(this.gameSettings.trackName)

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

    async preload() {
        const warp = await this.warpSpeed("-ground", "-light", "-sky")
        this.addLights()

        const listener = new AudioListener()
        this.camera.add(listener)
        getBeep(getStaticPath("sound/beepC4.mp3"), listener, (beepC4) => {
            this.beepC4 = beepC4
        })

        getBeep(getStaticPath("sound/beepE4.mp3"), listener, (beepE4) => {
            this.beepE4 = beepE4
        })

        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.restartGame()
            } else if (e.key === "p") {
                this.togglePauseGame()
            } else if (e.key === "t") {
                this.resetPlayer(0)
            }
        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.togglePauseGame()
                if (this.gameRoomActions.escPressed) {
                    this.gameRoomActions.escPressed()
                }
            }
        })

        window.addEventListener("resize", () => this.onWindowResize())
        await this.loadAssets()
    }

    async loadAssets() { }

    async init() {
        // need to do some test with performance and the draw distance
        this.camera = new PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, this.gameSettings.drawDistance)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        // this gravity seems to work better
        // -30 gives weird behaviour and -10 makes the vehicle fly sometimes
        this.physics.setGravity(0, -20, 0)
    }

    async createVehicles(): Promise<void> {
        const promise = new Promise<void>((topresolve, reject) => {
            this.vehicles = []
            // get random color of chassis
            let chassisColOffset = Math.floor(Math.random() * 4)

            const batches = []
            for (let i = 0; i < this.players.length; i++) {
                const color = possibleVehicleColors[chassisColOffset + i]
                let newVehicle: IVehicle
                if (getVehicleClassFromType(this.players[i].vehicleType) === "LowPoly") {
                    newVehicle = new LowPolyVehicle(this, color, this.players[i].playerName, i, this.players[i].vehicleType, this.useSound)
                } else {
                    newVehicle = new SphereVehicle(this, color, this.players[i].playerName, i, this.players[i].vehicleType, this.useSound)
                }
                this.vehicles.push(newVehicle)
                if (getVehicleClassFromType(this.players[i].vehicleType) === "LowPoly") {
                    batches.push(
                        loadLowPolyVehicleModels(this.players[i].vehicleType, false).then(([tires, chassis]) => {
                            this.vehicles[i].addModels(tires, chassis)
                        }))
                } else {
                    batches.push(loadSphereModel(this.players[i].vehicleType, false).then((body) => {
                        this.vehicles[i].addModels([], body)
                    }))
                }
            }
            Promise.all(batches).then(content => {
                this.emitVehiclesReady()
                topresolve()
            })

        })
        return promise
    }

    /**
     * 
     * @param info text to be displayed
     * @param i view indoex
     * @param clear if the function should handle clearing the text using a time out
     * 
     */
    setViewImportantInfo(info: string, i: number, clear?: boolean) {
        this.viewsImpornantInfo[i].innerHTML = info

        const fadeSecs = 2
        if (clear) {
            this.viewsImpornantInfoClearTimeout[i] = setTimeout(() => {
                this.clearViewImportantInfo(i)
            }, fadeSecs * 1000)
        }
    }

    clearViewImportantInfo(i: number) {
        this.viewsImpornantInfo[i].innerHTML = ""
    }

    clearTimouts() {
        for (let to of this.viewsImpornantInfoClearTimeout) {
            window.clearTimeout(to)
        }
    }

    setNeedsReload(needsReload: boolean) {
        this.needsReload = needsReload
    }

    createViews() {
        this.gameInfoDiv.appendChild(this.playerInfosContainer)
        this.views = []
        this.playerInfosContainer.innerHTML = ""
        this.viewsImpornantInfo = []
        this.viewsKmhInfo = []


        const n = this.players.length
        for (let i = 0; i < this.players.length; i++) {
            const viewHeight = n > 2 ? .5 : 1.0
            let viewWidth: number
            if (n === 3 || n === 1) {
                viewWidth = i < n - 1 ? .5 : 1
            } else {
                viewWidth = .5
            }
            const fov = vechicleFov
            // for some reason the last view needs to use the Scene's camera
            // maybe remove camera from warpSpeed ("-camera")
            const camera = i === n - 1 ? this.camera as PerspectiveCamera : new PerspectiveCamera(fov, (window.innerWidth * viewWidth) / (window.innerHeight * viewHeight), 1, this.gameSettings.drawDistance)

            const view = {
                left: viewLefts[i % 2],
                bottom: viewBottoms[i],
                width: viewWidth,
                height: viewHeight,
                up: [0, 1, 0],
                fov,
                camera,
            }

            view.camera.up.fromArray(view.up)


            this.vehicles[i].addCamera(view.camera)
            this.vehicles[i].isReady = true
            this.views.push(view)

            const width = viewWidth * window.innerWidth

            //  const left = (lefts[i % 2] * (window.innerWidth)) + (window.innerWidth / 4)
            const left = viewLefts[i % 2] * (window.innerWidth)
            const bottom = viewBottoms[i] * window.innerHeight
            const viewDivWidth = viewWidth * window.innerWidth
            const viewDivHeight = viewHeight * window.innerHeight

            const viewDiv = document.createElement("div")
            const nameInfo = document.createElement("span")

            nameInfo.innerHTML = this.players[i].playerName
            viewDiv.appendChild(nameInfo)

            const kmInfo = document.createElement("span")
            viewDiv.appendChild(kmInfo)
            /** to be updated */
            this.viewsKmhInfo.push(kmInfo)

            const imporantViewInfo = document.createElement("span")
            viewDiv.appendChild(imporantViewInfo)
            this.viewsImpornantInfo.push(imporantViewInfo)
            //this.viewsImpornantInfo.push(document.createElement("span"))


            viewDiv.setAttribute("style", `
                position:absolute;
                font-family:monospace;
                text-shadow:1px 1px white;
             
                left:${left}px;
                bottom:${bottom}px;
                font-size:32px;
                width:${viewDivWidth}px;
                height:${viewDivHeight}px;
            `)


            kmInfo.setAttribute("style", `
                position:absolute;
                left:50%;
                bottom:0;
                transform:translate(-50%,0px);
            `)

            imporantViewInfo.setAttribute("style", `
                position:absolute;
                left:50%;
                bottom:50%;
                font-size:32px;
                transform:translate(-50%,-25px);
                text-align:center;
            `)

            // setTimeout(() => {
            //     this.showViewsImportantInfo("some info")
            // }, 7000)



            let nameRight = 50;
            let nameTop = 50;
            let nameFontSize = 132;
            nameInfo.setAttribute("style", `
            position:absolute;
            right:${nameRight}%;
            top:${nameTop}%;
            font-size:${nameFontSize}px;
            transform:translate(${nameRight}%, -${nameTop}%);
            `)
            const pName = this.players[i].playerName.toUpperCase().slice(0, 3)

            const callNameAnimate = () => {
                nameInfo.innerHTML = pName

                setTimeout(() => {
                    if (nameRight > 0) {
                        nameTop -= 2;
                        nameRight -= 2;
                        nameFontSize -= 4;
                        nameInfo.setAttribute("style", `
                        position:absolute;
                        right:${nameRight}%;
                        top:${nameTop}%;
                        font-size:${nameFontSize}px;
                        transform:translate(${nameRight}%, -${nameTop}%);
                        `)

                        callNameAnimate()
                    }
                }, 5)
            }

            setTimeout(() => {

                callNameAnimate()
            }, 1500)


            this.playerInfosContainer.appendChild(viewDiv)

            window.addEventListener("resize", () => {
                const left = viewLefts[i % 2] * (window.innerWidth)
                const bottom = viewBottoms[i] * window.innerHeight
                const viewDivWidth = viewWidth * window.innerWidth
                const viewDivHeight = viewHeight * window.innerHeight

                viewDiv.setAttribute("style", `
                position:absolute;
                font-family:monospace;
                text-shadow:1px 1px white;
             
                left:${left}px;
                bottom:${bottom}px;
                font-size:32px;
                width:${viewDivWidth}px;
                height:${viewDivHeight}px;
            `)
            })
        }
    }

    startGameSong() {
        // not use game song right now...
        if (!!false && this.useSound && (!this.songIsPlaying) && !this.isGamePaused()) {
            this.songIsPlaying = true
        }
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    isGamePaused() {
        return this.gameStarted && this.vehicles[0].isPaused
    }

    pauseGame() {
        if (this.isGamePaused()) return
        this.songIsPlaying = false
        for (let i = 0; i < this.vehicles.length; i++) {
            if (this.vehicles[i].isReady) {
                this.vehicles[i].pause()
            }
        }
        this._togglePauseGame(false)
    }

    unpauseGame() {
        if (!this.isGamePaused()) return


        this.startGameSong()
        this.songIsPlaying = false
        for (let i = 0; i < this.vehicles.length; i++) {
            if (this.vehicles[i].isReady) {
                this.vehicles[i].unpause()
            }

        }
        this._togglePauseGame(true)
    }

    togglePauseGame() {
        let isPaused = this.isGamePaused()
        if (isPaused) {
            this.unpauseGame()
        } else {
            this.pauseGame()
        }
    }

    /** to be overritten by child
     * TODO: learn correct syntax
     */
    _togglePauseGame(isPaused: boolean) {

    }

    /** show all view the same info */
    showViewsImportantInfo(text: string, clear?: boolean) {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.setViewImportantInfo(text, i, clear)
        }
    }

    clearViewsImportantInfo() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.clearViewImportantInfo(i)
        }
    }

    showImportantInfo(text: string) {
        this.importantInfoDiv.innerHTML = text
    }

    clearImportantInfo() {
        this.importantInfoDiv.innerHTML = ""
    }

    everythingReady(): boolean {
        if (!this.courseLoaded) {
            this._everythingReady = false
            return false
        }
        if (this._everythingReady) return true

        for (let vehicle of this.vehicles) {
            if (!vehicle.isReady) return false
        }

        this._everythingReady = true
        return true
    }


    setGameRoomActions(gameRoomActions: IGameRoomActions) {
        this.gameRoomActions = gameRoomActions
    }

    setGameSettings(gameSettings: IGameSettings) {

        if (this.courseLoaded && (this.gameSettings.trackName !== gameSettings.trackName || this.gameSettings.graphics !== gameSettings.graphics)) {
            this.setNeedsReload(true)
        }

        this.gameSettings = gameSettings


        for (let key of Object.keys(gameSettings)) {
            if (gameSettings[key] !== undefined) {
                this[key] = gameSettings[key]
            }
        }

        this.timeOfDay = getTimeOfDay(this.gameSettings.trackName)
        if (this.pLight && this.course) {
            this.pLight.castShadow = this.useShadows && this.timeOfDay === "day"
            this.pLight.shadow.bias = 0.1
            this.course.toggleShadows(this.useShadows)
        }

        this.toggleUseSound()

        for (let i = 0; i < this.views.length; i++) {
            this.views[i].camera.far = gameSettings.drawDistance
        }
        this.camera.far = gameSettings.drawDistance

        // if gameSettings change and needs reload then restart without user say?
        this.socket?.emit(dts_game_settings_changed_callback, {})
    }

    toggleUseSound() {
        if (!this.useSound) {

            this.songIsPlaying = false
        } else {
            this.startGameSong()
        }
        for (let vehicle of this.vehicles) {
            vehicle.toggleSound(this.useSound)
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

    /** if song stops start it again */
    isGameSongPlaying() {
        return false
        //  return gameSong.playing()
    }

    startAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].canDrive = true
            this.vehicles[i].unpause()

        }
        this._startAllVehicles()
    }

    _startAllVehicles() { }

    stopAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].canDrive = false
            this.vehicles[i].stop()
        }
    }

    async create() { }

    restartGame() {
        this.oldTime = 0
        this.totalPing = 0
        this.totalPingsGotten = 0
        this.totalNumberOfFpsTicks = 0
        this.totalFpsTicks = 0
        if (this.gameRoomActions?.closeModals) {
            this.gameRoomActions.closeModals()
        }
        if (this.needsReload) {
            this._everythingReady = false
            this.gameStarted = false
            this.courseLoaded = false
            this.needsReload = false
            /** I think I need to delete ammo vecs */
            for (let vehicle of this.vehicles) {
                vehicle.destroy()
            }
            this.restart().then(() => {
            })
        } else {
            this.gameStarted = false
            this.resetVehicles()
            this._restartGame()
        }
    }

    _restartGame() { }

    changeTrack(trackName: TrackName) {
        this.setNeedsReload(true)
    }

    vehicleCollidedWithObject(object: any, vehicleNumber: number) {
        console.warn("Not implmented vehicle collided with object")
        if (object instanceof Wagon) {
            //(object as Wagon).connectToVehicle(vehicle)
        }
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    setPlayers(players: IPlayerInfo[]) {
        this.players = players
    }

    createController() {
        this.socket?.off(std_controls)
        if (this.gameSceneConfig?.onlyMobile) {
            if (this.gameSceneConfig.mobileController && this.vehicles.length > 0) {

                const controllerInterval = setInterval(() => {
                    driveVehicle(this.gameSceneConfig.mobileController, this.vehicles[0])
                }, 1000 / 60)
            } else {
                console.warn("not able to drive")
            }
        } else {


            /** Vehicle controls is only for testing */
            this.vehicleControls = new VehicleControls()
            addControls(this.vehicleControls, this.socket, this.vehicles)
        }
    }

    emitVehiclesReady() {
        /** send info about vehiclesTypes and have the server check if 
         * non premium accounts have premium vehicles
         */
        this.socket?.emit(dts_vehicles_ready, { numberOfVehicles: this.vehicles.length })
    }

    userSettingsListener() {
        this.socket?.on(std_user_settings_changed, (data: IUserSettingsMessage) => {
            if (this.vehicles?.length > 0 && this.vehicles[0].isReady) {
                if (this.vehicles.length >= data.playerNumber - 1) {
                    /* 
                    * There could be a situation when the leader resets and vehicles are destroyed and in the same moment a non leader changes his vehicleType
                    */
                    this.setVehicleSettings(data.playerNumber, data.userSettings.vehicleSettings)
                    //   this.vehicles[data.playerNumber].updateVehicleSettings(data.userSettings.vehicleSettings)
                }
            }
        })
    }

    setVehicleSettings(vehicleNumber: number, vehicleSettings: IVehicleSettings) {
        this.players[vehicleNumber].vehicleType = vehicleSettings.vehicleType
        this.vehicles[vehicleNumber].updateVehicleSettings(vehicleSettings)
    }

    resetPlayer(idx: number) {
        this.vehicles[idx].resetPosition()
        this._resetPlayer(idx)
    }

    _resetPlayer(idx: number) { }

    checkVehicleOutOfBounds(idx: number) {
        const pos = this.vehicles[idx].getPosition()
        if (this.course.checkIfObjectOutOfBounds(pos)) {
            this.resetPlayer(idx)
        }
    }

    updatePing() {
        const start = Date.now()

        this.socket?.emit(dts_ping_test)
        this.socket?.once(std_ping_test_callback, () => {
            const ping = Date.now() - start
            this.pingInfo.innerHTML = `ping ${ping}ms`
            this.totalPing += ping
            this.totalPingsGotten += 1
        })
    }

    updateFps(time: number) {
        this.fpsTick += 1
        if (Math.floor(time) > this.oldTime) {
            this.fpsInfo.innerHTML = `fps ${this.fpsTick}`
            this.totalFpsTicks += this.fpsTick
            this.totalNumberOfFpsTicks += 1
            this.fpsTick = 0
            this.oldTime = Math.floor(time)
        }
        if (time > 30 && !this.hasAskedToLowerSettings) {
            this.hasAskedToLowerSettings = true
            window.localStorage.setItem("hasAskedToLowerSettings", "true")
            if (this.totalFpsTicks / this.totalNumberOfFpsTicks < 40) {
                if (this.gameSettings.graphics === "high" || this.gameSettings.useShadows) {
                    toast.warn("Low fps detected, to increase fps and a more smooth game, go into settings (esc) and turn off shadows and put the graphics on low. Also close other tabs in your browser.", {})
                }
            }
        }
    }

    resetVehicles() {
        this.course.setStartPositions(this.vehicles)
        for (let vehicle of this.vehicles) {
            vehicle.canDrive = false
        }
        this._resetVehicles()
    }

    _resetVehicles() { }



    /** function called if vehicle position is reset */
    resetVehicleCallback(vehicleNumber: number) {

    }

    updateVehicles() {
        for (let i = 0; i < this.views.length; i++) {

            /**
             * For the chase cam, we have to look at the vehicle and then update the position
             * Maybe that is wrong but I think it shakes less
             */
            this.vehicles[i].cameraLookAt(this.views[i].camera)
            this.vehicles[i].update()

            const left = Math.floor(window.innerWidth * this.views[i].left);
            const bottom = Math.floor(window.innerHeight * this.views[i].bottom);
            const width = Math.floor(window.innerWidth * this.views[i].width);
            const height = Math.floor(window.innerHeight * this.views[i].height);

            this.renderer.setViewport(left, bottom, width, height);
            this.renderer.setScissor(left, bottom, width, height);
            this.renderer.setScissorTest(true);
            this.renderer.setClearColor(new Color(255, 255, 255))


            this.views[i].camera.aspect = width / height;
            this.views[i].camera.updateProjectionMatrix();
            this.renderer.render(this.scene, this.views[i].camera);

            this.checkVehicleOutOfBounds(i)

            this.viewsKmhInfo[i].innerHTML = `${this.vehicles[i].getCurrentSpeedKmHour().toFixed(0)} km/h`
        }
    }

    setGameSceneConfig(config: IGameSceneConfig) {
        this.gameSceneConfig = config
        this.setSocket(config.socket)
        this.setGameSettings(config.gameSettings)
        this.setPlayers(config.players)
        this.roomId = config.roomId
        this.setGameRoomActions(config.gameRoomActions)
        // if (config.onlyMobile) {
        //   this.createController()
        //}
    }



    async destroyGame() {
        document.body.removeChild(this.gameInfoDiv)
        document.body.removeChild(this.canvas)
        for (let vehicle of this.vehicles) {
            vehicle.destroy()
        }
        this.stop()
    }

}



export const startGame = (SceneClass: typeof GameScene, gameSceneConfig: IGameSceneConfig, callback: (gameObject: GameScene) => void) => {
    const config = { scenes: [SceneClass], antialias: true, fixedTimeStep: 0.005 }
    PhysicsLoader("/ammo", () => {

        const project = new Project(config)
        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        const gameObject = (project.scenes.get(key) as GameScene);
        gameObject.setGameSceneConfig(gameSceneConfig)
        callback(gameObject)

        return project
    })
}