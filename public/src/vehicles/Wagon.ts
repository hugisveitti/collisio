import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Vector3, Quaternion } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { getStaticPath } from "../utils/settings";
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

    constructor(scene: GameScene, wagonType: WagonType) {
        this.wagonType = wagonType
        this.config = wagonConfigs[this.wagonType]
        this.tires = []
        this.scene = scene
        console.log("creating wagon")
        this.loadModels().then(() => {
            console.log("wagon loaded")
            this.createWagonWithAxis()
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

    createAxis() {
        const axisMass = 10
        this.scene.physics.add.existing(this.axis, { mass: axisMass, shape: "convex" })
        // this.axis.body.setAngularFactor(0, .1, 1)
        // const a = this.axis.body.ammo.getAngularFactor()
        // console.log("ang fac", a.x(), a.y(), a.z())
    }


    createWagonCollisionDetection() {
        this.wagonBody.body.checkCollisions = true
        this.wagonBody.body.on.collision((otherObject, e) => {
            if (isVehicle(otherObject)) {
                this.scene.vehicleCollidedWithObject(this, getVehicleNumber(otherObject.name))
            }
        })

    }

    removeWagonCollisionDetection() {
        this.wagonBody.body.checkCollisions = false
    }

    update() {
        // const p = this.wagonBody.position
        // const r = this.wagonBody.rotation
        // this.connectPoint.position.set(
        //     p.x,
        //     p.y,
        //     p.z ,
        // )
        // this.connectPoint.body.needUpdate = true
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

        this.hinge = this.scene.physics.add.constraints.hinge(vehicle.vehicleBody.body, this.wagonBody.body, {
            axisA: { y: 1, },
            axisB: { y: 1 },
            pivotA: vehicle.getTowPivot(),
            pivotB: { ...this.connectPoint.position, y: -.5 }
        }, false)
        this.removeWagonCollisionDetection()
    }

    setPosition(pos: Vector3) {
        if (this.axisHinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.axisHinge)
        }

        this.scene.physics.destroy(this.wagonBody.body)
        this.scene.physics.destroy(this.axis.body)
        const yOff = 2

        this.wagonBody.position.set(pos.x, pos.y + yOff, pos.z)

        this.axis.position.set(
            this.wagonBody.position.x + this.axisDiff.x,
            this.wagonBody.position.y - this.axisDiff.y,
            this.wagonBody.position.z - this.axisDiff.z
        )

        this.scene.physics.add.existing(this.wagonBody, { shape: "convex", mass: this.config.mass })
        this.createAxis()
        this.createAxisHinge()
        this.createWagonCollisionDetection()
    }

    setRotation(q: Quaternion) {
        if (this.axisHinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.axisHinge)
        }
        this.scene.physics.destroy(this.wagonBody.body)
        this.scene.physics.destroy(this.axis.body)

        this.wagonBody.rotation.setFromQuaternion(q)
        this.axis.rotation.setFromQuaternion(q)

        this.scene.physics.add.existing(this.wagonBody, { shape: "convex", mass: this.config.mass })
        this.createAxis()
        this.createAxisHinge()
        this.createWagonCollisionDetection()
    }

    removeConnection() {
        // how to destroy
        // this.hinge.
        if (this.hinge) {
            this.scene.physics.physicsWorld.removeConstraint(this.hinge)
            Ammo.destroy(this.hinge)
            this.hinge = null
        }
        this.createWagonCollisionDetection()
    }


    /**
     * Configure where the wheels will be and stuff
     */
    createWagonConstraint() {
        if (!this.connectPoint || !this.wagonBody || this.tires.length < 2) {
            console.warn("Error loading models:")
            console.warn(this.connectPoint, this.wagonBody, this.tires)
            return
        }
        console.log("models")
        console.log(this.connectPoint, this.wagonBody, this.tires)

        let tireMass = 20

        const p = new Vector3(0, 5, 0)
        this.scene.add.existing(this.wagonBody)
        this.wagonBody.geometry.center()
        this.wagonBody.position.set(p.x, p.y, p.z)

        const wheelXOffset = (this.config.wheelHalfTrack / 2)
        const wheelZOffset = this.config.wheelAxisPosition
        const wheelYOffset = this.config.wheelAxisHeight

        this.scene.add.existing(this.tires[RIGHT])
        this.tires[RIGHT].position.set(p.x - wheelXOffset, p.y + wheelYOffset, p.z + wheelZOffset)

        this.scene.add.existing(this.tires[LEFT])
        this.tires[LEFT].position.set(p.x + wheelXOffset, p.y + wheelYOffset, p.z + wheelZOffset);

        //   (this.tires[LEFT].material as MeshLambertMaterial).transparent = true
        // this.tires[RIGHT].visible = false

        this.tires[LEFT].geometry.center()
        this.tires[RIGHT].geometry.center()
        for (let tire of this.tires) {
            this.scene.physics.add.existing(tire, { mass: tireMass, shape: "convex" })

        }
        //    this.wagonBody.visible = false
        // this.scene.physics.add.existing(this.wagonBody,
        //     { mass: 100, shape: "box" }
        // )
        const pLeft = this.tires[LEFT].position
        const pRight = this.tires[RIGHT].position

        console.log("pleft", pLeft, pRight)


        const axisRadius = 0.06
        const axisHeight = pLeft.distanceTo(pRight) + .8

        const axis = this.scene.add.cylinder({
            mass: 10, radiusTop: axisRadius, radiusBottom: axisRadius, height: axisHeight
        }, {
            lambert: { color: "blue", opacity: 0.5 }
        })
        //  axis.geometry.center()
        axis.rotateZ(Math.PI / 2)
        axis.position.setZ(pLeft.z)
        axis.position.setY(pLeft.y)

        this.scene.physics.add.existing(axis)


        const leftRotor = this.addRotor(pLeft.x, pLeft.y, pLeft.z)
        const rightRotor = this.addRotor(pRight.x, pRight.y, pRight.z)




        const lockRight = this.scene.physics.add.constraints.fixed(rightRotor.body, axis.body, true)
        const lockLeft = this.scene.physics.add.constraints.fixed(leftRotor.body, axis.body, true)



        let wheelToRotorConstraint = { axisA: { y: 1 }, axisB: { z: 1 } }

        const left = this.scene.physics.add.constraints.hinge(
            leftRotor.body,
            this.tires[LEFT].body,
            {
                ...wheelToRotorConstraint,
                pivotA: {
                    y: -.8
                },
                pivotB: {

                }
            },
            true
        )

        const right = this.scene.physics.add.constraints.hinge(
            rightRotor.body,
            this.tires[RIGHT].body,
            {
                ...wheelToRotorConstraint,
                pivotA: {
                    y: .8
                },
                pivotB: {

                }
            },
            true
        )
    }

    addRotor(x: number, y: number, z: number) {
        let transparent = true
        const rotorMass = 10
        const rotor = this.scene.add.cylinder(
            { mass: rotorMass, radiusBottom: 0.35, radiusTop: 0.35, radiusSegments: 24, height: 0.5 },
            { lambert: { color: 'green', opacity: 0.5, transparent } }
        )

        rotor.position.set(x, y, z)
        rotor.rotateZ(Math.PI / 2)

        this.scene.physics.add.existing(rotor)
        return rotor
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
                        this.wagonBody = child as ExtendedObject3D
                    } else if (child.name === "connect-point") {
                        this.connectPoint = child as ExtendedObject3D
                    } else if (child.name === "axis") {
                        this.axis = child as ExtendedObject3D
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