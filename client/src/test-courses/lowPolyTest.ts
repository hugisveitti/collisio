import { OrbitControls } from "@enable3d/three-wrapper/dist/index"
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from "enable3d"
import { Socket } from "socket.io-client"
import Stats from "stats.js"
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera"
import { defaultGameSettings, IGameSettings } from "../classes/Game"
import { loadLowPolyVehicleModels, LowPolyVehicle, VehicleType } from "../vehicles/LowPolyVehicle"
import "../one-monitor-game/game-styles.css"
import { RaceCourse } from "../shared-game-components/raceCourse"
import { MobileControls, VehicleControls } from "../utils/ControlsClasses"
import "./lowPolyTest.css"
import { addTestControls, testDriveVehicleWithKeyboard } from "./testControls"

const vechicleFov = 60


const scoreTable = document.createElement("div")
const lapTimeDiv = document.createElement("div")
const bestLapTimeDiv = document.createElement("div")
const stats = new Stats()




export class LowPolyTestScene extends Scene3D {

    vehicle?: LowPolyVehicle

    font?: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    // course!: RaceCourse
    gameSettings: IGameSettings
    raceStarted: boolean
    checkpointCrossed: boolean
    goalCrossed: boolean
    currentLaptime: number
    timeStarted: number
    bestLapTime: number
    canStartUpdate: boolean
    course: RaceCourse
    pLight: THREE.PointLight
    useShadows: boolean
    vehicleType: VehicleType
    mobileControls: MobileControls

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
        this.goalCrossed = false
        this.bestLapTime = 10000
        this.canStartUpdate = false

        this.gameSettings = defaultGameSettings

        this.currentLaptime = 0
        this.timeStarted = 0

        stats.showPanel(0)
        document.body.appendChild(stats.dom)
        this.useShadows = true
        this.vehicleType = "f1"
        this.mobileControls = new MobileControls()
    }

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        this.physics.setGravity(0, -20, 0)
    }

    async preload() {


        this.physics.debug?.enable()
        const { lights } = await this.warpSpeed('-ground', "-light")
        // this.dirLight = lights.directionalLight
        // const helper = new THREE.CameraHelper(this.dirLight.shadow.camera);
        // this.scene.add(helper)
        // this.scene.add(this.dirLight.target)



        this.pLight = new THREE.PointLight(0xffffff, 1, 0, 1)
        this.pLight.position.set(100, 150, 100);

        this.scene.add(this.pLight);
        if (this.useShadows) {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }
        console.log("plight", this.pLight)
        const helper = new THREE.CameraHelper(this.pLight.shadow.camera);
        this.scene.add(helper)
        console.log("plight helper", helper)


        const hLight = new THREE.HemisphereLight(0xffffff, 1)
        hLight.position.set(0, 1, 0)
        this.scene.add(hLight)

        const aLight = new THREE.AmbientLight(0xffffff, 1)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)


        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize())

        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {

                this.resetPlayer(0)
            } else if (e.key === "t") {
                //  this.vehicle.chassisMesh.body.setCollisionFlags(0)
            } else if (e.key === "p") {
                if (this.vehicle.isPaused) {
                    this.vehicle.unpause()
                    this.vehicle.gameTime.start()
                } else {
                    this.vehicle.pause()
                    this.vehicle.gameTime.stop()

                }
            } else if (e.key === "o") {
                this.vehicle.setPosition(0, 4, 0)
                this.vehicle.setRotation(Math.PI, 0, 0)
            }
        })

        this.vehicle = new LowPolyVehicle(this, "blue", "test hugi", 0, this.vehicleType)

    }

    async create() {
        // test-course.gltf
        // low-poly-farm-track
        this.course = new RaceCourse(this, "test-course", (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            loadLowPolyVehicleModels(this.vehicleType, (tires, chassises,) => {
                this.vehicle.addModels(tires, chassises[Math.floor(Math.random() * chassises.length)],)

                this.createController()
                this.vehicle.useChaseCamera = true
                this.vehicle.addCamera(this.camera as THREE.PerspectiveCamera)
                const p = this.course.goalSpawn.position
                const r = this.course.goalSpawn.rotation
                this.vehicle.setCheckpointPositionRotation({ position: { x: p.x, z: p.z, y: p.y }, rotation: { x: 0, z: 0, y: r.y } })
                this.vehicle.resetPosition()
                // this.dirLight.target = this.vehicle.chassisMesh
                this.camera.position.set(0, 10, -25)
                this.loadFont()


                const engineInputDiv = document.createElement("div")
                engineInputDiv.setAttribute("class", "vehicle-input")
                engineInputDiv.innerHTML = "Engine force"

                const engineInput = document.createElement("input")
                engineInput.setAttribute("type", "number")
                engineInput.setAttribute("placeholder", "engine force")

                engineInput.setAttribute("value", this.vehicle.engineForce + "")

                engineInput.addEventListener("input", (e) => {
                    console.log("e", e)
                    if (e.target instanceof HTMLInputElement) {
                        e.target.value
                        //console.log("target", target)
                        if (!isNaN(+e.target.value)) {
                            this.vehicle.updateVehicleSettings({
                                ...this.vehicle.vehicleSettings,
                                // I think this will still work in changing the engineForce
                                // @ts-ignore
                                engineForce: +e.target.value,
                            })
                        }
                    }
                })
                engineInputDiv.appendChild(engineInput)
                document.body.appendChild(engineInputDiv)

                const massInputDiv = document.createElement("div")
                massInputDiv.setAttribute("class", "vehicle-input")
                massInputDiv.setAttribute("style", "top:25px;")
                massInputDiv.innerHTML = "Mass"
                const massInput = document.createElement("input")
                massInput.setAttribute("type", "number")
                massInput.setAttribute("placeholder", "mass")

                massInput.setAttribute("value", this.vehicle.mass + "")
                massInput.addEventListener("input", (e) => {
                    console.log("e", e)
                    if (e.target instanceof HTMLInputElement) {
                        e.target.value
                        //console.log("target", target)
                        if (!isNaN(+e.target.value)) {
                            this.vehicle.updateMass(
                                +e.target.value

                            )
                        }
                    }
                })
                massInputDiv.appendChild(massInput)
                document.body.appendChild(massInputDiv)

                const breakInputDiv = document.createElement("div")
                breakInputDiv.setAttribute("class", "vehicle-input")
                breakInputDiv.setAttribute("style", "top:50px;")
                breakInputDiv.innerHTML = "Break force"
                const breakInput = document.createElement("input")

                breakInput.setAttribute("type", "number")
                breakInput.setAttribute("placeholder", "break")
                breakInput.setAttribute("value", this.vehicle.breakingForce + "")
                breakInput.addEventListener("input", (e) => {
                    if (e.target instanceof HTMLInputElement) {
                        e.target.value
                        //console.log("target", target)
                        if (!isNaN(+e.target.value)) {
                            this.vehicle.updateBreakingForce(
                                +e.target.value

                            )
                        }
                    }
                })

                breakInputDiv.appendChild(breakInput)
                document.body.appendChild(breakInputDiv)

                const useChaseCamButtontDiv = document.createElement("div")
                useChaseCamButtontDiv.setAttribute("class", "vehicle-input")
                useChaseCamButtontDiv.setAttribute("style", "top:75px;")
                useChaseCamButtontDiv.innerHTML = "Chase cam"
                const useChaseCamButton = document.createElement("button")


                useChaseCamButton.innerHTML = this.vehicle.useChaseCamera ? "ON" : "OFF"
                useChaseCamButton.addEventListener("click", (e) => {
                    this.vehicle.updateVehicleSettings({
                        ...this.vehicle.vehicleSettings,
                        useChaseCamera: !this.vehicle.useChaseCamera
                    })
                    useChaseCamButton.innerHTML = this.vehicle.useChaseCamera ? "ON" : "OFF"

                })

                useChaseCamButtontDiv.appendChild(useChaseCamButton)
                document.body.appendChild(useChaseCamButtontDiv)

                const ball = this.physics.add.sphere({ radius: 1, mass: 10, x: 0, y: 4, z: 0 })
                ball.body.setBounciness(1)
                this.canStartUpdate = true

            })
        })
    }

    handleGoalCrossed(o: ExtendedObject3D) {
        if (!this.goalCrossed) {
            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicle.setCheckpointPositionRotation({ position: { x: p.x, y: p.y, z: p.z }, rotation: { x: 0, y: r.y, z: 0 } })
            this.checkpointCrossed = false

            if (!this.raceStarted) {
                this.vehicle.gameTime.start();
                this.raceStarted = true
            } else {
                this.vehicle.gameTime.lapDone()
            }
        }
        this.goalCrossed = true
    }

    handleCheckpointCrossed(o: ExtendedObject3D) {
        if (!this.checkpointCrossed) {
            this.goalCrossed = false
            const p = this.course.checkpointSpawn.position
            const r = this.course.checkpointSpawn.rotation

            this.vehicle.setCheckpointPositionRotation({ position: { x: p.x, y: p.y, z: p.z }, rotation: { x: 0, y: r.y, z: 0 } })
        }
        this.checkpointCrossed = true
    }



    setGameSettings(newGameSettings: IGameSettings) {
        this.gameSettings = newGameSettings
    }

    updateScoreTable() {
        scoreTable.innerHTML = `
        Leaderboard
        `
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
            addTestControls(this.vehicleControls, this.socket, this.vehicle, (mc) => this.mobileControls = mc)
        }
    }


    updateVehicles() {

        if (this.vehicle) {
            this.vehicle.update()
            this.vehicle.cameraLookAt(this.camera as THREE.PerspectiveCamera)
        }
    }

    update() {
        if (this.canStartUpdate) {

            stats.begin()
            this.updateVehicles()
            if (this.vehicle) {
                testDriveVehicleWithKeyboard(this.vehicle, this.vehicleControls, this.mobileControls)
                const pos = this.vehicle.getPosition()
                scoreTable.innerHTML = `x: ${pos.x.toFixed(2)}, z:${pos.z.toFixed(2)} 
                <br />
                km/h: ${this.vehicle.getCurrentSpeedKmHour().toFixed(0)}
                `
            }
            stats.end()

            if (this.raceStarted) {
                lapTimeDiv.innerHTML = this.vehicle.gameTime.getCurrentLapTime() + ""
                bestLapTimeDiv.innerHTML = this.vehicle.gameTime.getBestLapTime() + ""
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
                console.log("setting font")
                this.vehicle.setFont(this.font)
            }
        });
    }

}


export const startLowPolyTest = (socket: Socket, gameSettings: IGameSettings) => {
    const config = { scenes: [LowPolyTestScene], antialias: true, randomStuff: "hello" }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        (project.scenes.get(key) as LowPolyTestScene).setSocket(socket);
        // (project.scenes.get(key) as LowPolyTestScene).createVehicle();
        (project.scenes.get(key) as LowPolyTestScene).setGameSettings(gameSettings);
        return project
    })

}
