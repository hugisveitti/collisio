
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

    checkpoints: ExtendedObject3D[]
    checkpointSpawns: ExtendedObject3D[]


    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void



    constructor(gameScene: GameScene, trackName: TrackName, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D, checkpointNumber: number) => void) {

        super(gameScene, trackName)
        this.checkpointSpawns = []
        this.checkpoints = []

        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback

    }

    _createCourse() {

        const tempCheckpoints = []
        for (let p of this.checkpoints) {
            if (!p.name.includes("spawn")) {
                tempCheckpoints.push(p)
            }
        }
        this.checkpoints = tempCheckpoints

        /**
         * make sure
         * checkpoint 1 and spawn 1 have same index
         */
        this.checkpointSpawns.sort((a, b) => {
            if (a.name > b.name) return 1
            return -1
        })
        this.checkpoints.sort((a, b) => {
            if (a.name > b.name) return 1
            return -1
        })

        console.log("checkpoints and spawns", this.checkpoints, this.checkpointSpawns)




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
                console.log("No goal object")
            }
        }
        if (this.checkpoints) {
            for (let checkpoint of this.checkpoints) {
                let checkpointNumber: number = +checkpoint.name.slice("checkpoint".length, "checkpoint".length + 1) ?? 1

                if (checkpointNumber === 0) {
                    checkpointNumber = 1
                }
                console.log("checkpoint number", checkpointNumber)

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
        }
    }

    checkIfVechileCrossedGoal(vehicle: IVehicle) {
        if (this.goal) {

        }
    }
}