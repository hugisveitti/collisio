import { PhysicsLoader, Project } from "enable3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { ICourse } from "../course/ICourse";
import { IVehicle } from "../vehicles/IVehicle";
import { GameScene } from "../game/GameScene"
import { IPlayerInfo, MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { Course } from "../course/Course";
import { TestDriver } from "./TestDriver";


class SpeedTestScene extends GameScene {



    course: ICourse
    vehicles: IVehicle[]
    players: IPlayerInfo[]
    trackName: TrackName = "speed-test-track"

    constructor() {
        super()

        this.players = []
        const vehicleTypes: VehicleType[] = ["normal2", "f1", "simpleSphere", "offRoader", "sportsCar", "tractor", "normal"]
        for (let i = 0; i < vehicleTypes.length; i++) {
            this.players.push({
                playerName: `name-${vehicleTypes[i]}`,
                playerNumber: i,
                vehicleType: vehicleTypes[i],
                mobileControls: new MobileControls(),
                photoURL: "",
                isAuthenticated: false,
                id: `speed-test${i}`,
                teamName: "",
                teamNumber: -1,
                isLeader: i === 0,
                isConnected: false
            })
        }
        this.course = new Course(this, this.trackName)
    }



    async loadAssets(): Promise<void> {

        const controls = new OrbitControls(this.camera, this.renderer.domElement);


        await this.course.createCourse()
        this.courseLoaded = true
        await this.createVehicles()

        this.vehicles[0].addCamera(this.camera)
        this.vehicles[0].useChaseCamera = false

        this.resetVehicles()
        this.restartGame()

        const driver = new TestDriver("normal2")
    }


    _restartGame(): void {
        this.gameStarted = true
        for (let vehicle of this.vehicles) {
            vehicle.canDrive = true
            vehicle.unpause()
            vehicle.start()
        }
    }


    updateVehicles(delta: number) {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.vehicles[i].goForward()
            this.vehicles[i].update(delta)
            if (i === 0) {
                this.vehicles[i].cameraLookAt(this.camera)
            }
        }
    }


    update(time: number, delta: number) {
        this.updateFps(time)
        if (this.everythingReady()) {
            this.updateVehicles(delta)
        }
    }
}

export const startSpeedTest = () => {
    const config = { scenes: [SpeedTestScene], antialias: true }
    PhysicsLoader("/ammo", () => {

        const project = new Project(config)
        return project
    })
}