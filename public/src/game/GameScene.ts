import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Socket } from "socket.io-client";
import { Audio, AudioListener, Color, PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { v4 as uuid } from "uuid";
import { IGameSettings, IRoomSettings } from '../classes/localGameSettings';
import { IUserSettings, IVehicleSettings } from "../classes/User";
import { dts_game_settings_changed_callback, dts_vehicles_ready, IPlayerInfo, std_controls, std_user_settings_changed, TrackName, vehicleColors, VehicleColorType, VehicleControls, VehicleType } from "../shared-backend/shared-stuff";
import { VehicleSetup } from "../shared-backend/vehicleItems";
import { addMusic, getBeep, pauseMusic, removeMusic, setMusicVolume, startMusic, stopMusic } from "../sounds/gameSounds";
import { addControls, driveVehicle } from "../utils/controls";
import { getStaticPath } from '../utils/settings';
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle";
import { loadSphereModel, SphereVehicle } from "../vehicles/SphereVehicle";
import { IVehicleClassConfig } from "../vehicles/Vehicle";
import { getVehicleClassFromType } from '../vehicles/VehicleConfigs';
import { getWagonNumber, Wagon } from "../vehicles/Wagon";
import { WagonType } from "../vehicles/WagonConfigs";
import "./game-styles.css";
import { IGameRoomActions, IGameScene, IGameSceneConfig } from "./IGameScene";
import { MyScene } from "./MyScene";



// placement of views on the screen,
// left = viewLefts[playerIndex % 2]
export const viewLefts = [0, 0.5]
export const viewBottoms = [0, 0, 0.5, 0.5]

const vechicleFov = 60
const fadeSecs = 2



interface IUserSettingsMessage {
    playerNumber: number
    userSettings: IUserSettings | undefined
    vehicleSetup: VehicleSetup | undefined
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


export class GameScene extends MyScene implements IGameScene {

    players: IPlayerInfo[]
    vehicles: IVehicle[]

    roomId: string
    gameId: string

    views: IView[]
    songIsPlaying: boolean

    vehicleControls: VehicleControls


    gameStarted: boolean


    private _everythingReady: boolean



    viewDivs: HTMLDivElement[]
    viewsKmhInfo: HTMLSpanElement[]
    viewsLapsInfo: HTMLSpanElement[]
    viewsImpornantInfo: HTMLSpanElement[]
    viewsNameInfo: HTMLSpanElement[]
    viewsImpornantInfoClearTimeout: NodeJS.Timeout[]
    playerInfosContainer: HTMLDivElement

    /**
     * when some settings change then the needsUpdate is set to true
     * e.g. when trackName is changed
     * Then we reload the map 
     */


    beepE4: Audio
    beepC4: Audio

    hasAskedToLowerSettings: boolean


    extraVehicles: IVehicle[]
    wagons: Wagon[]
    mobileOnlyControllerInterval: NodeJS.Timer



    constructor() {
        super()


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

        this.viewDivs = []
        this.viewsKmhInfo = []
        this.viewsLapsInfo = []
        this.viewsImpornantInfo = []
        this.viewsImpornantInfoClearTimeout = [] as NodeJS.Timeout[]
        this.viewsNameInfo = []

        this.playerInfosContainer = document.createElement("div")
        this.playerInfosContainer.setAttribute("style", "position:relative;")


        this.hasAskedToLowerSettings = eval(window.localStorage.getItem("hasAskedToLowerSettings")) ?? false

        this.extraVehicles = []
        this.wagons = []
    }


    async preload() {
        const warp = await this.warpSpeed("-ground", "-light", "-sky")
        this.addLights()
        removeMusic()

        addMusic(this.gameSettings?.musicVolume || 0, this.camera as PerspectiveCamera, this.getRaceSong())
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.physics.debug.enable()

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

        window.addEventListener("resize", () => this.handleResizeWindow())
        await this.loadAssets()

        this.renderer.clear()
        this.renderer.info.autoReset = false
        //  this.renderer.capabilities.precision = "lowp"
        this.renderer.autoClear = false
        this.renderer.shadowMap.autoUpdate = false

    }

    async loadAssets() { }

    async init(data: any) {
        // need to do some test with performance and the draw distance
        this.camera = new PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, this.getDrawDistance())
        this.setPixelRatio()

        // this gravity seems to work better
        // -30 gives weird behaviour and -10 makes the vehicle fly sometimes
        this.physics.setGravity(0, -9.82, 0)


    }


    createWagons(wagonTypes: WagonType[], positions?: THREE.Vector3[], rotations?: THREE.Quaternion[]) {
        const batch: Promise<Wagon>[] = []
        for (let i = 0; i < wagonTypes.length; i++) {
            batch.push(this.createWagon(wagonTypes[i], i))
        }

        Promise.all(batch).then(wagons => {
            for (let i = 0; i < wagons.length; i++) {
                if (positions && positions.length === wagons.length && rotations && rotations.length === wagons.length) {
                    wagons[i].setPositionRotation(positions[i], rotations[i])
                }

                this.wagons.push(wagons[i])
            }
        })
    }


    createWagon(wagonType: WagonType, wagonNumber: number): Promise<Wagon> {
        return new Promise<Wagon>(async (resolve, reject) => {
            const wagon = new Wagon(this, wagonType, wagonNumber)
            await wagon.constructWagon()
            resolve(wagon)
        })
    }

    /**
     * To be used in e.g. storyCourse to create interactive vehicles
     * @param vehicleTypes list of VehicleTypes
     */
    async createExtraVehicles(vehicleTypes: VehicleType[], positions?: THREE.Vector3[], rotations?: THREE.Quaternion[]) {
        const batch: Promise<IVehicle>[] = []
        for (let i = 0; i < vehicleTypes.length; i++) {
            batch.push(this.createVehicle(vehicleTypes[i], vehicleColors[0].value, `extra-vehicle-${i}`, i + this.players.length))
        }

        Promise.all(batch).then(vehicles => {
            for (let i = 0; i < vehicles.length; i++) {
                if (positions && positions.length === vehicles.length) {
                    vehicles[i].setPosition(positions[i].x, positions[i].y, positions[i].z)
                }
                if (rotations && rotations.length === vehicles.length) {
                    vehicles[i].setRotation(rotations[i])
                }
                vehicles[i].start()
                vehicles[i].unpause()

                this.extraVehicles.push(vehicles[i])
            }
        })
    }


    async createVehicle(vehicleType: VehicleType, vehicleColor: string | number, name: string, vehicleNumber: number): Promise<IVehicle> {
        return new Promise<IVehicle>(async (resolve, reject) => {
            let newVehicle: IVehicle
            const config = {
                scene: this,
                name,
                vehicleNumber,
                vehicleType,
                useSoundEffects: this.useSound,
                vehicleSetup: { vehicleColor: vehicleColor as VehicleColorType, vehicleType },
                id: `vehicle-${vehicleNumber}-id`
            }
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                newVehicle = new LowPolyVehicle(config)
            } else {
                newVehicle = new SphereVehicle(config)
            }
            this.vehicles.push(newVehicle)
            if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                await loadLowPolyVehicleModels(vehicleType, false).then(([tires, chassis]) => {
                    newVehicle.addModels(tires, chassis)
                })
            } else {
                await loadSphereModel(vehicleType, false).then((body) => {
                    newVehicle.addModels([], body)
                })
            }
            resolve(newVehicle)
        })
    }

    async createVehicles(): Promise<void> {
        const promise = new Promise<void>((topresolve, reject) => {
            this.vehicles = []
            // get random color of chassis
            let chassisColOffset = Math.floor(Math.random() * vehicleColors.length)

            const batches = []
            for (let i = 0; i < this.players.length; i++) {
                const vehicleColor = vehicleColors[(chassisColOffset + i) % vehicleColors.length]?.value ?? "red"
                let newVehicle: IVehicle
                const vehicleType = this.gameSceneConfig?.tournament?.vehicleType ? this.gameSceneConfig.tournament?.vehicleType : this.players[i].vehicleType
                const config: IVehicleClassConfig = {
                    scene: this,
                    name: this.players[i].playerName,
                    vehicleNumber: i,
                    vehicleType,
                    useSoundEffects: this.useSound,
                    vehicleSetup: this.players[i].vehicleSetup,
                    id: this.players[i].id,
                    vehicleSettings: this.players[i].vehicleSettings
                }
                if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                    newVehicle = new LowPolyVehicle(config)
                } else {
                    newVehicle = new SphereVehicle(
                        config
                    )
                }
                this.vehicles.push(newVehicle)
                if (getVehicleClassFromType(vehicleType) === "LowPoly") {
                    batches.push(
                        loadLowPolyVehicleModels(vehicleType, false).then(([tires, chassis]) => {
                            this.vehicles[i].addModels(tires, chassis)
                        }))
                } else {
                    batches.push(loadSphereModel(vehicleType, false).then((body) => {
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

    getVehicles(): IVehicle[] {
        return this.vehicles
    }


    setPixelRatio() {
        const lowGraphics = this.gameSettings.graphics === "low"
        this.renderer.capabilities.precision = lowGraphics ? "lowp" : "highp"
        // let ratio = lowGraphics ? 4 : 1

        // if (window.devicePixelRatio < ratio && lowGraphics) {
        //     ratio = Math.floor(window.devicePixelRatio)
        // }
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    /**
     * 
     * @param info text to be displayed
     * @param i view indoex
     * @param clear if the function should handle clearing the text using a time out
     * 
     */
    setViewImportantInfo(info: string, i: number, clear?: boolean) {
        // this.viewsImpornantInfo[i].textContent = info
        this.viewsImpornantInfo[i].textContent = info
        if (clear) {
            this.viewsImpornantInfoClearTimeout[i] = setTimeout(() => {
                this.clearViewImportantInfo(i)
            }, fadeSecs * 1000)
        }
    }

    clearViewImportantInfo(i: number) {
        if (this.viewsImpornantInfo[i]) {
            this.viewsImpornantInfo[i].textContent = ""
        }
    }

    _clearTimeouts() {
        for (let to of this.viewsImpornantInfoClearTimeout) {
            clearTimeout(to)
        }
    }


    createViews() {
        this.gameInfoDiv.appendChild(this.playerInfosContainer)
        this.views = []
        this.playerInfosContainer.textContent = ""
        this.viewsImpornantInfo = []
        this.viewsNameInfo = []
        this.viewsKmhInfo = []
        this.viewDivs = []
        this.viewsLapsInfo = []


        const n = this.players.length
        if (n > 2) {
            this.totalTimeDiv.setAttribute("style", `
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            `)
        }
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

            const camera = i === n - 1 ? this.camera as PerspectiveCamera : new PerspectiveCamera(fov, (window.innerWidth * viewWidth) / (window.innerHeight * viewHeight), 1, this.getDrawDistance())

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
            this.viewDivs.push(viewDiv)
            const nameInfo = document.createElement("span")

            nameInfo.textContent = this.players[i].playerName
            viewDiv.appendChild(nameInfo)
            this.viewsNameInfo.push(nameInfo)

            const kmInfo = document.createElement("span")
            viewDiv.appendChild(kmInfo)
            /** to be updated */
            this.viewsKmhInfo.push(kmInfo)

            const lapsInfo = document.createElement("span")
            lapsInfo.textContent = ""
            viewDiv.appendChild(lapsInfo)
            this.viewsLapsInfo.push(lapsInfo)

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

            const fontSize = window.innerWidth < 1500 ? 32 : 82

            kmInfo.setAttribute("style", `
                position:absolute;
                left:50%;
                bottom:0;
                transform:translate(-50%,0px);
                font-size:${fontSize}px;
            `)

            lapsInfo.setAttribute("style", `
                position:absolute;
                right:0;
                bottom:0;
                font-size:${fontSize}px;
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
            transition:2s;
            `)
            const pName = this.players[i].playerName.toUpperCase().slice(0, 3)


            setTimeout(() => {
                nameInfo.textContent = pName
                nameInfo.setAttribute("style", `
                    position:absolute;
                    right:100px;
                    top:0%;
                    font-size:32px;
                    transform:translate(0%, -0%);
                `)
            }, 1500)


            this.playerInfosContainer.appendChild(viewDiv)
        }
    }

    handleResizeWindow() {

        const n = this.viewDivs.length

        for (let i = 0; i < this.viewDivs.length; i++) {
            const viewHeight = n > 2 ? .5 : 1.0
            let viewWidth: number
            if (n === 3 || n === 1) {
                viewWidth = i < n - 1 ? .5 : 1
            } else {
                viewWidth = .5
            }
            const left = viewLefts[i % 2] * (window.innerWidth)
            const bottom = viewBottoms[i] * window.innerHeight
            const viewDivWidth = viewWidth * window.innerWidth
            const viewDivHeight = viewHeight * window.innerHeight

            this.viewDivs[i].setAttribute("style", `
                position:absolute;
                font-family:monospace;
                text-shadow:1px 1px white;
             
                left:${left}px;
                bottom:${bottom}px;
                font-size:32px;
                width:${viewDivWidth}px;
                height:${viewDivHeight}px;
            `)
        }

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startGameSong() {
        // not use game song right now...
        if ((!this.songIsPlaying) && !this.isPaused) {
            this.songIsPlaying = true
            startMusic()
        }
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }



    pauseGame() {
        this.isPaused = true
        if (!this.gameStarted) return
        pauseMusic()

        this.songIsPlaying = false
        for (let i = 0; i < this.vehicles.length; i++) {
            if (this.vehicles[i].isReady) {
                this.vehicles[i].pause()
            }
        }
        this._togglePauseGame(false)
    }

    unpauseGame() {
        this.isPaused = false
        if (!this.gameStarted) return

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

        if (!this.everythingReady()) return

        if (!this.gameStarted) return
        if (this.isPaused) {
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

    saveDriveRecording(playerId: string) {
        console.warn("Save drive recording not implemented")
    }

    _setRoomSettings() { }

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
        this._setRoomSettings()
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

        this.toggleUseSound()

        setMusicVolume(gameSettings.musicVolume)
        if (gameSettings.musicVolume > 0) {
            this.startGameSong()
        }

        for (let i = 0; i < this.views.length; i++) {
            this.views[i].camera.far = this.getDrawDistance()
        }
        this.camera.far = this.getDrawDistance()

        // if gameSettings change and needs reload then restart without user say?
        this.socket?.emit(dts_game_settings_changed_callback, {})
        if (this.targetFPS) {
            this.physics.config.fixedTimeStep = 1 / this.targetFPS
        }
        this._setGameSettings()
    }

    _setGameSettings() { }

    toggleUseSound() {
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
            this.vehicles[i].unpause()

        }
        this._startAllVehicles()
    }

    _startAllVehicles() { }

    stopAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].setCanDrive(false)
            this.vehicles[i].stop()
        }
    }

    async create() { }

    async destroyVehicles() {
        return new Promise<void>(async (resolve, reject) => {
            for (let vehicle of this.vehicles) {
                try {
                    await vehicle.destroy()
                } catch (err) {
                    console.warn("Error destroying vehicle:", err)
                }
            }
            for (let i = 0; i < this.vehicles.length; i++) {
                delete this.vehicles[0]
            }
            this.vehicles = []

            for (let vehicle of this.extraVehicles) {
                vehicle.destroy()
            }

            this.extraVehicles = []

            for (let wagon of this.wagons) {
                wagon.destroy()
            }

            this.wagons = []
            resolve()
        })
    }

    async restartGame() {
        this.clearImportantInfo()
        this.clearViewsImportantInfo()

        this.isPaused = false
        this.oldTime = 0
        this.totalPing = 0
        this.totalPingsGotten = 0
        this.totalNumberOfFpsTicks = 0
        this.totalFpsTicks = 0
        if (this.gameRoomActions?.closeModals) {
            this.gameRoomActions.closeModals()
        }
        if (this.needsReload) {
            stopMusic()
            this.socket?.off(std_controls)
            this._everythingReady = false
            this.gameStarted = false
            this.courseLoaded = false
            this.needsReload = false
            /** I think I need to delete ammo vecs */

            await this.destroyVehicles()
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

    vehicleCollidedWithObject(object: ExtendedObject3D, vehicleNumber: number) {
        console.warn("Not implmented vehicle collided with object")
        if (object instanceof Wagon) {
            const wagonNumber = getWagonNumber(object.name)
            this.wagons[wagonNumber].connectToVehicle(this.vehicles[vehicleNumber])
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

                this.mobileOnlyControllerInterval = setInterval(() => {
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
                    this.setVehicleSettings(data.playerNumber, data.userSettings?.vehicleSettings, data.vehicleSetup)
                    //   this.vehicles[data.playerNumber].updateVehicleSettings(data.userSettings.vehicleSettings)
                }
            }
        })
    }

    setVehicleSettings(vehicleNumber: number, vehicleSettings: IVehicleSettings, vehicleSetup: VehicleSetup) {
        if (vehicleSettings) {
            this.players[vehicleNumber].vehicleType = vehicleSettings.vehicleType
        }
        this.vehicles[vehicleNumber].updateVehicleSettings(vehicleSettings, vehicleSetup)
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



    resetVehicles() {
        this.course.setStartPositions(this.vehicles)
        this.stopAllVehicles()
        this._resetVehicles()
    }

    _resetVehicles() { }



    /** function called if vehicle position is reset */
    resetVehicleCallback(vehicleNumber: number) {

    }

    updateVehicles(delta: number) {
        for (let i = 0; i < this.views.length; i++) {

            /**
             * For the chase cam, we have to look at the vehicle and then update the position
             * Maybe that is wrong but I think it shakes less
             */


            this.vehicles[i].update(delta)
            this.vehicles[i].cameraLookAt(this.views[i].camera, delta)


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

            if (i === this.views.length - 1) {
                //     this.renderer.shadowMap.needsUpdate = true
                this.renderer.info.reset()
                this.renderer.clear()
            } else {
                this.renderer.shadowMap.needsUpdate = false
                //       this.renderer.compile(this.scene, this.views[i].camera);
            }
            this.renderer.render(this.scene, this.views[i].camera);



            if (this.gameStarted) {
                //     this.checkVehicleOutOfBounds(i)

                this.viewsKmhInfo[i].textContent = `${Math.ceil(this.vehicles[i].getCurrentSpeedKmHour(delta)).toFixed(0)} km/h`
            }
        }
    }

    setGameSceneConfig(config: IGameSceneConfig) {
        this.gameSceneConfig = config
        this.setSocket(config.socket)
        this.setGameSettings(config.gameSettings)
        this.setRoomSettings(config.roomSettings)
        this.setPlayers(config.players)
        this.roomId = config.roomId
        this.setGameRoomActions(config.gameRoomActions)
    }

    update(_time: number, _delta: number): void {
        if (this.everythingReady()) {
            this._updateChild(_time, _delta)
            for (let vehicle of this.extraVehicles) {
                vehicle.update(_delta)
            }
            for (let wagon of this.wagons) {
                wagon.update()
            }
        }
    }


    public _updateChild(time: number, delta: number) {

    }

    async _destroyGame() {
        return new Promise<void>(async (resolve, reject) => {
            stopMusic()
            window.removeEventListener("resize", () => this.handleResizeWindow())

            if (this.mobileOnlyControllerInterval) {
                clearInterval(this.mobileOnlyControllerInterval)
            }
            this.clearTimeouts()
            this.socket?.off(std_controls)
            this.socket?.off(std_user_settings_changed)

            await this.destroyVehicles()


            //   document.body.setAttribute("style", "")
            resolve()
        })
    }
}



export const startGame = (SceneClass: typeof GameScene, gameSceneConfig: IGameSceneConfig, callback: (gameObject: GameScene) => void) => {
    const config = { scenes: [SceneClass], antialias: true, autoStart: false }
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