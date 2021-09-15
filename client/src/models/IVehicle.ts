import * as THREE from '@enable3d/three-wrapper/dist/index';

export interface SimpleVector {
    x: number
    z: number
    y: number
}
export interface IVehicle {
    goForward: (speed: number) => void
    goBackward: (speed: number) => void
    noForce: () => void
    turnLeft: (angle: number) => void
    turnRight: (angle: number) => void
    noTurn: () => void
    break: (notBreak?: boolean) => void

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
}