import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Font, MeshStandardMaterial } from "@enable3d/three-wrapper/dist";
import { GLTF, GLTFLoader, LoadingManager } from "@enable3d/three-wrapper/dist";
import { ExtendedMesh, Scene3D } from "enable3d";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IPositionRotation, IVehicle, SimpleVector } from "./IVehicle";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { GameTime } from "../one-monitor-game/GameTimeClass";
import { PerspectiveCamera } from "three";



const cameraOffset = 20

let wheelRadius = .36
let wheelRadiusS = .36
let wheelWidth = .2
const FRONT_LEFT = 0
const FRONT_RIGHT = 1
const BACK_LEFT = 2
const BACK_RIGHT = 3

const steeringIncrement = 0.02

let suspensionStiffness = 58.0

let rollInfluence = .01

let CUBE_HALF_EXTENTS = .96;
let suspensionRestLength = 1.1
let frictionSlip = 3.5
let rearWheelFriction = 4.5
let suspensionCompression = 2.4
let maxSuspensionTravelCm = 1500.0;
let maxSuspensionForce = 50000.0;
let connectionHeight = 2.5;
let suspensionDamping = 4;
let tm: Ammo.btTransform, p: Ammo.btVector3, q: Ammo.btQuaternion
let targetPos: THREE.Vector3

const ACTIVE_TAG = 1;
const ISLAND_SLEEPING = 2;
const WANTS_DEACTIVATION = 3;
const DISABLE_DEACTIVATION = 4;
const DISABLE_SIMULATION = 5;



export class LowPolyVehicle implements IVehicle {
    canDrive: boolean;
    isPaused: boolean;
    mass: number;
    tire!: ExtendedObject3D
    chassisMesh!: ExtendedObject3D
    scene: Scene3D
    color: string | number | undefined
    name: string
    vehicle: Ammo.btRaycastVehicle
    wheelMeshes: ExtendedObject3D[] = []

    steeringSensitivity = 0.005
    engineForce = 5000
    vehicleSteering = 0
    breakingForce = 100
    chassis: Ammo.btRigidBody
    zeroVec = new Ammo.btVector3(0, 0, 0)
    checkpointPositionRotation = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }

    tuning: Ammo.btVehicleTuning
    vehicleNumber: number
    font: THREE.Font
    badRotationTicks = 0
    modelsLoaded = false

    gameTime: GameTime

    cameraDir = new THREE.Vector3()

    cameraFollowSpeed: number
    useChaseCamera: boolean
    vehicleSettings: IVehicleSettings
    camera!: THREE.PerspectiveCamera


    constructor(scene: Scene3D, color: string | number | undefined, name: string, vehicleNumber: number) {

        this.scene = scene
        this.color = color
        this.name = name
        this.canDrive = true
        this.isPaused = false
        this.mass = 800
        this.vehicleNumber = vehicleNumber
        this.gameTime = new GameTime(5)
        this.useChaseCamera = true
        this.cameraFollowSpeed = 0.3
        this.vehicleSettings = defaultVehicleSettings

    }

    addModels(tire: ExtendedObject3D, chassis: ExtendedObject3D) {

        this.tire = tire
        this.chassisMesh = chassis
        this.tire.receiveShadow = this.tire.castShadow = true
        this.chassisMesh.receiveShadow = this.chassisMesh.castShadow = true
        this.modelsLoaded = true;

        console.log("chassi mesh", this.chassisMesh)

        this.createVehicle()
    }

    createBadChassis() {
        const chassisWidth = 1.8;
        const chassisHeight = .6;
        const chassisLength = 3;
        //this.scene.add.existing(this.chassisMesh, {})
        let chassisMesh = new ExtendedObject3D()


        const geometry = new THREE.BoxGeometry(chassisWidth, .4, chassisLength);
        const material = new THREE.MeshLambertMaterial({ color: this.color });
        const cubeA = new ExtendedMesh(geometry, material);
        cubeA.position.set(0, 0.1, 0)
        chassisMesh.add(cubeA)

        const geometry2 = new THREE.BoxGeometry(chassisWidth, 1, chassisLength);

        const cubeB = new ExtendedMesh(geometry2, material);
        cubeB.position.set(0, .5, 0)
        chassisMesh.add(cubeB)

        const geometry3 = new THREE.BoxGeometry(1, 1, 1);

        const cubeC = new ExtendedMesh(geometry3, material);
        cubeC.position.set(0, 1.5, 0)
        chassisMesh.add(cubeC)

        const antG = new THREE.BoxGeometry(.05, 1, .05)
        const antM = new THREE.MeshLambertMaterial({ color: "black" })
        const antenna = new ExtendedMesh(antG, antM)
        antenna.position.set(.6, 1.5, .85)
        chassisMesh.add(antenna)

        const exhG = new THREE.CylinderGeometry(.15, .15, .5, 12, 1., false)
        const exhM = new THREE.MeshLambertMaterial({ color: "gray" })
        const exhaust = new ExtendedMesh(exhG, exhM)
        exhaust.rotateX(Math.PI / 2)
        exhaust.position.set(-chassisWidth + 1.3, .1, -chassisLength / 2)
        chassisMesh.add(exhaust)
        return chassisMesh
    }

    createVehicle() {
        let useBad = false

        if (useBad) {
            this.chassisMesh = this.createBadChassis()

        }

        this.scene.add.existing(this.chassisMesh, {})
        if (useBad) {

            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass })
        } else {
            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass, shape: "convex", autoCenter: false, })
        }


        this.chassisMesh.body.ammo.setActivationState(DISABLE_DEACTIVATION)
        this.chassisMesh.body.setFriction(1)
        this.chassisMesh.body.setBounciness(1)




        this.tuning = new Ammo.btVehicleTuning()

        this.tuning.set_m_suspensionStiffness(suspensionStiffness);
        this.tuning.set_m_suspensionCompression(suspensionCompression);
        this.tuning.set_m_suspensionDamping(suspensionDamping);
        this.tuning.set_m_maxSuspensionTravelCm(maxSuspensionTravelCm);
        this.tuning.set_m_frictionSlip(frictionSlip);
        this.tuning.set_m_maxSuspensionForce(maxSuspensionForce);



        const rayCaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)

        this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.chassisMesh.body.ammo, rayCaster)
        // this.chassisMesh.body.ammo.setActivationState(DISABLE_DEACTIVATION)
        this.chassisMesh.body.skipUpdate = true
        this.vehicle.setCoordinateSystem(0, 1, 2)



        this.chassisMesh.body.name = "vehicle-" + this.vehicleNumber
        this.chassisMesh.name = "vehicle-" + this.vehicleNumber


        this.scene.physics.physicsWorld.addAction(this.vehicle)

        const wheelAxisBackPosition = -1.65
        const wheelRadiusBack = 0.63 / 2
        const wheelHalfTrackBack = .9
        const wheelAxisHeightBack = useBad ? 0 : -.75

        const wheelAxisFrontPosition = 1.35
        const wheelRadiusFront = 0.63 / 2
        const wheelHalfTrackFront = .9
        const wheelAxisHeightFront = useBad ? 0 : -.75
        this.wheelMeshes = []



        this.addWheel(
            true,
            new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
            wheelRadiusFront,
            FRONT_LEFT
        )

        this.addWheel(
            true,
            new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
            wheelRadiusFront,
            FRONT_RIGHT
        )


        this.addWheel(
            false,
            new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition),
            wheelRadiusBack,
            BACK_LEFT
        )

        this.addWheel(
            false,
            new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition),
            wheelRadiusBack,
            BACK_RIGHT
        )

    }

    addWheel(isFront: boolean, pos: Ammo.btVector3, radius: number, index: number) {
        const suspensionStiffness = 50
        const suspensionDamping = 2.3
        const suspensionCompression = 4.4
        const suspensionRestLength = 0.

        const friction = 50
        const rollInfluence = 0.01

        const wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0)
        const wheelAxelCS = new Ammo.btVector3(-1, 0, 0)


        const wheelInfo = this.vehicle.addWheel(
            pos,
            wheelDirectionCS0,
            wheelAxelCS,
            suspensionRestLength,
            radius,
            this.tuning,
            isFront
        )


        wheelInfo.set_m_suspensionStiffness(suspensionStiffness)
        wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping)
        wheelInfo.set_m_wheelsDampingCompression(suspensionCompression)

        wheelInfo.set_m_frictionSlip(friction)
        wheelInfo.set_m_rollInfluence(rollInfluence)

        this.wheelMeshes.push(this.createWheelMesh(radius))

    }

    createWheelMesh(radius: number) {
        const t = this.tire.clone(true)
        this.scene.scene.add(t)
        return t
    }

    goForward(moreSpeed: boolean) {
        if (!this.canDrive) return
        this.vehicle.applyEngineForce(moreSpeed ? this.engineForce * 1.5 : this.engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(moreSpeed ? this.engineForce * 1.5 : this.engineForce, BACK_RIGHT)
    };
    goBackward(speed: number) {
        if (!this.canDrive) return
        this.vehicle.applyEngineForce(-this.engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(-this.engineForce, BACK_RIGHT)
    };
    noForce() {
        this.vehicle.applyEngineForce(0, BACK_LEFT)
        this.vehicle.applyEngineForce(0, BACK_RIGHT)
    };
    turnLeft(angle: number) { };
    turnRight(angle: number) { };
    noTurn() {
        if (Math.abs(this.vehicleSteering) < steeringIncrement - 0.001) return
        if (this.vehicleSteering > 0) {
            this.vehicleSteering -= steeringIncrement
        } else {
            this.vehicleSteering += steeringIncrement
        }
        this.vehicle.setSteeringValue(this.vehicleSteering, FRONT_LEFT)
        this.vehicle.setSteeringValue(this.vehicleSteering, FRONT_RIGHT)

        this.vehicle.setSteeringValue(0, FRONT_LEFT)
        this.vehicle.setSteeringValue(0, FRONT_RIGHT)
    };
    turn(angle: number) {
        if (this.canDrive) {
            // this.vehicle.setSteeringValue(angle / turnDivder, FRONT_LEFT)
            // this.vehicle.setSteeringValue(angle / turnDivder, FRONT_RIGHT)
            this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_LEFT)
            this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_RIGHT)
        } else {
            this.vehicle.setSteeringValue(0, FRONT_LEFT)
            this.vehicle.setSteeringValue(0, FRONT_RIGHT)
        }
    };
    break(notBreak?: boolean) {
        const breakForce = notBreak ? 0 : this.breakingForce
        this.vehicle.setBrake(breakForce, BACK_RIGHT)
        this.vehicle.setBrake(breakForce, BACK_LEFT)
        this.vehicle.setBrake(breakForce, FRONT_RIGHT)
        this.vehicle.setBrake(breakForce, FRONT_LEFT)
    };
    stop() {
        this.chassisMesh.body.setCollisionFlags(1)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
    };
    start() {
        this.chassisMesh.body.setCollisionFlags(0)
    };
    pause() {
        this.isPaused = true
        this.chassisMesh.body.setCollisionFlags(1)
    };
    unpause() {
        this.isPaused = false
        this.chassisMesh.body.setCollisionFlags(0)
    };
    addCamera(camera: THREE.PerspectiveCamera) {
        if (!this.useChaseCamera) {
            this.chassisMesh.add(camera)
        }
        this.camera = camera

    };
    cameraLookAt(camera: THREE.PerspectiveCamera) {

        if (this.useChaseCamera) {

            const r = this.chassisMesh.rotation
            const p = this.getPosition()


            // this is for the follow camera effect
            targetPos = new THREE.Vector3(

                p.x - ((Math.sin(r.y) * cameraOffset)),
                p.y + 10,
                p.z - ((Math.cos(r.y) * cameraOffset) * Math.sign(Math.cos(r.z)))
            )


            this.cameraDir.x = (camera.position.x + ((targetPos.x - camera.position.x) * this.cameraFollowSpeed))
            this.cameraDir.z = (camera.position.z + ((targetPos.z - camera.position.z) * this.cameraFollowSpeed))
            this.cameraDir.y = (camera.position.y + ((targetPos.y - camera.position.y) * 0.05)) // have the y dir change slower?



            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)

            camera.updateProjectionMatrix()
        } else {
            camera.lookAt(this.chassisMesh.position.clone())
        }


        /** Don't let camera go into the ground
         * This code could be better
         */

        // if the vehicle is starting to go on its back
        // and the world coords is under chassis
        /** also allow camera follow option? */
        // if (wp.y < chassY + 3 && this.badRotationTicks > 2) {
        //     console.log("camera too low", wp.y, chassY)

        //     const r = this.getRotation()

        //     //   const ltw = camera.localToWorld(camera.position)
        //     // console.log("ltw", ltw)

        //     wp.setY(10)
        //     camera.updateProjectionMatrix()
        //     console.log("camera", camera)


        //     //            const wtl = camera.worldToLocal(camera.position)
        //     //   console.log("wtl", wtl)
        //     // if (wp.y < 0) {


        //     // } else {
        //     //     camera.position.set(p.x, p.y *= .05, p.z)
        //     // }
        //     // if the vehicle is not flipped and the camera is not in the correct place
        // } else if (p.y < 10 && this.badRotationTicks < 2) {

        //     if (Math.abs(p.y) < (0.1)) {
        //         console.log("less than 0.1 but not bad rot")
        //         camera.position.set(p.x, p.y += 0.5, p.z)

        //     } else if (p.y > -0) {

        //         camera.position.set(p.x, p.y *= 1.1, p.z)
        //     } else {
        //         camera.position.set(p.x, p.y *= .95, p.z)

        //     }
        // }
        // // if camera is too much higher than the chassis
        // else if (wp.y > chassY + 15 && this.badRotationTicks < 2) {
        //     const p = camera.position
        //     camera.position.set(p.x, p.y *= .9, p.z)
        // } else {
        // }
        camera.lookAt(this.chassisMesh.position.clone())
    };
    update() {


        // this.vehicle.updateWheelTransform(4, true)
        tm = this.vehicle.getChassisWorldTransform()
        p = tm.getOrigin()
        q = tm.getRotation()

        this.chassisMesh.position.set(p.x(), p.y(), p.z())
        this.chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w())
        if (Math.abs(q.z()) > 0.1 || Math.abs(q.x()) > 0.1) {
            this.badRotationTicks += 1
        } else {
            this.badRotationTicks = 0
        }


        for (let i = 0; i < 5; i++) {
            //  this.vehicle.getWheelInfo(i).updateWheel(this.chassis)
            // this.vehicle.updateWheelTransform(i, true)
            tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            p = tm.getOrigin()
            q = tm.getRotation()



            if (i < 4) {

                this.wheelMeshes[i].position.set(p.x(), p.y(), p.z())
                this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w())
                this.vehicle.updateWheelTransform(i, true)
                //    this.wheelMeshes[i].rotateZ(Math.PI / 2)
            } else {

            }
        }

        if (this.badRotationTicks > 60 && Math.abs(this.getCurrentSpeedKmHour()) < 20) {
            // make this flip smoother ??
            this.stop()
            this.start()

            this.setRotation(0, this.chassisMesh.rotation.y, 0)
        }

    };
    setPosition(x: number, y: number, z: number) {
        const tm = this.vehicle.getChassisWorldTransform()
        tm.setOrigin(new Ammo.btVector3(x, y, z))
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
        tm.setRotation(new Ammo.btQuaternion(x, y, z, 1))
    };

    getCurrentSpeedKmHour() {
        return this.vehicle.getCurrentSpeedKmHour()
    };
    setFont(font: Font) {
        this.font = font
    };

    lookForwardsBackwards(lookBackwards: boolean) { };

    resetPosition() {
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        const { position, rotation } = this.checkpointPositionRotation
        this.setPosition(position.x, position.y + 6, position.z)
        this.setRotation(rotation.x, rotation.y, rotation.z)
    };

    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {
        this.vehicleSettings = vehicleSettings
        this.engineForce = vehicleSettings.engineForce
        console.log("update vehicle settings", vehicleSettings)
        this.steeringSensitivity = vehicleSettings.steeringSensitivity
        // this.cameraFollowSpeed = vehicleSettings.cameraFollowSpeed
        // this.mass = vehicleSettings.mass
        // this.useChaseCamera = vehicleSettings.useChaseCamera

        // this.chassisMesh.remove(this.camera)
        // if (!this.useChaseCamera) {
        //     this.chassisMesh.add(this.camera)
        // }

    };

    updateMass(mass: number) {
        this.mass = mass
        let inertia = new Ammo.btVector3(1, 1, 1)
        this.vehicle.getRigidBody()
        this.chassisMesh.body.ammo.getCollisionShape().calculateLocalInertia(mass, inertia)
        this.vehicle.getRigidBody().setMassProps(this.mass, inertia)
    }

    updateBreakingForce(breakingForce: number) {
        this.breakingForce = breakingForce
    }

    setCameraFollowSpeed(cameraFollowSpeed: number) {
        this.cameraFollowSpeed = cameraFollowSpeed
    }

}

export const createLowPolyVehicle = async (scene: Scene3D, color: string | number | undefined, name: string,) => {

}

export const loadLowPolyVehicleModels = (callback: (tire: ExtendedObject3D, chassises: ExtendedObject3D[]) => void) => {
    const loader = new GLTFLoader()

    loader.load("models/simple-low-poly-car.gltf", (gltf: GLTF) => {
        let chassises = [] as ExtendedObject3D[], tire: ExtendedObject3D;
        for (let child of gltf.scene.children) {
            if (child.type === "Mesh" || child.type === "Group") {

                if (child.name.includes("chassis")) {
                    let chassis = (child as ExtendedObject3D);
                    chassis.geometry.center();

                    chassises.push(chassis)
                }
                else if (child.name === "tire") {
                    tire = (child as ExtendedObject3D)

                    tire.geometry.center()
                }
            }
        }



        callback(tire, chassises)
    })

}