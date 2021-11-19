
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { PhysicsLoader, Project, Scene3D } from "enable3d";
import { Howl } from "howler";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { defaultPreGameSettings, IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPreGameSettings, IRaceTimeInfo } from "../classes/Game";
import { IUserGameSettings, IUserSettings } from "../classes/User";
import { dts_ping_test, dts_vehicles_ready, IPlayerInfo, std_ping_test_callback, std_user_settings_changed, TrackName, VehicleControls } from "../shared-backend/shared-stuff";
import { ICourse } from "../course/ICourse";
import { addControls } from "../utils/controls";
import { getStaticPath } from '../utils/settings';
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle, staticCameraPos } from "../vehicles/LowPolyVehicle";
import { possibleVehicleColors } from '../vehicles/VehicleConfigs';
import { IGameScene } from "./IGameScene";
import { skydomeFragmentShader, skydomeVertexShader } from './shaders';
import "./game-styles.css";

// placement of views on the screen,
// left = viewLefts[playerIndex % 2]
export const viewLefts = [0, 0.5]
export const viewBottoms = [0, 0, 0.5, 0.5]

const vechicleFov = 60


const beepC4 = new Howl({
    src: [getStaticPath("sound/beepC4.mp3")],
    html5: true,
})

const beepE4 = new Howl({
    src: [getStaticPath("sound/beepE4.mp3")],
    html5: true
})



const gameSong = new Howl({
    src: [getStaticPath("sound/song2.mp3")],
    html5: true,
    volume: .5,

})

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
    camera: THREE.PerspectiveCamera
}

export interface IGameRoomActions {
    escPressed?: () => void
    /** have the possibity to expand this interface to include other game types */
    gameFinished?: (data: IEndOfGameData) => void
    updateScoreTable?: (data: IRaceTimeInfo[]) => void
    playerFinished?: (data: IEndOfRaceInfoPlayer) => void
}


export class GameScene extends Scene3D implements IGameScene {

    players: IPlayerInfo[]
    vehicles: IVehicle[]
    font: THREE.Font
    preGameSettings: IPreGameSettings
    useSound: boolean
    useShadows: boolean
    pLight: THREE.PointLight
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
        this.preGameSettings = defaultPreGameSettings
        this.importantInfoDiv = document.createElement("div")

        this.importantInfoDiv.setAttribute("id", "important-info")
        document.body.appendChild(this.importantInfoDiv)
        this.gameRoomActions = {}

        this.viewsKmhInfo = []
        this.viewsImpornantInfo = []
        this.viewsImpornantInfoClearTimeout = [] as NodeJS.Timeout[]


        this.pingInfo = document.createElement("span")
        this.pingInfo.setAttribute("class", "game-text")
        this.pingInfo.setAttribute("style", `
            position:absolute;
            top:50px;
            left:5px;
        `)
        document.body.appendChild(this.pingInfo)
    }

    async addLights() {
        this.pLight = new THREE.PointLight(0xffffff, 1, 0, 1)
        this.pLight.position.set(100, 150, 100);
        if (this.useShadows) {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }

        this.scene.add(this.pLight)

        const hLight = new THREE.HemisphereLight(0xffffff, 1)
        hLight.position.set(0, 1, 0);
        hLight.color.setHSL(0.6, 1, 0.4);
        this.scene.add(hLight)

        const aLight = new THREE.AmbientLight(0xffffff, 1)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)



        const uniforms = {
            "topColor": { value: new THREE.Color(0x0077ff) },
            "bottomColor": { value: new THREE.Color(0xffffff) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(hLight.color);
        this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
        this.scene.fog = new THREE.Fog(this.scene.background, 1, 5000);
        this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: skydomeVertexShader,
            fragmentShader: skydomeFragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);

    }

    async preload() {
        await this.warpSpeed("-ground", "-light", "-sky")

        this.addLights()



        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.restartGame()
            } else if (e.key === "p") {
                this.togglePauseGame()
            }
        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (this.gameRoomActions.escPressed) {
                    this.gameRoomActions.escPressed()
                }
                this.togglePauseGame()
            }
        })

        window.addEventListener("resize", () => this.onWindowResize())

    }

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        // this gravity seems to work better
        // -30 gives weird behaviour and -10 makes the vehicle fly sometimes
        this.physics.setGravity(0, -20, 0)
    }

    async createVehicles(callback: () => void) {
        const loadedVehicleModels = {}
        // get random color of chassis
        let chassisColOffset = Math.floor(Math.random() * 4)

        /** make this better
         * Currently doing async loading of models, when it could be sync
         */
        const recursiveCreate = (i: number) => {


            const color = possibleVehicleColors[i]

            let newVehicle: IVehicle
            newVehicle = new LowPolyVehicle(this, color, this.players[i].playerName, i, this.players[i].vehicleType)
            this.vehicles.push(newVehicle)



            let loadPromise = new Promise((resolve, reject) => {

                loadLowPolyVehicleModels(this.players[i].vehicleType, (tires, chassises,) => {
                    console.log("loaded model for player", i, this.players[i].vehicleType)
                    // only x colors of chassis
                    loadedVehicleModels[this.players[i].vehicleType] = { chassises, tires };
                    (this.vehicles[i] as LowPolyVehicle).addModels(tires, chassises[(i + chassisColOffset) % chassises.length])
                    resolve("success")
                }, false)
            })
            loadPromise.then((msg) => {
                if (i === this.players.length - 1) {
                    callback()
                    this.emitVehiclesReady()
                } else {
                    recursiveCreate(i + 1)
                }
            })

        }

        recursiveCreate(0)
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
        // this.viewsImpornantInfo[i].setAttribute("style", `
        // opacity:1;
        // `)
        // setTimeout(() => {
        //     this.viewsImpornantInfo[i].setAttribute("style", `
        //     opacity:0;
        //     `)
        // }, fadeSecs * 1000)
    }

    clearViewImportantInfo(i: number) {

        this.viewsImpornantInfo[i].innerHTML = ""

    }

    clearTimouts() {
        for (let to of this.viewsImpornantInfoClearTimeout) {
            window.clearTimeout(to)
        }
    }


    createViews() {
        this.views = []

        const playerInfosContainer = document.createElement("div")
        playerInfosContainer.setAttribute("style", "position:relative;")
        document.body.appendChild(playerInfosContainer)
        // only works for 2 players right now, need algorithm to make it dynamically calculate the size of each view
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
            const camera = i === n - 1 ? this.camera as THREE.PerspectiveCamera : new THREE.PerspectiveCamera(fov, (window.innerWidth * viewWidth) / (window.innerHeight * viewHeight), 1, 10000)

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
            const { x, y, z } = staticCameraPos
            view.camera.position.set(x, y, z)


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


            playerInfosContainer.appendChild(viewDiv)

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
        // not use sound right now...
        if (!!false && this.useSound && (!gameSong.playing() || !this.songIsPlaying) && !this.isGamePaused()) {

            gameSong.play()
            this.songIsPlaying = true
        }
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    isGamePaused() {
        return this.vehicles[0].isPaused
    }

    togglePauseGame() {

        let isPaused = this.isGamePaused()
        if (isPaused) {
            this.startGameSong()
            this.clearImportantInfo()
        } else {
            gameSong.pause()
            this.songIsPlaying = false
            //     this.showImportantInfo("GAME PAUSED <br /> Press 'p' to unpause.")
        }

        for (let i = 0; i < this.vehicles.length; i++) {
            if (isPaused) {
                this.vehicles[i].unpause()
            } else {
                this.vehicles[i].pause()
            }
        }
        this._togglePauseGame(isPaused)
    }

    /** to be overritten by child
     * TODO: learn correct syntax
     */
    _togglePauseGame(isPaused: boolean) {

    }

    /** show all view the same info */
    showViewsImportantInfo(text: string) {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.setViewImportantInfo(text, i)
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
        if (this._everythingReady) return true

        if (!this.courseLoaded) return false

        for (let vehicle of this.vehicles) {
            if (!vehicle.isReady) return false
        }

        this._everythingReady = true
        return true
    }



    setPreGameSettings(preGameSettings: IPreGameSettings, roomId: string) {
        this.preGameSettings = preGameSettings
        this.roomId = roomId
    }

    setGameRoomActions(gameRoomActions: IGameRoomActions) {
        this.gameRoomActions = gameRoomActions
    }

    setUserGameSettings(userGameSettings: IUserGameSettings) {
        for (let key of Object.keys(userGameSettings)) {
            if (userGameSettings[key] !== undefined) {
                this[key] = userGameSettings[key]
            }
        }
        if (this.pLight && this.course) {
            this.pLight.castShadow = this.useShadows
            this.pLight.shadow.bias = 0.01
            this.course.toggleShadows(this.useShadows)
        }

        if (!this.useSound) {
            gameSong.stop()
            this.songIsPlaying = false
        } else {
            this.startGameSong()
        }
    }

    playCountdownBeep() {
        if (this.useSound) {
            beepC4.play()
        }
    }

    playStartBeep() {
        if (this.useSound) {
            beepE4.play()
        }
    }

    /** if song stops start it again */
    isGameSongPlaying() {
        return gameSong.playing()
    }

    startAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].canDrive = true
            this.vehicles[i].unpause()

        }
        this._startAllVehicles()
    }

    _startAllVehicles() { }


    restartGame() {
        this.resetVehicles()

        this._restartGame()
    }

    _restartGame() { }

    changeTrack(trackName: TrackName) {
        console.log("change track not implemented")
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    setPlayers(players: IPlayerInfo[]) {
        this.players = players
    }

    createController() {
        /** Vehicle controls is only for testing */
        this.vehicleControls = new VehicleControls()
        addControls(this.vehicleControls, this.socket, this.vehicles)
    }

    emitVehiclesReady() {
        /** send info about vehiclesTypes and have the server check if 
         * non premium accounts have premium vehicles
         */
        this.socket.emit(dts_vehicles_ready, { numberOfVehicles: this.vehicles.length })
    }

    userSettingsListener() {
        this.socket.on(std_user_settings_changed, (data: IUserSettingsMessage) => {
            console.log("setting user settings", data)
            if (this.vehicles?.length > 0 && this.vehicles[0].isReady) {

                this.vehicles[data.playerNumber].updateVehicleSettings(data.userSettings.vehicleSettings)
            }
        })
    }

    loadFont() {
        const fontName = "helvetiker"
        const fontWeight = "regular"
        const loader = new THREE.FontLoader();
        loader.load('fonts/' + fontName + '_' + fontWeight + '.typeface.json', (response) => {
            this.font = response;
            for (let vehicle of this.vehicles) {
                vehicle.setFont(this.font)
            }
        });
    }

    resetPlayer(idx: number) {
        this.vehicles[idx].resetPosition()
    }

    checkVehicleOutOfBounds(idx: number) {
        const pos = this.vehicles[idx].getPosition()
        if (this.course.checkIfObjectOutOfBounds(pos)) {
            this.resetPlayer(idx)
        }
    }

    updatePing() {
        const start = Date.now()
        this.socket.emit(dts_ping_test)
        this.socket.once(std_ping_test_callback, () => {
            const ping = Date.now() - start
            this.pingInfo.innerHTML = `ping ${ping}ms`
        })
    }

    resetVehicles() {

        this.course.setStartPositions(this.vehicles)
        this._resetVehicles()
    }

    // to be overwritten
    _resetVehicles() {

    }

    updateVehicles() {
        for (let i = 0; i < this.views.length; i++) {

            this.vehicles[i].update()
            this.vehicles[i].cameraLookAt(this.views[i].camera)

            const left = Math.floor(window.innerWidth * this.views[i].left);
            const bottom = Math.floor(window.innerHeight * this.views[i].bottom);
            const width = Math.floor(window.innerWidth * this.views[i].width);
            const height = Math.floor(window.innerHeight * this.views[i].height);

            this.renderer.setViewport(left, bottom, width, height);
            this.renderer.setScissor(left, bottom, width, height);
            this.renderer.setScissorTest(true);
            this.renderer.setClearColor(new THREE.Color(255, 255, 255))


            this.views[i].camera.aspect = width / height;
            this.views[i].camera.updateProjectionMatrix();
            this.renderer.render(this.scene, this.views[i].camera);

            this.checkVehicleOutOfBounds(i)

            this.viewsKmhInfo[i].innerHTML = `${this.vehicles[i].getCurrentSpeedKmHour().toFixed(0)} km/h`
        }
    }

}

export const startGame = (SceneClass: typeof GameScene, socket: Socket, players: IPlayerInfo[], gameSettings: IPreGameSettings, userGameSettings: IUserGameSettings, roomId: string, gameRoomActions: IGameRoomActions, callback: (gameObject: GameScene) => void) => {
    const config = { scenes: [SceneClass], antialias: true }
    PhysicsLoader("/ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        const gameObject = (project.scenes.get(key) as GameScene);
        gameObject.setSocket(socket);
        gameObject.setPlayers(players);
        gameObject.setGameRoomActions(gameRoomActions)
        gameObject.setPreGameSettings(gameSettings, roomId);
        gameObject.setUserGameSettings(userGameSettings);
        callback(gameObject)

        return project
    })
}