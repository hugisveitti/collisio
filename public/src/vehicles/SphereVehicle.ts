import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Euler, Quaternion, Audio, AudioListener, Color, Font, MeshStandardMaterial, PerspectiveCamera, Vector3, TextGeometry, MeshLambertMaterial, Mesh } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { loadEngineSoundBuffer } from "../sounds/gameSounds";
import { getStaticPath } from "../utils/settings";
import { degToRad, logScaler, numberScaler } from "../utils/utilFunctions";
import { getStaticCameraPos, IPositionRotation, IVehicle } from "./IVehicle";
import { vehicleConfigs } from "./VehicleConfigs";




export class SphereVehicle implements IVehicle {

    vehicleBody: ExtendedObject3D
    canDrive: boolean;
    isPaused: boolean;
    mass: number;
    scene: IGameScene
    color: string | number | undefined
    name: string
    steeringSensitivity = 0.5
    vehicleSteering = 0
    breakingForce: number
    engineForce: number
    zeroVec = new Ammo.btVector3(0, 0, 0)
    checkpointPositionRotation: IPositionRotation = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }

    vector: Ammo.btVector3
    badRotationTicks = 0
    useBadRotationTicks = true
    modelsLoaded = false

    cameraDir = new Vector3()
    cameraLookAtPos = new Vector3()
    cameraDiff = new Vector3()
    cameraTarget = new Vector3()

    quaternion = new Quaternion()
    euler = new Euler()

    chaseCameraSpeed: number
    useChaseCamera: boolean
    chaseCameraTicks: number
    prevCahseCameraPos: Vector3 = new Vector3(0, 0, 0)
    vehicleSettings: IVehicleSettings
    camera: PerspectiveCamera
    isReady: boolean
    vehicleNumber: number;
    oldPos: Vector3

    maxSpeedTicks: number
    useEngineSound: boolean

    xVel: number
    yVel: number
    zVel: number
    // decay
    dVel: number
    // rate of change of vel, remove z leter, should be just dVel and vel
    dzVel: number

    yRot: number

    spinCameraAroundVehicle: boolean;
    vehicleType: VehicleType;

    physicsConfig: {}

    staticCameraPos: { x: number, y: number, z: number }

    prevPosition: Vector3

    constructor(scene: IGameScene, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType, useEngineSound?: boolean) {
        this.oldPos = new Vector3(0, 0, 0)
        this.scene = scene
        this.color = color
        this.name = name
        this.canDrive = false
        this.isPaused = false
        this.vehicleNumber = vehicleNumber
        this.useChaseCamera = false
        this.chaseCameraSpeed = 0.3
        this.chaseCameraTicks = 0
        this.vehicleSettings = defaultVehicleSettings
        this.isReady = false
        this.vehicleType = vehicleType


        //this.maxEngineFoce = 1000
        this.maxSpeedTicks = 0
        this.useEngineSound = useEngineSound


        this.vehicleBody = this.scene.physics.add.sphere({ mass: 100, radius: 2 }, { lambert: { color: this.color } })


        this.vehicleBody.castShadow = true
        this.isReady = true
        this.canDrive = true

        this.xVel = 0
        this.zVel = 0
        this.yVel = 0
        this.yRot = 0

        this.physicsConfig = { mass: vehicleConfigs[this.vehicleType].mass, shape: "convex", autoCenter: false, collisionFlags: 0 }

        this.engineForce = vehicleConfigs[this.vehicleType].engineForce
        this.engineForce = 300
        this.breakingForce = -1
        this.dVel = 3
        this.dzVel = -1

        this.vector = new Ammo.btVector3(0, 0, 0)

        this.staticCameraPos = getStaticCameraPos(this.scene.gameSceneConfig?.onlyMobile)
        this.prevPosition = new Vector3(0, 0, 0)
    }



    addModels(tires: ExtendedObject3D[], body: ExtendedObject3D): void {

        this.staticCameraPos = getStaticCameraPos(this.scene.gameSceneConfig?.onlyMobile)


        this.isReady = false

        this.scene.physics.destroy(this.vehicleBody)
        this.scene.scene.remove(this.vehicleBody)

        this.vehicleBody = body.clone()

        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
        this.scene.add.existing(this.vehicleBody, this.physicsConfig)
        //   this.scene.physics.add.existing(this.vehicleBody,{collisionFlags})

        this.vehicleBody.body.name = "vehicle-" + this.vehicleNumber
        this.vehicleBody.name = "vehicle-" + this.vehicleNumber



        // this.vehicleBody.visible = true

        this.vehicleBody.receiveShadow = false
        this.vehicleBody.castShadow = true
        this.modelsLoaded = true;
        const material = (this.vehicleBody.material as MeshStandardMaterial).clone();
        this.vehicleBody.material = material;

        (this.vehicleBody.material as MeshStandardMaterial).color = new Color(this.color);

        // const { x, y, z } = vehicleConfigs[this.vehicleType].inertia
        // this.vector.setValue(x, y, z)
        // //this.vehicle.getRigidBody().setMassProps(this.mass, this.vector)
        // this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(this.mass, this.vector)

        this.vehicleBody.body.setAngularFactor(0, 1, 0)
        this.vehicleBody.body.setFriction(1)
        this.vehicleBody.body.setCollisionFlags(0)
        this.vehicleBody.body.setBounciness(0.4)
        this.isReady = true
        this.canDrive = true
        this.isPaused = false
    };


    goForward(moreSpeed?: boolean): void {
        // if (this.zVel > -this.engineForce) {
        //     this.zVel -= this.dzVel
        // }
        if (!this.canDrive) return


        this.zVel = -this.engineForce
    }
    goBackward(speed?: number): void {
        if (!this.canDrive) return

        if (this.zVel < 10) {
            this.zVel += 10
        } else {

            this.zVel = this.engineForce
        }

        return
        if (this.zVel < this.dVel * 5) {
            this.zVel += this.dVel * 5

        } else {
            // if (this.zVel < this.engineForce) {
            //     this.zVel += this.dzVel
            // }
            this.zVel = this.engineForce

        }
    }

    noForce(): void {
        // this.zVel = 0
        if (this.zVel < - this.dVel * 10) {
            this.zVel += this.dVel
        } else if (this.zVel > this.dVel * 10) {
            this.zVel -= this.dVel
        } else {
            this.zVel = 0
        }

        return
        if (this.zVel < - (this.dVel * 5)) {
            this.zVel += this.dVel
        } else if (this.zVel > this.dVel * 5) {
            this.zVel -= this.dVel
        } else {
            this.zVel = 0
        }
        // this.zVel = this.engineForce
    }

    turnLeft(angle: number): void { }

    turnRight(angle: number): void { }

    noTurn(): void {
        // this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        // this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        this.yVel = 0
    }

    turn(angle: number): void {
        //        this.vehicleBody.body.setAngularVelocity(0, 0, angle)
        //this.yVel = angle * degToRad * this.steeringSensitivity * 25
        this.yVel = angle * degToRad
        this.yRot %= (Math.PI * 2)
        this.yRot -= (angle * degToRad * this.steeringSensitivity * .3)

    }

    break(notBreak?: boolean): void { }

    zeroBreakForce(): void { }

    zeroEngineForce() {
        this.zVel = 0

    }

    stop(): void {
        this.zVel = 0
        if (!this.vehicleBody?.body)
            this.vehicleBody.body.setCollisionFlags(1)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        this.vehicleBody.body.applyForce(0, 0, 0)
    }

    start(): void {
        this.vehicleBody?.body?.setCollisionFlags(0)
    }

    pause(): void {
        this.isPaused = true
        this.canDrive = false
        this.zVel = 0
        this.xVel = 0
        this.yVel = 0
        this.vehicleBody?.body?.setCollisionFlags(1)
    }

    unpause(): void {
        this.isPaused = false
        this.canDrive = true
        this.vehicleBody?.body?.setCollisionFlags(0)
    }

    addCamera(camera: any): void {
        this.camera = camera
        //this.vehicleBody.add(this.camera)
    }

    // remove camera from body
    removeCamera(): void {

    }

    // look at vehicle
    cameraLookAt(camera: PerspectiveCamera): void {


        const pos = this.vehicleBody.position.clone()
        const rot = this.vehicleBody.rotation

        const chaseSpeedY = 0.9
        const chaseSpeed = .9 //this.chaseCameraSpeed

        // this.oldPos = pos.clone()

        // this is for the follow camera effect
        this.cameraTarget.set(
            pos.x - ((Math.sin(this.yRot) * -this.staticCameraPos.z)),
            pos.y + this.staticCameraPos.y,
            pos.z + ((Math.cos(this.yRot) * -this.staticCameraPos.z))
        )



        this.cameraDiff.subVectors(this.cameraTarget, camera.position)

        this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * chaseSpeed))
        this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * chaseSpeed))
        this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * chaseSpeedY)) // have the y dir change slower?

        //    this.cameraLookAtPos.set(0, 0, 0)
        const cs = 0.5

        this.cameraLookAtPos.x = (this.prevCahseCameraPos.x + ((pos.x - this.prevCahseCameraPos.x) * cs))
        this.cameraLookAtPos.z = (this.prevCahseCameraPos.z + ((pos.z - this.prevCahseCameraPos.z) * cs))
        this.cameraLookAtPos.y = (this.prevCahseCameraPos.y + ((pos.y - this.prevCahseCameraPos.y) * cs))

        this.prevCahseCameraPos = this.cameraLookAtPos.clone()


        // camera.position.set(
        //     pos.x - ((Math.sin(this.yRot) * cameraOffset)),
        //     pos.y + staticCameraPos.y,
        //     pos.z + ((Math.cos(this.yRot) * cameraOffset))
        // )

        camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
        camera.updateProjectionMatrix()

        camera.lookAt(this.cameraLookAtPos)
        this.cameraLookAtPos = pos.clone()



    }

    getTowPivot() {
        console.warn("Tow pivot not implemented for sphere")
        return new Vector3(1, 0, 1)
    }

    setPosition(x: number, y: number, z: number): void {
        this.scene.physics.destroy(this.vehicleBody)

        this.vehicleBody.position.set(x, y + 1, z)
        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
    }

    getPosition(): Vector3 {

        return this.vehicleBody.position
    }

    getRotation(): Quaternion {
        this.quaternion.setFromEuler(this.vehicleBody.rotation)
        return this.quaternion
    }


    setRotation(x: number | Quaternion, y?: number, z?: number): void {
        this.scene.physics.destroy(this.vehicleBody)
        if (x instanceof Quaternion) {
            this.euler.setFromQuaternion(x)
            this.yRot = this.euler.y
            this.vehicleBody.setRotationFromQuaternion(x)
        } else {
            this.yRot = y
            this.vehicleBody.rotation.set(x, y, z)
        }

        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
    }

    getCurrentSpeedKmHour(delta: number): number {
        const { x, z } = this.vehicleBody.body.velocity

        const num = Math.sqrt(x * x + z * z)

        const currPos = this.vehicleBody.position

        console.log("delta", delta)
        const meterPerSec = (currPos.distanceTo(this.prevPosition) / delta)
        const kmh = meterPerSec * (3.6) * 1000
        console.log("speed", kmh)
        console.log("numb", num)

        this.prevPosition = currPos.clone()


        return num
    }

    setFont(font: Font): void {

    }

    lookForwardsBackwards(lookBackwards: boolean): void {
        console.warn("lookForwardsBackwards not imple")
    }

    resetPosition(): void {
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        this.zVel = 0


        const { position, rotation } = this.checkpointPositionRotation
        this.setPosition(position.x, position.y, position.z)

        if (!(rotation instanceof Quaternion)) {

            this.setRotation(rotation.x, rotation.y, rotation.z)
        } else {
            this.setRotation(rotation as Quaternion)
        }

        this.scene.resetVehicleCallback(this.vehicleNumber)
    }

    setCheckpointPositionRotation(positionRotation: IPositionRotation): void {
        this.checkpointPositionRotation = positionRotation
    }

    updateVehicleSettings(vehicleSettings: IVehicleSettings): void {
        this.vehicleSettings = vehicleSettings

        if (this.vehicleSettings.vehicleType !== this.vehicleType) {
            this.scene.setNeedsReload(true)
        }

        const keys = Object.keys(vehicleSettings)
        for (let key of keys) {
            if (vehicleSettings[key] !== undefined) {
                this[key] = vehicleSettings[key]
            }
        }


        // this.vehicleBody.remove(this.camera)
        // if (!this.useChaseCamera && this.camera) {
        //     const { x, y, z } = staticCameraPos
        //     this.camera.position.set(x, y, z)
        //     this.vehicleBody.add(this.camera)
        // }

    }


    setColor(color: string | number) {
        this.color = color;
        (this.vehicleBody.material as MeshStandardMaterial).color = new Color(this.color);
    }

    toggleSound(useSound: boolean): void {

    }

    destroy(): void {
        this.scene.destroy(this.vehicleBody)
    }

    rotateY(num: number) {
        this.vehicleBody.rotateY(num)

        //this.scene.physics.add.existing(this.vehicleBody)
    }

    // update mesh and model to vehicle place
    update(delta: number): void {
        this.vehicleBody.body.setAngularVelocity(this.zVel * Math.cos(this.yRot) * .05, 0, this.zVel * Math.sin(this.yRot) * .05)
        // this.vehicleBody.body.ammo.
        // this.vehicleBody.body.setVelocity(-this.zVel * Math.sin(this.yRot), 0, this.zVel * Math.cos(this.yRot))
        this.vehicleBody.body.applyForce(-this.zVel * Math.sin(this.yRot), 0, this.zVel * Math.cos(this.yRot))


    }

    randomDrive(): void { }

}

export const loadSphereModel = async (vehicleType: VehicleType, onlyLoad?: boolean): Promise<ExtendedObject3D> => {
    const promise = new Promise<ExtendedObject3D>((resolve, reject) => {




        const loader = new GLTFLoader()

        loader.load(getStaticPath(`models/${vehicleConfigs[vehicleType].path}`), (gltf: GLTF) => {
            let sphere: ExtendedObject3D
            let extraStuff: ExtendedObject3D
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh" || child.type === "Group") {

                    if (child.name.includes("sphere")) {
                        let _sphere = (child as ExtendedObject3D);
                        sphere = _sphere
                        // import to clone the material since the tires share material
                        const material = (sphere.material as MeshStandardMaterial).clone();
                        //  material.color = new Color("");
                        (sphere.material as MeshStandardMaterial) = material
                        if (!onlyLoad) {
                            // chassis.geometry.center();
                        }
                    } else if (child.name.includes("extra-stuff")) {
                        extraStuff = (child as ExtendedObject3D)
                        if (!onlyLoad) {
                            // extraCarStuff.geometry.center()
                        }

                    }
                }
            }


            resolve(sphere)
        })
    })
    return promise
}