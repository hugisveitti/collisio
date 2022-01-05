import { CollisionEvent } from "@enable3d/common/dist/types";
import { ExtendedObject3D, Scene3D } from "enable3d";
import { IVehicle } from "../vehicles/IVehicle";
import { IRaceCourse } from "./ICourse";
import { TrackName } from '../shared-backend/shared-stuff';
import { Course } from './Course';
import { shuffleArray } from "../utils/utilFunctions";
import { GameScene } from "../game/GameScene";


export class RaceCourse extends Course implements IRaceCourse {


    goal: ExtendedObject3D
    goalSpawn: ExtendedObject3D

    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void



    constructor(gameScene: GameScene, trackName: TrackName, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void) {

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
        return { position: pos, rotation: { x: 0, y: this.goalSpawn.rotation.y, z: 0 } }
    }
}