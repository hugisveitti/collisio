import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Font, MeshStandardMaterial } from "@enable3d/three-wrapper/dist";
import { GLTF, GLTFLoader, LoadingManager } from "@enable3d/three-wrapper/dist";
import { ExtendedMesh, Scene3D } from "enable3d";
import { defaultVehicleSettings, IVehicleSettings } from "../classes/User";
import { IPositionRotation, IVehicle, SimpleVector } from "./IVehicle";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { vehicleConfigs, VehicleType } from "./VehicleConfigs";




const cameraOffset = 20


const FRONT_LEFT = 0
const FRONT_RIGHT = 1
const BACK_LEFT = 2
const BACK_RIGHT = 3

const degToRad = 0.017453


let tm: Ammo.btTransform, p: Ammo.btVector3, q: Ammo.btQuaternion
let targetPos = new THREE.Vector3(0, 0, 0)

const ACTIVE_TAG = 1;
const ISLAND_SLEEPING = 2;
const WANTS_DEACTIVATION = 3;
const DISABLE_DEACTIVATION = 4;
const DISABLE_SIMULATION = 5;

export const staticCameraPos = { x: 0, y: 10, z: -25 }


let useBad = false


export class LowPolyVehicle implements IVehicle {
    canDrive: boolean;
    isPaused: boolean;
    mass: number;
    tires: ExtendedObject3D[]
    chassisMesh!: ExtendedObject3D


    scene: Scene3D
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
    font: THREE.Font
    badRotationTicks = 0
    useBadRotationTicks = true
    modelsLoaded = false


    cameraDir = new THREE.Vector3()

    chaseCameraSpeed: number
    useChaseCamera: boolean
    chaseCameraTicks: number
    prevCahseCameraPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
    vehicleSettings: IVehicleSettings
    camera: THREE.PerspectiveCamera
    vehicleType: VehicleType
    is4x4: boolean
    isReady: boolean


    forwardTicks = 0


    constructor(scene: Scene3D, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType) {

        this.scene = scene
        this.color = color
        this.name = name
        this.canDrive = true
        this.isPaused = false
        this.vehicleNumber = vehicleNumber
        this.useChaseCamera = false
        this.chaseCameraSpeed = 0.3
        this.chaseCameraTicks = 0
        this.vehicleSettings = defaultVehicleSettings
        this.vehicleType = vehicleType
        this.isReady = false



        this.mass = vehicleConfigs[this.vehicleType].mass
        this.engineForce = vehicleConfigs[this.vehicleType].engineForce
        this.breakingForce = vehicleConfigs[this.vehicleType].breakingForce
        this.is4x4 = vehicleConfigs[this.vehicleType].is4x4
    }

    addModels(tires: ExtendedObject3D[], chassis: ExtendedObject3D) {

        this.tires = []
        for (let tire of tires) {
            tire.receiveShadow = tire.castShadow = true
            this.tires.push(tire.clone())
        }

        this.chassisMesh = chassis.clone()
        this.chassisMesh.receiveShadow = this.chassisMesh.castShadow = true
        this.modelsLoaded = true;



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


        if (useBad) {
            this.chassisMesh = this.createBadChassis()

        }

        this.scene.add.existing(this.chassisMesh,)

        if (useBad) {

            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass })
        } else {
            this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass, shape: "convex", autoCenter: false, })
        }



        this.chassisMesh.body.ammo.setActivationState(DISABLE_DEACTIVATION)

        this.chassisMesh.body.setBounciness(.05)

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
        console.log("vehilce config", vehicleConfigs[this.vehicleType])

        this.wheelMeshes = []

        const wheelAxisBackPosition = vehicleConfigs[this.vehicleType].wheelAxisBackPosition
        const wheelRadiusBack = vehicleConfigs[this.vehicleType].wheelRadiusBack
        const wheelHalfTrackBack = vehicleConfigs[this.vehicleType].wheelHalfTrackBack
        const wheelAxisHeightBack = vehicleConfigs[this.vehicleType].wheelAxisHeightBack

        const wheelAxisFrontPosition = vehicleConfigs[this.vehicleType].wheelAxisFrontPosition
        const wheelRadiusFront = vehicleConfigs[this.vehicleType].wheelRadiusFront
        const wheelHalfTrackFront = vehicleConfigs[this.vehicleType].wheelHalfTrackFront
        const wheelAxisHeightFront = vehicleConfigs[this.vehicleType].wheelAxisHeightFront


        this.addWheel(
            true,
            new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
            wheelRadiusFront,
            FRONT_LEFT
        )

        this.addWheel(
            true,
            new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition),
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

        // not sure what to have the gravity, the auto is -20
        this.vehicle.getRigidBody().setGravity(new Ammo.btVector3(0, -30, 0))
        this.vehicle.getRigidBody().setFriction(3.0)

        // I suspect that 0 means infinity, so 0 inertia is actually inf intertia, and the vehicle cannot move on that axis


        /** setting inertia */
        const { x, y, z } = vehicleConfigs[this.vehicleType].inertia
        this.vehicle.getRigidBody().setMassProps(this.mass, new Ammo.btVector3(x, y, z))
        this.chassisMesh.body.ammo.getCollisionShape().calculateLocalInertia(this.mass, new Ammo.btVector3(x, y, z))

        this.isReady = true

    }

    addWheel(isFront: boolean, pos: Ammo.btVector3, radius: number, index: number) {


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

        // wheelInfo.set_m_suspensionRestLength1(2)
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
        if (this.getCurrentSpeedKmHour() > 300) {

            eF = 0
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
        let slowBreakForce = 1000
        slowBreakForce *= -Math.sign(this.getCurrentSpeedKmHour())
        if (Math.abs(this.getCurrentSpeedKmHour()) < 10) slowBreakForce = 0


        if (this.is4x4) {
            this.vehicle.applyEngineForce(slowBreakForce, FRONT_LEFT)
            this.vehicle.applyEngineForce(slowBreakForce, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(slowBreakForce, BACK_LEFT)
        this.vehicle.applyEngineForce(slowBreakForce, BACK_RIGHT)
    };
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
            // this.chassisMesh.position 
            const p = this.getPosition()

            // this is for the follow camera effect
            targetPos = new THREE.Vector3(

                p.x - ((Math.sin(r.y) * cameraOffset)),
                p.y + 10,
                p.z - ((Math.cos(r.y) * cameraOffset) * Math.sign(Math.cos(r.z)))
            )


            let a = new THREE.Vector3()
            a.subVectors(targetPos, camera.position)

            this.cameraDir.x = (camera.position.x + ((targetPos.x - camera.position.x) * this.chaseCameraSpeed))
            this.cameraDir.z = (camera.position.z + ((targetPos.z - camera.position.z) * this.chaseCameraSpeed))
            this.cameraDir.y = (camera.position.y + ((targetPos.y - camera.position.y) * 0.005)) // have the y dir change slower?

            const cameraLookAtPos = new THREE.Vector3(0, 0, 0)
            const cs = 0.5

            cameraLookAtPos.x = (this.prevCahseCameraPos.x + ((p.x - this.prevCahseCameraPos.x) * cs))
            cameraLookAtPos.z = (this.prevCahseCameraPos.z + ((p.z - this.prevCahseCameraPos.z) * cs))
            cameraLookAtPos.y = (this.prevCahseCameraPos.y + ((p.y - this.prevCahseCameraPos.y) * cs))

            this.prevCahseCameraPos = cameraLookAtPos.clone()


            if (a.length() > 0.1) {
                camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
                camera.updateProjectionMatrix()
                camera.lookAt(cameraLookAtPos)
                //camera.lookAt(this.chassisMesh.position.clone())
                //  console.log("camera.lookAt(this.chassisMesh.position.clone())", camera.lookAt(this.chassisMesh.position.clone()))

            } else {

            }

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

        //     const r = this.getRotation()

        //     //   const ltw = camera.localToWorld(camera.position)

        //     wp.setY(10)
        //     camera.updateProjectionMatrix()


        //     //            const wtl = camera.worldToLocal(camera.position)
        //     // if (wp.y < 0) {


        //     // } else {
        //     //     camera.position.set(p.x, p.y *= .05, p.z)
        //     // }
        //     // if the vehicle is not flipped and the camera is not in the correct place
        // } else if (p.y < 10 && this.badRotationTicks < 2) {

        //     if (Math.abs(p.y) < (0.1)) {
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
        // camera.lookAt(this.chassisMesh.position.clone())
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

            // this.vehicle.updateWheelTransform(i, true)
            tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            p = tm.getOrigin()
            q = tm.getRotation()



            if (i < 4) {
                const x = this.vehicle.getWheelTransformWS(i).getOrigin().x()

                const fa = this.vehicle.getRightAxis()

                this.wheelMeshes[i].position.set(p.x(), p.y(), p.z())
                this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w())
                this.vehicle.updateWheelTransform(i, false)
                //  this.wheelMeshes[i].rotateZ(Math.PI / 2)
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
        tm.setOrigin(new Ammo.btVector3(x ?? p.x(), y ?? p.y(), z ?? p.z()))
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
        this.createNameMesh()
    }

    createNameMesh() {
        const textGeo = new THREE.TextGeometry(this.name, {
            font: this.font!,
            size: 1,
            height: 0.5,
        })

        const textMesh = new THREE.Mesh(textGeo, new THREE.MeshLambertMaterial({ color: 0x667399, }))
        textMesh.rotateY(Math.PI)
        this.scene.add.existing(textMesh)

        textMesh.position.set(3, 3, 0)
        this.chassisMesh.add(textMesh)

    }

    lookForwardsBackwards(lookBackwards: boolean) { };

    resetPosition() {
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        const { position, rotation } = this.checkpointPositionRotation
        this.setPosition(position.x, position.y + 4, position.z)
        this.setRotation(rotation.x, rotation.y, rotation.z)
    };

    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        this.checkpointPositionRotation = positionRotation
    };

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {
        this.vehicleSettings = vehicleSettings
        // this.engineForce = vehicleSettings.engineForce
        // this.steeringSensitivity = vehicleSettings.steeringSensitivity
        const keys = Object.keys(vehicleSettings)
        for (let key of keys) {
            if (vehicleSettings[key] !== undefined) {
                this[key] = vehicleSettings[key]
            }
        }

        // this.chaseCameraSpeed = vehicleSettings.chaseCameraSpeed
        // this.mass = vehicleSettings.mass
        // this.useChaseCamera = vehicleSettings.useChaseCamera

        this.chassisMesh.remove(this.camera)
        if (!this.useChaseCamera) {
            const { x, y, z } = staticCameraPos
            this.camera.position.set(x, y, z)
            this.chassisMesh.add(this.camera)
        }
    };

    setchaseCameraSpeed(chaseCameraSpeed: number) {
        this.chaseCameraSpeed = chaseCameraSpeed
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

    loader.load(`models/${vehicleConfigs[vehicleType].path}`, (gltf: GLTF) => {
        let tires = [] as ExtendedObject3D[]
        let chassises = [] as ExtendedObject3D[]
        for (let child of gltf.scene.children) {
            if (child.type === "Mesh" || child.type === "Group") {

                if (child.name.includes("chassis")) {
                    let chassis = (child as ExtendedObject3D);
                    if (!onlyLoad) {
                        chassis.geometry.center();
                    }
                    chassises.push(chassis)
                }
                else if (child.name === "tire") {
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



        callback(tires, chassises)

    })

}