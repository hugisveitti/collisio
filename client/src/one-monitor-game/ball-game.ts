import { Color } from "@enable3d/three-wrapper/dist";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D } from "enable3d";
import { Socket } from "socket.io-client";
import { IPreGameSettings, IPlayerInfo } from "../classes/Game";
import { IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { SimpleCourt, SimpleCourtSettings } from "../shared-game-components/SquaredCourse";
import { addControls } from "../utils/controls";
import { VehicleControls } from "../utils/ControlsClasses";
import "./game-styles.css";
import { NormalVehicle } from "../vehicles/NormalVehicle";


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



export class PhysicsTest extends Scene3D {

    ball!: ExtendedObject3D
    players!: IPlayerInfo[]
    vehicles!: IVehicle[]
    font?: THREE.Font
    hasGoalScored = false
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    isLeader!: boolean
    court!: SimpleCourt
    views!: IView[]
    team0Goals: number
    team1Goals: number
    gameSettings: IPreGameSettings

    constructor() {
        super()
        this.team0Goals = 0
        this.team1Goals = 0
        scoreTable.setAttribute("id", "score-info")
        this.updateScoreTable()
        document.body.appendChild(scoreTable)
        this.gameSettings = {
            ballRadius: 1,
            numberOfLaps: 0,
            gameType: "ball",
            trackName: "low-poly-farm-track"
        }
    }

    setGameSettings(newGameSettings: IPreGameSettings) {
        this.gameSettings = newGameSettings
    }


    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateScoreTable() {
        scoreTable.innerHTML = `
        <span style="background-color:${team0Color}"><i>Team0</i></span>
        ${this.team0Goals}-${this.team1Goals}
        <span style="background-color:${team1Color}"><i>Team1</i></span> 
        `
    }


    async create() {


        this.createVehicles()
        this.createViews()
        this.createController()
        this.loadFont()

        // this.physics.debug?.enable()
        //this.physics.debug?.mode(2048 + 4096)
        this.warpSpeed("-ground")
        // this.warpSpeed()

        // const directional = this.lights.directionalLight({ intensity: 1 })
        // directional.position.set(5, 5, 5)

        const bricks = await this.load.texture("textures/bricks.jpg")
        bricks.wrapS = bricks.wrapT = 1000 // repeat
        bricks.offset.set(0, 0)
        bricks.repeat.set(50, 50)
        bricks.needsUpdate = true

        const courtSettings = new SimpleCourtSettings()
        this.court = new SimpleCourt(this, courtSettings)
        this.court.createGoals()
        this.court.createCourt(bricks)


        this.ball = this.physics.add.sphere({ y: 10, z: -5, mass: 10, radius: this.gameSettings.ballRadius }, { lambert: { color: "yellow" } })
        this.ball.body.setBounciness(1)



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

    createViews() {

        this.views = []
        const lefts = [0, 0.5]
        const bottoms = [0, 0, 0.5, 0.5]

        // only works for 2 players right now, need algorithm to make it dynamically calculate the size of each view
        for (let i = 0; i < this.players.length; i++) {
            const n = this.players.length
            const viewHeight = n > 2 ? .5 : 1.0
            let viewWidth: number
            if (n === 3) {
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
        if (this.court.checkIfObjectOutOfBounds(pos)) {
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

        this.checkIfBallOutOfBounds()
        this.checkIfGoal()
        this.updateVehicles()

    }


    goalWasScored(goalScoredOn: number) {
        if (this.font) {

            const textPosZ = goalScoredOn === 1 ? this.court.goalDepth - 5 : -this.court.goalDepth + 5

            const textGeo = new THREE.TextGeometry("GOAL", {
                font: this.font,
                size: 8,
                height: 1
            })
            textGeo.computeBoundingBox();
            this.textMesh = new THREE.Mesh(textGeo, new THREE.MeshLambertMaterial({ color: 0xee11ee }))
            this.textMesh.position.x = 15
            this.textMesh.position.y = 3
            this.textMesh.position.z = textPosZ
            this.textMesh.rotateY(goalScoredOn === 1 ? Math.PI : 0)
            this.add.existing(this.textMesh)

            if (goalScoredOn === 1) {
                this.team0Goals += 1
            } else {
                this.team1Goals += 1
            }
            this.updateScoreTable()
        }

        // texture in 2d space

        setTimeout(() => {
            this.hasGoalScored = false
            this.scene.remove(this.textMesh)
            this.resetBall()
            this.resetPlayers()
        }, 3000)
    }



    checkIfGoal() {
        if (!this.hasGoalScored) {

            const goalScoredOn = this.court.checkIfGoal(this.ball)

            if (goalScoredOn === 1 || goalScoredOn === 2) {
                this.hasGoalScored = true
                this.goalWasScored(goalScoredOn)
            }
        }
    }

    checkIfBallOutOfBounds() {
        const { x, y, z } = this.ball.position
        if (this.court.checkIfObjectOutOfBounds({ x, y, z } as SimpleVector)) {
            this.resetBall()
        }
    }

    resetPlayer(idx: number, y?: number) {
        let zPos: number, yRotation: number
        if (this.players[idx].teamNumber === 0) {
            zPos = 25
            yRotation = team1RotationY
        } else {
            zPos = -25
            yRotation = team0RotationY
        }
        const cW = this.court?.courtWidth ?? 30 - 10
        this.vehicles[idx].setPosition((Math.random() * cW) - (cW / 2), y ?? 4, zPos)
        this.vehicles[idx].setRotation(0, yRotation, 0)
    }


    resetPlayers() {
        console.log("reset players")
        for (let i = 0; i < this.vehicles.length; i++) {
            this.resetPlayer(i)
        }
    }

    resetBall() {
        this.ball.remove()
        this.scene.remove(this.ball)
        this.physics.destroy(this.ball)
        this.ball = this.physics.add.sphere({ y: 10, z: -20, mass: 100, radius: this.gameSettings.ballRadius }, { lambert: { color: "yellow" } })
        this.ball.body.setBounciness(0.5)
    }



    setPlayers(players: IPlayerInfo[]) {
        this.players = players
    }

    createVehicles() {
        console.log("create vehicles")
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


export const startBallGameOneMonitor = (socket: Socket, players: IPlayerInfo[], gameSettings: IPreGameSettings) => {
    const config = { scenes: [PhysicsTest], antialias: true, }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)
        console.log("project", project)
        console.log("project.scenes[0]", project.scenes)
        console.log("project.scenes[0]", project.scenes.keys().next().value)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        (project.scenes.get(key) as PhysicsTest).setSocket(socket);
        (project.scenes.get(key) as PhysicsTest).setPlayers(players);
        (project.scenes.get(key) as PhysicsTest).setGameSettings(gameSettings);
        return project
    })

}
