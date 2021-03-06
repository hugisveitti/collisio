import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Euler, Vector3 } from "three";
import { GhostVehicle } from "../vehicles/GhostVehicle";
import { IPositionRotation, IVehicle, SimpleVector } from "../vehicles/IVehicle";


export interface ICourse {
    checkIfObjectOutOfBounds: (object: SimpleVector) => boolean
    toggleShadows: (useShadows: boolean) => void
    createCourse: () => Promise<void>
    clearCourse: () => void
    updateCourse: () => void
    setStartPositions: (vehicle: IVehicle[]) => void
    setToSpawnPostion: (spawnPosition: number, vehicle: IVehicle) => void
    ground: ExtendedObject3D
    startPosition: Vector3
    startRotation: Euler
    // Maybe this is not a tag course thing
    getCheckpointPositionRotation: (checkpointNumber: number) => IPositionRotation

    // make intersections transparent
    seeObject: (cameraPos: Vector3, objectPos: Vector3) => void
    nextBotDir: (currentDirNum: number) => undefined | { pos: Vector3, nextNum: number, goSlow: boolean | number, nextPos: Vector3, nextNextNum: number }
    restartCourse: () => void
}

export interface IRaceCourse extends ICourse {
    goalSpawn: ExtendedObject3D
    checkpointSpawns: ExtendedObject3D[]
    goal: ExtendedObject3D
    checkpoints: ExtendedObject3D[]
    getNumberOfCheckpoints: () => number
    getGoalCheckpoint: () => IPositionRotation
}

export interface ITagCourse extends ICourse {
    setupGameObjects: () => void
}