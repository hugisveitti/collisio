import { ExtendedObject3D, Types } from "@enable3d/ammo-physics";
import { Color, Euler, MeshStandardMaterial, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { degToRad, getSteerAngleFromBeta } from "../utils/utilFunctions";
import { getStaticCameraPos } from "./IVehicle";
import { changeVehicleBodyColor, IVehicleClassConfig, Vehicle } from "./Vehicle";
import { vehicleConfigs } from "./VehicleConfigs";

export class SphereVehicle extends Vehicle { //implements IVehicle {

    vector: Ammo.btVector3
    quaternion = new Quaternion()
    euler = new Euler()
    zVel: number
    // decay
    dVel: number
    // rate of change of vel, remove z leter, should be just dVel and vel
    dzVel: number
    yRot: number
    spinCameraAroundVehicle: boolean;
    physicsConfig: Types.AddExistingConfig
    prevPosition: Vector3
    items: ExtendedObject3D[] = []

    constructor(config: IVehicleClassConfig) {
        super(config)

        this.zVel = 0
        this.yRot = 0
        this.physicsConfig = { mass: this.vehicleConfig.mass, shape: "convex", autoCenter: false, collisionFlags: 0, addChildren: false }
        this.engineForce = this.vehicleConfig.engineForce
        this.breakingForce = -1
        this.dVel = 3
        this.dzVel = -1
        this.vector = new Ammo.btVector3(0, 0, 0)
        this.prevPosition = new Vector3(0, 0, 0)
    }

    async addModels(tires: ExtendedObject3D[], body: ExtendedObject3D) {
        return new Promise<void>(async (resolve, reject) => {

            this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)
            this.isReady = false
            this.vehicleBody = body.clone()

            this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
            this.scene.add.existing(this.vehicleBody, this.physicsConfig)

            this.vehicleBody.body.name = "vehicle-" + this.vehicleNumber
            this.vehicleBody.name = "vehicle-" + this.vehicleNumber

            this.vehicleBody.receiveShadow = false
            this.vehicleBody.castShadow = true
            this.modelsLoaded = true;

            changeVehicleBodyColor(this.vehicleBody, [this.vehicleColor] as VehicleColorType[])

            this.vehicleBody.body.setAngularFactor(0, 1, 0)
            this.vehicleBody.body.setFriction(1)
            this.vehicleBody.body.setCollisionFlags(0)
            this.vehicleBody.body.setBounciness(0.4)
            this.isReady = true
            this._canDrive = true
            if (this.vehicleSetup) {
                await this.updateVehicleSetup(this.vehicleSetup)
            }

            resolve()
        })
    };

    goForward(): void {
        if (!this._canDrive) return
        this.zVel = -this.vehicleConfig.engineForce
    }
    goBackward(speed?: number): void {
        if (!this._canDrive) return

        if (this.zVel < 10) {
            this.zVel += 10
        } else {
            this.zVel = this.vehicleConfig.engineForce
        }
    }

    noForce(stop?: boolean): void {
        if (this.zVel < - this.dVel * 10) {
            this.zVel += this.dVel
        } else if (this.zVel > this.dVel * 10) {
            this.zVel -= this.dVel
        } else {
            this.zVel = 0
        }
    }

    turnLeft(angle: number): void { }

    turnRight(angle: number): void { }

    noTurn(): void {

    }

    turn(beta: number): void {
        const angle = getSteerAngleFromBeta(beta, this.vehicleSettings.noSteerNumber)
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
        this._canDrive = false
        this.zVel = 0


        this.vehicleBody?.body?.setCollisionFlags(1)
    }

    unpause(): void {
        this.isPaused = false
        this._canDrive = true
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
    cameraLookAt(camera: PerspectiveCamera, delta: number): void {
        const pos = this.vehicleBody.position.clone()

        const chaseSpeedY = 0.9
        const chaseSpeed = .9 //this.chaseCameraSpeed


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

        const cs = 0.5
        this.cameraLookAtPos.x = (this.prevChaseCameraPos.x + ((pos.x - this.prevChaseCameraPos.x) * cs))
        this.cameraLookAtPos.z = (this.prevChaseCameraPos.z + ((pos.z - this.prevChaseCameraPos.z) * cs))
        this.cameraLookAtPos.y = (this.prevChaseCameraPos.y + ((pos.y - this.prevChaseCameraPos.y) * cs))

        this.prevChaseCameraPos = this.cameraLookAtPos.clone()

        camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)

        camera.lookAt(this.cameraLookAtPos)
        this.cameraLookAtPos = pos.clone()

        if (this.scene.getGraphicsType() === "high") {
            this.seeVehicle(this.cameraDir.clone())
        }
    }

    getTowPivot() {
        console.warn("Tow pivot not implemented for sphere")
        return new Vector3(1, 0, 1)
    }

    setPosition(x: number, y: number, z: number): void {

        this.vehicleBody.clear()
        this.scene.physics.destroy(this.vehicleBody)

        this.vehicleBody.position.set(x, y + 1, z)
        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
        this.addItemsBack()
    }

    getPosition(): Vector3 {
        return this.vehicleBody.position
    }

    getRotation(): Quaternion {
        this.quaternion.setFromEuler(this.vehicleBody.rotation)
        return this.quaternion
    }


    setRotation(x: number | Quaternion, y?: number, z?: number): void {

        this.vehicleBody.clear()
        this.scene.physics.destroy(this.vehicleBody)
        if (x instanceof Quaternion) {
            const xNorm = x.normalize()
            this.euler.setFromQuaternion(x.normalize())
            this.yRot = this.euler.y
            this.vehicleBody.quaternion.set(x.x, x.y, x.z, x.w) //.setRotationFromQuaternion(x)
        } else {
            this.yRot = y
            this.vehicleBody.rotation.set(x, y, z)
        }

        this.scene.physics.add.existing(this.vehicleBody, this.physicsConfig)
        this.addItemsBack()
    }

    addItemsBack() {
        for (let item of this.items) {
            this.vehicleBody.add(item)
        }
    }

    getCurrentSpeedKmHour(delta: number): number {
        const currPos = this.vehicleBody.position

        const meterPerSec = (currPos.distanceTo(this.prevPosition) / delta)
        const kmh = meterPerSec * (3.6) * 1000
        this.prevPosition = currPos.clone()
        return kmh
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

    _updateVehicleSettings(): void { }

    // set to default vehicle config
    _updateVehicleSetup() {
        return new Promise<void>((resolve, reject) => {

            this.items = []
            this.updateMass(this.vehicleConfig.mass)
            for (let child of this.vehicleBody.children) {
                this.items.push(child)
            }
            resolve()
        })
    }
    updateMass(mass: number) {
        this.vehicleConfig.mass = mass

        // will this change the mass??
        this.vector.setValue(this.vehicleConfig.inertia.x, this.vehicleConfig.inertia.y, this.vehicleConfig.inertia.z)
        this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(mass, this.vector)
    }

    destroy() {
        return new Promise<void>((resolve, reject) => {
            this.vehicleBody.clear()
            this.scene.destroy(this.vehicleBody)
            resolve()
        })
    }

    rotateY(num: number) {
        this.vehicleBody.rotateY(num)
    }

    // update mesh and model to vehicle place
    update(delta: number): void {
        this.delta = delta
        this.vehicleBody.body.setAngularVelocity(this.zVel * Math.cos(this.yRot) * .05, 0, this.zVel * Math.sin(this.yRot) * .05)
        this.vehicleBody.body.applyForce(-this.zVel * Math.sin(this.yRot), 0, this.zVel * Math.cos(this.yRot))
    }
}

export const loadSphereModel = async (vehicleType: VehicleType, onlyLoad?: boolean): Promise<[ExtendedObject3D[], ExtendedObject3D]> => {
    const promise = new Promise<[ExtendedObject3D[], ExtendedObject3D]>((resolve, reject) => {

        const loader = new GLTFLoader()

        loader.load(getStaticPath(`${vehicleConfigs[vehicleType].path}`), (gltf: GLTF) => {
            let sphere: ExtendedObject3D
            let extraStuff: ExtendedObject3D
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh" || child.type === "Group") {

                    if (child.name.includes("sphere")) {
                        let _sphere = (child as ExtendedObject3D);
                        sphere = _sphere
                        // import to clone the material since the tires share material
                        const material = (sphere.material as MeshStandardMaterial).clone();

                        (sphere.material as MeshStandardMaterial) = material
                    } else if (child.name.includes("extra-stuff")) {
                        extraStuff = (child as ExtendedObject3D)
                    }
                }
            }
            resolve([[], sphere])
        })
    })
    return promise
}