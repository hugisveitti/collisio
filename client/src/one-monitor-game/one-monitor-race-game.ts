import { Color } from "@enable3d/three-wrapper/dist";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import Stats from "stats.js";
import { IGameSettings, IPlayerInfo } from "../classes/Game";
import { IVehicle, SimpleVector } from "../models/IVehicle";
import { NormalVehicle } from "../models/NormalVehicle";
import { RaceCourse } from "../shared-game-components/raceCourse";
import { addControls } from "../utils/controls";
import { VehicleControls } from "../utils/ControlsClasses";
import "./one-monitor-styles.css";

const vechicleFov = 60

const possibleColors = ["red", "blue", "green", "yellow", "brown", "black", "white"]


const stats = new Stats()
const scoreTable = document.createElement("div")
const importantInfoDiv = document.createElement("div")


const numDecimals = 2
const getSimpleVectorString = (vec: SimpleVector) => {
    if (!vec) return ""
    return `x: ${vec.x.toFixed(numDecimals)} y: ${vec.y.toFixed(numDecimals)} z: ${vec.z.toFixed(numDecimals)}`
}

const simpleVecDistance = (vec1: SimpleVector, vec2: SimpleVector) => {
    const x = vec1.x - vec2.x
    const y = vec1.y - vec2.y
    const z = vec1.z - vec2.z
    return Math.sqrt((x * x) + (z * z) + (y * y))
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

export class OneMonitorRaceGameScene extends Scene3D {

    players!: IPlayerInfo[]
    vehicles!: IVehicle[]
    font?: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    course!: RaceCourse
    views!: IView[]
    gameSettings: IGameSettings
    raceStarted: boolean
    checkpointCrossed: boolean[]
    goalCrossed: boolean[]
    timeStarted: number
    bestLapTime: number[]
    lapNumber: number[]
    totalTime: number[]
    currentLapStart: number[]
    courseLoaded: boolean


    constructor() {
        super()

        scoreTable.setAttribute("id", "score-info")
        importantInfoDiv.setAttribute("id", "important-info")

        document.body.appendChild(scoreTable)
        document.body.appendChild(importantInfoDiv)
        importantInfoDiv.innerHTML = "Loading course..."
        this.gameSettings = {
            ballRadius: 1,
            typeOfGame: "race"
        }

        this.raceStarted = false
        this.checkpointCrossed = []
        this.goalCrossed = []
        this.timeStarted = 0
        this.currentLapStart = []
        this.bestLapTime = []
        this.lapNumber = []
        this.totalTime = []
        this.courseLoaded = false

    }

    setGameSettings(newGameSettings: IGameSettings) {
        this.gameSettings = newGameSettings
    }

    startRaceCountdown() {
        let countdown = 4
        const timer = () => {
            importantInfoDiv.innerHTML = countdown + ""
            countdown -= 1
            setTimeout(() => {
                if (countdown > 0) {
                    timer()
                } else {
                    this.raceStarted = true
                    importantInfoDiv.innerHTML = "GO!!!!"
                    this.startAllVehicles()
                    this.timeStarted = Date.now()
                    for (let i = 0; i < this.vehicles.length; i++) {
                        this.currentLapStart.push(Date.now())
                    }
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
        }
    }

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateScoreTable() {
        const currentLapTimes = []
        let s = "<table><th>Player |</th><th>Best LT |</th><th>Curr LT |</th><th>Ln</th>"
        for (let i = 0; i < this.vehicles.length; i++) {
            const cLapTime = (Date.now() - this.currentLapStart[i]) / 1000
            currentLapTimes.push(cLapTime)
            s += `<tr><td>${this.players[i].playerName}</td><td>${this.bestLapTime[i]}</td><td>${currentLapTimes}</td><td>${this.lapNumber[i]}</td></tr>`
        }
        s += "</table>"
        scoreTable.innerHTML = s
    }


    async create() {

        this.createVehicles()
        this.createViews()
        this.createController()
        this.loadFont()

        // this.physics.debug?.enable()
        // this.physics.debug?.mode(2048 + 4096)
        this.warpSpeed("-ground")

        this.course = new RaceCourse(this, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(() => {
            this.courseLoaded = true
            importantInfoDiv.innerHTML = "Race starting in"
        })

        stats.showPanel(0)
        document.body.appendChild(stats.dom)


        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.resetPlayers()
            }
        })
        window.addEventListener("resize", () => this.onWindowResize())
        setTimeout(() => {
            this.startRaceCountdown()
        }, 2000)
    }


    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = vehicle.body.name.slice(8, 9)
        if (this.checkpointCrossed[vehicleNumber]) {
            this.lapNumber[vehicleNumber] += 1
            this.checkpointCrossed[vehicleNumber] = false
            const cLapTime = (Date.now() - this.currentLapStart[vehicleNumber]) / 1000
            this.bestLapTime[vehicleNumber] = Math.min(this.bestLapTime[vehicleNumber], cLapTime)
            this.currentLapStart[vehicleNumber] = Date.now()
        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        const vehicleNumber = vehicle.body.name.slice(8, 9)
        this.checkpointCrossed[vehicleNumber] = true
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
            view.camera.position.set(0, 15, -23)

            this.vehicles[i].addCamera(view.camera)
            this.views.push(view)
        }
    }

    setSocket(socket: Socket) {
        this.socket = socket
    }

    createController() {
        this.vehicleControls = new VehicleControls()
        addControls(this.vehicleControls, this.socket, this.vehicles)
    }

    checkVehicleOutOfBounds(idx: number) {
        const pos = this.vehicles[idx].getPosition()
        if (this.course.checkIfObjectOutOfBounds(pos)) {
            this.resetPlayer(idx, 20, 0, 0)
        }
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
            this.updateScoreTable()
            this.updateVehicles()
            stats.end()
        }
    }

    resetPlayer(idx: number, y?: number, x?: number, z?: number) {
        const zPos = 10


        const cW = Math.random() * 20 - 10
        this.vehicles[idx].setPosition(x ?? cW, y ?? 4, z ?? zPos)
        this.vehicles[idx].setRotation(0, 0, 0)
    }


    resetPlayers() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.resetPlayer(i)
        }
    }


    setPlayers(players: IPlayerInfo[]) {
        this.players = players
    }

    createVehicles() {
        this.vehicles = []
        for (let i = 0; i < this.players.length; i++) {
            const color = possibleColors[i]
            this.vehicles.push(new NormalVehicle(this, color, this.players[i].playerName, i))
            this.vehicles[i].setPosition(163, 4, -17 - (i * 5))
            this.vehicles[i].setRotation(0, 180, 0)
            this.vehicles[i].canDrive = false
            this.checkpointCrossed.push(false)
            this.goalCrossed.push(false)
            this.lapNumber.push(1)
            this.totalTime.push(0)
            this.bestLapTime.push(Infinity)
        }
    }

    loadFont() {
        const fontName = "helvetiker"
        const fontWeight = "regular"
        const loader = new THREE.FontLoader();
        loader.load('fonts/' + fontName + '_' + fontWeight + '.typeface.json', (response) => {

            this.font = response;
            if (this.font) {
                for (let i = 0; i < this.vehicles.length; i++)
                    this.vehicles[i].setFont(this.font as THREE.Font)
            }
        });

    }
}


export const startRaceGameOneMonitor = (socket: Socket, players: IPlayerInfo[], gameSettings: IGameSettings) => {
    const config = { scenes: [OneMonitorRaceGameScene], antialias: true }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)
        console.log("project", project)
        console.log("project.scenes[0]", project.scenes)
        console.log("project.scenes[0]", project.scenes.keys().next().value)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        (project.scenes.get(key) as OneMonitorRaceGameScene).setSocket(socket);
        (project.scenes.get(key) as OneMonitorRaceGameScene).setPlayers(players);
        (project.scenes.get(key) as OneMonitorRaceGameScene).setGameSettings(gameSettings);
        return project
    })

}
