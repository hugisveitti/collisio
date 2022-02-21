import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Scene3D } from "enable3d";
import { MeshStandardMaterial, Quaternion, Vector3, Object3D, Color, RGBAFormat } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { CurrentItemProps } from "../components/showRoom/showRoomCanvas";
import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { possibleVehicleItemTypes, VehicleSetup } from "../shared-backend/vehicleItems";
import { getStaticPath } from "../utils/settings";
import { changeVehicleBodyColor } from "./Vehicle";
import { vehicleConfigs } from "./VehicleConfigs";
import { VehiclesSetup } from "./VehicleSetup";

export interface IGhostVehicle {
    setPosition: (position: Vector3) => void
    setRotation: (rotation: Quaternion) => void
    setSimpleRotation: (rotation: { x: number, z: number, y: number, w: number }) => void
    isReady: boolean
    //  vehicle: ExtendedObject3D
    loadModel: () => Promise<void>
    addToScene: (scene: Scene3D) => void
    removeFromScene: (scene: Scene3D) => void
    show: () => void
    hide: () => void
    saveCurrentPosition: () => void
    changeColor: (color: VehicleColorType) => void
    id: string
    setSpeed: (number: number, delta: number, alpha: number) => void
    updateVehicleSetup: (vehicleSetup: VehicleSetup) => void
}

export interface GhostVehicleConfig {
    vehicleType: VehicleType
    color: string
    // in mutliplayer, has to be userId
    id: string
    notOpague?: boolean
}

export class GhostVehicle implements IGhostVehicle {

    config: GhostVehicleConfig
    position: Vector3
    futurePosition: Vector3
    rotation: Quaternion
    isReady: boolean;
    vehicle: ExtendedObject3D
    id: string

    timeSinceLastUpdate: number
    private _speed: number
    delta: number
    /** Use alpha for lerping */
    alpha: number

    // number of setPositions with out

    vehicleItems: CurrentItemProps
    isUpdatingVehicleSetup: boolean
    constructor(config: GhostVehicleConfig) {
        this.id = config.id
        this.config = config
        this.position = new Vector3(0, 0, 0)
        this.futurePosition = new Vector3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 0)
        this.isReady = false
        this._speed = 0
        this.alpha = 0
        this.isUpdatingVehicleSetup = false
        this.vehicleItems = {
            exhaust: undefined,
            spoiler: undefined,
            wheelGuards: undefined
        }

        this.vehicle = new ExtendedObject3D()

        if (this.config.vehicleType === "simpleSphere") {
            // TODO
            console.warn("Round betty not suported as ghost!")
            this.config.vehicleType = "normal"
        }
    }

    setSpeed(speed: number, delta: number, alpha: number) {
        this._speed = speed
        this.delta = delta
        this.alpha = alpha
    }

    changeColor(color: VehicleColorType) {
        this.config.color = color
        changeVehicleBodyColor(this.vehicle, [this.config.color] as VehicleColorType[])
    }

    addToScene(scene: Scene3D) {
        // start with no collision
        // scene.physics.add.existing(this.vehicle, { mass: vehicleConfigs[this.config.vehicleType].mass, collisionFlags: 6, shape: "convex" })
        // having collision with ghost
        scene.physics.add.existing(this.vehicle, { mass: 0, collisionFlags: 6, shape: "plane" })
        scene.scene.add(this.vehicle)
    }

    removeFromScene(scene: Scene3D) {
        scene.physics.destroy(this.vehicle)
        scene.scene.remove(this.vehicle)
    }

    setRotation(rotation: Quaternion) {
        if (!this.isReady) return
        this.rotation = rotation
        this.vehicle.setRotationFromQuaternion(rotation)
    };

    setSimpleRotation(r: { x: number, y: number, z: number, w: number }) {
        if (!this.isReady) return
        this.rotation.set(r.x, r.y, r.z, r.w)
        this.vehicle.setRotationFromQuaternion(this.rotation)

    }

    saveCurrentPosition() {
        this.position = this.vehicle.position
    }

    setPosition(position: Vector3) {
        if (!this.isReady) return
        this.position.set(
            position.x,
            position.y,
            position.z
        )
        // the ghost vehicle seems to be going back and forth
        // but according to this the vehicle just goes forth

        if (this._speed && this.delta) {

            calcExpectedPos(this.position, this.vehicle.quaternion, this._speed, this.delta, this.futurePosition)
            const nP = this.position.lerp(this.futurePosition, this.alpha)

            // should probably do something like this
            //  const nP = this.position.lerp(this.futurePosition, this.alpha)

            //  this.vehicle.position.set(this.futurePosition.x, this.futurePosition.y, this.futurePosition.z)
            //   console.log("np", nP.x.toFixed(2), ", pos:", position.x.toFixed(2), ", futur pos:", this.futurePosition.x.toFixed(2))
            this.vehicle.position.set(nP.x, nP.y, nP.z)

        } else {
            this.vehicle.position.set(position.x, position.y, position.z)
        }
        this.vehicle.body.needUpdate = true
    };

    hide() {
        if (!this.vehicle) return
        this.vehicle.visible = false
    }

    show() {
        if (!this.vehicle) return
        this.vehicle.visible = true
    }

    async updateVehicleSetup(vehicleSetup: VehicleSetup) {
        // add vehiclesetup
        return new Promise<void>((resolve, reject) => {

            if (this.isUpdatingVehicleSetup) return
            this.isUpdatingVehicleSetup = true
            changeVehicleBodyColor(this.vehicle, [vehicleSetup.vehicleColor])

            for (let item in this.vehicleItems) {
                if (this.vehicleItems[item]?.model) {
                    this.vehicle.remove(this.vehicleItems[item].model)
                }
            }
            for (let itemType of possibleVehicleItemTypes) {
                if (vehicleSetup[itemType]?.path) {
                    this.loadItem(vehicleSetup[itemType]?.path).then(model => {
                        this.vehicleItems[itemType] = {
                            model,
                            props: undefined
                        }
                    })
                }
            }
            this.isUpdatingVehicleSetup = false
            resolve()
        })
    }

    loadItem(itemPath: string) {
        return new Promise<ExtendedObject3D>((resolve, reject) => {

            if (!this.vehicle) {

                console.warn("No vehiclebody to add items to")
                reject()
                return
            }
            const loader = new GLTFLoader()
            loader.load(getStaticPath(`models/${this.config.vehicleType}/${itemPath}.glb`), (gltf: GLTF) => {
                for (let child of gltf.scene.children) {
                    if (child.type === "Mesh") {
                        //   child.position.set(child.position.x, child.position.y + this.vehicleConfig.centerOfMassOffset, child.position.z)
                        this.vehicle.add(child)
                        resolve(child as ExtendedObject3D)
                    }
                }
            })
        })
    }

    async loadModel() {
        const promise = new Promise<void>((resolve, reject) => {

            const loader = new GLTFLoader()

            loader.load(getStaticPath(`${vehicleConfigs[this.config.vehicleType].path}`), (gltf: GLTF) => {
                let tires = [] as ExtendedObject3D[]
                let chassis: ExtendedObject3D
                let extraCarStuff: ExtendedObject3D;
                let opacity = 0.2
                for (let child of gltf.scene.children) {
                    if (child.type === "Mesh" || child.type === "Group") {
                        if (!this.config.notOpague) {
                            makeObjectOpague(child as ExtendedObject3D);
                        }


                        if (child.name.includes("chassis")) {
                            let _chassis = (child as ExtendedObject3D);
                            chassis = _chassis
                            // import to clone the material since the tires share material
                            changeVehicleBodyColor(chassis, [this.config.color] as VehicleColorType[])
                            // const material = (chassis.material as MeshStandardMaterial).clone();

                            // (chassis.material as MeshStandardMaterial) = material;
                            // //  (chassis.material as MeshStandardMaterial).color = new Color(this.config.color);

                        } else if (child.name.includes("extra-car-stuff")) {
                            extraCarStuff = (child as ExtendedObject3D);

                        } else if (child.name === "tire") {
                            const tire = (child as ExtendedObject3D)

                            tires.push(tire)
                        } else {

                            if (child.name.includes("tire")) {
                                tires.push(child as ExtendedObject3D);
                            }
                        }
                    }
                }

                if (chassis) {
                    this.vehicle.add(chassis)
                }
                if (extraCarStuff) {
                    this.vehicle.add(extraCarStuff)
                }
                for (let tire of tires) {
                    this.vehicle.add(tire)
                }

                this.isReady = true
                resolve()
            })
        })
        return promise
    }
}

const makeObjectOpague = (object: ExtendedObject3D) => {
    if (object.type === "Mesh") {
        (object.material as MeshStandardMaterial).format = RGBAFormat;
        (object.material as MeshStandardMaterial).opacity = .2;
        (object.material as MeshStandardMaterial).transparent = true
    } else {
        for (let child of object.children) {
            (child.material as MeshStandardMaterial).format = RGBAFormat;
            (child.material as MeshStandardMaterial).opacity = .2;
            (child.material as MeshStandardMaterial).transparent = true
        }
    }
}


/**
 * Calculate expected position
 * @param currentPos 
 * @param q: current rotation of item in Quaternion
 * @param kmh: speed
 * @param delta: 
 * @param newPos:Vector3, to save the position in
 * @returns Vector3, expected pos after delta seconds 
 * I assume the vehicle isnt going up in the air
 * Might not work well on uneven tracks
 */
const calcExpectedPos = (currentPos: Vector3, q: Quaternion, kmh: number, delta: number, newPos: Vector3) => {
    const mps = (kmh) / 3.6
    const expDist = mps * (delta)
    const alpha = 2 * Math.asin(q.y)
    newPos.set(
        currentPos.x + (expDist * Math.sin(alpha) * Math.sign(q.w)),
        currentPos.y,
        currentPos.z + (expDist * Math.cos(alpha))
    )
}