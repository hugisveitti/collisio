/**
 * Class to be extended by LowPolyVehicle and Sphere
 */

import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Audio, AudioListener, Font, PerspectiveCamera, Quaternion, Vector3, PositionalAudio } from "three";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { loadEngineSoundBuffer, loadSkidSoundBuffer } from "../sounds/gameSounds";
import { numberScaler } from "../utils/utilFunctions";
import { getStaticCameraPos, IPositionRotation, IVehicle, SimpleVector } from "./IVehicle";
import { IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";

const maxFov = 80
const minFov = 55
const fovScaler = numberScaler(minFov, maxFov, 1, 400, 8)


export interface IVehicleClassConfig {
    vehicleColor: string | number | undefined
    name: string
    vehicleNumber: number
    vehicleType: VehicleType
    scene: IGameScene
    useSoundEffects?: boolean
}

export class Vehicle implements IVehicle {
    vehicleConfig: IVehicleConfig
    name: string
    mass: number
    vehicleColor: number | string
    useSoundEffects: boolean
    engineSoundLoaded = false
    engineSound: Audio | undefined
    skidSound: Audio | undefined
    skidVolume: number

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

    currentFov: number


    goForward() { };
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
    cameraLookAt(camera: any, detla: number) { };
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
    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    setToGround() { }

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {
        console.log("vehicle settings updated", vehicleSettings)
        this.vehicleSettings =
        {
            ...defaultVehicleSettings,
            ...vehicleSettings
        }

        if (this.vehicleSettings.vehicleType !== this.vehicleType) {
            this.scene.setNeedsReload(true)
        }

        const keys = Object.keys(vehicleSettings)
        for (let key of keys) {
            if (vehicleSettings[key] !== undefined) {
                this[key] = vehicleSettings[key]
            }
        }
        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)

        if (this.scene.gameSceneConfig?.gameSettings?.gameType === "race") {
            this.setColor(this.vehicleColor)
        }
        this._updateVehicleSettings()
    };

    _updateVehicleSettings() { }

    setColor(color: string | number) { };
    destroy() { };
    addModels(tires: ExtendedObject3D[], body: ExtendedObject3D) { };

    constructor(config: IVehicleClassConfig) {
        this.vehicleType = config.vehicleType
        this.vehicleNumber = config.vehicleNumber
        this.name = config.name
        this.useSoundEffects = config.useSoundEffects
        this.scene = config.scene
        this.vehicleColor = config.vehicleColor

        this.vehicleConfig = JSON.parse(JSON.stringify(vehicleConfigs[this.vehicleType]))
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
        this.currentFov = 55
    }

    getTowPivot() {
        return vehicleConfigs[this.vehicleType].towPosition
    }

    toggleSound(useSound: boolean) {
        this.useSoundEffects = useSound
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

        if (!this.engineSound?.isPlaying && this.useSoundEffects) {
            this.engineSound.play()
        }
    }

    createCarSounds() {
        const listener = new AudioListener()
        this.camera.add(listener)
        let volume = 0.3
        this.engineSound = new Audio(listener)
        const batch = []

        batch.push(

            loadEngineSoundBuffer().then((engineSoundBuffer: AudioBuffer) => {
                this.engineSound.setBuffer(engineSoundBuffer)
                this.engineSound.setLoop(true)
                this.engineSound.setVolume(volume)
                this.engineSound.setLoopEnd(2.5)


                /**
                 * some bug here
                 * AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
                 */
                this.stopEngineSound()
            })
        )

        this.skidSound = new Audio(listener)
        batch.push(
            loadSkidSoundBuffer().then(buffer => {
                this.skidSound.setBuffer(buffer)
                this.skidSound.setLoop(false)
                this.skidSound.setVolume(1)
                this.skidVolume = 0
            })
        )

        Promise.all(batch).then(() => {
            console.log("all sounds loaded")
            this.engineSoundLoaded = true
        })
    }

    addDownForce() {
        // const downforceCoeff = .4
        // const frontalArea = 2
        // const airDence = 1.2041

        // const v = this.getCurrentSpeedKmHour()
        // const force = 0.5 * downforceCoeff * frontalArea * airDence * (v * v)

        // this.vehicleBody.body.applyForceY(-force)
    }

    updateFov() {
        if (this.camera) {
            if (this.getCurrentSpeedKmHour() > 10) {
                this.currentFov = Math.min(fovScaler(this.getCurrentSpeedKmHour()), maxFov)
                this.camera.fov = this.currentFov
                this.camera.updateProjectionMatrix()
            } else {
                this.currentFov -= 1
                this.currentFov = Math.max(this.currentFov, minFov)

                this.camera.fov = this.currentFov
                this.camera.updateProjectionMatrix()

            }
        }
    }

    playSkidSound(skid: number) {
        if (!this.skidSound || !this.useSoundEffects || this.isPaused || !this.canDrive) return
        if (skid < 0.8) {

            this.skidVolume += 0.01
            this.skidVolume = Math.min(1, this.skidVolume)
            this.skidSound.setVolume(this.skidVolume)
            if (!this.skidSound.isPlaying) {
                this.skidSound.play()
            } else {
                this.skidSound.isPlaying
            }
        } else if (this.skidSound.isPlaying) {
            this.skidVolume = 0
            this.skidSound?.stop()
        }
    }

}