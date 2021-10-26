import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedMesh, ExtendedObject3D, Scene3D } from "enable3d";
import { defaultVehicleSettings, IVehicleSettings } from '../classes/User';
import { GameTime } from '../one-monitor-game/GameTimeClass';
import { IPositionRotation, IVehicle, SimpleVector } from "./IVehicle";


const FRONT_LEFT = 0
const FRONT_RIGHT = 1
const BACK_LEFT = 2
const BACK_RIGHT = 3
const steeringIncrement = 0.02
const maxSteering = 0.4


const maxBreakingForce = 100

const chassisWidth = 1.8;
const chassisHeight = .6;
const chassisLength = 3;

const yOrigin = .5

// how to determine this value?
const turnDivder = 150


const radiantMultiplier = 0.0174532925

export class NormalVehicle implements IVehicle {

    vehicle: Ammo.btRaycastVehicle
    scene: Scene3D
    tuning: Ammo.btVehicleTuning
    chassisMesh: ExtendedObject3D
    wheelMeshes: THREE.Mesh[]
    color: string | number | undefined

    vehicleSteering: number

    name: string
    font?: THREE.Font

    lookBackwards: boolean
    canDrive: boolean

    checkpointPositionRotation: IPositionRotation
    isPaused: boolean
    mass: number

    steeringSensitivity: number
    gameTime: GameTime
    vehicleSettings: IVehicleSettings
    engineForce: number = 5000
    breakingForce: number = 100
    steeringSentitivity: number = 0.05


    constructor(scene: Scene3D, color: string | number | undefined, name: string, vehicleNumber?: number) {
        this.color = color
        this.scene = scene
        this.vehicleSteering = 0
        this.name = name
        this.lookBackwards = false
        this.canDrive = true
        this.isPaused = false
        this.engineForce = 5000
        this.steeringSensitivity = 0.5 * radiantMultiplier
        this.vehicleSettings = defaultVehicleSettings

        this.gameTime = new GameTime(5)
        this.checkpointPositionRotation = {
            position: { x: 0, y: 4, z: 0 }, rotation: { x: 0, y: 0, z: 0 }
        }

        this.mass = 800

        this.chassisMesh = new ExtendedObject3D()


        const geometry = new THREE.BoxGeometry(chassisWidth, .4, chassisLength);
        const material = new THREE.MeshLambertMaterial({ color: this.color });
        const cubeA = new ExtendedMesh(geometry, material);
        cubeA.position.set(0, 0.1, 0)
        this.chassisMesh.add(cubeA)

        const geometry2 = new THREE.BoxGeometry(chassisWidth, 1, chassisLength);

        const cubeB = new ExtendedMesh(geometry2, material);
        cubeB.position.set(0, .5, 0)
        this.chassisMesh.add(cubeB)

        const geometry3 = new THREE.BoxGeometry(1, 1, 1);

        const cubeC = new ExtendedMesh(geometry3, material);
        cubeC.position.set(0, 1.5, 0)
        this.chassisMesh.add(cubeC)

        const antG = new THREE.BoxGeometry(.05, 1, .05)
        const antM = new THREE.MeshLambertMaterial({ color: "black" })
        const antenna = new ExtendedMesh(antG, antM)
        antenna.position.set(.6, 1.5, .85)
        this.chassisMesh.add(antenna)

        const exhG = new THREE.CylinderGeometry(.15, .15, .5, 12, 1., false)
        const exhM = new THREE.MeshLambertMaterial({ color: "gray" })
        const exhaust = new ExtendedMesh(exhG, exhM)
        exhaust.rotateX(Math.PI / 2)
        exhaust.position.set(-chassisWidth + 1.3, .1, -chassisLength / 2)
        this.chassisMesh.add(exhaust)


        this.scene.add.existing(this.chassisMesh, {})
        this.scene.physics.add.existing(this.chassisMesh, { mass: this.mass })

        this.tuning = new Ammo.btVehicleTuning()

        const rayCaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)
        this.vehicle = new Ammo.btRaycastVehicle(this.tuning, this.chassisMesh.body.ammo, rayCaster)
        this.vehicle.setCoordinateSystem(0, 1, 2)
        this.chassisMesh.body.name = "vehicle-" + vehicleNumber
        this.chassisMesh.name = "vehicle-" + vehicleNumber


        scene.physics.physicsWorld.addAction(this.vehicle)

        const wheelAxisBackPosition = -1.3
        const wheelRadiusBack = 0.4
        const wheelHalfTrackBack = 1.1
        const wheelAxisHeightBack = 0

        const wheelAxisFrontPosition = 1.2
        const wheelRadiusFront = 0.4
        const wheelHalfTrackFront = 1.1
        const wheelAxisHeightFront = 0
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

        this.setPosition(0, 3, 0)
    }

    setCheckpointPositionRotation(newPositionRotation: IPositionRotation) {
        this.checkpointPositionRotation = newPositionRotation
    }

    setFont(font: THREE.Font) {
        this.font = font
        this.createNameMesh()
    }

    createNameMesh() {
        const textGeo = new THREE.TextGeometry(this.name, {
            font: this.font!,
            size: 1,
            height: 0.5,
        })

        const textMesh = new THREE.Mesh(textGeo, new THREE.MeshLambertMaterial({ color: 0xee11ee, }))
        textMesh.rotateY(Math.PI)
        this.scene.add.existing(textMesh)

        textMesh.position.set(chassisWidth / 2, 3, 0)
        this.chassisMesh.add(textMesh)

    }




    update() {
        let tm: Ammo.btTransform, p: Ammo.btVector3, q: Ammo.btQuaternion
        const n = this.vehicle.getNumWheels()
        tm = this.vehicle.getChassisWorldTransform()
        p = tm.getOrigin()
        q = tm.getRotation()



        this.chassisMesh.position.set(p.x(), p.y(), p.z())
        this.chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w())
        for (let i = 0; i < this.wheelMeshes.length; i++) {
            // this.vehicle.updateWheelTransform(i, true)
            tm = this.vehicle.getWheelTransformWS(i)
            p = tm.getOrigin()
            q = tm.getRotation()

            this.wheelMeshes[i].position.set(p.x(), p.y(), p.z())
            this.wheelMeshes[i].quaternion.set(q.x(), q.y(), q.z(), q.w())
            this.wheelMeshes[i].rotateZ(Math.PI / 2)
        }
    }

    getCurrentSpeedKmHour() {
        return this.vehicle.getCurrentSpeedKmHour()
    }

    goForward(moreSpeed: boolean) {
        if (!this.canDrive) return
        this.vehicle.applyEngineForce(moreSpeed ? this.engineForce * 1.5 : this.engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(moreSpeed ? this.engineForce * 1.5 : this.engineForce, BACK_RIGHT)
    }

    goBackward(speed: number) {
        if (!this.canDrive) return
        this.vehicle.applyEngineForce(-this.engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(-this.engineForce, BACK_RIGHT)
    }

    noForce() {

        this.vehicle.applyEngineForce(0, BACK_LEFT)
        this.vehicle.applyEngineForce(0, BACK_RIGHT)
    }

    break(notBreak?: boolean) {
        const breakForce = notBreak ? 0 : maxBreakingForce
        this.vehicle.setBrake(breakForce, BACK_RIGHT)
        this.vehicle.setBrake(breakForce, BACK_LEFT)
        this.vehicle.setBrake(breakForce, FRONT_RIGHT)
        this.vehicle.setBrake(breakForce, FRONT_LEFT)
    }

    stop() {
        this.chassisMesh.body.setCollisionFlags(1)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
    }

    start() {
        this.chassisMesh.body.setCollisionFlags(0)
    }

    pause() {
        this.isPaused = true
        this.chassisMesh.body.setCollisionFlags(1)
    }

    unpause() {
        this.isPaused = false
        this.chassisMesh.body.setCollisionFlags(0)
    }

    turn(angle: number) {
        if (this.canDrive) {

            this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_LEFT)
            this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_RIGHT)
        } else {
            this.vehicle.setSteeringValue(0, FRONT_LEFT)
            this.vehicle.setSteeringValue(0, FRONT_RIGHT)
        }
    }

    turnLeft(angle: number) {
        if (this.vehicleSteering < maxSteering) {
            this.vehicleSteering += steeringIncrement
        }
        this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_LEFT)
        this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_RIGHT)
    }



    turnRight(angle: number) {
        if (Math.abs(this.vehicleSteering) < maxSteering) {
            this.vehicleSteering -= steeringIncrement
        }
        this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_LEFT)
        this.vehicle.setSteeringValue(angle * this.steeringSensitivity, FRONT_RIGHT)
    }

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
    }

    addCamera(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
        this.chassisMesh.add(camera)

    }

    cameraLookAt(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
        camera.lookAt(this.chassisMesh.position.clone())
    }

    setPosition(x: number, y: number, z: number) {
        const tm = this.vehicle.getChassisWorldTransform()
        tm.setOrigin(new Ammo.btVector3(x, y, z))
    }

    setRotation(x: number, y: number, z: number) {
        const tm = this.vehicle.getChassisWorldTransform()
        tm.setRotation(new Ammo.btQuaternion(x, y, z, 1))
    }

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

    lookForwardsBackwards(lookBackwards: boolean) {
        this.lookBackwards = lookBackwards
    }

    addWheel(isFront: boolean, pos: Ammo.btVector3, radius: number, index: number) {
        const suspensionStiffness = 50
        const suspensionDamping = 2.3
        const suspensionCompression = 4.4
        const suspensionRestLength = 0.1

        const friction = 50
        const rollInfluence = 0.001

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
        const w = this.scene.make.cylinder({
            radiusBottom: radius,
            radiusTop: radius,
            height: 0.2,
            radiusSegments: 12
        },
            { lambert: { color: 'white' } }
        )
        this.scene.add.existing(w)
        return w
    }

    resetPosition() {
        this.chassisMesh.body.setAngularVelocity(0, 0, 0)
        this.chassisMesh.body.setVelocity(0, 0, 0)
        const { position, rotation } = this.checkpointPositionRotation
        this.setPosition(position.x, position.y, position.z)
        this.setRotation(rotation.x, rotation.y, rotation.z)
    }

    updateVehicleSettings(vehicleSettings: IVehicleSettings) {

        this.steeringSensitivity = radiantMultiplier * vehicleSettings.steeringSensitivity
    }
}


export function createNormalVehicle(scene: Scene3D, color: string | number | undefined, name: string) {
    const vehicle = new NormalVehicle(scene, color, name)
    return vehicle
}