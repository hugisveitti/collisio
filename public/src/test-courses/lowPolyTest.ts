import { ExtendedObject3D, PhysicsLoader, Project, THREE } from "enable3d"
import { Socket } from "socket.io-client"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { getGameTypeFromTrackName } from "../classes/Game"
import { defaultGameSettings, IGameSettings } from "../classes/localGameSettings"
import { RaceCourse } from "../course/RaceCourse"
import { StoryCourse } from "../course/StoryCourse"
import { Coin, itColor, notItColor, TagCourse } from "../course/TagCourse"
import "../game/game-styles.css"
import { GameScene } from "../game/GameScene"
import { GameTime } from "../game/GameTimeClass"
import { defaultVehicleType, GameType, MobileControls, std_user_settings_changed, TrackName, vehicleColors, VehicleControls, VehicleType } from "../shared-backend/shared-stuff"
import { GhostVehicle, IGhostVehicle } from "../vehicles/GhostVehicle"
import { ITestVehicle } from "../vehicles/IVehicle"
import { LowPolyTestVehicle } from "../vehicles/LowPolyTestVehicle"
import { getVehicleNumber, isVehicle, loadLowPolyVehicleModels } from "../vehicles/LowPolyVehicle"
import { SphereTestVehicle } from "../vehicles/SphereTestVehicle"
import { loadSphereModel } from "../vehicles/SphereVehicle"
import { allVehicleTypes, getVehicleClassFromType } from "../vehicles/VehicleConfigs"
import { getWagonNumber, isWagon } from "../vehicles/Wagon"
import "./lowPolyTest.css"
import { addTestControls } from "./testControls"
import { DriveRecorder, TestDriver } from "./TestDriver"
import { createTestVehicleInputs } from "./testVehicleInputs"

const vechicleFov = 60

let tA = 0

const scoreTable = document.createElement("div")
const lapTimeDiv = document.createElement("div")
const bestLapTimeDiv = document.createElement("div")

const vehicleInputsContainer = document.createElement("div")
document.body.appendChild(vehicleInputsContainer)

let recording = true
let playRecording = true

export class LowPolyTestScene extends GameScene {

    //vehicle?: LowPolyTestVehicle
    vehicle: ITestVehicle
    vehicles: ITestVehicle[]

    font: THREE.Font
    textMesh?: any
    socket!: Socket
    vehicleControls!: VehicleControls

    gameSettings: IGameSettings
    raceStarted: boolean
    checkpointCrossed: boolean
    goalCrossed: boolean
    currentLaptime: number
    timeStarted: number
    bestLapTime: number
    canStartUpdate: boolean

    course: RaceCourse | TagCourse | StoryCourse
    gameType: GameType

    pLight: THREE.PointLight
    useShadows: boolean
    vehicleType: VehicleType
    mobileControls: MobileControls
    gameTime: GameTime
    escPress: () => void
    isPaused = false
    trackName: TrackName
    usingDebug: boolean
    vehicleColorNumber = 0

    otherVehicles: ITestVehicle[] // LowPolyTestVehicle[]
    numberOfOtherVehicles = 1

    isIt: number

    driveVehicle: () => MobileControls
    controls: MobileControls



    testDriver: TestDriver
    driverRecorder: DriveRecorder

    otherDrivers: TestDriver[]
    ghostVechicle: IGhostVehicle

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
        this.goalCrossed = false
        this.bestLapTime = 10000
        this.canStartUpdate = false


        this.gameSettings = defaultGameSettings

        this.currentLaptime = 0
        this.timeStarted = 0


        this.useShadows = true

        this.vehicleType = window.localStorage.getItem("vehicleType") as VehicleType ?? defaultVehicleType
        this.mobileControls = new MobileControls()

        this.gameTime = new GameTime(3, 1)
        this.trackName = window.localStorage.getItem("trackName") as TrackName ?? "test-course"
        this.usingDebug = eval(window.localStorage.getItem("usingDebug")) ?? true

        this.gameType = this.getGameType()


        this.otherVehicles = []
        this.otherDrivers = []


        // in tag game
        this.isIt = 0
        this.testDriver = new TestDriver(this.trackName, this.getNumberOfLaps(), this.vehicleType,)
        this.ghostVechicle = new GhostVehicle({ vehicleType: "f1", color: "#10eedd" })
        this.driverRecorder = new DriveRecorder({ tournamentId: "low poly test", active: recording, trackName: this.getTrackName(), vehicleType: this.vehicleType, numberOfLaps: this.getNumberOfLaps() })

    }

    getNumberOfLaps() {
        return 1
    }

    async preload() {
        if (this.usingDebug) {
            this.physics.debug?.enable()
            //    this.physics.debug?.mode(2048 + 4096)
        }
        await this.warpSpeed('-ground', "-light", "-sky")


        // this could do something for the jitter of the vehicle
        // how the physics are updated:https://github.com/enable3d/enable3d/blob/master/packages/ammoPhysics/src/physics.ts
        //this.physics.config.maxSubSteps = 10
        // this.physics.config.fixedTimeStep = 1 / 120
        // this.__config.fixedTimeStep =  1 / 120

        this.addLights()

        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener("resize", () => this.onWindowResize())

        document.addEventListener("keypress", (e) => {
            if (e.key === "r") {

                this.resetPlayer(0)
            } else if (e.key === "t") {

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
                this.vehicle.setRotation(0, 0, Math.PI)
            } else if (e.key === "u") {
                this.vehicle.stop()
                this.vehicle.start()
                const p = this.vehicle.getPosition()
                this.vehicle.setPosition(p.x, p.y + 5, p.z)
                this.vehicle.setRotation(0, 0, 0)
            }
            else if (e.key === "i") {
                this.vehicle.stop()
                this.vehicle.start()
                const p = this.vehicle.getPosition()
                const r = this.vehicle.getRotation()

                this.vehicle.setPosition(p.x, p.y, p.z)
                tA = tA + Math.PI / 20
                tA = tA % (Math.PI * 2)

                // const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, tA, 0, "XYZ"))

                this.vehicle.setRotation(0, tA, 0)


            }

            else if (e.key === "y") {
                this.vehicle.stop()
                this.vehicle.start()
                const p = this.vehicle.getPosition()
                const r = this.vehicle.getRotation()

                this.vehicle.setPosition(p.x, p.y, p.z)
                tA = tA + Math.PI / 20
                tA = tA % (Math.PI * 2)

                // const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, tA, 0, "XYZ"))

                this.vehicle.setRotation(0, tA, tA)

            } else if (e.key === "l") {
                const q = new THREE.Quaternion(0, 0.97602, 0, .217668135)
                this.vehicle.setRotation(q)
            } else if (e.key === "m") {
                for (let wagon of this.wagons) {
                    if (wagon.isConnectedToVehicle(this.vehicle)) {
                        wagon.removeConnection()
                    }
                }
            }
        })

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.escPress()
                this.togglePauseGame()
            }
        })

        this.initVehicles()
    }

    initVehicles() {
        this.otherVehicles = []
        //  this.vehicle = new LowPolyTestVehicle(this, itColor, "test hugi", 0, this.vehicleType, true)
        if (getVehicleClassFromType(this.vehicleType) === "LowPoly") {
            this.vehicle = new LowPolyTestVehicle(this, itColor, "test hugi", 0, this.vehicleType, true)

        } else {

            this.vehicle = new SphereTestVehicle(this, itColor, "test hugi", 0, this.vehicleType, true)
        }
        for (let i = 0; i < this.numberOfOtherVehicles; i++) {
            const vehicleType = allVehicleTypes[i % allVehicleTypes.length].type
            this.otherVehicles.push(
                new LowPolyTestVehicle(this, notItColor, "test" + (i + 1), i + 1, vehicleType, false)
            )
            this.otherDrivers.push(new TestDriver(this.getTrackName(), 1, vehicleType))
        }
    }

    async create() {

        if (this.getGameType() === "race") {

            this.course = new RaceCourse(this, this.trackName, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D, checkpointNumber: number) => this.handleCheckpointCrossed(o, checkpointNumber))
        } else if (this.getGameType() === "tag") {
            this.course = new TagCourse(this, this.trackName, (name, coin) => this.handleCoinCollided(name, coin))
        } else if (this.getGameType() === "story") {
            this.course = new StoryCourse(this, this.trackName)
        } else {
            console.warn("Unknown game type when creating course", this.getGameType())
        }

        await this.course.createCourse()
        if (this.course instanceof RaceCourse) {
            this.gameTime = new GameTime(3, this.course.getNumberOfCheckpoints())
        }

        this.courseLoaded = true
        await this.createOtherVehicles()
        await this.createTestVehicle()
        this.vehicle.useBadRotationTicks = true

        const allVehicles = this.otherVehicles.concat(this.vehicle)
        this.vehicles = allVehicles

        this.course.setStartPositions(allVehicles)
        for (let v of allVehicles) {
            if (v.isReady) {
                v.unpause()
            }
            v.canDrive = true
            v.start()
        }

        //this.vehicle.setPosition(5, 2, 5)
        // this.vehicle.setRotation(0, 0, 0)
        if (this.getGameType() === "tag") {

            this.vehicle.setPosition(0, 2, 0)
        }

        this.createController()

        this.canStartUpdate = true
        if (this.gameSettings.gameType === "tag") {

            this.vehicle.vehicleBody.body.on.collision((otherObject: ExtendedObject3D, e: any) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    this.vehicle.setColor(notItColor)
                    this.otherVehicles[vehicleNumber - 1].setColor(itColor)
                    this.isIt = vehicleNumber
                }
            })
        }
        this.vehicle.addCamera(this.camera as THREE.PerspectiveCamera)


        this.ghostVechicle.loadModel().then(() => {

            this.ghostVechicle.addToScene(this)
        });

        console.log("camera", this.camera)
    }



    getGameType() {
        return getGameTypeFromTrackName(this.trackName)
    }

    handleCoinCollided(vehicleName: string, coin: Coin) {
        const vehicleNumber = getVehicleNumber(vehicleName)
        if (vehicleNumber !== this.isIt) {
            coin.removeFromScene(this)
        } else {

        }
    }

    async createOtherVehicles() {
        return new Promise<void>((resolve, reject) => {
            if (this.numberOfOtherVehicles === 0) {
                resolve()
            }
            const p = this.course.ground.scale
            const helper = (i: number) => {
                loadLowPolyVehicleModels(this.otherVehicles[i].vehicleType, false).then(([tires, chassis]) => {
                    this.otherVehicles[i].addModels(tires, chassis)
                    if (i < this.otherVehicles.length - 1) {
                        helper(i + 1)
                    } else {
                        resolve()
                    }
                })
            }
            if (this.otherVehicles.length > 0) {
                helper(0)
            }
        })
    }

    changeTrack(trackName: TrackName) {
        this.trackName = trackName
        window.localStorage.setItem("trackName", trackName)
        this.canStartUpdate = false
        this.course.clearCourse()
        this.scene.clear()
        this.addLights()
        this.create()
    }

    async createTestVehicle() {
        const promise = new Promise<void>((resolve, reject) => {
            const vehicleClass = getVehicleClassFromType(this.vehicleType)
            if (vehicleClass === "Sphere") {
                loadSphereModel(this.vehicleType, false).then((sphere) => {
                    this.vehicle.addModels([sphere], sphere)

                    const useChaseCamera = window.localStorage.getItem("useChaseCamera")
                    this.vehicle.useChaseCamera = eval(useChaseCamera)
                    this.vehicle.addCamera(this.camera as THREE.PerspectiveCamera)
                    this.vehicle.resetPosition()
                    // this.dirLight.target = this.vehicle.chassisMesh
                    this.camera.position.set(0, 10, -25)
                    this.loadFont()
                    this.vehicle.unpause()
                    resolve()
                })
            } else {


                loadLowPolyVehicleModels(this.vehicleType, false).then(([tires, chassis]) => {

                    this.vehicle.addModels(tires, chassis)



                    const useChaseCamera = window.localStorage.getItem("useChaseCamera")
                    this.vehicle.useChaseCamera = eval(useChaseCamera)
                    this.vehicle.addCamera(this.camera as THREE.PerspectiveCamera)
                    this.vehicle.resetPosition()
                    // this.dirLight.target = this.vehicle.chassisMesh
                    this.camera.position.set(0, 10, -25)
                    this.loadFont()


                    const createVehicleInputButtons = () => {
                        createTestVehicleInputs(this, vehicleInputsContainer)
                    }

                    createVehicleInputButtons()


                    resolve()

                })
            }
        })
        return promise
    }

    resetVehicleCallback(vehicleNumber: number) {

    }


    handleGoalCrossed(o: ExtendedObject3D) {
        if (!this.goalCrossed) {
            if (getVehicleNumber(o.name) === 0 && recording && this.checkpointCrossed) {
                this.driverRecorder.goalCrossed()
            }
            const { position, rotation } = (this.course as RaceCourse).getGoalCheckpoint()
            this.vehicle.setCheckpointPositionRotation({ position, rotation })
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

    handleCheckpointCrossed(o: ExtendedObject3D, checkpointNumber: number) {

        // if (!this.checkpointCrossed) {
        if (!this.gameTime.crossedCheckpoint(checkpointNumber)) {
            this.gameTime.checkpointCrossed(checkpointNumber)
            this.goalCrossed = false
            const { position, rotation } = this.course.getCheckpointPositionRotation(checkpointNumber)
            this.vehicle.setCheckpointPositionRotation({ position: { x: position.x, y: position.y, z: position.z }, rotation: rotation })
            //}
        }
        this.checkpointCrossed = true
    }



    setTestGameSettings(newGameSettings: IGameSettings, escPress: () => void) {
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
            (this.camera as THREE.PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
        }
        this.camera.updateProjectionMatrix();
    }


    setSocket(socket: Socket) {
        this.socket = socket
        this.userSettingsListener()
    }

    createController() {
        if (this.vehicle) {
            this.vehicleControls = new VehicleControls()

            this.driveVehicle = addTestControls(this.socket, this.vehicle)
            //this.driveVehicle()
        }
    }

    vehicleCollidedWithObject(object: ExtendedObject3D, vehicleNumber: number) {

        if (isWagon(object)) {
            if (vehicleNumber === 0) {
                const wagonNumber = getWagonNumber(object.name)
                this.wagons[wagonNumber].connectToVehicle(this.vehicle)
            }
            //(object as Wagon).connectToVehicle(vehicle)
        }
    }

    // this.vehicle isnt appart of allVehicles in GameScene class
    updateVehicles(delta: number) {
        this.vehicle.update(delta)
    }

    _upd(delta: number) {
        if (this.canStartUpdate && this.everythingReady() && this.vehicle) {
            this.vehicle.cameraLookAt(this.camera as THREE.PerspectiveCamera, delta)
        }
    }

    _updateChild(time: number, delta: number) {
        //      this.physics.physicsWorld.stepSimulation(1)

        if (this.canStartUpdate && this.everythingReady() && this.ghostVechicle.isReady) {


            if (this.vehicle) {
                this.updateVehicles(delta)
                this.mobileControls = this.driveVehicle?.()
                this.driverRecorder.record(this.vehicle, time)

                if (playRecording) {
                    this.testDriver.setPlace(this.ghostVechicle, time, delta)
                }

                //    this.vehicle.intelligentDrive(true)
                this.updateFps(time)
                this.updatePing()
                // testDriveVehicleWithKeyboard(this.vehicle, this.vehicleControls)
                const pos = this.vehicle.getPosition()
                const rot = this.vehicle.getRotation()
                scoreTable.innerHTML = `x: ${pos.x.toFixed(2)}, z:${pos.z.toFixed(2)} 
                <br />
                rot x:${rot.x.toFixed(2)}, y:${rot.y.toFixed(2)}, z:${rot.z.toFixed(2)}, w:${rot.w.toFixed(2)}
                <br />
                km/h: ${this.vehicle.getCurrentSpeedKmHour(delta).toFixed(0)}
                `

            }
            this.course.updateCourse()
            for (let i = 0; i < this.otherVehicles.length; i++) {
                let oVehicle = this.otherVehicles[i]
                // oVehicle.randomDrive()
                //oVehicle.intelligentDrive(false)
                //this.otherDrivers[i].setMobileController(time)
                //  driveVehicle(this.otherDrivers[i].controller, oVehicle)

                oVehicle.update(delta)
            }


            if (this.raceStarted) {
                lapTimeDiv.innerHTML = this.gameTime.getCurrentLapTime() + ""
                bestLapTimeDiv.innerHTML = this.gameTime.getBestLapTime() + ""
            }
        }

        this._upd(delta)
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

        if (!this.vehicle.isReady || !this.everythingReady()) return
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

    unpauseGame() {
        this.vehicle.unpause()
        this.isPaused = false
    }

    pauseGame() {
        if (this.vehicle.isReady) {
            this.vehicle.pause()
        }
        this.isPaused = true
    }


    changeVehicle(vehicleNumber: number, vehicleType: VehicleType) {

        window.localStorage.setItem("vehicleType", vehicleType)
        this.vehicleType = vehicleType
        this.canStartUpdate = false

        this.vehicleColorNumber += 1

        this.vehicle = new LowPolyTestVehicle(this, vehicleColors[this.vehicleColorNumber].value, "test hugi", 0, this.vehicleType, true)
        this.createTestVehicle()

    }

    userSettingsListener() {
        this.socket.on(std_user_settings_changed, (data: any) => {
            this.vehicle.updateVehicleSettings(data.userSettings.vehicleSettings)
        })
    }

}


export const startLowPolyTest = (socket: Socket, gameSettings: IGameSettings, escPress: () => void, callback: (gameObject: LowPolyTestScene) => void) => {
    const config = { scenes: [LowPolyTestScene], antialias: true }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        const gameObject = (project.scenes.get(key) as LowPolyTestScene)
        // hacky way to get the project's scene
        gameObject.setSocket(socket);
        // (project.scenes.get(key) as LowPolyTestScene).createVehicle();
        gameObject.setTestGameSettings(gameSettings, escPress);
        callback(gameObject)

        return project
    })

}
