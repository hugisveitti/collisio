import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Euler, PerspectiveCamera, SpotLight, TextureLoader, FlatShading, MeshLambertMaterial, MeshStandardMaterial, IcosahedronGeometry, Quaternion, Mesh, MeshPhongMaterial, PlaneGeometry, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { degToRad, getSteerAngleFromBeta, numberScaler } from "../utils/utilFunctions";
import { getStaticCameraPos } from "./IVehicle";
import { changeVehicleBodyColor, IVehicleClassConfig, Vehicle } from "./Vehicle";
import { IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";


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

    is4x4: boolean


    /** 
     * if player is holding down forward then the vehicle gets to the maxspeed (300km/h)
     * and then the maxSpeedTicks can help the vehicle gain more speed gradually
     */
    maxSpeedTime: number

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
    p0: Ammo.btVector3[]

    euler = new Euler(0, 0, 0)

    // too see if camera is inside wall
    rayer: Ammo.ClosestRayResultCallback

    prevPosition = new Vector3(0, 0, 0)

    chaseSpeedX = 0
    chaseSpeedZ = 0
    chaseX = 0
    chaseZ = 0

    vehicleBodyPosition = new Vector3(0, 0, 0)
    delta: number

    jitterX: number = 0
    jitterZ: number = 0

    smokeParticles: { model: Mesh, frames: 0 }[]
    smokeIndex: number
    extraSpeedScaler: (time: number) => number

    wheelInfos: Ammo.btWheelInfo[]

    light: SpotLight

    constructor(config: IVehicleClassConfig) {
        super(config)

        this.maxSpeedTime = 0
        this.smokeParticles = []
        this.wheelInfos = []
        this.smokeIndex = 0

        this.engineForce = this.vehicleConfig.engineForce
        this.breakingForce = this.vehicleConfig.breakingForce
        this.is4x4 = this.vehicleConfig.is4x4

        this.currentEngineForce = this.vehicleConfig.engineForce
        this.spinCameraAroundVehicle = false
        this.p0 = [
            new Ammo.btVector3(0, 0, 0),
            new Ammo.btVector3(0, 0, 0),
            new Ammo.btVector3(0, 0, 0),
            new Ammo.btVector3(0, 0, 0),
        ]


        this.vector = new Ammo.btVector3(0, 0, 0)
        this.vector2 = new Ammo.btVector3(0, 0, 0)
        this.rayer = new Ammo.ClosestRayResultCallback(this.vector, this.vector2);
        this.quaternion = new Ammo.btQuaternion(0, 0, 0, 0)

        this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)
        this.delta = 0

        this.extraSpeedScaler = numberScaler(0, this.vehicleConfig.maxSpeed, Math.log2(1), Math.log2(600), 2)

        if (config.vehicleSetup) {
            this.vehicleSetup = config.vehicleSetup
        }
        this.createTireSmokeParticles()
    }

    async addModels(tires: ExtendedObject3D[], chassis: ExtendedObject3D) {
        return new Promise<void>(async (resolve, reject) => {

            this.tires = []
            for (let tire of tires) {
                tire.receiveShadow = false
                tire.castShadow = true
                this.tires.push(tire.clone())
            }

            this.vehicleBody = chassis.clone()
            this.vehicleBody.receiveShadow = false
            this.vehicleBody.castShadow = true
            this.modelsLoaded = true;
            changeVehicleBodyColor(this.vehicleBody, [this.vehicleSetup.vehicleColor] as VehicleColorType[])

            await this.createVehicle()
            // this.createLights()
            resolve()
        })
    }

    // createLights() {
    //     this.light = new SpotLight(0xffffff, 0.5, 500)
    //     this.scene.scene.add(this.light)
    //     this.light.target = this.vehicleBody
    // }

    async createTireSmokeParticles() {

        const geometry = new IcosahedronGeometry(.3, 0);
        const material = new MeshPhongMaterial({
            color: 'gray', transparent: true
        });

        for (let i = 0; i < 60; i++) {

            const part = new Mesh(geometry, material)
            part.visible = false
            this.scene.scene.add(part)
            this.smokeParticles.push({ model: part, frames: 0 })
        }
    }

    async addTireSmoke() {

        const leftPart = this.smokeParticles[this.smokeIndex]
        const rightPart = this.smokeParticles[this.smokeIndex + 1]

        const pRight = this.wheelMeshes[BACK_RIGHT].position
        const pLeft = this.wheelMeshes[BACK_LEFT].position

        leftPart.model.position.set(pLeft.x, pLeft.y - this.vehicleConfig.wheelRadiusBack, pLeft.z)
        leftPart.model.visible = true;
        //   (leftPart.model.material as MeshPhongMaterial).opacity = 1
        leftPart.model.rotateX(Math.random());
        let scale = [(Math.random() * .6) + 1, (Math.random() * .6) + 1, (Math.random() * .6) + 1]
        leftPart.model.scale.set(scale[0], scale[1], scale[2])
        leftPart.frames = 0

        rightPart.model.position.set(pRight.x, pRight.y - this.vehicleConfig.wheelRadiusBack, pRight.z)
        rightPart.model.visible = true
        rightPart.model.rotateZ(Math.random());
        scale = [(Math.random() * .6) + 1, (Math.random() * .6) + 1, (Math.random() * .6) + 1]
        rightPart.model.scale.set(scale[0], scale[1], scale[2])
        rightPart.frames = 0

        this.smokeIndex += 2
        if (this.smokeIndex >= this.smokeParticles.length) {
            this.smokeIndex = 0
        }
    }

    updateTireSmoke() {
        for (let s of this.smokeParticles) {
            if (s.model.visible) {

                s.model.position.y += 0.03
                s.model.scale.multiplyScalar(0.95)
                s.frames += 1
                if (s.frames > 30) {
                    s.model.visible = false;
                    //     (s.model.material as MeshPhongMaterial).opacity -= .1
                    s.frames = 0
                }
            }
        }
    }


    changeCenterOfMass() {

        // set center of mass
        const mw = this.vehicleBody.matrixWorld.clone()
        mw.elements[13] = mw.elements[13] + this.vehicleConfig.centerOfMassOffset
        if (this.vehicleBody.geometry) {

            this.vehicleBody.geometry = this.vehicleBody.geometry.clone()
            this.vehicleBody.geometry.applyMatrix4(mw)
        }
        for (let i = 0; i < this.vehicleBody.children.length; i++) {
            const p = this.vehicleBody.children[i].position
            this.vehicleBody.children[i].position.setY(p.y + this.vehicleConfig.centerOfMassOffset)
            this.vehicleBody.children[i].updateWorldMatrix(true, true)
        }

        this.vehicleConfig.wheelAxisHeightBack += this.vehicleConfig.centerOfMassOffset
        this.vehicleConfig.wheelAxisHeightFront += this.vehicleConfig.centerOfMassOffset
    }

    getWheelInfos(): { [number: string]: { wheelHalfTrack: number, wheelAxisHeight: number, wheelAxisPosition: number } } {
        const wheelAxisBackPosition = this.vehicleConfig.wheelAxisBackPosition
        const wheelHalfTrackBack = this.vehicleConfig.wheelHalfTrackBack
        const wheelAxisHeightBack = this.vehicleConfig.wheelAxisHeightBack

        const wheelAxisFrontPosition = this.vehicleConfig.wheelAxisFrontPosition
        const wheelHalfTrackFront = this.vehicleConfig.wheelHalfTrackFront
        const wheelAxisHeightFront = this.vehicleConfig.wheelAxisHeightFront

        const obj = {}

        obj[FRONT_RIGHT] =
        {
            wheelHalfTrack: wheelHalfTrackFront,
            wheelAxisHeight: wheelAxisHeightFront,
            wheelAxisPosition: wheelAxisFrontPosition
        }
        obj[FRONT_LEFT] =
        {
            wheelHalfTrack: -wheelHalfTrackFront,
            wheelAxisHeight: wheelAxisHeightFront,
            wheelAxisPosition: wheelAxisFrontPosition
        }
        obj[BACK_RIGHT] =
        {
            wheelHalfTrack: wheelHalfTrackBack,
            wheelAxisHeight: wheelAxisHeightBack,
            wheelAxisPosition: wheelAxisBackPosition
        }
        obj[BACK_LEFT] =
        {
            wheelHalfTrack: -wheelHalfTrackBack,
            wheelAxisHeight: wheelAxisHeightBack,
            wheelAxisPosition: wheelAxisBackPosition
        }

        return obj
    }

    async createVehicle() {
        return new Promise<void>(async (resolve, reject) => {

            this.staticCameraPos = getStaticCameraPos(this.vehicleSettings.cameraZoom)
            if (this.vehicleBody.type === "Mesh") {

                this.scene.add.existing(this.vehicleBody,)
            } else {
                this.scene.add.existing(this.vehicleBody)
            }
            //  (this.vehicleBody.material as MeshStandardMaterial).wireframe = true;
            //    (this.vehicleBody.material as MeshStandardMaterial).visible = false;


            // box.body.ammo.setActivationState(DISABLE_DEACTIVATION)
            // box.body.skipUpdate = true

            console.log("creating vehicle, setting center of mass", this.vehicleConfig.centerOfMassOffset)
            this.changeCenterOfMass()
            this.scene.physics.add.existing(this.vehicleBody, { mass: this.vehicleConfig.mass, shape: this.vehicleConfig.shape ?? "convex", autoCenter: false, })
            // this.scene.physics.add.existing(this.vehicleBody, { mass: this.vehicleConfig.mass, shape: "box", autoCenter: false, width: 2, depth: 6, height: 1.5, y: 2 })

            // this.vehicleBody.body.ammo.setActivationState(DISABLE_DEACTIVATION)
            const bounce = .1

            this.vehicleBody.body.setBounciness(bounce)
            this.vehicleBody.body.setRestitution(bounce)
            this.vehicleBodyPosition.set(this.vehicleBody.position.x, this.vehicleBody.position.y + this.vehicleConfig.centerOfMassOffset, this.vehicleBody.position.z)
            // how to lower center of mass

            this.tuning = new Ammo.btVehicleTuning()

            this.tuning.set_m_suspensionStiffness(this.vehicleConfig.suspensionStiffness);
            this.tuning.set_m_suspensionCompression(this.vehicleConfig.suspensionCompression);
            this.tuning.set_m_suspensionDamping(this.vehicleConfig.suspensionDamping);
            this.tuning.set_m_maxSuspensionTravelCm(this.vehicleConfig.maxSuspensionTravelCm);
            this.tuning.set_m_frictionSlip(this.vehicleConfig.frictionSlip);
            this.tuning.set_m_maxSuspensionForce(this.vehicleConfig.maxSuspensionForce);
            this.raycaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)

            this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.vehicleBody.body.ammo, this.raycaster)
            //   this.vehicle = new Ammo.btRaycastVehicle(this.tuning, box.body.ammo, this.raycaster)


            this.vehicleBody.body.skipUpdate = true
            this.vehicle.setCoordinateSystem(0, 1, 2)


            this.vehicleBody.body.name = this.isBot ? "bot" : "vehicle-" + this.vehicleNumber
            this.vehicleBody.name = this.isBot ? "bot" : "vehicle-" + this.vehicleNumber

            this.scene.physics.physicsWorld.addAction(this.vehicle)

            this.wheelMeshes = []

            const wheelAxisBackPosition = this.vehicleConfig.wheelAxisBackPosition
            const wheelRadiusBack = this.vehicleConfig.wheelRadiusBack
            const wheelHalfTrackBack = this.vehicleConfig.wheelHalfTrackBack
            const wheelAxisHeightBack = this.vehicleConfig.wheelAxisHeightBack

            const wheelAxisFrontPosition = this.vehicleConfig.wheelAxisFrontPosition
            const wheelRadiusFront = this.vehicleConfig.wheelRadiusFront
            const wheelHalfTrackFront = this.vehicleConfig.wheelHalfTrackFront
            const wheelAxisHeightFront = this.vehicleConfig.wheelAxisHeightFront

            this.vector.setValue(wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition)

            this.addWheel(
                true,
                this.vector,
                wheelRadiusFront,
                FRONT_RIGHT
            )



            this.vector.setValue(-wheelHalfTrackFront, wheelAxisHeightFront, wheelAxisFrontPosition)
            this.addWheel(
                true,
                this.vector,
                wheelRadiusFront,
                FRONT_LEFT
            )

            this.vector.setValue(wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
            this.addWheel(
                false,
                this.vector,
                wheelRadiusBack,
                BACK_RIGHT
            )

            this.vector.setValue(-wheelHalfTrackBack, wheelAxisHeightBack, wheelAxisBackPosition)
            this.addWheel(
                false,
                this.vector,
                wheelRadiusBack,
                BACK_LEFT
            )

            // not sure what to have the gravity, the auto is -20
            this.vector.setValue(0, -30, 0)
            //  this.vector.setValue(0, -20, 0)
            this.vehicle.getRigidBody().setGravity(this.vector)
            this.vehicle.getRigidBody().setFriction(3.0)
            // I suspect that 0 means infinity, so 0 inertia is actually inf intertia, and the vehicle cannot move on that axis

            /** setting inertia */
            const { x, y, z } = this.vehicleConfig.inertia
            this.vector.setValue(x, y, z)
            this.vehicle.getRigidBody().setMassProps(this.vehicleConfig.mass, this.vector)
            this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(this.vehicleConfig.mass, this.vector)

            /** don't start the vehicle until race */
            this.stop()

            if (this.vehicleSetup) {
                await this.updateVehicleSetup(this.vehicleSetup)
            }
            // think I need this, going through walls in multiplayer
            this.vehicleBody.body.setCcdMotionThreshold(1)
            this._createVehicle()
            this.isReady = true
            resolve()
        })
    }
    _createVehicle() { }

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
            this.vehicleConfig.suspensionRestLength,
            radius,
            this.tuning,
            isFront
        )

        wheelInfo.set_m_suspensionStiffness(this.vehicleConfig.suspensionStiffness)

        wheelInfo.set_m_wheelsDampingRelaxation(this.vehicleConfig.suspensionDamping)
        wheelInfo.set_m_wheelsDampingCompression(this.vehicleConfig.suspensionDamping)
        wheelInfo.set_m_frictionSlip(this.vehicleConfig.frictionSlip)
        wheelInfo.set_m_rollInfluence(this.vehicleConfig.rollInfluence)
        this.wheelInfos.push(wheelInfo)
        this.vehicle.updateSuspension(0)

        this.wheelMeshes.push(this.createWheelMesh(index))

        Ammo.destroy(wheelDirectionCS0)
        Ammo.destroy(wheelAxelCS)
    }

    createWheelMesh(index: number) {
        const t = this.tires[index]
        this.scene.scene.add(t)
        return t
    }



    decreaseMaxSpeedTicks() {
        if (this.maxSpeedTime > 1) {
            this.maxSpeedTime = (this.maxSpeedTime * .95)
        }
    }

    goForward() {

        if (!this._canDrive) {
            this.break()
            return
        }
        const kmh = this.getCurrentSpeedKmHour(0)
        let eF = this.engineForce
        // if (kmh > this.vehicleConfig.maxSpeed + (this.extraSpeedScaler(Math.log2(this.maxSpeedTime)))) {
        if (kmh > 10 + (this.extraSpeedScaler(Math.log2(this.maxSpeedTime)) * this.maxSpeedMult)) {
            //  if (kmh > this.vehicleConfig.maxSpeed + (this.maxSpeedTime / (16 * 10))) {

            eF = 0 // -500
            this.maxSpeedTime += (this.delta / 2)
        } else if (kmh < this.vehicleConfig.maxSpeed) {

        } else {
            this.decreaseMaxSpeedTicks()
        }

        if (kmh < 2) {
            this.break(true)
        }


        let abs = 1000

        const mult = (60 / 1000) * this.delta * 0.05

        let possibleEf = this.currentEngineForce + ((eF - this.currentEngineForce) * mult)
        if (Math.abs(this.currentEngineForce - eF) > abs) {
            //   console.warn("big diff", this.currentEngineForce - eF)
            this.currentEngineForce = this.currentEngineForce - (abs * Math.sign(this.currentEngineForce - eF))
        } else {
            this.currentEngineForce = possibleEf
        }

        eF = this.currentEngineForce * this.accelerationMult

        if (this.is4x4) {
            this.vehicle.applyEngineForce(eF, FRONT_LEFT)
            this.vehicle.applyEngineForce(eF, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(eF, BACK_LEFT)
        this.vehicle.applyEngineForce(eF, BACK_RIGHT)

    };

    setPower(engineForce: number) {

        if (this.is4x4) {
            this.vehicle.applyEngineForce(engineForce, FRONT_LEFT)
            this.vehicle.applyEngineForce(engineForce, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(engineForce, BACK_RIGHT)
    }



    goBackward() {
        if (this.onlyForward) return

        if (!this._canDrive) {
            this.break()
            return
        }

        let eF = -this.engineForce
        if (this.getCurrentSpeedKmHour(0) > 10) {
            this.decreaseMaxSpeedTicks()
            this.break()
            return
        }

        if (this.getCurrentSpeedKmHour() < -100) {
            eF = 0
        }

        this.break(true)
        if (this.is4x4) {
            this.vehicle.applyEngineForce(eF, FRONT_LEFT)
            this.vehicle.applyEngineForce(eF, FRONT_RIGHT)
        }

        this.vehicle.applyEngineForce(eF, BACK_LEFT)
        this.vehicle.applyEngineForce(eF, BACK_RIGHT)
    };

    noForce(stop?: boolean) {
        this.decreaseMaxSpeedTicks()

        this.break(true)
        let slowBreakForce = 2000
        const kmh = this.getCurrentSpeedKmHour(0)
        slowBreakForce *= -Math.sign(kmh)
        if (Math.abs(kmh) < 5) slowBreakForce = 0

        if (stop) {
            slowBreakForce = 0
        }

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

    turn(beta: number) {
        const angle = getSteerAngleFromBeta(beta, this.vehicleSettings.noSteerNumber) * this.invertedContoller
        if (this._canDrive) {
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
        if (this.noBreaks) return


        let breakForce = !!notBreak ? 0 : this.breakingForce
        if (!this._canDrive) breakForce = 500

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
        this.break()
        this.vehicleBody.body.setCollisionFlags(1)
        this.vehicleBody.body.setVelocity(0, 0, 0)
        this.vehicleBody.body.setAngularVelocity(0, 0, 0)
    };

    start() {
        this.break(true)
        this.vehicleBody.body.setCollisionFlags(0)
    };

    pause() {
        this.break()
        this.isPaused = true
        this.setCanDrive(false)
        this.zeroEngineForce()
        this.stopEngineSound()
        if (this.vehicleBody?.body) {
            this.vehicleBody.body.setCollisionFlags(1)
        }
    };

    unpause() {
        this.isPaused = false
        this.setCanDrive(true)
        if (this.useSoundEffects) {
            this.startEngineSound()
        }
        if (this.vehicleBody?.body) {
            this.vehicleBody.body.setCollisionFlags(0)
        }
    };

    getPositionInfrontOfBody() {
        const p = this.getPosition()
        const r = this.vehicleBody.rotation
        return { x: p.x + (20 * Math.sin(r.y)), y: p.y + 10, z: p.z - (20 * Math.cos(r.y) * Math.sign(Math.cos(r.z))) }
    }

    addCamera(camera: PerspectiveCamera) {
        if (!this.vehicleBody) return
        const c = this.vehicleBody.getObjectByName(camera.name)
        this.camera = camera
        if (!this.useChaseCamera && !c) {

            camera.position.set(this.staticCameraPos.x, this.staticCameraPos.y, this.staticCameraPos.z)
            this.vehicleBody.add(camera)
        } else if (this.useChaseCamera) {

            const { x, y, z } = this.getPositionInfrontOfBody()
            this.camera.position.set(x, y, z)
            this.camera.lookAt(this.vehicleBody.position.clone())
            //   this.camera.position.set(p.x + (10 * Math.sin(r.y)), p.y, p.z + (10 * Math.cos(r.y) * Math.sign(r.z)))
            this.camera.updateProjectionMatrix()
        }
        if (!this.engineSound) {
            this.createCarSounds()
        }
    };

    // delete this?
    removeCamera() {
        for (let i = 0; i < this.vehicleBody.children.length; i++) {
            if (this.vehicleBody.children[i].type === "PerspectiveCamera") {
                this.vehicleBody.remove(this.vehicleBody.children[i])
            }
        }
    }

    cameraLookAt(camera: PerspectiveCamera, delta: number) {
        if (this.spinCameraAroundVehicle) {
            const rot = this.vehicleBody.rotation
            const pos = this.vehicleBody.position

            this.cameraTarget.set(
                pos.x + ((Math.sin(rot.y) * this.staticCameraPos.z)),
                pos.y + this.staticCameraPos.y,
                pos.z + ((Math.cos(rot.y) * this.staticCameraPos.z) * Math.sign(Math.cos(rot.z)))
            )

            this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * 0.03))
            this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * 0.03))
            this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * 0.03))

            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.lookAt(this.vehicleBody.position.clone())
        }

        else if (this.useChaseCamera) {

            // because of ammo, the body goes into some illegal state
            const pos = this.vehicleBody.position
            const q = this.vehicleBody.quaternion
            let alpha = 2 * Math.asin(q.y)


            this.cameraTarget.set(
                pos.x + ((Math.sin(alpha) * this.staticCameraPos.z) * Math.sign(q.w)),
                pos.y + this.staticCameraPos.y,
                pos.z + ((Math.cos(alpha) * this.staticCameraPos.z))
            )
            const cs = 0.4
            this.cameraLookAtPos.x = (this.prevChaseCameraPos.x + ((pos.x + ((Math.sin(alpha) * 10) * Math.sign(q.w)) - this.prevChaseCameraPos.x) * cs))
            this.cameraLookAtPos.z = (this.prevChaseCameraPos.z + ((pos.z + ((Math.cos(alpha) * 10)) - this.prevChaseCameraPos.z) * cs))
            this.cameraLookAtPos.y = (this.prevChaseCameraPos.y + ((pos.y - this.prevChaseCameraPos.y) * cs))

            const ct = this.chaseCameraSpeed * (60 / this.scene.targetFPS)
            this.cameraDir.x = (camera.position.x + ((this.cameraTarget.x - camera.position.x) * ct)) //* this.chaseSpeedX))
            this.cameraDir.z = (camera.position.z + ((this.cameraTarget.z - camera.position.z) * ct)) //* this.chaseSpeedZ))
            this.cameraDir.y = (camera.position.y + ((this.cameraTarget.y - camera.position.y) * ct))


            camera.position.set(this.cameraDir.x, this.cameraDir.y, this.cameraDir.z)
            camera.lookAt(this.cameraLookAtPos)
            this.prevChaseCameraPos = this.cameraLookAtPos.clone()

            if (this.scene.getGraphicsType() === "high") {
                this.seeVehicle(this.cameraDir.clone())
            }
        }
        else {
            if (this.scene.getGraphicsType() !== "high") {
                camera.lookAt(this.vehicleBody.position.clone())
            } else {
                const pos = this.vehicleBody.position
                const rot = this.vehicleBody.rotation

                this.cameraTarget.set(
                    pos.x + ((Math.sin(rot.y) * this.staticCameraPos.z)),
                    pos.y + this.staticCameraPos.y,
                    pos.z + ((Math.cos(rot.y) * this.staticCameraPos.z) * Math.sign(Math.cos(rot.z)))
                )
                camera.lookAt(this.getPosition().clone())
                this.seeVehicle(this.cameraTarget)
            }
        }
    };

    _clearPowerups() {
        this.maxSpeedTime = 0
    }

    checkIfSpinning(log?: boolean) {
        const vel = this.vehicle.getRigidBody().getAngularVelocity()
        if (Math.abs(vel.x()) > 3) {
            if (log) {
                console.warn("angular vel danger, X:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))
            }

            this.vector.setValue(vel.x() / 2, vel.y(), vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
        if (Math.abs(vel.y()) > 5) {
            if (log) {
                console.warn("angular vel danger, Y:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))
            }

            this.vector.setValue(vel.x(), vel.y() / 2, vel.z())
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
        if (Math.abs(vel.z()) > 6) {
            if (log) {
                console.warn("angular vel danger, Z:", vel.x().toFixed(2), vel.y().toFixed(2), vel.z().toFixed(2))
            }

            this.vector.setValue(vel.x(), vel.y(), vel.z() / 2)
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
    }



    vehicleAssist(log?: boolean) {
        const { isOnGround: fl, pos: flPos } = this.isWheelOffGround(FRONT_LEFT)
        const { isOnGround: fr, pos: frPos } = this.isWheelOffGround(FRONT_RIGHT)
        const { isOnGround: br, pos: brPos } = this.isWheelOffGround(BACK_RIGHT)
        //   const { isOnGround: bl, pos: blPos } = this.isWheelOffGround(BACK_LEFT)

        /**
         * Flying assist:
         * Works by seeing if left tires are above right or front tires above back
         * and tries to even them out
         * dirX and dirZ are key
         * the * Math.sign(Math.cos(r.z)) is because there is some error when converting
         * from quaternions and euler
         */
        if (!fr || !fl || !br || !br) {
            const r = this.vehicleBody.rotation

            const dirX = -(Math.sin(r.y))
            const dirZ = -(Math.cos(r.y)) * Math.sign(Math.cos(r.z))

            const eps = 0.2
            let turningRight = Math.abs(frPos.y() - flPos.y()) < eps ? 0 : (frPos.y() - flPos.y())
            let turningFront = Math.abs(frPos.y() - brPos.y()) < eps ? 0 : (frPos.y() - brPos.y())

            if (turningFront === 0 && turningRight === 0) {

                return
            }
            // these parameters can be optimized
            const maxTurning = 0.5
            const changeFactor = .1
            turningFront = Math.min(Math.abs(turningFront), maxTurning) * Math.sign(turningFront)
            turningRight = Math.min(Math.abs(turningRight), maxTurning) * Math.sign(turningRight)

            if (log) {
                console.warn("Vehicle assist, Turning right:", turningRight.toFixed(2), ", TurningFront:", turningFront.toFixed(2))
            }

            let targetChangeX = - ((dirZ * turningFront)) * changeFactor
            targetChangeX += -((dirX * turningRight)) * changeFactor

            let targetChangeZ = ((dirX * turningFront)) * changeFactor
            targetChangeZ += -((dirZ * turningRight)) * changeFactor

            const aVel = this.vehicle.getRigidBody().getAngularVelocity()

            let newX = aVel.x() + targetChangeX
            let newZ = aVel.z() + targetChangeZ


            // this.vector.setValue(newX, aVel.y() * .5, newZ)
            // this.vehicle.getRigidBody().setAngularVelocity(this.vector)
            this.vector.setValue(newX, aVel.y(), newZ)
            this.vehicle.getRigidBody().setAngularVelocity(this.vector)
        }
    }

    isWheelOffGround(wheelNumber: number) {
        this.tm = this.vehicle.getWheelInfo(wheelNumber).get_m_worldTransform()
        const p = this.tm.getOrigin()
        const touchingGroung = this.isTouchingGround(this.tm.getOrigin())
        return { isOnGround: touchingGroung, pos: p }
    }

    detectJitter(delta: number) {
        // only check if going forward for now
        if (this.getCurrentSpeedKmHour() < 0) return false
        // this is somehow wrong
        // the expected DX and expDZ are not correct
        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        this.q = this.tm.getRotation()

        const newPos = new Vector3(this.p.x(), this.p.y(), this.p.z())
        // sometime
        const dist = newPos.clone().distanceTo(this.prevPosition)
        const mps = (this.getCurrentSpeedKmHour()) / 3.6
        const expDist = mps * (delta / 1000)


        if (Math.abs(expDist - dist) > .3 && Math.abs(expDist - dist) < 2) {
            //const expDX = Math.sin(e.y) * expDist
            const diff = (dist - expDist)
            const r = this.vehicleBody.rotation
            this.jitterX = (expDist) * Math.sin(r.y)
            this.jitterZ = (expDist) * Math.cos(r.y) * Math.sign(Math.cos(r.z))
            let correctNewPos = new Vector3(
                this.prevPosition.x + (this.jitterX),
                this.prevPosition.y, //+ expDist,
                this.prevPosition.z + (this.jitterZ)
            )


            // const newDist = correctNewPos.clone().distanceTo(this.prevPosition)



            this.p.setValue(correctNewPos.x, newPos.y, correctNewPos.z)
            // this.tm.setOrigin(this.p)
            // this.vehicle.getRigidBody().setWorldTransform(this.tm)

            this.vehicleBody.position.set(this.p.x(), this.p.y(), this.p.z())
            this.vehicleBody.quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())


            console.warn("JITTER", ", dist:", dist.toFixed(2), ", exp dist:", expDist.toFixed(2), ", diff:", diff.toFixed(2))

            this.prevPosition = correctNewPos.clone() // newPos.clone()
            return true

        } else {
            this.prevPosition = newPos.clone()
            return false
        }
        return false
    }

    setToGround() {
        // first set to above ground
        const tempY = this.scene.course.ground.position.y
        this.setPosition(undefined, tempY + 2, undefined)

        const groundY = this.findClosesGround()
        this.setPosition(undefined, groundY, undefined)
    }

    updateWheels() {

        for (let i = 0; i < 4; i++) {
            this.tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            this.p0[i] = this.tm.getOrigin()
            this.q = this.tm.getRotation()
            if (i < 4) {
                this.wheelMeshes[i].position.set(this.p0[i].x(), this.p0[i].y(), this.p0[i].z())
                this.wheelMeshes[i].quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
                this.vehicle.updateWheelTransform(i, false)
            }
        }
    }

    update(delta: number) {
        if (!this.isReady) return
        this.delta = delta

        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        this.q = this.tm.getRotation()

        if (isFinite(this.p.x())) {
            this.vehicleBody.position.set(this.p.x(), this.p.y(), this.p.z())
        } else {
            console.log("Position not finite", this.p.x())
            this.stop()
            this.setPosition(0, 0, 0)
            this.start()
            // this.resetPosition()
        }

        if (isFinite(this.q.x())) {
            this.vehicleBody.quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
        } else {
            // do nothing? set rotation
            console.log("Rotation not finite", this.q.x())


            this.stop()
            this.setRotation(new Quaternion(0, Math.PI / 2, 0, Math.PI / 2))
            this.start()
            // this.resetPosition()
            return
        }


        // maybe this 0.2 value could use more thought
        if (Math.abs(this.q.z()) > 0.2 || Math.abs(this.q.x()) > 0.2) {
            this.badRotationTicks += 1
        } else {
            this.badRotationTicks = 0
        }

        this.updateWheels()

        if (this.badRotationTicks > 60 && Math.abs(this.getCurrentSpeedKmHour(0)) < 20 && this.useBadRotationTicks) {
            // make this flip smoother ??
            this.stop()
            this.start()
            this.setRotation(0, this.vehicleBody.rotation.y + Math.PI, 0)
            const groundY = this.findClosesGround() + 1
            this.setPosition(undefined, groundY, undefined)
        }

        if (!this.isPaused && this.isReady) {
            // have these calls optional, since they are quite heavy for the machine, or maybe only perform every other tick?
            // only use vehicle assist if more than 30 fps
            if (delta < 25 && !this.isBot && !this.scene.isLagging) {

                this.checkIfSpinning()
                this.vehicleAssist(false)
            }

            if (!this.isBot) {
                const skid = this.vehicle.getWheelInfo(BACK_LEFT).get_m_skidInfo()
                const skidding = this.playSkidSound(skid)
                if (skid < 0.8 && this.scene.gameSettings.graphics === "high") {
                    this.addTireSmoke()
                }
                this.updateEngineSound()
                this.updateFov()
            }
        }
        this.updateTireSmoke()

        if (this.vehicleBody.position.y < -50) {
            //   this.resetPosition()
        }

        if (this.onlyForward) {
            this.goForward()
        }
    };



    findClosesGround(): number {
        const pos = this.vehicleBody.position// this.getPosition() // this.vehicleBody.position
        this.vector2.setValue(pos.x, pos.y - .1, pos.z);
        this.vector.setValue(pos.x, pos.y - 4, pos.z);

        // this.rayer = new Ammo.ClosestRayResultCallback(this.vector2, this.vector)
        this.rayer.set_m_rayFromWorld(this.vector2)
        this.rayer.set_m_rayToWorld(this.vector)

        // this.rayer.set_m_rayFromWorld(this.vector)
        // this.rayer.set_m_rayToWorld(this.vector2)
        this.scene.physics.physicsWorld.rayTest(this.vector, this.vector2, this.rayer)

        let groundY = 3
        if (this.rayer.hasHit()) {
            groundY = this.rayer.get_m_hitPointWorld().y()
        }
        return groundY
    }



    isTouchingGround(pos: Ammo.btVector3): boolean {

        this.vector2.setValue(pos.x(), pos.y() - .1, pos.z());
        this.vector.setValue(pos.x(), pos.y() - 2, pos.z());

        //   this.rayer = new Ammo.ClosestRayResultCallback(this.vector2, this.vector)
        this.rayer.set_m_rayFromWorld(this.vector2)
        this.rayer.set_m_rayToWorld(this.vector)

        this.scene.physics.physicsWorld.rayTest(this.vector, this.vector2, this.rayer)

        if (this.rayer.hasHit()) {
            const groundY = this.rayer.get_m_hitPointWorld().y()
            return Math.abs(groundY - pos.y()) < this.vehicleConfig.wheelRadiusBack + .3
        } else {
            return false
        }
    }



    setPosition(x: number | undefined, y: number | undefined, z: number | undefined) {
        this.tm = this.vehicle.getChassisWorldTransform()
        this.p = this.tm.getOrigin()
        const wheelY = this.getVehicleYOffset()
        this.vehicleBodyPosition.set(x ?? this.p.x(), (y ?? this.p.y()) + wheelY, z ?? this.p.z())
        this.p.setValue(x ?? this.p.x(), (y ?? this.p.y()) + wheelY, z ?? this.p.z())
        this.tm.setOrigin(this.p)

        for (let i = 0; i < 4; i++) {
            this.tm = this.vehicle.getWheelInfo(i).get_m_worldTransform();
            this.p0[i] = this.tm.getOrigin()
            this.q = this.tm.getRotation()
            this.wheelMeshes[i].position.set(this.p0[i].x(), this.p0[i].y(), this.p0[i].z())
            this.wheelMeshes[i].quaternion.set(this.q.x(), this.q.y(), this.q.z(), this.q.w())
            this.vehicle.updateWheelTransform(i, false)
        }
    };

    getPosition() {
        const tm = this.vehicle.getChassisWorldTransform()
        const o = tm.getOrigin()
        this.vehicleBodyPosition.set(o.x(), o.y() + this.vehicleConfig.centerOfMassOffset, o.z())
        return this.vehicleBodyPosition
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

    /**
     * return the height vehicle needs to offset from its relative origin to reach to bottom of the wheels 
     */
    getVehicleYOffset() {
        const frontHeight = - this.vehicleConfig.wheelAxisHeightFront + this.vehicleConfig.suspensionRestLength + (this.vehicleConfig.wheelRadiusFront)
        const backHeight = - this.vehicleConfig.wheelAxisHeightBack + this.vehicleConfig.suspensionRestLength + (this.vehicleConfig.wheelRadiusBack)

        const y = Math.max(backHeight, frontHeight) ?? 2
        return y
    }

    resetPosition() {
        this.currentEngineForce = this.vehicleConfig.engineForce
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

    _updateVehicleSettings() {
        this.vehicleBody.remove(this.camera)
        if (!this.useChaseCamera && this.camera) {
            const { x, y, z } = this.staticCameraPos
            this.camera.position.set(x, y, z)
            this.vehicleBody.add(this.camera)
            //    this.camera.updateProjectionMatrix()
        } else if (this.camera) {

            const { x, y, z } = this.getPositionInfrontOfBody()
            this.camera.position.set(x, y, z)
            this.camera.lookAt(this.vehicleBody.position.clone())

        }
    };

    // set to default vehicle config
    async _updateVehicleSetup() {
        return new Promise<void>((resolve, reject) => {

            this.currentEngineForce = this.vehicleConfig.engineForce
            this.updateMass(this.vehicleConfig.mass)
            this.updateWheelsSuspension()
            this.updateMaxSpeed()
            resolve()
        })
    }

    updateMaxSpeed() {
        this.extraSpeedScaler = numberScaler(0, this.vehicleConfig.maxSpeed, Math.log2(1), Math.log2(800), 2)
    }

    updateMass(mass: number) {
        this.vehicleConfig.mass = mass

        if (!this.vehicleBody.body) {
            console.warn("No body when updating mass, name:", this.name)
            return
        }
        this.vector.setValue(this.vehicleConfig.inertia.x, this.vehicleConfig.inertia.y, this.vehicleConfig.inertia.z)
        this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(mass, this.vector)

        this.vehicle.getRigidBody().setMassProps(this.vehicleConfig.mass, this.vector)
    }

    updateWheelsSuspension() {
        this.tuning.set_m_suspensionStiffness(this.vehicleConfig.suspensionStiffness);
        this.tuning.set_m_suspensionCompression(this.vehicleConfig.suspensionCompression);
        this.tuning.set_m_suspensionDamping(this.vehicleConfig.suspensionDamping);

        this.tuning.set_m_maxSuspensionTravelCm(this.vehicleConfig.maxSuspensionTravelCm);
        this.tuning.set_m_frictionSlip(this.vehicleConfig.frictionSlip);
        this.tuning.set_m_maxSuspensionForce(this.vehicleConfig.maxSuspensionForce);


        for (let i = 0; i < this.vehicle.getNumWheels(); i++) {
            const wheelInfo = this.vehicle.getWheelInfo(i)
            wheelInfo.set_m_suspensionRestLength1(this.vehicleConfig.suspensionRestLength)
            wheelInfo.set_m_suspensionStiffness(this.vehicleConfig.suspensionStiffness)

            wheelInfo.set_m_wheelsDampingRelaxation(this.vehicleConfig.suspensionDamping)
            wheelInfo.set_m_wheelsDampingCompression(this.vehicleConfig.suspensionDamping)

            wheelInfo.set_m_frictionSlip(this.vehicleConfig.frictionSlip)
            wheelInfo.set_m_rollInfluence(this.vehicleConfig.rollInfluence)
            //    wheelInfo.updateWheel(this.vehicle.getRigidBody(), this.vehicle.getRigidBody().)
            this.vehicle.updateSuspension(0)
        }
    }

    setVehicleConfigKey(key: keyof IVehicleConfig, value: number) {
        // this is for engineForce
        // @ts-ignore
        this.vehicleConfig[key] = value
        if (this[key] !== undefined) {
            this[key] = value
        }
        this.updateWheelsSuspension()
    }


    destroyAmmo(obj: any, name?: string) {
        return new Promise<void>((resolve, reject) => {

            try {
                Ammo.destroy(obj)
                resolve()
            } catch (err) {

                console.warn("Error destroying:", name, "err:", err)
                resolve()

            }
        })
    }


    removeTireSmoke() {
        for (let s of this.smokeParticles) {
            this.scene.scene.remove(s.model)
        }
        this.smokeParticles = []
    }

    async _destroy() {
        new Promise<void>(async (resolve, reject) => {
            this.stop()
            const p = this.getPosition()
            //this.setPosition(p.x, p.y + 30, p.z)
            //this.update(16)
            this.removeTireSmoke()



            this.destroyAmmo(this.zeroVec, "this.zeroVec")
            /** dont know if I need to check */
            this.destroyAmmo(this.vector, "this.vector")
            this.destroyAmmo(this.vector2, "this.vector2")
            // await this.destroyAmmo(this.tuning)

            for (let p of this.p0) {
                this.destroyAmmo(p, "p")
            }
            this.p0 = []

            this.destroyAmmo(this.rayer, "this.rayer")
            this.destroyAmmo(this.quaternion, "this.quaternion")



            for (let i = 0; i < 4; i++) {
                const wheel = this.vehicle.getWheelInfo(i)
                this.destroyAmmo(wheel, "wheel" + i)
                await this.destroyAmmo(this.wheelInfos[i], "wheel " + i)
            }


            this.isReady = false
            this._canDrive = false
            this.stopEngineSound()
            this.scene.scene.remove(this.engineSound)
            this.scene.scene.remove(this.skidSound)

            for (let tire of this.tires) {
                if (this.scene?.scene && tire) {
                    this.scene.scene.remove(tire)
                }
            }

            // removeAction is very important
            // it removes the wheels or something
            this.scene.physics.physicsWorld.removeAction(this.vehicle)
            this.scene.physics.physicsWorld.removeRigidBody(this.vehicle.getRigidBody())

            resolve()
        })
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

export const loadLowPolyVehicleModels = async (vehicleType: VehicleType, onlyLoad?: boolean): Promise<[ExtendedObject3D[], ExtendedObject3D]> => {
    const promise = new Promise<[ExtendedObject3D[], ExtendedObject3D]>((resolve, reject) => {


        if (vehicleModels[vehicleType] !== undefined) {

            resolve([vehicleModels[vehicleType].tires, vehicleModels[vehicleType].chassis])
            return promise
        }

        const loader = new GLTFLoader()

        loader.load(getStaticPath(`${vehicleConfigs[vehicleType].path}`), (gltf: GLTF) => {

            let tires = [] as ExtendedObject3D[]
            let chassis: ExtendedObject3D
            let extraCarStuff: ExtendedObject3D
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh" || child.type === "Group") {

                    if (child.name.includes("chassis")) {
                        let _chassis = (child as ExtendedObject3D);
                        chassis = _chassis

                    } else if (child.name.includes("extra-car-stuff")) {
                        extraCarStuff = (child as ExtendedObject3D)


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


