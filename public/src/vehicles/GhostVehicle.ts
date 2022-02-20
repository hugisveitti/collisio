import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { Scene3D } from "enable3d";
import { MeshStandardMaterial, Quaternion, Vector3, Object3D, Color, RGBAFormat } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { changeVehicleBodyColor } from "./Vehicle";
import { vehicleConfigs } from "./VehicleConfigs";

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
    changeColor: (color: VehicleColorType) => void
    id: string
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
    rotation: Quaternion
    isReady: boolean;
    vehicle: ExtendedObject3D
    id: string

    constructor(config: GhostVehicleConfig) {
        this.id = config.id
        this.config = config
        this.position = new Vector3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 0)
        this.isReady = false

        this.vehicle = new ExtendedObject3D()

        if (this.config.vehicleType === "simpleSphere") {
            // TODO
            console.warn("Round betty not suported as ghost!")
            this.config.vehicleType = "normal"
        }
    }

    changeColor(color: VehicleColorType) {
        this.config.color = color
        changeVehicleBodyColor(this.vehicle, [this.config.color] as VehicleColorType[])
    }

    addToScene(scene: Scene3D) {
        // start with no collision
        // scene.physics.add.existing(this.vehicle, { mass: vehicleConfigs[this.config.vehicleType].mass, collisionFlags: 6, shape: "convex" })
        scene.physics.add.existing(this.vehicle, { mass: 0, collisionFlags: 6, shape: "box" })
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

    setPosition(position: Vector3) {
        if (!this.isReady) return
        this.position = position
        // the ghost vehicle seems to be going back and forth
        // but according to this the vehicle just goes forth
        this.vehicle.position.set(position.x, position.y, position.z)
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
