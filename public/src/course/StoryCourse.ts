import { StoryGameScene } from "../game/StoryGameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { Quaternion, Group, LoadingManager, Object3D, Vector3, Euler, PointLight } from "three";
import { Course } from "./Course";
import { getVehicleTypeFromName, getWagonTypeFromName } from "./GameItems";
import { rejects } from "assert";



export class StoryCourse extends Course {

    constructor(gameScene: StoryGameScene, trackName: TrackName) {
        super(gameScene, trackName)
    }

    async _createCourse(): Promise<void> {
        return new Promise(async (resolve, reject) => {

            console.log("this vehicles", this.vehicles)

            console.log("this wagons", this.wagons)
            await this._createCourseObjects()
            resolve()
        })
    }


    async _createCourseObjects() {
        return new Promise<void>(async (resolve, reject) => {

            await Promise.all([
                this.createCourseVehicles(),
                this.createCourseWagons()
            ])
            resolve()
        })
    }

    async createCourseVehicles() {
        const vehicleTypes = []
        let positions: Vector3[] = []
        let rotations: Quaternion[] = []
        for (let child of this.vehicles) {
            child.visible = false
            const type = getVehicleTypeFromName(child.name)
            if (type) {
                positions.push(child.position)
                rotations.push(new Quaternion().setFromEuler(child.rotation))
                vehicleTypes.push(type)
            } else {
                console.warn("Unknown vehicle type in name", child.name)
            }
        }
        this.gameScene.createExtraVehicles(vehicleTypes, positions, rotations)
    }

    async createCourseWagons() {
        const wagonTypes = []
        const positions = []
        const rotations = []
        for (let child of this.wagons) {
            child.visible = false
            const type = getWagonTypeFromName(child.name)
            if (type) {
                positions.push(child.position)
                rotations.push(new Quaternion().setFromEuler(child.rotation))
                wagonTypes.push(type)
            } else {
                console.warn("Unknown vehicle type in name", child.name)
            }
        }
        this.gameScene.createWagons(wagonTypes, positions, rotations)
    }

    // _restartCourse(): void {
    //  this.createCourseObjects()   
    // }
}