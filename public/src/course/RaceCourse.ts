import { CollisionEvent } from "@enable3d/common/dist/types";
import { ExtendedObject3D } from "enable3d";
import { Quaternion, Euler } from "three";
import { MyScene } from "../game/MyScene";
import { TrackName } from '../shared-backend/shared-stuff';
import { IVehicle } from "../vehicles/IVehicle";
import { Course } from './Course';
import { IRaceCourse } from "./ICourse";

export class RaceCourse extends Course implements IRaceCourse {


    goal: ExtendedObject3D
    goalSpawn: ExtendedObject3D

    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void



    constructor(gameScene: MyScene, trackName: TrackName, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void) {

        super(gameScene, trackName)
        this.checkpointSpawns = []
        this.checkpoints = []

        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback

    }

    async _createCourse() {

        this.setupCollisionListeners()
    }

    getNumberOfCheckpoints() {
        return this.checkpoints.length
    }


    setupCollisionListeners() {
        if (this.goal) {
            try {
                this.goal.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                    if (otherObject.name.slice(0, 7) === "vehicle") {
                        this.goalCrossedCallback(otherObject)
                    }
                })
            } catch {
                console.warn("No goal object")
            }
        }
        if (this.checkpoints) {
            for (let checkpoint of this.checkpoints) {
                let checkpointNumber: number = +checkpoint.name.slice("checkpoint".length, "checkpoint".length + 1) ?? 1

                if (checkpointNumber === 0) {
                    checkpointNumber = 1
                }


                checkpoint.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                    if (otherObject.name.slice(0, 7) === "vehicle") {
                        this.checkpointCrossedCallback(otherObject, checkpointNumber)
                    }
                })
            }
        }
        if (this.goalSpawn) {
            this.startPosition = this.goalSpawn.position
            this.startRotation = this.goalSpawn.rotation
        } else if (this.spawns.length > 0) {
            this.startPosition = this.spawns[0].position
            this.startRotation = this.spawns[0].rotation
        }
    }

    checkIfVechileCrossedGoal(vehicle: IVehicle) {
        if (this.goal) {

        }
    }

    getGoalCheckpoint() {
        const pos = this.goalSpawn.position
        const key = "goal-align"
        if (key in this.spawnAligners) {
            const aPos = this.spawnAligners[key].position
            const q = this.calcSpawnAngle(aPos, pos)
            return { position: pos, rotation: q }
        }
        const q = new Quaternion().setFromEuler(new Euler(0, this.goalSpawn.rotation.y, 0))
        return { position: pos, rotation: q }
    }
}