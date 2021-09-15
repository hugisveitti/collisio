// import THREE from "@enable3d/three-wrapper/node_modules/three";
import { Scene3D } from "enable3d";
import { width } from "../mobile/mobileGui";
import { IVehicle } from "./IVehicle";
import * as THREE from '@enable3d/three-wrapper/dist/index';


const FRONT_LEFT = 0
const FRONT_RIGHT = 1
const BACK_LEFT = 2
const BACK_RIGHT = 3
const steeringIncrement = 0.02
const maxSteering = 0.4

const engineForce = 5001
const maxBreakingForce = 100

const chassisWidth = 1.8;
const chassisHeight = .6;
const chassisLength = 4;
const vehicleMass = 800;
export class NormalVehicle implements IVehicle {

    vehicle: Ammo.btRaycastVehicle
    scene: Scene3D
    tuning: Ammo.btVehicleTuning
    chassisMesh: THREE.Mesh
    wheelMeshes: THREE.Mesh[]
    color: string | number | undefined

    vehicleSteering: number

    name: string
    font?: THREE.Font


    lookBackwards: boolean

    constructor(scene: Scene3D, color: string | number | undefined, name: string) {
        this.color = color
        this.scene = scene
        this.vehicleSteering = 0
        this.name = name
        this.lookBackwards = false


        const origin = new Ammo.btVector3(0, .01, 0)

        const geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5))
        const transform = new Ammo.btTransform()

        transform.setIdentity()
        transform.setOrigin(origin)
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1))

        const vehicleBody = new Ammo.btCompoundShape()
        vehicleBody.addChildShape(transform, geometry)

        const topBoxG = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .25, 1, chassisWidth * .25))
        const topBoxT = new Ammo.btTransform()
        topBoxT.setIdentity()
        topBoxT.setOrigin(new Ammo.btVector3(0, 1, 0))
        topBoxT.setRotation(new Ammo.btQuaternion(0, 0, 0, 1))
        vehicleBody.addChildShape(topBoxT, topBoxG)

        const motionState = new Ammo.btDefaultMotionState(transform)
        const localInertia = new Ammo.btVector3(0, 10, 0)
        vehicleBody.calculateLocalInertia(vehicleMass, localInertia)

        // creates the physics of the vehiclebody
        const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(vehicleMass, motionState, vehicleBody, localInertia))
        body.setActivationState(4)

        scene.physics.physicsWorld.addRigidBody(body)

        // this creates the look, 
        this.chassisMesh = this.createChassisMesh(chassisWidth, chassisHeight, chassisLength)


        this.tuning = new Ammo.btVehicleTuning()

        const rayCaster = new Ammo.btDefaultVehicleRaycaster(this.scene.physics.physicsWorld)
        this.vehicle = new Ammo.btRaycastVehicle(this.tuning, body, rayCaster)
        this.vehicle.setCoordinateSystem(0, 1, 2)

        scene.physics.physicsWorld.addAction(this.vehicle)

        const wheelAxisBackPosition = -1.3
        const wheelRadiusBack = 0.5
        const wheelHalfTrackBack = .9
        const wheelAxisHeightBack = -0

        const wheelAxisFrontPosition = 1.3
        const wheelRadiusFront = 0.5
        const wheelHalfTrackFront = .9
        const wheelAxisHeightFront = -0
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
        for (let i = 0; i < n; i++) {
            this.vehicle.updateWheelTransform(i, true)
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

    goForward(speed: number) {
        this.vehicle.applyEngineForce(engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(engineForce, BACK_RIGHT)
    }
    goBackward(speed: number) {
        this.vehicle.applyEngineForce(-engineForce, BACK_LEFT)
        this.vehicle.applyEngineForce(-engineForce, BACK_RIGHT)
    }
    noForce() {
        if (Math.abs(this.vehicle.getCurrentSpeedKmHour()) < 1) {
            return
        }
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

    turnLeft(angle: number) {

        if (this.vehicleSteering < maxSteering) {
            this.vehicleSteering += steeringIncrement
        }

        this.vehicle.setSteeringValue(angle / 100, FRONT_LEFT)
        this.vehicle.setSteeringValue(angle / 100, FRONT_RIGHT)
    }

    turnRight(angle: number) {

        if (Math.abs(this.vehicleSteering) < maxSteering) {
            this.vehicleSteering -= steeringIncrement
        }


        this.vehicle.setSteeringValue(angle / 100, FRONT_LEFT)
        this.vehicle.setSteeringValue(angle / 100, FRONT_RIGHT)
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

        // this.vehicle.setSteeringValue(0, FRONT_LEFT)
        // this.vehicle.setSteeringValue(0, FRONT_RIGHT)
    }

    addCamera(camera: THREE.PerspectiveCamera) {
        this.chassisMesh.add(camera)

    }

    cameraLookAt(camera: THREE.PerspectiveCamera) {
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

        const friction = 1000
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


        this.wheelMeshes.push(this.createWheelMesh(radius, width))
    }

    createWheelMesh(radius: number, width: number) {
        const t = new THREE.CylinderGeometry(radius, radius, 0.2, 24, 1)
        const mesh = new THREE.Mesh(t, new THREE.MeshPhongMaterial({ color: 0x221d40, }))
        this.scene.add.existing(mesh)
        return mesh
    }

    createChassisMesh(w: number, l: number, h: number) {
        const wireframe = false
        const shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1)
        const mesh = new THREE.Mesh()

        const box = new THREE.Mesh(
            shape, new THREE.MeshPhongMaterial({ color: 0x114433, wireframe })
        )
        box.position.set(0, .3, 0)
        mesh.add(box)

        const smallCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(.1, .2, .5, 12, 12),
            new THREE.MeshPhongMaterial({ color: this.color })
        )
        smallCylinder.position.set(0, .8, 1.5)
        mesh.add(smallCylinder)

        const cone = new THREE.Mesh(
            new THREE.CylinderGeometry(.3, .8, 1.5, 12, 12),
            new THREE.MeshPhongMaterial({ color: this.color })
        )
        cone.position.set(0, 1, 0)
        mesh.add(cone)

        this.scene.add.existing(mesh)
        return mesh as THREE.Mesh
    }

}


export function createNormalVehicle(scene: Scene3D, color: string | number | undefined, name: string,) {
    const vehicle = new NormalVehicle(scene, color, name)
    return vehicle
}