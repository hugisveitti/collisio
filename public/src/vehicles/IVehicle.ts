import * as THREE from '@enable3d/three-wrapper/dist/index';
import { IVehicleSettings } from '../classes/User';
import { GameTime } from '../game/GameTimeClass';

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
    rotation: SimpleVector
}

export interface IVehicle {
    canDrive: boolean
    isPaused: boolean
    mass: number

    vehicleSettings: IVehicleSettings
    engineForce: number
    steeringSensitivity: number
    breakingForce: number

    /* Has model loaded */
    isReady: boolean

    goForward: (moreSpeed?: boolean) => void
    goBackward: (speed?: number) => void
    noForce: () => void
    turnLeft: (angle: number) => void
    turnRight: (angle: number) => void
    noTurn: () => void
    turn: (angle: number) => void
    break: (notBreak?: boolean) => void
    stop: () => void
    start: () => void
    pause: () => void
    unpause: () => void

    addCamera: (camera: any) => void
    cameraLookAt: (camera: any) => void
    update: () => void
    setPosition: (x: number, y: number, z: number) => void
    getPosition: () => SimpleVector
    getRotation: () => SimpleVector
    setRotation: (x: number, y: number, z: number) => void
    getCurrentSpeedKmHour: () => number
    setFont: (font: THREE.Font) => void

    lookForwardsBackwards: (lookBackwards: boolean) => void

    resetPosition: () => void
    setCheckpointPositionRotation: (positionRotation: IPositionRotation) => void
    updateVehicleSettings: (vehicleSettings: IVehicleSettings) => void

}