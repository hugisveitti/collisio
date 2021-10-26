import { Color } from "@enable3d/three-wrapper/dist";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { v4 as uuid } from "uuid"
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import Stats from "stats.js";
import { defaultGameSettings, IEndOfGameInfoGame, IEndOfGameInfoPlayer, IGameSettings, IPlayerGameInfo, IPlayerInfo } from "../classes/Game";
import { IVehicle } from "../models/IVehicle";
import { RaceCourse } from "../shared-game-components/raceCourse";
import { addControls, driveVehicleWithKeyboard } from "../utils/controls";
import { VehicleControls } from "../utils/ControlsClasses";
import "./game-styles.css";
import { saveGameData } from "../firebase/firebaseFunctions";
import { IUserSettings } from "../classes/User";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../models/LowPolyVehicle";
import { GameTime } from "./GameTimeClass";
import { startGameAuto } from "../utils/settings";

const vechicleFov = 60

const possibleColors = [0x9e4018, 0x0d2666, 0x1d8a47, 0x61f72a, "brown", "black", "white"]


const stats = new Stats()
const scoreTable = document.createElement("div")
const importantInfoDiv = document.createElement("div")

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

export class RaceGameScene extends Scene3D {

    players!: IPlayerInfo[]
    vehicles!: IVehicle[]
    font?: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    course!: RaceCourse
    views!: IView[]
    gameSettings: IGameSettings

    courseLoaded: boolean
    finishedTime: number[]

    totalNumberOfLaps: number
    raceOnGoing: boolean
    winner: string
    winTime: number


    gameId: string
    roomId!: string
    escPress: () => void
    pLight: THREE.PointLight

    gameTimers: GameTime[]
    useShadows: boolean

    constructor() {
        super()

        scoreTable.setAttribute("id", "score-info")
        importantInfoDiv.setAttribute("id", "important-info")

        document.body.appendChild(scoreTable)
        document.body.appendChild(importantInfoDiv)

        this.gameSettings = defaultGameSettings


        this.courseLoaded = false
        this.vehicles = []
        this.totalNumberOfLaps = 3
        this.raceOnGoing = false
        this.winner = ""
        this.winTime = -1
        this.finishedTime = []
        this.gameId = uuid()
        this.gameTimers = []
        this.useShadows = false
    }


    async preload() {
        const { lights } = await this.warpSpeed("-ground", "-light")
        console.log("lights", lights)
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


        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    async create() {

        // this.physics.debug?.enable()
        // this.physics.debug?.mode(2048 + 4096)

        this.course = new RaceCourse(this, this.gameSettings.trackName, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            this.createVehicles(() => {
                this.loadFont()
                this.createViews()
                this.createController()

                this.resetVehicles()
                this.startRaceCountdown()

            })
        })

        stats.showPanel(0)
        document.body.appendChild(stats.dom)


        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.restartGame()
            } else if (e.key === "p") {
                // all or non paused
                this.togglePauseGame()
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

    setPlayers(players: IPlayerInfo[]) {
        this.players = players
    }

    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    createController() {
        this.vehicleControls = new VehicleControls()
        addControls(this.vehicleControls, this.socket, this.vehicles)
    }

    setUseShadows(useShadows: boolean) {
        this.useShadows = useShadows
        this.pLight.castShadow = this.useShadows
        this.pLight.shadow.bias = 0.01
        this.course.toggleShadows(useShadows)
    }

    isGamePaused() {
        return this.vehicles[0].isPaused
    }

    togglePauseGame() {

        let isPaused = this.isGamePaused()
        if (isPaused) {
            importantInfoDiv.innerHTML = ""
        } else {
            importantInfoDiv.innerHTML = "GAME PAUSED <br /> Press 'p' to unpause."
        }

        for (let i = 0; i < this.vehicles.length; i++) {
            if (isPaused) {
                this.gameTimers[i].start()
                this.vehicles[i].unpause()
            } else {
                this.gameTimers[i].stop()
                this.vehicles[i].pause()
            }
        }
    }



    setGameSettings(newGameSettings: IGameSettings, roomId: string, escPress: () => void) {
        this.gameSettings = newGameSettings
        this.totalNumberOfLaps = this.gameSettings.numberOfLaps
        this.roomId = roomId
        this.escPress = escPress
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startRaceCountdown() {
        let countdown = startGameAuto ? 1 : 4

        // makes vehicle fall
        for (let vehcile of this.vehicles) {
            vehcile.start()
        }

        const timer = () => {
            importantInfoDiv.innerHTML = countdown + ""
            countdown -= 1
            setTimeout(() => {
                if (countdown > 0) {
                    timer()
                } else {
                    importantInfoDiv.innerHTML = "GO!!!!"
                    this.startAllVehicles()
                    this.raceOnGoing = true
                    setTimeout(() => {
                        importantInfoDiv.innerHTML = ""
                    }, 2000)
                }
            }, 1000)
        }
        timer()
    }

    startAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].canDrive = true
            this.vehicles[i].unpause()
            this.gameTimers[i].start()
        }
    }

    restartGame() {

        this.raceOnGoing = false
        this.winner = ""
        this.winTime = -1


        this.resetVehicles()

        const sec = 2
        importantInfoDiv.innerHTML = "Race starting in " + sec + " seconds"
        setTimeout(() => {
            this.startRaceCountdown()
        }, sec * 1000)
    }

    async createVehicles(callback: () => void) {
        const loadedVehicleModels = {}
        // get random color of chassis
        let chassisColOffset = Math.floor(Math.random() * 4)
        for (let i = 0; i < this.players.length; i++) {
            const color = possibleColors[i]

            let newVehicle: IVehicle
            // if (this.gameSettings.trackName.includes("low-poly")) {
            newVehicle = new LowPolyVehicle(this, color, this.players[i].playerName, i, this.players[i].vehicleType)

            this.vehicles.push(newVehicle)


            this.gameTimers.push(new GameTime(this.totalNumberOfLaps))

            await loadLowPolyVehicleModels(this.players[i].vehicleType, (tires, chassises,) => {
                // only x colors of chassis
                console.log("loded poly models")
                loadedVehicleModels[this.players[i].vehicleType] = { chassises, tires };
                (this.vehicles[i] as LowPolyVehicle).addModels(tires, chassises[(i + chassisColOffset) % chassises.length])

                if (i === this.vehicles.length - 1) {

                    this.courseLoaded = true
                    callback()
                }
            })
        }
    }



    resetVehicles() {
        // delete?
        for (let timer of this.gameTimers) {
            timer.stop()
        }

        this.gameTimers = []
        const p = this.course.goalSpawn.position
        const r = this.course.goalSpawn.rotation

        const courseY = this.course.ground?.position?.y ?? 2
        let possibleStartingPos = []
        let offset = 0
        for (let i = 0; i < this.vehicles.length; i++) {

            offset *= -1

            if (i % 2 !== 0) {
                offset += (Math.sign(offset) * 5)
            }


            possibleStartingPos.push({ x: p.x + offset - 10, y: courseY, z: p.z + offset - 10 })
        }


        for (let i = 0; i < this.players.length; i++) {
            this.gameTimers.push(new GameTime(this.totalNumberOfLaps))
            this.vehicles[i].canDrive = false

            const sI = Math.floor(Math.random() * possibleStartingPos.length)
            const sPos = possibleStartingPos[sI]
            possibleStartingPos.splice(sI, 1)

            this.vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: { x: 0, y: r.y, z: 0 } })
            this.vehicles[i].resetPosition()
            this.vehicles[i].pause()
        }
    }




    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = vehicle.body.name.slice(8, 9)
        if (this.gameTimers[vehicleNumber].isCheckpointCrossed) {
            this.gameTimers[vehicleNumber].lapDone()


            const cLapTime = this.gameTimers[vehicleNumber].getCurrentLapTime()

            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: 4, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })

            if (this.gameTimers[vehicleNumber].finished() && this.raceOnGoing) {
                const totalTime = this.gameTimers[vehicleNumber].getTotalTime()

                if (this.winner === "") {
                    this.winner = this.players[vehicleNumber].playerName
                    this.winTime = totalTime
                }
                this.checkRaceOver()
            }
        }
    }

    checkRaceOver() {
        let isRaceOver = true
        for (let i = 0; i < this.vehicles.length; i++) {
            if (!this.gameTimers[i].finished()) {
                isRaceOver = false
            }
        }
        if (isRaceOver) {
            importantInfoDiv.innerHTML = `Race over <br /> ${this.winner} won with total time ${this.winTime} <br /> Press 'r' to reset game`
            this.raceOnGoing = false
            this.prepareEndOfGameData()
        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        const vehicleNumber = vehicle.body.name.slice(8, 9)
        this.gameTimers[vehicleNumber].checkpointCrossed()

        const p = this.course.checkpointSpawn.position
        const r = this.course.checkpointSpawn.rotation
        this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: 4, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })
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
            view.camera.position.set(0, 10, -25)


            this.vehicles[i].addCamera(view.camera)
            this.views.push(view)
        }
    }




    userSettingsListener() {
        this.socket.on("user-settings-changed", (data: IUserSettingsMessage) => {
            this.vehicles[data.playerNumber].updateVehicleSettings(data.userSettings.vehicleSettings)
        })
    }



    checkVehicleOutOfBounds(idx: number) {
        const pos = this.vehicles[idx].getPosition()
        if (this.course.checkIfObjectOutOfBounds(pos)) {
            this.resetPlayer(idx)
        }
    }

    updateScoreTable() {
        let s = "<table><th>Player |</th><th>Best LT |</th><th>Curr LT |</th><th>TT |</th><th>Ln</th>"
        for (let i = 0; i < this.vehicles.length; i++) {
            let cLapTime = this.gameTimers[i].getCurrentLapTime().toFixed(2)
            const bLT = this.gameTimers[i].getBestLapTime() === Infinity ? "-" : this.gameTimers[i].getBestLapTime()
            let totalTime = this.gameTimers[i].getTotalTime()
            if (this.gameTimers[i].finished()) {
                cLapTime = "Fin"
            }
            s += `<tr><td>${this.players[i].playerName}</td><td>${bLT}</td><td>${cLapTime}</td><td>${totalTime.toFixed(2)}</td><td>${this.gameTimers[i].lapNumber} / ${this.totalNumberOfLaps}</td></tr>`
        }
        s += "</table>"
        scoreTable.innerHTML = s
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
            this.renderer.setClearColor(new Color(255, 255, 255))


            this.views[i].camera.aspect = width / height;
            this.views[i].camera.updateProjectionMatrix();
            this.renderer.render(this.scene, this.views[i].camera);

            this.checkVehicleOutOfBounds(i)
        }

    }

    update() {
        if (this.courseLoaded) {
            stats.begin()
            if (startGameAuto) {
                driveVehicleWithKeyboard(this.vehicles[0], this.vehicleControls)
            }
            this.updateScoreTable()
            this.updateVehicles()

            stats.end()
        }
    }

    resetPlayer(idx: number) {
        this.vehicles[idx].resetPosition()
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

    prepareEndOfGameData() {
        const playerGameInfos: IPlayerGameInfo[] = []
        const playersData: IEndOfGameInfoPlayer[] = []
        for (let i = 0; i < this.vehicles.length; i++) {
            const playerData: IEndOfGameInfoPlayer = {
                totalTime: this.gameTimers[i].getTotalTime(),
                numberOfLaps: this.totalNumberOfLaps,
                playerName: this.players[i].playerName,
                playerId: this.players[i].id,
                bestLapTime: this.gameTimers[i].getBestLapTime(), //  this.bestLapTime[i],
                trackType: this.gameSettings.trackName,
                lapTimes: this.gameTimers[i].getLapTimes(),
                gameId: this.gameId,
                date: new Date(),
                private: false,
                isAuthenticated: this.players[i].isAuthenticated,
                vehicleType: this.players[i].vehicleType,
                engineForce: this.vehicles[i].engineForce,
                breakingForce: this.vehicles[i].breakingForce,
                steeringSensitivity: this.vehicles[i].steeringSensitivity
            }
            playersData.push(playerData)
            playerGameInfos.push({
                id: this.players[i].id ?? "undefined",
                name: this.players[i].playerName,
                totalTime: this.gameTimers[i].getTotalTime(),
                lapTimes: this.gameTimers[i].getLapTimes(),
                vehicleType: this.players[i].vehicleType,
                engineForce: this.vehicles[i].engineForce,
                breakingForce: this.vehicles[i].breakingForce,
                steeringSensitivity: this.vehicles[i].steeringSensitivity
            })
        }

        const endOfGameInfo: IEndOfGameInfoGame = {
            playersInfo: playerGameInfos,
            numberOfLaps: this.totalNumberOfLaps,
            trackType: this.gameSettings.trackName,
            gameId: this.gameId,
            roomId: this.roomId,
            date: new Date()
        }

        saveGameData(playersData, endOfGameInfo)
        // if save then update gameId
        this.gameId = uuid()
    }
}


export const startRaceGame = (socket: Socket, players: IPlayerInfo[], gameSettings: IGameSettings, roomId: string, escPress: () => void, callback: (gameObject: RaceGameScene) => void) => {
    const config = { scenes: [RaceGameScene], antialias: true }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)
        // console.log("project", project)
        // console.log("project.scenes[0]", project.scenes)
        // console.log("project.scenes[0]", project.scenes.keys().next().value)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        const gameObject = (project.scenes.get(key) as RaceGameScene);
        gameObject.setSocket(socket);
        gameObject.setPlayers(players);
        gameObject.setGameSettings(gameSettings, roomId, escPress);
        //setUnpauseFunc((project.scenes.get(key) as OneMonitorRaceGameScene).unpauseGame)
        console.log("starting game, players", players)
        callback(gameObject)
        return project
    })

}
