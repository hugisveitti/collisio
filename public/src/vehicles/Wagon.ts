import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Vector3, Quaternion, Vector2 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { getStaticPath } from "../utils/settings";
import { get2DAngleBetweenPoints, isBetweenAngles, isBetweenNumbers } from "../utils/utilFunctions";
import { IVehicle } from "./IVehicle";
import { getVehicleNumber, isVehicle } from "./LowPolyVehicle";
import { IWagonConfig, wagonConfigs, WagonType } from "./WagonConfigs";


const LEFT = 0
const RIGHT = 1

const tiresConfig = [

    {
        name: "right-tire",
        number: RIGHT
    },
    {
        name: "left-tire",
        number: LEFT
    },
]

export const getWagonNumber = (name: string) => {
    return +name.split("-")[1]
}

export const isWagon = (object: ExtendedObject3D) => {
    return object.name.slice(0, 5) === "wagon"
}

export class Wagon {


    wagonType: WagonType
    config: IWagonConfig
    tires: ExtendedObject3D[]
    wagonBody: ExtendedObject3D
    connectPoint: ExtendedObject3D
    scene: GameScene
    axis: ExtendedObject3D
    isReady: boolean
    hinge: Ammo.btHingeConstraint
    axisHinge: Ammo.btHingeConstraint

    axisDiff: Vector3
    connectionDiff: Vector3
    wagonNumber: number

    vehicleConnectionNumber: number

    v = new Vector2(0, 0)
    w = new Vector2(0, 0)

    constructor(scene: GameScene, wagonType: WagonType, wagonNumber: number) {
        this.wagonNumber = wagonNumber
        this.wagonType = wagonType
        this.config = wagonConfigs[this.wagonType]
        this.tires = []
        this.scene = scene
        this.vehicleConnectionNumber = -1
    }

    /**
     * Async load models and create the constraints
     * @returns a promise
     */
    async constructWagon() {
        return new Promise<void>(async (resolve, reject) => {
            await this.loadModels()
            this.createWagonWithAxis()
            console.log("created wagon with axis")
            resolve()
        })
    }

    /**
     * wagon where both wheels and axis are one object
     */
    createWagonWithAxis() {

        const wagonMass = this.config.mass
        const yPos = 3

        this.scene.add.existing(this.axis)
        this.scene.add.existing(this.wagonBody)
        this.wagonBody.name = `wagon-${this.wagonNumber}`

        this.wagonBody.position.setY(this.wagonBody.position.y + yPos);
        this.axis.position.setY(this.axis.position.y + yPos);

        this.axisDiff = this.wagonBody.position.clone()
        this.axisDiff.sub(this.axis.position).clone()
        this.scene.physics.add.existing(this.wagonBody, { mass: wagonMass, shape: "convex" })
        this.createAxis()

        this.createAxisHinge()
        this.createWagonCollisionDetection()

        this.isReady = true
    }

    async createAxis() {
        this.scene.physics.add.existing(this.axis, { mass: 50, shape: "convex" })
    }


    createWagonCollisionDetection() {
        this.wagonBody.body.checkCollisions = true
        this.wagonBody.body.on.collision((otherObject, e) => {
            if (isVehicle(otherObject)) {
                this.scene.vehicleCollidedWithObject(this.wagonBody, getVehicleNumber(otherObject.name))
            }
        })

    }

    removeWagonCollisionDetection() {
        this.wagonBody.body.checkCollisions = false
    }

    update() {
    }

    createAxisHinge() {
        this.axisHinge = this.scene.physics.add.constraints.hinge(this.wagonBody.body, this.axis.body, {
            axisA: { x: 1 },
            axisB: { x: 1 },
            pivotA:
            {
                y: this.axis.position.y - this.wagonBody.position.y,
                z: this.axis.position.z - this.wagonBody.position.z,
                x: this.axis.position.x - this.wagonBody.position.x
            },
        })
    }


    // note the connection points must be outside both the vehicle and the wagon
    // the reason is otherwise they cannot turn
    connectToVehicle(vehicle: IVehicle) {
        if (this.hinge) {
            console.warn("Wagon already connected to vehilce")
            return
        }

        // vehicle has to be infront of wagon.

        const wP = this.wagonBody.position
        const vP = vehicle.getPosition()

        const wR = this.wagonBody.rotation
        const vR = vehicle.vehicleBody.rotation

        // make sure the wagon and vehicle align
        const dAngle = Math.PI / 8
        const smallerAngle = wR.y - dAngle
        const biggerAngle = wR.y + dAngle

        // calculate if the vehicle is in a cone defined by two angles
        // calculate angles between the vehicle and wagon data:image/png;base64,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
        // theta is the angle between v and the wagon through the origin (0,0)
        // we want the angle between v and (0,0) through w
        const theta = Math.abs(get2DAngleBetweenPoints(this.wagonBody.position, vehicle.vehicleBody.position))
        this.v.set(vP.x, vP.z)
        this.w.set(wP.x, wP.z)
        const wv = this.v.distanceTo(this.w)
        const val = this.v.length() * Math.sin(theta) / wv
        const awv = Math.asin(
            val % 1
        )

        const awp0 = wR.y + dAngle
        const awp1 = wR.y - dAngle

        // console.log("awp1 < awv && awv < awp0 && isBetweenAngles(smallerAngle, biggerAngle, vR.y)")
        // console.log(awp1 < awv)
        // console.log(awv < awp0)

        console.log(isBetweenAngles(smallerAngle, biggerAngle, vR.y))
        // TODO: there is a bug here
        // the or (||) is just a temp fix to make it atleast possible to connect
        if ((awp1 < awv || awv < awp0) && isBetweenAngles(smallerAngle, biggerAngle, vR.y)) {

            this.hinge = this.scene.physics.add.constraints.hinge(vehicle.vehicleBody.body, this.wagonBody.body, {
                axisA: { y: 1, },
                axisB: { y: 1 },
                pivotA: vehicle.getTowPivot(),
                pivotB: { ...this.connectPoint.position }
            }, false)
            this.vehicleConnectionNumber = vehicle.vehicleNumber
            this.removeWagonCollisionDetection()
            return true
        } else {

            return false
        }
    }

    async setPositionRotation(pos: Vector3, q: Quaternion) {

        if (this.axisHinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.axisHinge)
        }

        this.scene.physics.destroy(this.axis.body)
        this.scene.physics.destroy(this.wagonBody.body)
        const yOff = 2

        this.wagonBody.position.set(pos.x, pos.y + yOff, pos.z)

        this.axis.position.set(
            this.wagonBody.position.x + this.axisDiff.x,
            this.wagonBody.position.y - this.axisDiff.y,
            this.wagonBody.position.z - this.axisDiff.z
        )
        this.wagonBody.rotation.setFromQuaternion(q)
        this.axis.rotation.setFromQuaternion(q)

        // dont know why but the axis wasnt being rendere correctly, this fixed it
        // I suspect some timing stuff and something being async
        setTimeout(() => {
            this.scene.physics.add.existing(this.axis, { mass: 50, shape: "convex" })
            this.scene.physics.add.existing(this.wagonBody, { shape: "convex", mass: this.config.mass })
            this.createAxisHinge()
            this.createWagonCollisionDetection()
        }, 100)

    }


    isConnectedToVehicle(vehicle: IVehicle) {
        return vehicle.vehicleNumber === this.vehicleConnectionNumber
    }

    removeConnection() {
        this.vehicleConnectionNumber = -1
        // how to destroy
        // this.hinge.
        if (this.hinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.hinge)
            Ammo.destroy(this.hinge)
            this.hinge = null
        }

        // just wait a little so it wont reconnect right away
        setTimeout(() => {
            this.createWagonCollisionDetection()
        }, 500)
    }



    destroy() {
        if (this.hinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.hinge)
        }
        if (this.axisHinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.axisHinge)
        }
        this.scene.destroy(this.wagonBody)
        this.scene.destroy(this.axis)
    }

    async loadModels() {
        return new Promise<void>((resolve, reject) => {
            const loader = new GLTFLoader()

            loader.load(getStaticPath(`models/${this.config.path}`), (gltf: GLTF) => {
                for (let child of gltf.scene.children) {
                    if (child.name.includes("wagon")) {
                        this.wagonBody = (child as ExtendedObject3D)
                    } else if (child.name === "connect-point") {
                        this.connectPoint = (child as ExtendedObject3D)
                    } else if (child.name === "axis") {
                        this.axis = (child as ExtendedObject3D)
                    }
                    else {
                        for (let tireConfig of tiresConfig) {
                            if (child.name === tireConfig.name) {
                                this.tires[tireConfig.number] = child as ExtendedObject3D
                            }
                        }
                    }
                }
                resolve()
            })
        })
    }
}