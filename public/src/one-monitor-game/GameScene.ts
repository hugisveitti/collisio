
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { Scene3D } from "enable3d";
import { Howl } from "howler";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { defaultPreGameSettings, IPlayerInfo, IPreGameSettings, TrackType } from "../classes/Game";
import { IUserGameSettings, IUserSettings } from "../classes/User";
import { ICourse } from "../shared-game-components/ICourse";
import { beepC4, beepE4 } from "../sound/soundPlayer";
import { addControls } from "../utils/controls";
import { VehicleControls } from "../utils/ControlsClasses";
import { IVehicle } from "../vehicles/IVehicle";
import { loadLowPolyVehicleModels, LowPolyVehicle, staticCameraPos } from "../vehicles/LowPolyVehicle";
import { IGameScene } from "./IGameScene";


const vechicleFov = 60
const possibleColors = [0x9e4018, 0x0d2666, 0x1d8a47, 0x61f72a, "brown", "black", "white"]



const gameSong = new Howl({
    src: ["/sound/song2.mp3"],
    html5: true,
    volume: .5,

})

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

    escPress?: () => void

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
    }

    async preload() {
        await this.warpSpeed("-ground", "-light")
        this.pLight = new THREE.PointLight(0xffffff, 1, 0, 1)
        this.pLight.position.set(100, 150, 100);
        if (this.useShadows) {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }

        this.scene.add(this.pLight)

        const hLight = new THREE.HemisphereLight(0xffffff, 1)
        hLight.position.set(0, 1, 0)
        this.scene.add(hLight)

        const aLight = new THREE.AmbientLight(0xffffff, 1)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)


        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.restartGame()
            }
        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.escPress()
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


            const color = possibleColors[i]

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
                } else {
                    recursiveCreate(i + 1)
                }
            })

        }

        recursiveCreate(0)
    }

    createViews() {
        this.views = []
        const lefts = [0, 0.5]
        const bottoms = [0, 0, 0.5, 0.5]

        // only works for 2 players right now, need algorithm to make it dynamically calculate the size of each view
        for (let i = 0; i < this.players.length; i++) {
            const n = this.players.length
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
                left: lefts[i % 2],
                bottom: bottoms[i],
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
            this.showImportantInfo("GAME PAUSED <br /> Press 'p' to unpause.")
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



    setPreGameSettings(preGameSettings: IPreGameSettings, roomId: string, escPress: () => void) {
        this.preGameSettings = preGameSettings

        this.roomId = roomId
        this.escPress = escPress
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

    changeTrack(trackType: TrackType) {
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

    userSettingsListener() {
        this.socket.on("user-settings-changed", (data: IUserSettingsMessage) => {
            this.vehicles[data.playerNumber].updateVehicleSettings(data.userSettings.vehicleSettings)
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

    resetVehicles() {
        // delete?

        const p = this.course.startPosition
        const r = this.course.startRotation

        const courseY = this.course.ground?.position?.y ?? 2
        let possibleStartingPos = []
        let offset = 1
        for (let i = 0; i < this.vehicles.length; i++) {

            offset *= -1

            if (i % 2 !== 0) {
                offset += (Math.sign(offset) * 5)
            }

            possibleStartingPos.push({ x: p.x + offset - 5, y: courseY + 3, z: p.z + offset - 5 })
        }


        for (let i = 0; i < this.players.length; i++) {

            this.vehicles[i].canDrive = false

            const sI = Math.floor(Math.random() * possibleStartingPos.length)
            const sPos = possibleStartingPos[sI]
            possibleStartingPos.splice(sI, 1)

            this.vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: { x: 0, y: r.y, z: 0 } })
            this.vehicles[i].resetPosition()
            this.vehicles[i].pause()
        }
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
        }
    }

}