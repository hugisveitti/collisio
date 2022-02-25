import ExtendedObject3D from '@enable3d/common/dist/extendedObject3D';
import { Vector3, Quaternion } from "three"
import { IVehicleSettings } from '../classes/User';
import { VehicleType } from '../shared-backend/shared-stuff';
import { VehicleSetup } from '../shared-backend/vehicleItems';
import { numberScaler } from '../utils/utilFunctions';

export interface SimpleVector {
    x: number
    z: number
    y: number
}

export const instanceOfSimpleVector = (object: any): object is SimpleVector => {
    return typeof object === "object" && ('x' in object && 'y' in object && 'z' in object)
}

export interface IPositionRotation {
    position: SimpleVector
    rotation: SimpleVector | Quaternion
}

export interface IVehicle {

    // hopefully a userId
    id: string

    /** could try and have a function getCollisionBody
     * But I couldn't import the definition of PhysicsBody
     */
    vehicleBody: ExtendedObject3D

    getCanDrive: () => boolean
    setCanDrive: (canDrive: boolean) => void

    isPaused: boolean

    engineForce: number

    vehicleSettings: IVehicleSettings
    vehicleSetup: VehicleSetup
    steeringSensitivity: number
    breakingForce: number

    /* Has model loaded */
    isReady: boolean

    /** same as playerNumber */
    vehicleNumber: number

    useBadRotationTicks: boolean

    spinCameraAroundVehicle: boolean

    useChaseCamera: boolean
    vehicleType: VehicleType

    goForward: () => void
    goBackward: (speed?: number) => void
    noForce: (stop?: boolean) => void

    noTurn: () => void
    turn: (angle: number) => void
    break: (notBreak?: boolean) => void
    zeroBreakForce: () => void
    zeroEngineForce: () => void
    stop: () => void
    start: () => void
    pause: () => void
    unpause: () => void

    addCamera: (camera: any) => void
    removeCamera: () => void
    cameraLookAt: (camera: any, delta: number) => void
    update: (delta: number) => void
    setPosition: (x: number, y: number, z: number) => void
    getPosition: () => SimpleVector
    getRotation: () => Quaternion
    setRotation: (x: number | Quaternion, y?: number, z?: number) => void
    getCurrentSpeedKmHour: (delta?: number) => number

    lookForwardsBackwards: (lookBackwards: boolean) => void

    resetPosition: () => void
    setCheckpointPositionRotation: (positionRotation: IPositionRotation) => void
    updateVehicleSettings: (vehicleSettings: IVehicleSettings, vehicleSetup: VehicleSetup) => void
    updateVehicleSetup: (vehicleSetup: VehicleSetup) => void
    setColor: (color: string | number) => void
    toggleSound: (useSound: boolean) => void

    addModels: (tires: ExtendedObject3D[], body: ExtendedObject3D) => void

    getTowPivot: () => Vector3

    setToGround: () => void
    destroy: () => Promise<void>

    addItemToVehicle: (filename: string) => Promise<ExtendedObject3D>
}


export interface ITestVehicle extends IVehicle {
    randomDrive: () => void
    intelligentDrive: (log: boolean) => void
}

//const zScaler = numberScaler(12, 30, 1, 10, 2)
// const yScaler = numberScaler(4, 12, 1, 10, 2)
const zScaler = numberScaler(12, 21, 1, 10, 2)
const yScaler = numberScaler(4, 8, 1, 10, 2)

// cameraZoom should be a number from 1 to 10
export const getStaticCameraPos = (cameraZoom: number) => {
    // cameraZoom = 2
    return { x: 0, y: yScaler(cameraZoom), z: -zScaler(cameraZoom) }
}

