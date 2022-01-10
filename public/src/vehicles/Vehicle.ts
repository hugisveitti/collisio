/**
 * Class to be extended by LowPolyVehicle and Sphere
 */

import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Audio, AudioListener, Font, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { loadEngineSoundBuffer } from "../sounds/gameSounds";
import { getStaticCameraPos, IPositionRotation, IVehicle, SimpleVector } from "./IVehicle";
import { IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";


export interface IVehicleClassConfig {
    vehicleColor: string | number | undefined
    name: string
    vehicleNumber: number
    vehicleType: VehicleType
    scene: IGameScene
    useEngineSound?: boolean
}

export class Vehicle implements IVehicle {
    vehicleConfig: IVehicleConfig
    name: string
    mass: number
    vehicleColor: number | string
    useEngineSound: boolean
    engineSoundLoaded = false
    engineSound: Audio | undefined
    camera: PerspectiveCamera

    badRotationTicks = 0
    useBadRotationTicks = true
    modelsLoaded = false

    oldPos: Vector3

    /** for startup animation */
    spinCameraAroundVehicle: boolean

    cameraDir = new Vector3()
    cameraLookAtPos = new Vector3()
    cameraDiff = new Vector3()
    cameraTarget = new Vector3()

    steeringSensitivity = 0.5
    vehicleSteering = 0
    breakingForce: number
    engineForce: number
    zeroVec = new Ammo.btVector3(0, 0, 0)
    checkpointPositionRotation: IPositionRotation = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
    scene: IGameScene

    chaseCameraSpeed: number
    useChaseCamera: boolean
    chaseCameraTicks: number


    prevChaseCameraPos: Vector3 = new Vector3(0, 0, 0)

    staticCameraPos: { x: number, y: number, z: number }

    vehicleBody: ExtendedObject3D;
    canDrive: boolean;
    isPaused: boolean;
    vehicleSettings: IVehicleSettings;
    isReady: boolean;
    vehicleNumber: number;
    vehicleType: VehicleType;

    goForward(moreSpeed?: boolean) { };
    goBackward(speed?: number) { };
    noForce() { };

    noTurn() { };
    turn(angle: number) { };
    break(notBreak?: boolean) { };
    zeroBreakForce() { };
    zeroEngineForce() { };
    stop() { };
    start() { };
    pause() { };
    unpause() { };
    addCamera(camera: any) { };
    removeCamera() { };
    cameraLookAt(camera: any) { };
    update(delta: number) { };
    setPosition(x: number, y: number, z: number) { };
    getPosition(): SimpleVector {
        console.warn("This function should not be called, getPosition of vehicle class")
        return new Vector3(0, 0, 0)
    };
    getRotation(): Quaternion {
        console.warn("This function should not be called, getRotation of vehicle class")
        return new Quaternion(0, 0, 0, 0)
    };
    setRotation(x: number | Quaternion, y?: number, z?: number) { };
    getCurrentSpeedKmHour(delta?: number): number {
        console.warn("This function should not be called, getCurrentSpeedKmHour of vehicle class")
        return 0
    };
    setFont(font: Font) { };
    lookForwardsBackwards(lookBackwards: boolean) { };
    resetPosition() { };
    setCheckpointPositionRotation(positionRotation: IPositionRotation) { };
    updateVehicleSettings(vehicleSettings: IVehicleSettings) { };
    setColor(color: string | number) { };
    destroy() { };
    addModels(tires: ExtendedObject3D[], body: ExtendedObject3D) { };

    constructor(config: IVehicleClassConfig) {
        this.vehicleType = config.vehicleType
        this.vehicleNumber = config.vehicleNumber
        this.name = config.name
        this.useEngineSound = config.useEngineSound
        this.scene = config.scene
        this.vehicleColor = config.vehicleColor

        this.vehicleConfig = vehicleConfigs[this.vehicleType]
        this.isReady = false
        this.isPaused = false
        this.canDrive = false

        this.vehicleSettings = defaultVehicleSettings

        this.mass = this.vehicleConfig.mass

        this.useChaseCamera = false
        this.chaseCameraSpeed = 0.3
        this.chaseCameraTicks = 0

        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)

        this.oldPos = new Vector3(0, 0, 0)
    }

    getTowPivot() {
        return vehicleConfigs[this.vehicleType].towPosition
    }

    toggleSound(useSound: boolean) {
        this.useEngineSound = useSound
        if (!this.engineSound) {
            console.warn("Engine sound not loaded")
            return
        }
    }

    stopEngineSound() {
        if (this.engineSound && this.engineSound.source) {
            this.engineSound.stop()
        }
    }

    startEngineSound() {
        if (this.isPaused) return

        if (!this.engineSound?.isPlaying && this.useEngineSound) {
            this.engineSound.play()
        }
    }

    createCarSounds() {
        const listener = new AudioListener()
        this.camera.add(listener)
        let volume = 0.3
        this.engineSound = new Audio(listener)


        loadEngineSoundBuffer((engineSoundBuffer: AudioBuffer) => {
            this.engineSound.setBuffer(engineSoundBuffer)
            this.engineSound.setLoop(true)
            this.engineSound.setVolume(volume)
            this.engineSound.setLoopEnd(2.5)
            this.engineSoundLoaded = true

            /**
             * some bug here
             * AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
             */
            this.stopEngineSound()
        })
    }


}