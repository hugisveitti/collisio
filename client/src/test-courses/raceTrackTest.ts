import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d"
import { IVehicle, SimpleVector } from "../models/IVehicle"
import { createNormalVehicle, } from "../models/NormalVehicle"
import { THREE } from "enable3d"
import { Socket } from "socket.io-client"
import { defaultGameSettings, IGameSettings, IPlayerInfo } from "../classes/Game"
import { RaceCourse } from "../shared-game-components/raceCourse";
import { addTestControls, testDriveVehicleWithKeyboard } from "./testControls";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { OrbitControls } from "@enable3d/three-wrapper/dist/index";
import { createConstraintVehicle } from "../models/ConstraintVehicle"
import Stats from "stats.js"
import { VehicleControls } from "../utils/ControlsClasses"


const vechicleFov = 60


const scoreTable = document.createElement("div")
const lapTimeDiv = document.createElement("div")
const bestLapTimeDiv = document.createElement("div")
const stats = new Stats()

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

// contraint
let currVechicleType = "normal"
let rs = false

export class OneMonitorRaceGameScene extends Scene3D {

    vehicle?: IVehicle

    font?: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    course!: RaceCourse
    gameSettings: IGameSettings
    raceStarted: boolean
    checkpointCrossed: boolean
    currentLaptime: number
    timeStarted: number
    bestLapTime: number
    canStartUpdate: boolean

    constructor() {
        super()

        scoreTable.setAttribute("id", "score-info")
        lapTimeDiv.setAttribute("id", "lap-time")
        bestLapTimeDiv.setAttribute("id", "best-lap-time")


        this.updateScoreTable()
        document.body.appendChild(scoreTable)
        document.body.append(lapTimeDiv)
        document.body.append(bestLapTimeDiv)

        this.raceStarted = false
        this.checkpointCrossed = false
        this.bestLapTime = 10000
        this.canStartUpdate = false

        this.gameSettings = defaultGameSettings

        this.currentLaptime = 0
        this.timeStarted = 0

        stats.showPanel(0)
        document.body.appendChild(stats.dom)

    }



    createVehicle() {
        this.vehicle = createNormalVehicle(this, "blue", "test")
        this.vehicle.addCamera(this.camera)
        this.camera.position.set(0, 15, -23)
        this.vehicle.setPosition(163, 4, -17)
        this.vehicle.setRotation(0, 180, 0)
        this.createController()
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

    piss() {
        console.log("piss")
    }

    async preload() {

        this.loadFont()
        // this.physics.debug?.enable()

        this.warpSpeed("-ground")

        this.course = new RaceCourse(this, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(() => {
            console.log("course loaded")
            this.canStartUpdate = true
            //   this.renderer.setAnimationLoop(() => this.update())
            this.createVehicle()
        })



        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize())

        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {
                console.log("rrr")
                this.resetPlayer(0)
            }
            if (e.key === "n") {
                if (currVechicleType === "normal") {
                    currVechicleType = "constraint"
                    this.vehicle = createConstraintVehicle(this, "red")
                } else {
                    currVechicleType = "normal"
                    this.vehicle = createNormalVehicle(this, "red", "testt")
                }
            }
        })
    }

    handleGoalCrossed(vehicle: ExtendedObject3D) {

        if (!this.raceStarted) {
            this.raceStarted = true
            this.timeStarted = Date.now()
        }

        if (this.raceStarted && this.checkpointCrossed) {
            this.checkpointCrossed = false
            this.currentLaptime = (Date.now() - this.timeStarted) / 1000
            this.timeStarted = Date.now()
            if (this.currentLaptime < this.bestLapTime) {
                this.bestLapTime = this.currentLaptime
            }
            bestLapTimeDiv.innerHTML = `Best lap time ${this.bestLapTime.toFixed(2)}`

        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        this.checkpointCrossed = true
    }


    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.camera.type === "PerspectiveCamera") {
            (this.camera as unknown as PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
        }
        this.camera.updateProjectionMatrix();
    }


    setSocket(socket: Socket) {
        this.socket = socket
    }

    createController() {
        if (this.vehicle) {
            this.vehicleControls = new VehicleControls()
            addTestControls(this.vehicleControls, this.socket, this.vehicle)
        }
    }

    checkVehicleOutOfBounds(idx: number) {
        if (this.vehicle) {
            const pos = this.vehicle.getPosition()
            if (this.course.checkIfObjectOutOfBounds(pos)) {
                this.resetPlayer(idx, 20)
            }
        }
    }

    updateVehicles() {
        if (this.vehicle) {
            this.vehicle.update()
            this.vehicle.cameraLookAt(this.camera)
        }
    }


    update() {
        if (this.canStartUpdate) {


            stats.begin()
            this.updateVehicles()
            if (this.vehicle) {
                testDriveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
                const pos = this.vehicle.getPosition()
                scoreTable.innerHTML = `x: ${pos.x.toFixed(2)}, z:${pos.z.toFixed(2)}`
                this.course.checkIfVechileCrossedGoal(this.vehicle)
            }
            stats.end()

            if (this.raceStarted) {
                lapTimeDiv.innerHTML = ((Date.now() - this.timeStarted) / 1000).toFixed(2)
            }
        }

    }

    resetPlayer(idx: number, y?: number) {

        if (this.vehicle) {
            const { x, z } = this.vehicle.getPosition()
            const rot = this.vehicle.getRotation()
            this.vehicle.setPosition(x, 4, z)
            this.vehicle.setRotation(0, rot.y, 0)
        }
    }


    loadFont() {
        const fontName = "helvetiker"
        const fontWeight = "regular"
        const loader = new THREE.FontLoader();
        loader.load('fonts/' + fontName + '_' + fontWeight + '.typeface.json', (response) => {

            this.font = response;
            if (this.font && this.vehicle) {
                this.vehicle.setFont(this.font)
            }
        });
    }

}


export const startRaceTrackTest = (socket: Socket, gameSettings: IGameSettings) => {

    const config = { scenes: [OneMonitorRaceGameScene], antialias: true }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)
        console.log("project", project)
        console.log("project.scenes[0]", project.scenes)
        console.log("project.scenes[0]", project.scenes.keys().next().value)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        (project.scenes.get(key) as OneMonitorRaceGameScene).setSocket(socket);
        //       (project.scenes.get(key) as OneMonitorRaceGameScene).createVehicle();
        (project.scenes.get(key) as OneMonitorRaceGameScene).setGameSettings(gameSettings);
        return project
    })

}
