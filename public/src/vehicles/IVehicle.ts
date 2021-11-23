import ExtendedObject3D from '@enable3d/common/dist/extendedObject3D';
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { IVehicleSettings } from '../classes/User';
import { GameScene } from '../game/GameScene';
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

    /** could try and have a function getCollisionBody
     * But I couldn't import the definition of PhysicsBody
     */
    chassisMesh: ExtendedObject3D

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
    setColor: (color: string | number) => void
    toggleSound: (useSound: boolean) => void

}