import { OrbitControls } from "@enable3d/three-wrapper/dist/index"
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from "enable3d"
import { Socket } from "socket.io-client"
import Stats from "stats.js"
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera"
import { defaultGameSettings, IGameSettings } from "../classes/Game"
import { createNormalVehicle, NormalVehicle } from "../models/NormalVehicle"
import "../one-monitor-game/game-styles.css"
import { RaceCourse } from "../shared-game-components/raceCourse"
import { VehicleControls } from "../utils/ControlsClasses"
import { addTestControls, testDriveVehicleWithKeyboard } from "./testControls"

const vechicleFov = 60


const scoreTable = document.createElement("div")
const lapTimeDiv = document.createElement("div")
const bestLapTimeDiv = document.createElement("div")
const stats = new Stats()

const numDecimals = 2



export class OneMonitorRaceGameScene extends Scene3D {

    vehicle?: NormalVehicle

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
    dirLight: THREE.DirectionalLight
    useShadows = false

    constructor() {
        super({ key: "OneMonitorRaceGameScene" })

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

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)


        this.physics.setGravity(0, -20, 0)
    }

    async preload() {

        this.loadFont()
        // this.physics.debug?.enable()

        // this.warpSpeed("-ground")
        //   this.warpSpeed("sky")
        const hLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        this.scene.add(hLight)

        const vertexShader = '\n\n\t\t\tvarying vec3 vWorldPosition;\n\n\t\t\tvoid main() {\n\n\t\t\t\tvec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n\t\t\t\tvWorldPosition = worldPosition.xyz;\n\n\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t\t}\n\n\t\t'
        const fragmentShader = '\n\n\t\t\tuniform vec3 topColor;\n\t\t\tuniform vec3 bottomColor;\n\t\t\tuniform float offset;\n\t\t\tuniform float exponent;\n\n\t\t\tvarying vec3 vWorldPosition;\n\n\t\t\tvoid main() {\n\n\t\t\t\tfloat h = normalize( vWorldPosition + offset ).y;\n\t\t\t\tgl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );\n\n\t\t\t}\n\n\t\t'
        const uniforms = {
            "topColor": { value: new THREE.Color(0x0077ff) },
            "bottomColor": { value: new THREE.Color(0xffffff) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms["topColor"].value.copy(new THREE.Color(0x0077ff));
        // uniforms["topColor"].value.copy(hLight.color);

        // this.scene.fog.color.copy(uniforms["bottomColor"].value);

        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);


        this.dirLight = new THREE.DirectionalLight(0xffffff, .1)
        this.dirLight.position.set(0, 1200, -250)

        this.scene.add(this.dirLight)


        this.course = new RaceCourse(this, "track", (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            this.canStartUpdate = true
            this.createVehicle()
        })



        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize())

        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {

                this.resetPlayer(0)
            } else if (e.key === "t") {
                this.vehicle.chassisMesh.body.setCollisionFlags(0)
            } else if (e.key === "p") {
                if (this.vehicle.isPaused) {
                    this.vehicle.unpause()
                } else {
                    this.vehicle.pause()
                }
            }
        })
    }

    async create() {

    }

    createVehicle() {
        this.vehicle = createNormalVehicle(this, "blue", "test")
        this.vehicle.addCamera(this.camera)
        this.camera.position.set(0, 15, -23)
        const p = this.course.goalSpawn.position
        const r = this.course.goalSpawn.rotation
        this.vehicle.setCheckpointPositionRotation({ position: { x: 158, y: 3, z: -72 }, rotation: { x: 0, y: r.y, z: 0 } })
        this.vehicle.resetPosition()
        this.createController()


    }

    setGameSettings(newGameSettings: IGameSettings) {
        this.gameSettings = newGameSettings
    }

    updateScoreTable() {
        scoreTable.innerHTML = `
        Leaderboard
        `
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
            this.vehicle.setCheckpointPositionRotation({ position: this.course.goalSpawn.position, rotation: this.course.goalSpawn.rotation })

        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        this.checkpointCrossed = true
        const p = this.course.checkpointSpawn.position
        this.vehicle.setCheckpointPositionRotation({ position: p, rotation: this.course.checkpointSpawn.rotation })
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
            this.vehicle.resetPosition()
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
    const config = { scenes: [OneMonitorRaceGameScene], antialias: true, randomStuff: "hello" }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        (project.scenes.get(key) as OneMonitorRaceGameScene).setSocket(socket);
        //       (project.scenes.get(key) as OneMonitorRaceGameScene).createVehicle();
        (project.scenes.get(key) as OneMonitorRaceGameScene).setGameSettings(gameSettings);
        return project
    })

}
