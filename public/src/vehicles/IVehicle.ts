import ExtendedObject3D from '@enable3d/common/dist/extendedObject3D';
import { Font, Vector3, Quaternion } from "three"
import { IVehicleSettings } from '../classes/User';
import { VehicleType } from '../shared-backend/shared-stuff';

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

    /** could try and have a function getCollisionBody
     * But I couldn't import the definition of PhysicsBody
     */
    vehicleBody: ExtendedObject3D

    canDrive: boolean
    isPaused: boolean

    engineForce: number

    vehicleSettings: IVehicleSettings
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

    goForward: (moreSpeed?: boolean) => void
    goBackward: (speed?: number) => void
    noForce: () => void
    turnLeft: (angle: number) => void
    turnRight: (angle: number) => void
    noTurn: () => void
    turn: (angle: number) => void
    break: (notBreak?: boolean) => void
    zeroBreakForce: () => void
    stop: () => void
    start: () => void
    pause: () => void
    unpause: () => void

    addCamera: (camera: any) => void
    removeCamera: () => void
    cameraLookAt: (camera: any) => void
    update: () => void
    setPosition: (x: number, y: number, z: number) => void
    getPosition: () => SimpleVector
    getRotation: () => Quaternion
    setRotation: (x: number | Quaternion, y?: number, z?: number) => void
    getCurrentSpeedKmHour: () => number
    setFont: (font: Font) => void

    lookForwardsBackwards: (lookBackwards: boolean) => void

    resetPosition: () => void
    setCheckpointPositionRotation: (positionRotation: IPositionRotation) => void
    updateVehicleSettings: (vehicleSettings: IVehicleSettings) => void
    setColor: (color: string | number) => void
    toggleSound: (useSound: boolean) => void
    destroy: () => void

    addModels: (tires: ExtendedObject3D[], body: ExtendedObject3D) => void

}


export interface ITestVehicle extends IVehicle {
    randomDrive: () => void
    intelligentDrive: (log: boolean) => void
}

export const getStaticCameraPos = (onlyMobile: boolean) => {
    if (onlyMobile) {
        return { x: 0, y: 5, z: -15 }
    }

    return { x: 0, y: 10, z: -25 }
}


