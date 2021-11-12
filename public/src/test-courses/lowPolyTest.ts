import { OrbitControls } from "@enable3d/three-wrapper/dist/index"
import { ExtendedObject3D, PhysicsLoader, Project, Scene3D, THREE } from "enable3d"
import { Socket } from "socket.io-client"
import Stats from "stats.js"
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera"
import { defaultPreGameSettings, IPreGameSettings } from "../classes/Game"
import { loadLowPolyVehicleModels, LowPolyVehicle } from "../vehicles/LowPolyVehicle"
import { defaultVehicleConfig, IVehicleConfig, possibleVehicleColors } from "../vehicles/VehicleConfigs";
import "../game/game-styles.css"
import { RaceCourse } from "../shared-game-components/RaceCourse"
import "./lowPolyTest.css"
import { addTestControls } from "./testControls"
import { IGameScene } from "../game/IGameScene"
import { IUserGameSettings } from "../classes/User"
import { GameTime } from "../game/GameTimeClass"
import { LowPolyTestVehicle } from "../vehicles/LowPolyTestVehicle"
import { instanceOfSimpleVector, SimpleVector } from "../vehicles/IVehicle"
import { VehicleControls, VehicleType, MobileControls, TrackType } from "../shared-backend/shared-stuff"
import { skydomeFragmentShader, skydomeVertexShader } from "../game/shaders"
import { Console } from "console"

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
    trackType: TrackType
    usingDebug: boolean
    vehicleColorNumber = 0

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
        this.trackType = window.localStorage.getItem("trackType") as TrackType ?? "test-course"
        this.usingDebug = eval(window.localStorage.getItem("usingDebug")) ?? true
    }

    async init() {
        this.camera = new THREE.PerspectiveCamera(vechicleFov, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        this.physics.setGravity(0, -20, 0)

    }

    async preload() {

        if (this.usingDebug) {
            this.physics.debug?.enable()
        }
        await this.warpSpeed('-ground', "-light", "-sky")



        this.pLight = new THREE.PointLight(0xffffff, 1, 0, 1)
        this.pLight.position.set(100, 150, 100);

        this.scene.add(this.pLight);
        if (this.useShadows) {
            this.pLight.castShadow = true
            this.pLight.shadow.bias = 0.01
        }
        // const helper = new THREE.CameraHelper(this.pLight.shadow.camera);
        // this.scene.add(helper)


        // const hLight = new THREE.HemisphereLight(0xffffff, 1)
        const hLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hLight.color.setHSL(0.6, 1, 0.6);
        hLight.groundColor.setHSL(0.095, 1, 0.75);
        hLight.position.set(0, 50, 0);
        // hLight.position.set(0, 1, 0)
        this.scene.add(hLight)

        const aLight = new THREE.AmbientLight(0xffffff, 1)
        aLight.position.set(0, 0, 0)
        this.scene.add(aLight)

        // skydome

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
            } else if (e.key === "u") {
                this.vehicle.stop()
                this.vehicle.start()
                const p = this.vehicle.getPosition()
                this.vehicle.setPosition(p.x, p.y + 5, p.z)
                this.vehicle.setRotation(0, 0, 0)
            }


        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.escPress()
                this.togglePauseGame()
            }
        })

        this.vehicle = new LowPolyTestVehicle(this, possibleVehicleColors[this.vehicleColorNumber], "test hugi", 0, this.vehicleType)
    }

    async create() {
        // test-course.gltf
        // low-poly-farm-track
        this.course = new RaceCourse(this, this.trackType, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            this.createVehicle()
        })
    }

    changeTrack(trackType: TrackType) {
        this.trackType = trackType
        window.localStorage.setItem("trackType", trackType)
        this.canStartUpdate = false
        this.course.clearCourse()
        this.create()

    }

    createVehcileInput(value: number | SimpleVector | boolean | string, top: number, innerHtml: string, onChange: (val: number | SimpleVector) => void) {

        if (instanceOfSimpleVector(value)) {
            this.createXYZInput(value, top, innerHtml, onChange)
        }

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



        loadLowPolyVehicleModels(this.vehicleType, (tires, chassises,) => {

            this.vehicle.addModels(tires, chassises[Math.floor(Math.random() * chassises.length)],)



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


            const createVehicleInputButtons = () => {


                while (vehicleInputsContainer.children.length > 0) {
                    vehicleInputsContainer.removeChild(vehicleInputsContainer.children[0])
                }

                let key: keyof IVehicleConfig = "engineForce"

                let topOffset = 25
                let top = 0
                this.createVehcileInput(this.vehicle.getVehicleConfigKey(key), top, key, (val) => {
                    this.vehicle.setVehicleConfigKey("engineForce", val)
                })



                key = "mass"
                top += topOffset
                this.createVehcileInput(this.vehicle.getVehicleConfigKey(key), top, key, (val) => this.vehicle.updateMass(val as number))

                key = "breakingForce"
                top += topOffset
                this.createVehcileInput(this.vehicle.getVehicleConfigKey(key), top, key, (val) => this.vehicle.setVehicleConfigKey(key, val))


                /** These cannot be mass and inertia */
                const keys = ["suspensionDamping", "suspensionStiffness", "suspensionCompression", "suspensionRestLength", "maxSuspensionTravelCm", "maxSuspensionForce", "rollInfluence", "frictionSlip"]
                for (let key of keys) {
                    key = key as keyof IVehicleConfig
                    top += topOffset
                    if (!(key in defaultVehicleConfig)) {
                        console.warn(key, "is not a part the VehicleConfig")
                    }
                    this.createVehcileInput(this.vehicle.getVehicleConfigKey(key as keyof IVehicleConfig), top, key, (val) => this.vehicle.setVehicleConfigKey(key as keyof IVehicleConfig, val))

                }


                top += topOffset
                this.createXYZInput(this.vehicle.getInertia(), top, "inertia", (newI) => {
                    this.vehicle.setInertia(newI)
                })

                top += topOffset
                this.createXYZInput(this.vehicle.getCenterOfMass(), top, "Set position", (newCM) => {
                    this.vehicle.setCenterOfMass(newCM)
                })


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
                const resetDefaultBtnDiv = document.createElement("div")
                resetDefaultBtnDiv.setAttribute("class", "vehicle-input")
                resetDefaultBtnDiv.setAttribute("style", `top:${top}px;`)
                resetDefaultBtnDiv.innerHTML = "Reset to default"
                const resetDefaultBtn = document.createElement("button")


                resetDefaultBtn.innerHTML = "RESET "
                resetDefaultBtn.addEventListener("click", (e) => {
                    this.vehicle.resetConfigToDefault()
                    createVehicleInputButtons()

                })
                resetDefaultBtnDiv.appendChild(resetDefaultBtn)
                vehicleInputsContainer.appendChild(resetDefaultBtnDiv)

                top += topOffset
                const debugBtnDiv = document.createElement("div")
                debugBtnDiv.setAttribute("class", "vehicle-input")
                debugBtnDiv.setAttribute("style", `top:${top}px;`)
                debugBtnDiv.innerHTML = "use debug "
                const debugBtn = document.createElement("button")


                debugBtn.innerHTML = `Debug ${this.usingDebug ? "ON" : "OFF"}`
                debugBtn.addEventListener("click", (e) => {
                    this.usingDebug = !this.usingDebug
                    window.localStorage.setItem("usingDebug", this.usingDebug + "")
                    if (this.usingDebug) {
                        this.physics.debug.enable()
                    } else {
                        this.physics.debug.disable()
                    }

                })
                debugBtnDiv.appendChild(debugBtn)
                vehicleInputsContainer.appendChild(debugBtnDiv)
            }
            createVehicleInputButtons()

            const ball = this.physics.add.sphere({ radius: 1, mass: 10, x: 0, y: 4, z: 0 })
            ball.body.setBounciness(1)

            this.vehicle.useBadRotationTicks = false

            this.canStartUpdate = true
            this.createController()

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


            addTestControls(this.vehicleControls, this.socket, this.vehicle,)

        }
    }


    updateVehicles() {


        this.vehicle.update()
        this.vehicle.cameraLookAt(this.camera as THREE.PerspectiveCamera)

    }

    update() {

        if (this.canStartUpdate) {

            stats.begin()
            if (this.vehicle) {
                this.updateVehicles()
                // testDriveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
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

        this.vehicleColorNumber += 1
        this.vehicle = new LowPolyTestVehicle(this, possibleVehicleColors[this.vehicleColorNumber], "test hugi", 0, this.vehicleType)
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
