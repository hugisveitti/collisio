
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

    checkpoint: ExtendedObject3D
    checkpointSpawn: ExtendedObject3D


    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void



    constructor(gameScene: GameScene, trackName: TrackName, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {

        super(gameScene, trackName)

        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback

    }

    _createCourse() {
        this.setupCollisionListeners()
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
        if (this.checkpoint) {
            this.checkpoint.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                if (otherObject.name.slice(0, 7) === "vehicle") {
                    this.checkpointCrossedCallback(otherObject)
                }
            })
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