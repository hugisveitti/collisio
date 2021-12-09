import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Audio, AudioListener, Color, Font, MeshStandardMaterial, PerspectiveCamera, Vector3, TextGeometry, MeshLambertMaterial, Mesh } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { loadEngineSoundBuffer } from "../sounds/gameSounds";
import { getStaticPath } from "../utils/settings";
import { logScaler, numberScaler } from "../utils/utilFunctions";
import { IPositionRotation, IVehicle } from "./IVehicle";
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

const degToRad = 0.017453



const DISABLE_DEACTIVATION = 4;

export const staticCameraPos = { x: 0, y: 10, z: -25 }
const cameraOffset = -staticCameraPos.z


let useBad = false


export class LowPolyVehicle implements IVehicle {
    canDrive: boolean;
    isPaused: boolean;
    mass: number;
    tires: ExtendedObject3D[]
    chassisMesh!: ExtendedObject3D


    scene: IGameScene
    color: string | number | undefined
    name: string
    vehicle: Ammo.btRaycastVehicle
    wheelMeshes: ExtendedObject3D[] = []

    steeringSensitivity = 0.5
    vehicleSteering = 0
    breakingForce: number
    engineForce: number
    chassis: Ammo.btRigidBody
    zeroVec = new Ammo.btVector3(0, 0, 0)
    checkpointPositionRotation = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }

    tuning: Ammo.btVehicleTuning
    raycaster: Ammo.btDefaultVehicleRaycaster
    vehicleNumber: number
    font: Font
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
    vehicleType: VehicleType
    is4x4: boolean
    isReady: boolean


    forwardTicks = 0

    /** 
     * if player is holding down forward then the vehicle gets to the maxspeed (300km/h)
     * and then the maxSpeedTicks can help the vehicle gain more speed gradually
     */
    maxSpeedTicks: number

    useEngineSound: boolean
    engineSound: Audio | undefined

    /** only for the engine sound */
    currentEngineForce: number

    /** for startup animation */
    spinCameraAroundVehicle: boolean


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

    oldPos: Vector3

    engineSoundLoaded = false

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
        this.vehicleType = vehicleType
        this.isReady = false

        this.maxSpeedTicks = 0


        this.mass = vehicleConfigs[this.vehicleType].mass
        this.engineForce = vehicleConfigs[this.vehicleType].engineForce
        this.breakingForce = vehicleConfigs[this.vehicleType].breakingForce
        this.is4x4 = vehicleConfigs[this.vehicleType].is4x4

        this.useEngineSound = useEngineSound

        this.currentEngineForce = 0

        this.spinCameraAroundVehicle = false
        this.vector = new Ammo.btVector3(0, 0, 0)
        this.vector2 = new Ammo.btVector3(0, 0, 0)
        this.quaternion = new Ammo.btQuaternion(0, 0, 0, 0)
    }

    addModels(tires: ExtendedObject3D[], chassis: ExtendedObject3D) {

        this.tires = []
        for (let tire of tires) {
            tire.receiveShadow = tire.castShadow = true
            this.tires.push(tire.clone())
        }

        this.chassisMesh = chassis.clone()
        this.chassisMesh.receiveShadow = false
        this.chassisMesh.castShadow = true
        this.modelsLoaded = true;
        const material = (this.chassisMesh.material as MeshStandardMaterial).clone();
        this.chassisMesh.material = material;

        (this.chassisMesh.material as MeshStandardMaterial).color = new Color(this.color);



        this.createVehicle()
    }

    setColor(color: string | number) {
        this.color = color;
        (this.chassisMesh.material as MeshStandardMaterial).color = new Color(this.color);
    }



    createVehicle() {


        this.scene.add.existing(this.chassisMesh)

        if (useBad) {
            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass })
        } else {
            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass, shape: "convex", autoCenter: false, })
        }



        this.chassisMesh.body.ammo.setActivationState(DISABLE_DEACTIVATION)

        this.chassisMesh.body.setBounciness(.0)

        // how to lower center of mass

        this.tuning = new Ammo.btVehicleTuning()

        this.tuning.set_m_suspensionStiffness(vehicleConfigs[this.vehicleType].suspensionStiffness);
        this.tuning.set_m_suspensionCompression(vehicleConfigs[this.vehicleType].suspensionCompression);
        this.tuning.set_m_suspensionDamping(vehicleConfigs[this.vehicleType].suspensionDamping);
        this.tuning.set_m_maxSuspensionTravelCm(vehicleConfigs[this.vehicleType].maxSuspensionTravelCm);
        this.tuning.set_m_frictionSlip(vehicleConfigs[this.vehicleType].frictionSlip);
        this.tuning.set_m_maxSuspensionForce(vehicleConfigs[this.vehicleType].maxSuspensionForce);



        this.raycaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)

        this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.chassisMesh.body.ammo, this.raycaster)
        this.chassisMesh.body.ammo.setActivationState(DISABLE_DEACTIVATION)
        this.chassisMesh.body.skipUpdate = true
        this.vehicle.setCoordinateSystem(0, 1, 2)





        this.chassisMesh.body.name = "vehicle-" + this.vehicleNumber
        this.chassisMesh.name = "vehicle-" + this.vehicleNumber



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
            this.vector,//   new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
            wheelRadiusFront,
            FRONT_LEFT
        )

        this.vector.setValue(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition)
        this.addWheel(
            true,
            this.vector,//new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
            wheelRadiusFront,
            FRONT_RIGHT
        )


        this.vector.setValue(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
        this.addWheel(
            false,
            this.vector,//  new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition),
            wheelRadiusBack,
            BACK_LEFT
        )

        this.vector.setValue(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
        this.addWheel(
            false,
            this.vector,// new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition),
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
        this.chassisMesh.body.ammo.getCollisionShape().calculateLocalInertia(this.mass, this.vector)

        this.isReady = true
        /** don't start the vehicle until race */
        this.stop()
        window.addEventListener("keydown", (e) => {
            if (e.key === "z") {
                this.useEngineSound = !this.useEngineSound
                this.toggleSound(this.useEngineSound)
            }
        })
    }



    toggleSound(useSound: boolean) {


        this.useEngineSound = useSound

        if (!this.engineSound) {
            console.warn("Engine sound not loaded")
            return
        }


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


        this.wheelMeshes.push(this.createWheelMesh(radius, index))

    }

    createWheelMesh(radius: number, index: number) {

        if (this.tires.length < 4) {
            const t = this.tires[0].clone(true)
            this.scene.scene.add(t)
            return t
        }

        const t = this.tires[index]
        this.scene.scene.add(t)
        return t
    }



    goForward(moreSpeed: boolean) {
        if (!this.canDrive) return

        let eF = moreSpeed ? this.engineForce * 1.5 : this.engineForce
        if (this.getCurrentSpeedKmHour() > vehicleConfigs[this.vehicleType].maxSpeed + (this.maxSpeedTicks / 10)) {

            eF = 0
            this.maxSpeedTicks += 1
        } else if (this.getCurrentSpeedKmHour() < vehicleConfigs[this.vehicleType].maxSpeed) {
            this.maxSpeedTicks = 0
        } else {
            this.maxSpeedTicks -= 1
        }
        if (this.getCurrentSpeedKmHour() < 2) {
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

        if (this.getCurrentSpeedKmHour() > 10) {
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
        slowBreakForce *= -Math.sign(this.getCurrentSpeedKmHour())
        if (Math.abs(this.getCurrentSpeedKmHour()) < 10) slowBreakForce = 0


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

    turnLeft(angle: number) { };
    turnRight(angle: number) { };
    noTurn() {

        this.vehicle.setSteeringValue(0, FRONT_LEFT)
        this.vehicle.setSteeringValue(0, FRONT_RIGHT)

    };
    turn(angle: number) {
        if (this.canDrive) {
            // this.vehicle.setSteeringValue(angle / turnDivder, FRONT_LEFT)
            // this.vehicle.setSteeringValue(angle / turnDivder, FRONT_RIGHT)
            this.vehicle.setSteeringValue(angle * degToRad * this.steeringSensitivity, FRONT_LEFT)
            this.vehicle.setSteeringValue(angle * degToRad * this.steeringSensitivity, FRONT_RIGHT)
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
        this.vehicle.setBrake(breakForce, FRONT_RIGHT)
        this.vehicle.setBrake(breakForce, FRONT_LEFT)
    };

    stop() {

        this.zeroEngineForce()
        this.chassisMesh.body.setCollisionFlags(1)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
    };

    start() {

        this.chassisMesh.body.setCollisionFlags(0)
    };

    pause() {
        this.isPaused = true
        this.zeroEngineForce()

        this.stopEngineSound()
        this.chassisMesh.body.setCollisionFlags(1)

    };



    unpause() {
        this.isPaused = false
        if (this.useEngineSound) {
            this.startEngineSound()
        }
        this.chassisMesh.body.setCollisionFlags(0)
    };

    addCamera(camera: PerspectiveCamera) {
        const c = this.chassisMesh.getObjectByName(camera.name)
        if (!this.useChaseCamera && !c) {
            camera.position.set(staticCameraPos.x, staticCameraPos.y, staticCameraPos.z)
            this.chassisMesh.add(camera)
        }

        this.camera = camera
        if (!this.engineSound) {
            this.createCarSounds()
        }
    };

    removeCamera() {
        for (let i = 0; i < this.chassisMesh.children.length; i++) {
            if (this.chassisMesh.children[i].type === "PerspectiveCamera") {
                this.chassisMesh.remove(this.chassisMesh.children[i])
            }
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


    cameraLookAt(camera: PerspectiveCamera) {


        if (this.spinCameraAroundVehicle) {


            const rot = this.chassisMesh.rotation
            this.vehicle.updateVehicle(0)
            const pos = this.getPosition()


            this.cameraTarget.set(
                pos.x - ((Math.sin(rot.y) * cameraOffset)),
                pos.y + staticCameraPos.y,
                pos.z - ((Math.cos(rot.y) * cameraOffset) * Math.sign(Math.cos(rot.z)))
            )


            this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * 0.03))
            this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * 0.03))
            this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * 0.03))


            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.lookAt(this.chassisMesh.position.clone())
            camera.updateProjectionMatrix()
            camera.updateMatrix()
            camera.updateWorldMatrix(false, false)
            camera.updateMatrixWorld()

        } else if (this.useChaseCamera) {



            const rot = this.chassisMesh.rotation

            // I think these are always the same
            // this.chassisMesh.pos is set to the value of this.getPosition in update()
            const pos = this.chassisMesh.position.clone() // this.getPosition()

            /**
             * I am not sure what to do with the chase speed
             */


            this.cameraDiff.subVectors(pos, this.oldPos)
            let chaseSpeed = speedScaler(Math.abs(this.getCurrentSpeedKmHour()))// 1// this.chaseCameraSpeed

            chaseSpeed = Math.min(1, chaseSpeed)
            let chaseSpeedY = 0.5
            if ((Math.abs(this.cameraDiff.x) > 2 || Math.abs(this.cameraDiff.z) > 2) && (Math.abs(this.cameraDiff.x) < 5 || Math.abs(this.cameraDiff.z) < 5)) {

                chaseSpeed = 1
                chaseSpeedY = 0
            }

            this.oldPos = pos.clone()

            // this is for the follow camera effect
            this.cameraTarget.set(
                pos.x - ((Math.sin(rot.y) * cameraOffset)),
                pos.y + staticCameraPos.y,
                pos.z - ((Math.cos(rot.y) * cameraOffset) * Math.sign(Math.cos(rot.z)))
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

            this.cameraLookAtPos = pos
            this.prevCahseCameraPos = this.cameraLookAtPos.clone()


            // if (this.cameraDiff.length() > 0.1) {
            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.updateProjectionMatrix()
            camera.lookAt(this.cameraLookAtPos)


            //    } else {
            //   }

        } else {

            /** I dont think I can make the camera stuck to the chassis AND not make it go under ground */
            camera.lookAt(this.chassisMesh.position.clone())

        }
    };

    checkIfSpinning() {
        const vel = this.vehicle.getRigidBody().getAngularVelocity()
        if (Math.abs(vel.x()) > 3) {

            this.vector.setValue(vel.x() / 2, vel.y(), vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)

        }
        if (Math.abs(vel.y()) > 5) {

            this.vector.setValue(vel.x(), vel.y() / 2, vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
        if (Math.abs(vel.z()) > 6) {

            this.vector.setValue(vel.x(), vel.y(), vel.z() / 2)
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }

        const v = this.vehicle.getRigidBody().getLinearVelocity()

        if (Math.abs(v.y()) > 20) {
            console.log("linear vel danger, Y:", v.x().toFixed(2), v.y().toFixed(2), v.z().toFixed(2))
            this.vector.setValue(v.x(), v.y() / 2, v.z())
            this.vehicle.getRigidBody().setLinearVelocity(this.vector)
        }

    }



    update() {
        this.checkIfSpinning()

        if (!!this.engineSound && this.useEngineSound) {
            this.engineSound.setPlaybackRate(soundScaler(Math.abs(this.getCurrentSpeedKmHour())))

        }



        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        this.q = this.tm.getRotation()

        this.chassisMesh.position.set(this.p.x(), this.p.y(), this.p.z())
        this.chassisMesh.quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
        if (Math.abs(this.q.z()) > 0.1 || Math.abs(this.q.x()) > 0.1) {
            this.badRotationTicks += 1
        } else {
            this.badRotationTicks = 0
        }


        for (let i = 0; i < 5; i++) {

            // this.vehicle.updateWheelTransform(i, true)
            this.tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            this.p = this.tm.getOrigin()
            this.q = this.tm.getRotation()



            if (i < 4) {
                const x = this.vehicle.getWheelTransformWS(i).getOrigin().x()

                const fa = this.vehicle.getRightAxis()

                this.wheelMeshes[i].position.set(this.p.x(), this.p.y(), this.p.z())
                this.wheelMeshes[i].quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
                this.vehicle.updateWheelTransform(i, false)

            } else {

            }
        }

        if (this.badRotationTicks > 60 && Math.abs(this.getCurrentSpeedKmHour()) < 20 && this.useBadRotationTicks) {
            // make this flip smoother ??
            this.stop()
            this.start()

            this.setRotation(0, this.chassisMesh.rotation.y, 0)
            this.setPosition(undefined, 5, undefined)
        }




    };
    setPosition(x: number | undefined, y: number | undefined, z: number | undefined) {
        const tm = this.vehicle.getChassisWorldTransform()
        const p = tm.getOrigin()
        this.vector.setValue(x ?? p.x(), y ?? p.y(), z ?? p.z())
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
        return { x: o.x(), y: o.y(), z: o.z(), w: o.w() }
    }

    setRotation(x: number, y: number, z: number) {
        const tm = this.vehicle.getChassisWorldTransform()
        this.quaternion.setValue(x, y, z, 1)
        tm.setRotation(this.quaternion)
    };

    getCurrentSpeedKmHour() {
        return this.vehicle.getCurrentSpeedKmHour()
    };

    setFont(font: Font) {
        this.font = font
        // this.createNameMesh()
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
        this.chassisMesh.add(textMesh)

    }

    lookForwardsBackwards(lookBackwards: boolean) { };

    resetPosition() {
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        const { position, rotation } = this.checkpointPositionRotation

        const frontHeight = - vehicleConfigs[this.vehicleType].wheelAxisHeightFront + vehicleConfigs[this.vehicleType].suspensionRestLength + vehicleConfigs[this.vehicleType].wheelRadiusFront
        const backHeight = - vehicleConfigs[this.vehicleType].wheelAxisHeightBack + vehicleConfigs[this.vehicleType].suspensionRestLength + vehicleConfigs[this.vehicleType].wheelRadiusBack
        const y = Math.max(backHeight, frontHeight) ?? 2
        this.setPosition(position.x, position.y + y, position.z)
        this.setRotation(rotation.x, rotation.y, rotation.z)

        this.scene.resetVehicleCallback(this.vehicleNumber)
    };

    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {
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


        this.chassisMesh.remove(this.camera)
        if (!this.useChaseCamera && this.camera) {
            const { x, y, z } = staticCameraPos
            this.camera.position.set(x, y, z)
            this.chassisMesh.add(this.camera)
        }


    };

    setchaseCameraSpeed(chaseCameraSpeed: number) {
        this.chaseCameraSpeed = chaseCameraSpeed
    }

    async destroy() {

        this.stopEngineSound()

        if (this.scene && this.chassisMesh) {

            this.scene.destroy(this.chassisMesh)
        }
        for (let tire of this.tires) {
            // this.scene.
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
        if (this.p) {

            //  Ammo.destroy(this.p)
        }
    }

}

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

export const loadLowPolyVehicleModels = async (vehicleType: VehicleType, callback: (tires: ExtendedObject3D[], chassises: ExtendedObject3D[]) => void, onlyLoad?: boolean) => {
    if (vehicleModels[vehicleType] !== undefined) {
        callback(vehicleModels[vehicleType].tires, vehicleModels[vehicleType].chassises)
        return
    }

    const loader = new GLTFLoader()

    loader.load(getStaticPath(`models/${vehicleConfigs[vehicleType].path}`), (gltf: GLTF) => {
        let tires = [] as ExtendedObject3D[]
        let chassises = [] as ExtendedObject3D[]
        let extraCarStuff: ExtendedObject3D
        for (let child of gltf.scene.children) {
            if (child.type === "Mesh" || child.type === "Group") {

                if (child.name.includes("chassis")) {
                    let chassis = (child as ExtendedObject3D);
                    // import to clone the material since the tires share material
                    const material = (chassis.material as MeshStandardMaterial).clone();
                    //  material.color = new Color("");
                    (chassis.material as MeshStandardMaterial) = material
                    if (!onlyLoad) {
                        // chassis.geometry.center();
                    }
                    chassises.push(chassis)
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



        vehicleModels[vehicleType] = { tires, chassises }

        if (extraCarStuff) {

            chassises[0].add(extraCarStuff)
        }


        if (!onlyLoad) {
            for (let chassis of chassises) {
                // chassis.geometry.center()
            }
        }

        callback(tires, chassises)

    })

}