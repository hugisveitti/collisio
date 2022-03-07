import { PhysicsLoader, Project, Scene3D } from "enable3d";
import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { defaultVehicleSettings } from "../classes/User";
import { Course } from "../course/Course";
import { ICourse } from "../course/ICourse";
import { hideLoadDiv } from "../course/loadingManager";
import { GameScene } from "../game/GameScene";
import { IPlayerInfo, MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { vehicleItems, VehicleSetup } from "../shared-backend/vehicleItems";
import { IVehicle } from "../vehicles/IVehicle";


class SpeedTestScene extends GameScene {

    course: ICourse
    vehicles: IVehicle[]
    players: IPlayerInfo[]
    trackName: TrackName = "speed-test-track"

    constructor() {
        super()

        this.players = []
        //const vehicleTypes: VehicleType[] = ["gokart", "future", "f1", "simpleSphere", "offRoader", "sportsCar", "tractor", "normal"]
        const vehicleTypes: VehicleType[] = ["f1", "f1", "f1", "f1", "f1", "f1", "f1"]

        const sharedVehicleSetup: VehicleSetup = {
            vehicleType: "f1",
            vehicleColor: "#1d8a47"
        }
        const vehicleSetups: VehicleSetup[] = [
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
            },
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",

            },
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
                spoiler: vehicleItems["f1"]?.["spoiler1"]
            },
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
                spoiler: vehicleItems["f1"]?.["spoiler2"],
                exhaust: vehicleItems["f1"]?.["exhaust3"]
            },
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
                exhaust: vehicleItems["f1"]?.["exhaust3"]
            }
            ,
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
                exhaust: vehicleItems["f1"]?.["exhaust5"]
            },
            {
                ...sharedVehicleSetup,
                vehicleType: "f1",
                exhaust: vehicleItems["f1"]?.["exhaust5"],
                wheelGuards: vehicleItems["f1"]?.["wheelGuards2"],
                spoiler: vehicleItems["f1"]?.["spoiler5"]
            }
        ]
        for (let i = 0; i < vehicleTypes.length; i++) {
            this.players.push({
                playerName: `name-${vehicleTypes[i]}`,
                playerNumber: i,
                vehicleType: vehicleTypes[i],
                photoURL: "",
                isAuthenticated: false,
                id: `speed-test${i}`,
                isLeader: i === 0,
                isConnected: false,
                vehicleSetup: vehicleSetups[i],
                vehicleSettings: defaultVehicleSettings
            })
        }
        this.course = new Course(this, this.trackName)
    }

    async create(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            this.resetVehicles()
            await this.createVehicles()

            this.vehicles[0].addCamera(this.camera)
            this.vehicles[0].useChaseCamera = false
            // for (let v of this.vehicles) {
            //     v.isReady = true
            // }


            this.resetVehicles()
            this.restartGame()
            resolve()
        })
    }

    async preload(): Promise<void> {
        this.isPaused = false

        this.addLights()


        this.loadAssets()
    }

    async init(data: any): Promise<void> {
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000)

    }

    async loadAssets(): Promise<void> {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        await this.course.createCourse()
        this.courseLoaded = true
        hideLoadDiv()


    }

    _restartGame(): void {
        // this.gameStarted = true
        for (let vehicle of this.vehicles) {
            vehicle.unpause()
            vehicle.start()
            vehicle.break(true)
            vehicle.setCanDrive(true)
        }
    }

    updateVehicles(delta: number) {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].goForward()

            this.vehicles[i].update(delta)
            if (i === 0) {
                this.vehicles[i].cameraLookAt(this.camera, delta)
            }
        }
    }

    _updateChild(time: number, delta: number) {

        this.updateFps(time)
        if (this.everythingReady()) {
            this.updateVehicles(delta)
        }
        this.renderer.render(this.scene, this.camera)
    }
}

export const startSpeedTest = () => {
    const config = { scenes: [SpeedTestScene], antialias: true }
    PhysicsLoader("/ammo", () => {

        const project = new Project(config)
        return project
    })
}