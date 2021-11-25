import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Euler, Vector3 } from "three";
import { IVehicle, SimpleVector } from "../vehicles/IVehicle";


export interface ICourse {
    checkIfObjectOutOfBounds: (object: SimpleVector) => boolean
    toggleShadows: (useShadows: boolean) => void
    createCourse: (useShadows: boolean, callback: () => void) => void
    clearCourse: () => void
    updateCourse: () => void
    setStartPositions: (vehicle: IVehicle[]) => void
    ground: ExtendedObject3D
    startPosition: Vector3
    startRotation: Euler
}

export interface IRaceCourse extends ICourse {
    goalSpawn: ExtendedObject3D
    checkpointSpawn: ExtendedObject3D
    goal: ExtendedObject3D
    checkpoint: ExtendedObject3D
}

export interface ITagCourse extends ICourse {
    setupGameObjects: () => void
}