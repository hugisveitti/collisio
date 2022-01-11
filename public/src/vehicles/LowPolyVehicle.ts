import { ClosestRaycaster, ExtendedObject3D } from "@enable3d/ammo-physics";
import { Object3D, Color, Vector2, Euler, Font, Mesh, Raycaster, MeshLambertMaterial, Ray, MeshStandardMaterial, PerspectiveCamera, Quaternion, TextGeometry, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { VehicleType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { degToRad, logScaler, numberScaler } from "../utils/utilFunctions";
import { getStaticCameraPos, IPositionRotation } from "./IVehicle";
import { IVehicleClassConfig, Vehicle } from "./Vehicle";
import { vehicleConfigs } from "./VehicleConfigs";


export const isVehicle = (object: ExtendedObject3D) => {
    return object.name.slice(0, 7) === "vehicle"
}

export const getVehicleNumber = (vehicleName: string) => {
    const num = +vehicleName.slice(8, 9)
    if (isNaN(num)) {
        console.warn("No vehicle number for", vehicleName)
    }
    return num
}

const soundScaler = numberScaler(1, 5, 0, 330)
const speedScaler = logScaler(300, 0.1, 1)



const FRONT_LEFT = 0
const FRONT_RIGHT = 1
const BACK_LEFT = 2
const BACK_RIGHT = 3

const DISABLE_DEACTIVATION = 4;



export class LowPolyVehicle extends Vehicle {

    tires: ExtendedObject3D[]

    vehicle: Ammo.btRaycastVehicle
    wheelMeshes: ExtendedObject3D[] = []

    chassis: Ammo.btRigidBody
    tuning: Ammo.btVehicleTuning
    raycaster: Ammo.btDefaultVehicleRaycaster

    font: Font

    is4x4: boolean

    transformCam: Ammo.btTransform
    chassisWorldTransfrom: Ammo.btTransform
    forwardTicks = 0

    /** 
     * if player is holding down forward then the vehicle gets to the maxspeed (300km/h)
     * and then the maxSpeedTicks can help the vehicle gain more speed gradually
     */
    maxSpeedTicks: number

    /** only for the engine sound */
    currentEngineForce: number

    /** 
     * multi purpos vector
     * Might have to delete them when vehicle is destroyed?
     */
    vector: Ammo.btVector3
    vector2: Ammo.btVector3

    quaternion: Ammo.btQuaternion

    /** Ammo folder needs to be in src folder */
    tm: Ammo.btTransform
    p: Ammo.btVector3
    q: Ammo.btQuaternion

    euler = new Euler(0, 0, 0)

    // too see if camera is inside wall
    cameraRay: ClosestRaycaster
    rayer: Ammo.ClosestRayResultCallback

    prevPosition = new Vector3(0, 0, 0)

    chaseSpeedX = 0
    chaseSpeedZ = 0
    chaseX = 0
    chaseZ = 0

    constructor(config: IVehicleClassConfig) { //scene: IGameScene, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType, useEngineSound?: boolean) {
        super(config)

        this.maxSpeedTicks = 0


        this.mass = vehicleConfigs[this.vehicleType].mass
        this.engineForce = vehicleConfigs[this.vehicleType].engineForce
        this.breakingForce = vehicleConfigs[this.vehicleType].breakingForce
        this.is4x4 = vehicleConfigs[this.vehicleType].is4x4

        this.currentEngineForce = 0
        this.spinCameraAroundVehicle = false
        this.vector = new Ammo.btVector3(0, 0, 0)
        this.vector2 = new Ammo.btVector3(0, 0, 0)
        this.rayer = new Ammo.ClosestRayResultCallback(this.vector, this.vector2);
        this.quaternion = new Ammo.btQuaternion(0, 0, 0, 0)
        this.transformCam = new Ammo.btTransform()

        this.chassisWorldTransfrom = new Ammo.btTransform()
        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)
        this.cameraRay = new ClosestRaycaster(this.scene.physics)


        console.log("max turn", vehicleConfigs[this.vehicleType].maxSteeringAngle)
    }

    addModels(tires: ExtendedObject3D[], chassis: ExtendedObject3D) {

        this.tires = []
        for (let tire of tires) {
            tire.receiveShadow = tire.castShadow = true
            this.tires.push(tire.clone())
        }

        this.vehicleBody = chassis.clone()
        this.vehicleBody.receiveShadow = false
        this.vehicleBody.castShadow = true
        this.modelsLoaded = true;
        const material = (this.vehicleBody.material as MeshStandardMaterial).clone();
        this.vehicleBody.material = material;

        (this.vehicleBody.material as MeshStandardMaterial).color = new Color(this.vehicleColor);

        this.createVehicle()
    }

    setColor(color: string | number) {
        this.vehicleColor = color;
        (this.vehicleBody.material as MeshStandardMaterial).color = new Color(this.vehicleColor);
    }


    createVehicle() {
        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)
        this.scene.add.existing(this.vehicleBody)
        this.scene.physics.add.existing(this.vehicleBody, { mass: this.mass, shape: vehicleConfigs[this.vehicleType].shape ?? "convex", autoCenter: false, })


        this.vehicleBody.body.ammo.setActivationState(DISABLE_DEACTIVATION)
        this.vehicleBody.body.setBounciness(0)
        this.vehicleBody.body.setRestitution(0)

        // how to lower center of mass

        this.tuning = new Ammo.btVehicleTuning()

        this.tuning.set_m_suspensionStiffness(vehicleConfigs[this.vehicleType].suspensionStiffness);
        this.tuning.set_m_suspensionCompression(vehicleConfigs[this.vehicleType].suspensionCompression);
        this.tuning.set_m_suspensionDamping(vehicleConfigs[this.vehicleType].suspensionDamping);
        this.tuning.set_m_maxSuspensionTravelCm(vehicleConfigs[this.vehicleType].maxSuspensionTravelCm);
        this.tuning.set_m_frictionSlip(vehicleConfigs[this.vehicleType].frictionSlip);
        this.tuning.set_m_maxSuspensionForce(vehicleConfigs[this.vehicleType].maxSuspensionForce);

        this.raycaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)

        this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.vehicleBody.body.ammo, this.raycaster)
        this.vehicleBody.body.ammo.setActivationState(DISABLE_DEACTIVATION)
        this.vehicleBody.body.skipUpdate = true
        this.vehicle.setCoordinateSystem(0, 1, 2)

        this.vehicleBody.body.name = "vehicle-" + this.vehicleNumber
        this.vehicleBody.name = "vehicle-" + this.vehicleNumber

        this.scene.physics.physicsWorld.addAction(this.vehicle)

        this.wheelMeshes = []

        const wheelAxisBackPosition = vehicleConfigs[this.vehicleType].wheelAxisBackPosition
        const wheelRadiusBack = vehicleConfigs[this.vehicleType].wheelRadiusBack
        const wheelHalfTrackBack = vehicleConfigs[this.vehicleType].wheelHalfTrackBack
        const wheelAxisHeightBack = vehicleConfigs[this.vehicleType].wheelAxisHeightBack

        const wheelAxisFrontPosition = vehicleConfigs[this.vehicleType].wheelAxisFrontPosition
        const wheelRadiusFront = vehicleConfigs[this.vehicleType].wheelRadiusFront
        const wheelHalfTrackFront = vehicleConfigs[this.vehicleType].wheelHalfTrackFront
        const wheelAxisHeightFront = vehicleConfigs[this.vehicleType].wheelAxisHeightFront

        this.vector.setValue(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition)

        this.addWheel(
            true,
            this.vector,
            wheelRadiusFront,
            FRONT_LEFT
        )

        this.vector.setValue(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition)
        this.addWheel(
            true,
            this.vector,
            wheelRadiusFront,
            FRONT_RIGHT
        )


        this.vector.setValue(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
        this.addWheel(
            false,
            this.vector,
            wheelRadiusBack,
            BACK_LEFT
        )

        this.vector.setValue(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
        this.addWheel(
            false,
            this.vector,
            wheelRadiusBack,
            BACK_RIGHT
        )

        // not sure what to have the gravity, the auto is -20
        this.vector.setValue(0, -30, 0)
        this.vehicle.getRigidBody().setGravity(this.vector)
        this.vehicle.getRigidBody().setFriction(3.0)
        // I suspect that 0 means infinity, so 0 inertia is actually inf intertia, and the vehicle cannot move on that axis

        /** setting inertia */
        const { x, y, z } = vehicleConfigs[this.vehicleType].inertia
        this.vector.setValue(x, y, z)
        this.vehicle.getRigidBody().setMassProps(this.mass, this.vector)
        this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(this.mass, this.vector)

        this.isReady = true
        /** don't start the vehicle until race */
        this.stop()
        window.addEventListener("keydown", (e) => {
            if (e.key === "z") {
                this.useEngineSound = !this.useEngineSound
                this.toggleSound(this.useEngineSound)
            }
        })

        this.vehicleBody.body.setCcdMotionThreshold(1)
    }

    addWheel(isFront: boolean, pos: Ammo.btVector3, radius: number, index: number) {
        /**
         * cannot use this.vector
         */
        const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0)
        const wheelAxelCS = new Ammo.btVector3(-1, 0, 0)

        const wheelInfo = this.vehicle.addWheel(
            pos,
            wheelDirectionCS0,
            wheelAxelCS,
            vehicleConfigs[this.vehicleType].suspensionRestLength,
            radius,
            this.tuning,
            isFront
        )

        wheelInfo.set_m_suspensionStiffness(vehicleConfigs[this.vehicleType].suspensionStiffness)

        wheelInfo.set_m_wheelsDampingRelaxation(vehicleConfigs[this.vehicleType].suspensionDamping)
        wheelInfo.set_m_wheelsDampingCompression(vehicleConfigs[this.vehicleType].suspensionDamping)
        wheelInfo.set_m_frictionSlip(vehicleConfigs[this.vehicleType].frictionSlip)
        wheelInfo.set_m_rollInfluence(vehicleConfigs[this.vehicleType].rollInfluence)
        this.vehicle.updateSuspension(0)

        this.wheelMeshes.push(this.createWheelMesh(index))
    }

    createWheelMesh(index: number) {
        const t = this.tires[index]
        this.scene.scene.add(t)
        return t
    }

    goForward(moreSpeed: boolean) {

        if (!this.canDrive) return
        const kmh = this.getCurrentSpeedKmHour(0)

        let eF = moreSpeed ? this.engineForce * 1.5 : this.engineForce
        if (kmh > vehicleConfigs[this.vehicleType].maxSpeed + (this.maxSpeedTicks / 10)) {

            eF = 0
            this.maxSpeedTicks += 1
        } else if (kmh < vehicleConfigs[this.vehicleType].maxSpeed) {
            this.maxSpeedTicks = 0
        } else {
            this.maxSpeedTicks -= 1
        }

        if (kmh < 2) {
            this.break(true)

        }

        if (this.is4x4) {
            this.vehicle.applyEngineForce(eF, FRONT_LEFT)
            this.vehicle.applyEngineForce(eF, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(eF, BACK_LEFT)
        this.vehicle.applyEngineForce(eF, BACK_RIGHT)

    };

    goBackward() {
        if (!this.canDrive) return
        if (this.getCurrentSpeedKmHour(0) > 10) {
            this.break()
            return
        }
        this.break(true)
        if (this.is4x4) {
            this.vehicle.applyEngineForce(-this.engineForce, FRONT_LEFT)
            this.vehicle.applyEngineForce(-this.engineForce, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(-this.engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(-this.engineForce, BACK_RIGHT)
    };

    noForce() {
        this.break(true)
        let slowBreakForce = 2000
        const kmh = this.getCurrentSpeedKmHour(0)
        slowBreakForce *= -Math.sign(kmh)
        if (Math.abs(kmh) < 5) slowBreakForce = 0


        if (this.is4x4) {
            this.vehicle.applyEngineForce(slowBreakForce, FRONT_LEFT)
            this.vehicle.applyEngineForce(slowBreakForce, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(slowBreakForce, BACK_LEFT)
        this.vehicle.applyEngineForce(slowBreakForce, BACK_RIGHT)
    };

    zeroEngineForce() {
        const ef = 0
        if (this.is4x4) {
            this.vehicle.applyEngineForce(ef, FRONT_LEFT)
            this.vehicle.applyEngineForce(ef, FRONT_RIGHT)
        }
        this.vehicle.applyEngineForce(ef, BACK_LEFT)
        this.vehicle.applyEngineForce(ef, BACK_RIGHT)
    }


    noTurn() {
        this.vehicle.setSteeringValue(0, FRONT_LEFT)
        this.vehicle.setSteeringValue(0, FRONT_RIGHT)
    };

    turn(angle: number) {

        if (this.canDrive) {

            const absSteer = Math.abs(angle * degToRad * this.steeringSensitivity)
            const steer = Math.min(absSteer, this.vehicleConfig.maxSteeringAngle) * Math.sign(angle)
            this.vehicle.setSteeringValue(steer, FRONT_LEFT)
            this.vehicle.setSteeringValue(steer, FRONT_RIGHT)
        } else {
            this.vehicle.setSteeringValue(0, FRONT_LEFT)
            this.vehicle.setSteeringValue(0, FRONT_RIGHT)
        }
    };

    break(notBreak?: boolean) {

        const breakForce = !!notBreak ? 0 : this.breakingForce

        this.zeroEngineForce()
        this.vehicle.setBrake(breakForce, BACK_RIGHT)
        this.vehicle.setBrake(breakForce, BACK_LEFT)
    };

    zeroBreakForce() {
        const breakForce = 0
        this.vehicle.setBrake(breakForce, BACK_RIGHT)
        this.vehicle.setBrake(breakForce, BACK_LEFT)
        this.vehicle.setBrake(breakForce, FRONT_RIGHT)
        this.vehicle.setBrake(breakForce, FRONT_LEFT)
    }

    stop() {
        if (!this.vehicleBody.body) return
        this.zeroEngineForce()
        this.vehicleBody.body.setCollisionFlags(1)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
    };

    start() {
        this.vehicleBody.body.setCollisionFlags(0)
    };

    pause() {
        this.break()
        this.isPaused = true
        this.canDrive = false
        this.zeroEngineForce()
        this.stopEngineSound()
        if (this.vehicleBody?.body) {
            this.vehicleBody.body.setCollisionFlags(1)
        }
    };

    unpause() {
        this.isPaused = false
        this.canDrive = true
        if (this.useEngineSound) {
            this.startEngineSound()
        }
        if (this.vehicleBody?.body) {
            this.vehicleBody.body.setCollisionFlags(0)
        }
    };

    addCamera(camera: PerspectiveCamera) {
        if (!this.vehicleBody) return
        const c = this.vehicleBody.getObjectByName(camera.name)
        if (!this.useChaseCamera && !c) {
            camera.position.set(this.staticCameraPos.x, this.staticCameraPos.y, this.staticCameraPos.z)
            this.vehicleBody.add(camera)
        }
        this.camera = camera
        if (!this.engineSound) {
            this.createCarSounds()
        }
    };

    removeCamera() {
        for (let i = 0; i < this.vehicleBody.children.length; i++) {
            if (this.vehicleBody.children[i].type === "PerspectiveCamera") {
                this.vehicleBody.remove(this.vehicleBody.children[i])
            }
        }
    }


    cameraLookAt(camera: PerspectiveCamera) {
        if (this.spinCameraAroundVehicle) {
            const rot = this.vehicleBody.rotation
            this.vehicle.updateVehicle(1 / 60)
            const pos = this.getPosition()

            this.cameraTarget.set(
                pos.x - ((Math.sin(rot.y) * -this.staticCameraPos.z)),
                pos.y + this.staticCameraPos.y,
                pos.z - ((Math.cos(rot.y) * -this.staticCameraPos.z) * Math.sign(Math.cos(rot.z)))
            )

            this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * 0.03))
            this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * 0.03))
            this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * 0.03))

            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.lookAt(this.vehicleBody.position.clone())
            camera.updateMatrix()
            camera.updateWorldMatrix(false, false)
            camera.updateMatrixWorld()
            camera.updateProjectionMatrix()

        } else if (this.useChaseCamera) {
            this.tm = this.vehicle.getChassisWorldTransform()
            this.p = this.tm.getOrigin()
            this.q = this.tm.getRotation()

            const rot = this.euler.setFromQuaternion(new Quaternion(this.q.x(), this.q.y(), this.q.z(), this.q.w())) //  this.vehicleBody.rotation

            // I think these are always the same
            // this.vehicleBody.pos is set to the value of this.getPosition in update()

            const pos = this.getPosition() // vec

            const chaseSpeedY = 0.5


            // this.oldPos = pos.clone()

            // this is for the follow camera effect
            this.cameraTarget.set(
                pos.x - ((Math.sin(rot.y) * -this.staticCameraPos.z)),
                pos.y + this.staticCameraPos.y,
                pos.z - ((Math.cos(rot.y) * -this.staticCameraPos.z) * Math.sign(Math.cos(rot.z)))
            )

            this.cameraDiff.subVectors(this.cameraTarget, camera.position)

            let dchaseSpeedX = Math.abs((Math.sin(rot.y)))// this.chaseCameraSpeed)
            let dchaseSpeedZ = Math.abs((Math.cos(rot.y))) // this.chaseCameraSpeed)

            const diffX = dchaseSpeedX - this.chaseSpeedX
            const diffZ = dchaseSpeedZ - this.chaseSpeedZ

            let scalerX = this.chaseCameraSpeed * .0051
            let scalerZ = this.chaseCameraSpeed * .0051


            let changeX = (scalerX * Math.abs(diffX)) * Math.sign(diffX)
            let changeZ = (scalerZ * Math.abs(diffZ)) * Math.sign(diffZ)


            this.chaseSpeedZ += changeZ
            this.chaseSpeedX += changeX

            const chaseXTarget = (1 / (1 + Math.abs(diffX)) ** 2)
            const chaseZTarget = (1 / (1 + Math.abs(diffZ)) ** 2)

            this.chaseX += (chaseXTarget - this.chaseX) * .01 // (1 / (1 + Math.abs(diffX)) ** 2)
            this.chaseZ += (chaseZTarget - this.chaseZ) * .01

            this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * this.chaseX)) //* this.chaseSpeedX))
            this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * this.chaseZ)) //* this.chaseSpeedZ))
            this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * chaseSpeedY)) // have the y dir change slower?

            const cs = 0.5
            this.cameraLookAtPos.x = (this.prevChaseCameraPos.x + ((pos.x - this.prevChaseCameraPos.x) * cs))
            this.cameraLookAtPos.z = (this.prevChaseCameraPos.z + ((pos.z - this.prevChaseCameraPos.z) * cs))
            this.cameraLookAtPos.y = (this.prevChaseCameraPos.y + ((pos.y - this.prevChaseCameraPos.y) * cs))

            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.lookAt(this.cameraLookAtPos)
            this.prevChaseCameraPos = this.cameraLookAtPos.clone()
            this.seeVehicle(this.cameraDir)
            camera.updateProjectionMatrix()
        } else {
            const pos = this.vehicleBody.position
            const rot = this.vehicleBody.rotation
            this.cameraTarget.set(
                pos.x - ((Math.sin(rot.y) * -this.staticCameraPos.z)),
                pos.y + this.staticCameraPos.y,
                pos.z - ((Math.cos(rot.y) * -this.staticCameraPos.z) * Math.sign(Math.cos(rot.z)))
            )
            camera.lookAt(this.vehicleBody.position.clone())
            this.seeVehicle(this.cameraTarget)
        }
    };

    /**
     * make items between camera and vehicle see through
     * @param cameraPos position of camera relative to the world
     */
    seeVehicle(cameraPos: Vector3) {
        this.scene.course.seeObject(cameraPos, this.vehicleBody.position.clone())
    }

    checkIfSpinning() {
        const vel = this.vehicle.getRigidBody().getAngularVelocity()
        if (Math.abs(vel.x()) > 3) {
            console.warn("angular vel danger, X:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))

            this.vector.setValue(vel.x() / 2, vel.y(), vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
        if (Math.abs(vel.y()) > 5) {
            console.warn("angular vel danger, Y:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))

            this.vector.setValue(vel.x(), vel.y() / 2, vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
        if (Math.abs(vel.z()) > 6) {
            console.warn("angular vel danger, Z:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))

            this.vector.setValue(vel.x(), vel.y(), vel.z() / 2)
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }

        // const v = this.vehicle.getRigidBody().getLinearVelocity()
        // // if you are going slow and pop up in the air, that fuggin bugg
        // if (Math.abs(v.y()) > 20 && Math.abs(this.getCurrentSpeedKmHour(0)) < 150) {
        //     console.warn("linear vel danger, Y:", v.x().toFixed(2), v.y().toFixed(2), v.z().toFixed(2))
        //     this.vector.setValue(v.x(), v.y() / 4, v.z())
        //     this.vehicle.getRigidBody().setLinearVelocity(this.vector)
        // }
    }

    detectJitter(delta: number) {
        // this is somehow wrong
        // the expected DX and expDZ are not correct
        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        this.q = this.tm.getRotation()

        const newPos = new Vector3(this.p.x(), this.p.y(), this.p.z())
        // sometime
        const dist = newPos.distanceTo(this.prevPosition)
        const mps = Math.abs(this.getCurrentSpeedKmHour()) / 3.6
        const expDist = mps * (delta / 1000)

        const e = new Euler().setFromQuaternion(new Quaternion(this.q.x(), this.q.y(), this.q.z(), this.q.w()))
        const expDX = Math.sin(e.y) * expDist
        const DX = (newPos.x - this.prevPosition.x)

        const expDZ = Math.cos(e.y) * expDist
        const DZ = (newPos.z - this.prevPosition.z)


        if (Math.abs(expDist - dist) > .3 && Math.abs(expDist - dist) < 2) {

            console.warn("JITTER", "dist", dist.toFixed(2), "exp dist", expDist)

        }
        this.prevPosition = newPos.clone()

    }



    update(delta: number) {
        this.checkIfSpinning()

        if (!!this.engineSound && this.useEngineSound) {
            this.engineSound.setPlaybackRate(+soundScaler(Math.abs(this.getCurrentSpeedKmHour())))
        }
        for (let i = 0; i < 5; i++) {
            // this.vehicle.updateWheelTransform(i, true)
            this.tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            this.p = this.tm.getOrigin()
            this.q = this.tm.getRotation()
            if (i < 4) {
                this.wheelMeshes[i].position.set(this.p.x(), this.p.y(), this.p.z())
                this.wheelMeshes[i].quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
                this.vehicle.updateWheelTransform(i, false)
            } else {
            }
        }

        //  this.detectJitter(delta)

        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        this.q = this.tm.getRotation()

        this.vehicleBody.position.set(this.p.x(), this.p.y(), this.p.z())
        this.vehicleBody.quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())


        // maybe this 0.2 value could use more thought
        if (Math.abs(this.q.z()) > 0.2 || Math.abs(this.q.x()) > 0.2) {
            this.badRotationTicks += 1
        } else {
            this.badRotationTicks = 0
        }


        if (this.badRotationTicks > 60 && Math.abs(this.getCurrentSpeedKmHour(0)) < 20 && this.useBadRotationTicks) {
            // make this flip smoother ??
            this.stop()
            this.start()
            this.setRotation(0, this.vehicleBody.rotation.y + Math.PI, 0)
            const groundY = this.findClosesGround() + 1
            this.setPosition(undefined, groundY, undefined)
        }
    };

    findClosesGround(): number {
        const pos = this.vehicleBody.position
        this.vector2.setValue(pos.x, pos.y, pos.z);
        this.vector.setValue(pos.x, pos.y + 4, pos.z);



        this.rayer.set_m_rayFromWorld(this.vector)
        this.rayer.set_m_rayToWorld(this.vector2)
        this.scene.physics.physicsWorld.rayTest(this.vector, this.vector2, this.rayer)

        let groundY = 3
        if (this.rayer.hasHit()) {
            groundY = this.rayer.get_m_hitPointWorld().y()
        }
        return groundY
    }

    setPosition(x: number | undefined, y: number | undefined, z: number | undefined) {
        const tm = this.vehicle.getChassisWorldTransform()
        const p = tm.getOrigin()
        const wheelY = this.getVehicleYOffset()
        this.vector.setValue(x ?? p.x(), (y ?? p.y()) + wheelY, z ?? p.z())
        tm.setOrigin(this.vector)
    };

    getPosition() {
        const tm = this.vehicle.getChassisWorldTransform()
        const o = tm.getOrigin()
        return { x: o.x(), y: o.y(), z: o.z() }
    }

    getRotation() {
        const tm = this.vehicle.getChassisWorldTransform()
        const o = tm.getRotation()
        const qu = new Quaternion(o.x(), o.y(), o.z(), o.w())
        return qu
    }

    setRotation(x: number | Quaternion, y?: number, z?: number) {
        const tm = this.vehicle.getChassisWorldTransform()

        if (!(x instanceof Quaternion)) {
            const qu = new Quaternion()
            qu.setFromEuler(new Euler(x, y, z))
            this.quaternion.setValue(qu.x, qu.y, qu.z, qu.w)
            tm.setRotation(this.quaternion)
        } else {
            const qu = (x as Quaternion)
            this.quaternion.setValue(qu.x, qu.y, qu.z, qu.w)
            tm.setRotation(this.quaternion)
        }
    };

    getCurrentSpeedKmHour(delta?: number) {
        return this.vehicle.getCurrentSpeedKmHour()
    };

    setFont(font: Font) {
        this.font = font

    }

    createNameMesh() {
        const textGeo = new TextGeometry(this.name.toUpperCase().slice(0, 3), {
            font: this.font!,
            size: 1,
            height: 0.5,

        })

        const textMesh = new Mesh(textGeo, new MeshLambertMaterial({ color: 0x667399, }))
        textMesh.rotateY(Math.PI)
        this.scene.add.existing(textMesh)
        textMesh.position.set(1.2, 3, 0)
        this.vehicleBody.add(textMesh)
    }

    lookForwardsBackwards(lookBackwards: boolean) {
        console.warn("Not implemented")
    };

    /**
     * return the height vehicle needs to offset from its relative origin to reach to bottom of the wheels 
     */
    getVehicleYOffset() {
        const frontHeight = - vehicleConfigs[this.vehicleType].wheelAxisHeightFront + vehicleConfigs[this.vehicleType].suspensionRestLength + vehicleConfigs[this.vehicleType].wheelRadiusFront
        const backHeight = - vehicleConfigs[this.vehicleType].wheelAxisHeightBack + vehicleConfigs[this.vehicleType].suspensionRestLength + vehicleConfigs[this.vehicleType].wheelRadiusBack
        const y = Math.max(backHeight, frontHeight) ?? 2
        return y
    }

    resetPosition() {
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        const { position, rotation } = this.checkpointPositionRotation


        this.setPosition(position.x, position.y, position.z)

        if (!(rotation instanceof Quaternion)) {
            this.setRotation(rotation.x, rotation.y, rotation.z)
        } else {
            this.setRotation(rotation as Quaternion)
        }

        this.scene.resetVehicleCallback(this.vehicleNumber)
    };

    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {
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

        this.vehicleBody.remove(this.camera)
        if (!this.useChaseCamera && this.camera) {
            const { x, y, z } = this.staticCameraPos
            this.camera.position.set(x, y, z)
            this.vehicleBody.add(this.camera)
            this.camera.updateProjectionMatrix()
        }

        if (this.scene.gameSceneConfig?.gameSettings?.gameType === "race") {
            this.setColor(this.vehicleColor)
        }
    };

    async destroy() {
        this.isReady = false
        this.stopEngineSound()

        if (this.scene && this.vehicleBody) {
            this.scene.destroy(this.vehicleBody)
        }
        for (let tire of this.tires) {
            if (this.scene?.scene && tire) {
                this.scene.scene.remove(tire)
            }
        }
        if (this.zeroVec) {
            Ammo.destroy(this.zeroVec)
        }
        /** dont know if I need to check */
        if (this.vector) {
            Ammo.destroy(this.vector)
        }
        if (this.vector2) {
            Ammo.destroy(this.vector2)
        }
        // if (this.tuning) {
        //     Ammo.destroy(this.tuning)
        // }
    }
}


// window.addEventListener('mousemove', onMouseMove, false);

const tiresConfig = [
    {
        name: "back-right-tire",
        number: BACK_RIGHT
    },
    {
        name: "back-left-tire",
        number: BACK_LEFT
    },
    {
        name: "front-left-tire",
        number: FRONT_LEFT
    },
    {
        name: "front-right-tire",
        number: FRONT_RIGHT
    },
]

let vehicleModels = {}

export const loadLowPolyVehicleModels = async (vehicleType: VehicleType, onlyLoad?: boolean): Promise<[ExtendedObject3D[], ExtendedObject3D]> => {
    const promise = new Promise<[ExtendedObject3D[], ExtendedObject3D]>((resolve, reject) => {


        if (vehicleModels[vehicleType] !== undefined) {

            resolve([vehicleModels[vehicleType].tires, vehicleModels[vehicleType].chassis])
            return promise
        }

        const loader = new GLTFLoader()

        loader.load(getStaticPath(`models/${vehicleConfigs[vehicleType].path}`), (gltf: GLTF) => {
            let tires = [] as ExtendedObject3D[]
            let chassis: ExtendedObject3D
            let extraCarStuff: ExtendedObject3D
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh" || child.type === "Group") {

                    if (child.name.includes("chassis")) {
                        let _chassis = (child as ExtendedObject3D);
                        chassis = _chassis
                        // import to clone the material since the tires share material
                        const material = (chassis.material as MeshStandardMaterial).clone();

                        (chassis.material as MeshStandardMaterial) = material
                        if (!onlyLoad) {
                            // chassis.geometry.center();
                        }
                    } else if (child.name.includes("extra-car-stuff")) {
                        extraCarStuff = (child as ExtendedObject3D)
                        if (!onlyLoad) {
                            // extraCarStuff.geometry.center()
                        }

                    } else if (child.name === "tire") {
                        const tire = (child as ExtendedObject3D)
                        if (!onlyLoad) {
                            tire.geometry.center()
                        }
                        tires.push(tire)
                    } else {
                        for (let tireConfig of tiresConfig) {
                            if (child.name === tireConfig.name) {
                                tires[tireConfig.number] = (child as ExtendedObject3D)
                                if (!onlyLoad) {
                                    tires[tireConfig.number].geometry.center()
                                }
                            }
                        }
                    }
                }
            }
            vehicleModels[vehicleType] = { tires, chassis }

            if (extraCarStuff) {
                chassis.add(extraCarStuff)
            }
            resolve([tires, chassis])
        })
    })
    return promise
}