import { OrbitControls } from "@enable3d/three-wrapper/dist/index"
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from "enable3d"
import { Socket } from "socket.io-client"
import Stats from "stats.js"
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera"
import { defaultPreGameSettings, IPreGameSettings } from "../classes/Game"
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle"
import { VehicleType } from "../vehicles/VehicleConfigs";
import "../one-monitor-game/game-styles.css"
import { RaceCourse } from "../shared-game-components/raceCourse"
import { MobileControls, VehicleControls } from "../utils/ControlsClasses"
import "./lowPolyTest.css"
import { addTestControls, testDriveVehicleWithKeyboard } from "./testControls"
import { IGameScene } from "../one-monitor-game/IGameScene"
import { IUserGameSettings } from "../classes/User"
import { GameTime } from "../one-monitor-game/GameTimeClass"
import { LowPolyTestVehicle } from "../vehicles/LowPolyTestVehicle"
import { SimpleVector } from "../vehicles/IVehicle"

const vechicleFov = 60


const scoreTable = document.createElement("div")
const lapTimeDiv = document.createElement("div")
const bestLapTimeDiv = document.createElement("div")
const stats = new Stats()

const vehicleInputsContainer = document.createElement("div")
document.body.appendChild(vehicleInputsContainer)


export class LowPolyTestScene extends Scene3D implements IGameScene {

    vehicle?: LowPolyTestVehicle

    font?: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls
    // course!: RaceCourse
    gameSettings: IPreGameSettings
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
    gameTime: GameTime
    escPress: () => void
    isPaused = false


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

        this.gameSettings = defaultPreGameSettings

        this.currentLaptime = 0
        this.timeStarted = 0

        stats.showPanel(0)
        document.body.appendChild(stats.dom)
        this.useShadows = true
        // monsterTruck, tractor

        this.vehicleType = window.localStorage.getItem("vehicleType") as VehicleType ?? "normal"
        this.mobileControls = new MobileControls()

        this.gameTime = new GameTime(3)
    }

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        this.physics.setGravity(0, -20, 0)
    }

    async preload() {


        this.physics.debug?.enable()
        await this.warpSpeed('-ground', "-light")



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
                    this.gameTime.start()
                } else {
                    this.vehicle.pause()
                    this.gameTime.stop()

                }
            } else if (e.key === "o") {
                this.vehicle.setPosition(0, 4, 0)
                this.vehicle.setRotation(Math.PI, 0, 0)
            } else if (e.key === "h") {
                this.vehicle.stop()
                this.vehicle.start()
                this.vehicle.setPosition(4, 15, 0)
                this.vehicle.setRotation(0, 0, 0)
            }


        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.escPress()
                this.togglePauseGame()
            }
        })

        this.vehicle = new LowPolyTestVehicle(this, "blue", "test hugi", 0, this.vehicleType)
    }

    async create() {
        // test-course.gltf
        // low-poly-farm-track
        this.course = new RaceCourse(this, "test-course", (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            this.createVehicle()
        })
    }

    createVehcileInput(value: number, top: number, innerHtml: string, onChange: (val: number) => void) {
        const inputDiv = document.createElement("div")
        inputDiv.setAttribute("class", "vehicle-input")
        inputDiv.setAttribute("style", `top:${top}px;`)
        inputDiv.innerHTML = innerHtml
        const input = document.createElement("input")

        input.setAttribute("type", "number")
        input.setAttribute("value", value + "")
        input.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                e.target.value

                if (!isNaN(+e.target.value)) {
                    onChange(+e.target.value)
                }
            }
        })

        inputDiv.appendChild(input)
        vehicleInputsContainer.appendChild(inputDiv)
    }

    createXYZInput(currVec: SimpleVector, top: number, innerHtml: string, onChange: (vec: SimpleVector) => void) {
        let cVec = currVec
        let inputWidth = 60
        const inputDiv = document.createElement("div")
        inputDiv.setAttribute("class", "vehicle-input")
        inputDiv.setAttribute("style", `top:${top}px;`)
        inputDiv.innerHTML = innerHtml
        const inputX = document.createElement("input")

        inputX.setAttribute("type", "number")
        inputX.setAttribute("value", cVec.x + "")
        inputX.setAttribute("style", `width:${inputWidth}px;`)
        inputX.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                e.target.value

                if (!isNaN(+e.target.value)) {
                    cVec.x = +e.target.value
                    onChange(cVec)
                }
            }
        })

        inputDiv.appendChild(inputX)

        const inputY = document.createElement("input")

        inputY.setAttribute("type", "number")
        inputY.setAttribute("value", cVec.y + "")
        inputY.setAttribute("style", `width:${inputWidth}px;`)
        inputY.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                e.target.value

                if (!isNaN(+e.target.value)) {
                    cVec.y = +e.target.value
                    onChange(cVec)
                }
            }
        })

        inputDiv.appendChild(inputY)

        const inputZ = document.createElement("input")

        inputZ.setAttribute("type", "number")
        inputZ.setAttribute("value", cVec.z + "")
        inputZ.setAttribute("style", `width:${inputWidth}px;`)
        inputZ.addEventListener("input", (e) => {
            if (e.target instanceof HTMLInputElement) {
                e.target.value

                if (!isNaN(+e.target.value)) {
                    cVec.z = +e.target.value
                    onChange(cVec)
                }
            }
        })

        inputDiv.appendChild(inputZ)



        vehicleInputsContainer.appendChild(inputDiv)
    }

    async createVehicle() {

        while (vehicleInputsContainer.children.length > 0) {
            vehicleInputsContainer.removeChild(vehicleInputsContainer.children[0])
        }

        loadLowPolyVehicleModels(this.vehicleType, (tires, chassises,) => {
            this.vehicle.addModels(tires, chassises[Math.floor(Math.random() * chassises.length)],)
            console.log("vehicle", this.vehicle)
            this.createController()
            const useChaseCamera = window.localStorage.getItem("useChaseCamera")
            this.vehicle.useChaseCamera = eval(useChaseCamera)
            this.vehicle.addCamera(this.camera as THREE.PerspectiveCamera)
            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicle.setCheckpointPositionRotation({ position: { x: p.x, z: p.z, y: p.y }, rotation: { x: 0, z: 0, y: r.y } })
            this.vehicle.resetPosition()
            // this.dirLight.target = this.vehicle.chassisMesh
            this.camera.position.set(0, 10, -25)
            this.loadFont()

            let topOffset = 25
            let top = 0
            this.createVehcileInput(this.vehicle.engineForce, top, "Engine force", (val) => {
                this.vehicle.updateVehicleSettings({
                    ...this.vehicle.vehicleSettings,
                    // I think this will still work in changing the engineForce
                    // @ts-ignore
                    engineForce: val,
                })
            })

            top += topOffset
            this.createVehcileInput(this.vehicle.mass, top, "Mass", (val) => this.vehicle.updateMass(val))

            top += topOffset

            this.createVehcileInput(this.vehicle.breakingForce, top, "Break force", (val) => this.vehicle.updateBreakingForce(val))

            top += topOffset

            /** Suspension damping */
            this.createVehcileInput(this.vehicle.getSuspensionDamping(), top, "suspension damping", (val) => this.vehicle.setSuspensionDamping(val))

            top += topOffset
            /** Suspension stiffness */
            this.createVehcileInput(this.vehicle.getSuspensionStiffness(), top, "suspension stiffness", (val) => this.vehicle.setSuspensionStiffness(val))

            top += topOffset
            /** Suspension stiffness */
            this.createVehcileInput(this.vehicle.getSuspensionCompression(), top, "suspension compression", (val) => this.vehicle.setSuspensionCompression(val))

            top += topOffset
            /** Suspension stiffness */
            this.createVehcileInput(this.vehicle.getSuspensionRestLength(), top, "suspension rest length", (val) => this.vehicle.setSuspensionRestLength(val))

            top += topOffset
            /** Suspension max travel cm */
            this.createVehcileInput(this.vehicle.getMaxSuspensionTravelCm(), top, "suspension max travel cm", (val) => this.vehicle.setMaxSuspensionTravelCm(val))

            top += topOffset
            /** Suspension max force */
            this.createVehcileInput(this.vehicle.getMaxSuspensionForce(), top, "suspension max force", (val) => this.vehicle.setMaxSuspensionForce(val))

            top += topOffset
            /** Roll influence */
            this.createVehcileInput(this.vehicle.getRollInfluence(), top, "Roll Influence", (val) => this.vehicle.setRollInfluence(val))

            top += topOffset
            /** Friction slip */
            this.createVehcileInput(this.vehicle.getFrictionSlip(), top, "Friction slip", (val) => this.vehicle.setFrictionSlip(val))


            top += topOffset
            const useChaseCamButtontDiv = document.createElement("div")
            useChaseCamButtontDiv.setAttribute("class", "vehicle-input")
            useChaseCamButtontDiv.setAttribute("style", `top:${top}px;`)
            useChaseCamButtontDiv.innerHTML = "Chase cam"
            const useChaseCamButton = document.createElement("button")


            useChaseCamButton.innerHTML = this.vehicle.useChaseCamera ? "ON" : "OFF"
            useChaseCamButton.addEventListener("click", (e) => {
                window.localStorage.setItem("useChaseCamera", (!this.vehicle.useChaseCamera).toString())
                this.vehicle.updateVehicleSettings({
                    ...this.vehicle.vehicleSettings,
                    useChaseCamera: !this.vehicle.useChaseCamera
                })
                useChaseCamButton.innerHTML = this.vehicle.useChaseCamera ? "ON" : "OFF"

            })

            useChaseCamButtontDiv.appendChild(useChaseCamButton)
            vehicleInputsContainer.appendChild(useChaseCamButtontDiv)

            top += topOffset
            this.createXYZInput(this.vehicle.getInertia(), top, "inertia", (newI) => {
                this.vehicle.setInertia(newI)
            })

            top += topOffset
            this.createXYZInput(this.vehicle.getCenterOfMass(), top, "Set position", (newCM) => {
                this.vehicle.setCenterOfMass(newCM)
            })

            const ball = this.physics.add.sphere({ radius: 1, mass: 10, x: 0, y: 4, z: 0 })
            ball.body.setBounciness(1)

            this.canStartUpdate = true
            this.vehicle.useBadRotationTicks = false


        })
    }

    handleGoalCrossed(o: ExtendedObject3D) {
        if (!this.goalCrossed) {
            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicle.setCheckpointPositionRotation({ position: { x: p.x, y: p.y, z: p.z }, rotation: { x: 0, y: r.y, z: 0 } })
            this.checkpointCrossed = false

            if (!this.raceStarted) {
                this.gameTime.start();
                this.raceStarted = true
            } else {
                this.gameTime.lapDone()
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



    setGameSettings(newGameSettings: IPreGameSettings, escPress: () => void) {
        this.gameSettings = newGameSettings
        this.escPress = escPress
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
                lapTimeDiv.innerHTML = this.gameTime.getCurrentLapTime() + ""
                bestLapTimeDiv.innerHTML = this.gameTime.getBestLapTime() + ""
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

    togglePauseGame() {

        if (this.isPaused) {
            this.gameTime.stop()
            this.vehicle.unpause()
            this.isPaused = false
        } else {
            this.gameTime.start()
            this.vehicle.pause()
            this.isPaused = true
        }
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
    }

    restartGame() {
        this.vehicle.resetPosition()
        this.gameTime.restart()
    }

    changeVehicle(vehicleType: VehicleType) {

        window.localStorage.setItem("vehicleType", vehicleType)
        this.vehicleType = vehicleType
        this.canStartUpdate = false

        this.vehicle = new LowPolyTestVehicle(this, "blue", "test hugi", 0, this.vehicleType)
        this.createVehicle()
    }
}


export const startLowPolyTest = (socket: Socket, gameSettings: IPreGameSettings, escPress: () => void, callback: (gameObject: LowPolyTestScene) => void) => {
    const config = { scenes: [LowPolyTestScene], antialias: true, randomStuff: "hello" }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        const gameObject = (project.scenes.get(key) as LowPolyTestScene)
        // hacky way to get the project's scene
        gameObject.setSocket(socket);
        // (project.scenes.get(key) as LowPolyTestScene).createVehicle();
        gameObject.setGameSettings(gameSettings, escPress);
        callback(gameObject)

        return project
    })

}
