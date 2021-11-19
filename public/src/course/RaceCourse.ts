
import { CollisionEvent } from "@enable3d/common/dist/types";
import { ExtendedObject3D, Scene3D } from "enable3d";
import { IVehicle } from "../vehicles/IVehicle";
import { IRaceCourse } from "./ICourse";
import { TrackName } from '../shared-backend/shared-stuff';
import { Course } from './Course';
import { shuffleArray } from "../utils/utilFunctions";


export class RaceCourse extends Course implements IRaceCourse {


    goal: ExtendedObject3D
    goalSpawn: ExtendedObject3D

    checkpoint: ExtendedObject3D
    checkpointSpawn: ExtendedObject3D


    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void



    constructor(scene: Scene3D, trackName: TrackName, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {

        super(scene, trackName)

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



    setStartPositions(vehicles: IVehicle[]) {

        let usableSpawns = this.spawns.filter(s => s.name !== "checkpoint-spawn" && s.name !== "goal-spawn")
        if (usableSpawns.length >= vehicles.length) {
            const sortedSpawns = new Array(usableSpawns.length)
            for (let spawn of usableSpawns) {
                const idx = +spawn.name.slice(5, 6)
                sortedSpawns[idx - 1] = spawn
            }
            /**
             * Make the spawns be in order (spawn1, spawn2, etc.)
             * and remove unwanted spawns
             * since if there are 2 players, they could start one in front of the other instead of side by side
             */
            //  shuffleArray(sortedSpawns)

            // use predefined spawns

            for (let i = 0; i < vehicles.length; i++) {
                const p = sortedSpawns[i].position
                const r = sortedSpawns[i].rotation

                vehicles[i].setCheckpointPositionRotation({ position: p, rotation: { x: 0, z: 0, y: r.y } })
                vehicles[i].resetPosition()
                vehicles[i].stop()
            }
        } else {


            const p = this.startPosition
            const r = this.startRotation

            const courseY = this.startPosition?.y ?? 2
            let possibleStartingPos = []
            let offset = 1
            for (let i = 0; i < vehicles.length; i++) {

                offset *= -1

                if (i % 2 !== 0) {
                    offset += (Math.sign(offset) * 5)
                }

                possibleStartingPos.push({ x: p.x + offset - 5, y: courseY, z: p.z + offset - 5 })
            }


            for (let i = 0; i < vehicles.length; i++) {

                vehicles[i].canDrive = false

                const sI = Math.floor(Math.random() * possibleStartingPos.length)
                const sPos = possibleStartingPos[sI]
                possibleStartingPos.splice(sI, 1)

                vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: { x: 0, y: r.y, z: 0 } })
                vehicles[i].resetPosition()
                vehicles[i].stop()
            }
        }
    }


}