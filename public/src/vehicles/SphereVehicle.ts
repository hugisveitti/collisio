import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Euler, Quaternion, Audio, AudioListener, Color, Font, MeshStandardMaterial, PerspectiveCamera, Vector3, TextGeometry, MeshLambertMaterial, Mesh } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { loadEngineSoundBuffer } from "../sounds/gameSounds";
import { getStaticPath } from "../utils/settings";
import { degToRad, logScaler, numberScaler } from "../utils/utilFunctions";
import { IPositionRotation, IVehicle } from "./IVehicle";
import { staticCameraPos } from "./LowPolyVehicle";
import { vehicleConfigs } from "./VehicleConfigs";

const cameraOffset = -staticCameraPos.z


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
        this.dVel = 3
        this.dzVel = -1

        this.vector = new Ammo.btVector3(0, 0, 0)
    }



    addModels(tires: ExtendedObject3D[], body: ExtendedObject3D): void {

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

        this.zVel = -this.engineForce
    }
    goBackward(speed?: number): void {
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

    stop(): void {
        this.zVel = 0
        this.vehicleBody.body.setCollisionFlags(1)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        this.vehicleBody.body.applyForce(0, 0, 0)
    }

    start(): void {

        this.vehicleBody.body.setCollisionFlags(0)
    }

    pause(): void {

        this.isPaused = true
        this.canDrive = false
        this.zVel = 0
        this.xVel = 0
        this.yVel = 0
        this.vehicleBody.body.setCollisionFlags(1)
    }

    unpause(): void {
        this.isPaused = false
        this.canDrive = true
        this.vehicleBody.body.setCollisionFlags(0)
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


        let pos = this.vehicleBody.position.clone()



        camera.position.set(
            pos.x - ((Math.sin(this.yRot) * cameraOffset)),
            pos.y + staticCameraPos.y,
            pos.z + ((Math.cos(this.yRot) * cameraOffset))
        )


        camera.lookAt(pos)



    }



    setPosition(x: number, y: number, z: number): void {

        this.scene.physics.destroy(this.vehicleBody)

        this.vehicleBody.position.set(x, y + 1, z)
        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)

        const rot = new Euler().setFromQuaternion(this.getRotation())

        // I think these are always the same
        // this.vehicleBody.pos is set to the value of this.getPosition in update()
        let pos = this.vehicleBody.position.clone() // this.getPosition()



        this.camera.position.set(
            pos.x - ((Math.sin(this.yRot) * cameraOffset)),
            pos.y + staticCameraPos.y,
            pos.z + ((Math.cos(this.yRot) * cameraOffset)) //* Math.sign(Math.cos(rot.z)))
        )

    }

    getPosition(): Vector3 {

        return this.vehicleBody.position
    }

    getRotation(): Quaternion {

        return new Quaternion().setFromEuler(this.vehicleBody.rotation)
    }


    setRotation(x: number | Quaternion, y?: number, z?: number): void {
        this.scene.physics.destroy(this.vehicleBody)
        if (x instanceof Quaternion) {
            const e = new Euler().setFromQuaternion(x)
            this.yRot = e.y
            this.vehicleBody.setRotationFromQuaternion(x)
        } else {
            this.yRot = y
            this.vehicleBody.rotation.set(x, y, z)
        }

        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
    }

    getCurrentSpeedKmHour(): number {
        const { x, z } = this.vehicleBody.body.velocity

        const num = Math.sqrt(x * x + z * z)
        return num
    }

    setFont(font: Font): void {

    }

    lookForwardsBackwards(lookBackwards: boolean): void {
        console.warn("not imple")
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



        const keys = Object.keys(vehicleSettings)
        for (let key of keys) {
            if (vehicleSettings[key] !== undefined) {
                this[key] = vehicleSettings[key]
            }
        }


        this.vehicleBody.remove(this.camera)
        if (!this.useChaseCamera && this.camera) {
            const { x, y, z } = staticCameraPos
            this.camera.position.set(x, y, z)
            this.vehicleBody.add(this.camera)
        }

    }


    setColor(color: string | number) {
        this.color = color;
        (this.vehicleBody.material as MeshStandardMaterial).color = new Color(this.color);
    }

    toggleSound(useSound: boolean): void {

    }

    destroy(): void {
        console.warn("not implemented")
    }

    rotateY(num: number) {
        this.vehicleBody.rotateY(num)

        //this.scene.physics.add.existing(this.vehicleBody)
    }

    // update mesh and model to vehicle place
    update(): void {






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