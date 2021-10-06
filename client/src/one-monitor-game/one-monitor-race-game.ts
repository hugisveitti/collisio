import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d"
import { IVehicle, SimpleVector } from "../models/IVehicle"
import { addControls, VehicleControls, } from "../utils/controls"
import { NormalVehicle } from "../models/NormalVehicle"
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { Socket } from "socket.io-client"
import { IGameSettings, IPlayerInfo } from "../classes/Game"
import { SimpleCourt, SimpleCourtSettings, } from "../shared-game-components/squaredCourse"
import { Color } from "@enable3d/three-wrapper/dist"
import "./one-monitor-styles.css"
import { RaceCourse } from "../shared-game-components/raceCourse";


const vechicleFov = 60

const team0Color = "blue"
const team1Color = "red"
const team0RotationY = 0
const team1RotationY = 180

const scoreTable = document.createElement("div")


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

    constructor() {
        super()

        scoreTable.setAttribute("id", "score-info")
        this.updateScoreTable()
        document.body.appendChild(scoreTable)
        this.gameSettings = {
            ballRadius: 1,
            typeOfGame: "race"
        }
    }

    setGameSettings(newGameSettings: IGameSettings) {
        this.gameSettings = newGameSettings
    }


    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateScoreTable() {
        scoreTable.innerHTML = `
        Leaderboard
        `
    }


    async create() {

        this.createVehicles()
        this.createViews()
        this.createController()
        this.loadFont()

        this.physics.debug?.enable()
        //this.physics.debug?.mode(2048 + 4096)
        this.warpSpeed("-ground")

        this.course = new RaceCourse(this, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse()


        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                this.resetPlayers()
            }
        })
        window.addEventListener("resize", () => this.onWindowResize())
    }


    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleGoalCrossed(vehicle: ExtendedObject3D) {

    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) { }

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
            this.resetPlayer(idx, 20)
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
        this.updateVehicles()
    }

    resetPlayer(idx: number, y?: number) {
        const zPos = 10


        const cW = Math.random() * 20 - 10
        this.vehicles[idx].setPosition(cW, y ?? 4, zPos)
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
            const color = this.players[i].teamNumber === 1 ? team1Color : team0Color
            this.vehicles.push(new NormalVehicle(this, color, this.players[i].playerName))
            this.resetPlayers()
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
