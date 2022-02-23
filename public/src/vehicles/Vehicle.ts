/**
 * Class to be extended by LowPolyVehicle and Sphere
 */

import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Audio, AudioListener, Color, MeshStandardMaterial, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { CurrentItemProps } from "../components/showRoom/showRoomCanvas";
import { MyScene } from "../game/MyScene";
import { defaultVehicleColorType, VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { possibleVehicleItemTypes, possibleVehicleMods, vehicleItems, VehicleSetup } from "../shared-backend/vehicleItems";
import { loadEngineSoundBuffer, loadSkidSoundBuffer } from "../sounds/gameSounds";
import { getStaticPath } from "../utils/settings";
import { numberScaler } from "../utils/utilFunctions";
import { getStaticCameraPos, IPositionRotation, IVehicle } from "./IVehicle";
import { IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";


const maxFov = 70
const minFov = 55
const fovScaler = numberScaler(minFov, maxFov, 1, 400, 8)
const soundScaler = numberScaler(1, 5, 0, 330, 2)


export interface IVehicleClassConfig {
    name: string
    vehicleNumber: number
    vehicleType: VehicleType
    scene: MyScene
    useSoundEffects?: boolean
    vehicleSetup: VehicleSetup
    id: string
    vehicleSettings?: IVehicleSettings
}

export class Vehicle implements IVehicle {
    id: string
    vehicleConfig: IVehicleConfig
    vehicleSetup: VehicleSetup
    // maybe this shouldnt import from showRoomCanvas
    vehicleItems: CurrentItemProps
    name: string
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
    isUpdatingVehicleSetup = false

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
    scene: MyScene

    chaseCameraSpeed: number
    useChaseCamera: boolean
    chaseCameraTicks: number


    prevChaseCameraPos: Vector3 = new Vector3(0, 0, 0)

    staticCameraPos: { x: number, y: number, z: number }

    vehicleBody: ExtendedObject3D;
    protected _canDrive: boolean;
    isPaused: boolean;
    vehicleSettings: IVehicleSettings;
    isReady: boolean;
    vehicleNumber: number;
    vehicleType: VehicleType;

    currentFov: number
    delta: number = 0

    constructor(config: IVehicleClassConfig) {
        this.id = config.id
        this.vehicleType = config.vehicleType
        this.vehicleSetup = config.vehicleSetup ?? {
            vehicleType: this.vehicleType,
            vehicleColor: defaultVehicleColorType
        }
        this.vehicleNumber = config.vehicleNumber
        this.name = config.name
        this.useSoundEffects = config.useSoundEffects
        this.scene = config.scene


        this.vehicleConfig = this.getDefaultVehicleConfig()
        this.isReady = false
        this.isPaused = false
        this._canDrive = false

        this.vehicleSettings = config.vehicleSettings ?? defaultVehicleSettings
        this.useChaseCamera = this.vehicleSettings.useChaseCamera
        this.chaseCameraSpeed = this.vehicleSettings.chaseCameraSpeed

        this.chaseCameraTicks = 0

        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)

        this.oldPos = new Vector3(0, 0, 0)
        this.currentFov = 55
        this.vehicleItems = {
            exhaust: undefined,
            spoiler: undefined,
            wheelGuards: undefined
        }
    }

    getCanDrive() {
        return this._canDrive
    }

    setCanDrive(_canDrive: boolean) {
        this._canDrive = _canDrive
    }

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
    getPosition(): Vector3 {
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

    lookForwardsBackwards(lookBackwards: boolean) { };
    resetPosition() { };
    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    setToGround() { }

    /**
   * make items between camera and vehicle see through
   * @param cameraPos position of camera relative to the world
   */
    seeVehicle(cameraPos: Vector3) {
        if (this.delta < 33) {
            this.scene.course.seeObject(cameraPos, this.getPosition()) // this.vehicleBody.position.clone())
        }
    }


    updateVehicleSettings(vehicleSettings: IVehicleSettings, vehicleSetup: VehicleSetup) {
        this.vehicleSettings =
        {
            ...defaultVehicleSettings,
            ...vehicleSettings
        }
        let goingToReload = false

        if (this.vehicleSettings.vehicleType !== this.vehicleType) {
            this.scene.setNeedsReload(true)
            goingToReload = true
        }

        const keys = Object.keys(vehicleSettings)
        for (let key of keys) {
            if (vehicleSettings[key] !== undefined) {
                this[key] = vehicleSettings[key]
            }
        }
        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)

        this._updateVehicleSettings()


        if (vehicleSetup) {
            if (this.scene.gameSceneConfig?.gameSettings?.gameType === "race") {
                this.setColor(vehicleSetup.vehicleColor)
            }
            if (vehicleSetup.vehicleType === this.vehicleType && !goingToReload) {

                this.updateVehicleSetup(vehicleSetup)
            } else if (!goingToReload) {
                console.warn("Vehiclesetup does not match the vehicle type, vehicleType", this.vehicleType, vehicleSetup.vehicleType)
            }
        }
    };

    async updateVehicleSetup(vehicleSetup: VehicleSetup) {
        if (this.isUpdatingVehicleSetup) return
        this.setColor(vehicleSetup.vehicleColor)
        if (vehicleSetup.vehicleType !== this.vehicleType) {
            console.warn("Vehicle setup doesn't match vehicleType", "setupType", vehicleSetup.vehicleType, "this vehicleType:", this.vehicleType)
            return
        }
        this.isUpdatingVehicleSetup = true

        this.vehicleConfig = this.getDefaultVehicleConfig()
        // not load if already loaded?
        this.vehicleSetup = vehicleSetup
        for (let item of possibleVehicleItemTypes) {
            if (this.vehicleItems[item]?.props?.id !== vehicleSetup[item]?.id) {
                if (this.vehicleItems[item]?.model) {
                    this.vehicleBody.remove(this.vehicleItems[item].model)
                    this.vehicleItems[item] = undefined
                }
                if (vehicleSetup[item]) {
                    await this.addItemToVehicle(vehicleSetup[item].path).then(model => {

                        this.vehicleItems[item] = {
                            props: vehicleSetup[item], model
                        }
                    }).catch(() => {
                        this.vehicleItems[item] = undefined
                    })
                }
            }

            for (let mod of possibleVehicleMods) {
                if (vehicleSetup?.[item]?.[mod.type]) {
                    this.vehicleConfig[mod.type] += Math.floor(vehicleSetup?.[item]?.[mod.type])
                }
            }
        }
        this.isUpdatingVehicleSetup = false
        this._updateVehicleSetup()
    }

    _updateVehicleSetup() { }

    _updateVehicleSettings() { }

    setColor(color: string | number) {
        this.vehicleColor = color;
        changeVehicleBodyColor(this.vehicleBody, [this.vehicleColor as VehicleColorType])
    }

    destroy() {
        return new Promise<void>((resolve, reject) => {
            resolve()
        })
    };
    addModels(tires: ExtendedObject3D[], body: ExtendedObject3D) { };

    addItemToVehicle(itemPath: string) {
        return new Promise<ExtendedObject3D>((resolve, reject) => {
            const itemProperties = vehicleItems[this.vehicleType][itemPath]
            console.log("item props", itemProperties)
            if (!this.vehicleBody) {

                console.warn("No vehiclebody to add items to")
                reject()
                return
            }
            const loader = new GLTFLoader()
            loader.load(getStaticPath(`models/${this.vehicleType}/${itemPath}.glb`), (gltf: GLTF) => {

                for (let child of gltf.scene.children) {
                    if (child.type === "Mesh") {
                        child.position.set(child.position.x, child.position.y + this.vehicleConfig.centerOfMassOffset, child.position.z)

                        if (itemProperties?.physicalObject) {
                            // this.scene.physics.destroy(this.vehicleBody)
                            console.log("is physical object")
                            this.scene.physics.add.existing(child as ExtendedObject3D, { mass: 1, collisionFlags: 1, shape: "convex", autoCenter: false })
                            this.vehicleBody.add(child)

                        }

                        this.vehicleBody.add(child)

                        resolve(child as ExtendedObject3D)
                    }
                }
            })
        })
    }

    getDefaultVehicleConfig() {
        return JSON.parse(JSON.stringify(vehicleConfigs[this.vehicleType]))
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
        if (this.engineSound && this.engineSound.source && this.engineSound.isPlaying) {
            this.engineSound.stop()
        }
    }

    startEngineSound() {
        if (this.isPaused) return

        if (!this.engineSound?.isPlaying && this.useSoundEffects) {
            this.engineSound.play()
        }
    }

    updateEngineSound() {
        if (!!this.engineSound && this.useSoundEffects) {
            const playbackRate = +soundScaler(Math.abs(this.getCurrentSpeedKmHour()))
            if (!isFinite(playbackRate)) {
                console.warn("Playback rate is non fitite", playbackRate)
                return
            }
            this.engineSound.setPlaybackRate(playbackRate)
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
                this.skidSound.setVolume(0)
                this.skidVolume = 0
            })
        )

        Promise.all(batch).then(() => {
            this.engineSoundLoaded = true
        })
    }

    addDownForce() {

    }

    updateFov() {
        if (!this.vehicleSettings.useDynamicFOV) return

        if (this.camera) {
            if (this.getCurrentSpeedKmHour() > 10) {
                this.currentFov = Math.min(fovScaler(this.getCurrentSpeedKmHour()), maxFov)
                this.camera.fov = this.currentFov
                //     this.camera.updateProjectionMatrix()
            } else {
                this.currentFov -= 1
                this.currentFov = Math.max(this.currentFov, minFov)

                this.camera.fov = this.currentFov
                //   this.camera.updateProjectionMatrix()

            }
        }
    }

    playSkidSound(skid: number) {
        if (!this.skidSound || !this.useSoundEffects || this.isPaused || !this._canDrive) return
        if (skid < 0.8) {

            this.skidVolume += 0.01
            this.skidVolume = Math.min(1, this.skidVolume)
            if (!isFinite(this.skidVolume)) {
                console.warn("Skid volume non finite", this.skidVolume)
                this.skidVolume = 0
                return
            }
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

export const changeVehicleBodyColor = (chassis: ExtendedObject3D, vehicleColors: VehicleColorType[]) => {
    // single material
    if (chassis.type === "Mesh") {
        (chassis.material as MeshStandardMaterial) = (chassis.material as MeshStandardMaterial).clone();
        (chassis.material as MeshStandardMaterial).color = new Color(vehicleColors[0] ?? defaultVehicleColorType)
    } else {
        // Group
        // multiple materials found in children
        for (let i = 0; i < chassis.children.length; i++) {
            (chassis.children[i].material as MeshStandardMaterial) = (chassis.children[i].material as MeshStandardMaterial).clone();
            (chassis.children[i].material as MeshStandardMaterial).color = new Color(vehicleColors[i % vehicleColors.length])
        }
    }
}