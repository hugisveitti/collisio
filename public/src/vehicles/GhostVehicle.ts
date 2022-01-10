import { ExtendedObject3D } from "@enable3d/ammo-physics";
import { MeshStandardMaterial, Quaternion, Vector3, Object3D, Color } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VehicleType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { vehicleConfigs } from "./VehicleConfigs";

export interface IGhostVehicle {
    setPosition: (position: Vector3) => void
    setRotation: (rotation: Quaternion) => void
    isReady: boolean
    vehicle: ExtendedObject3D
    loadModel: () => Promise<void>
}

interface GhostVehicleConfig {
    vehicleType: VehicleType
    color: string
}

export class GhostVehicle implements IGhostVehicle {

    config: GhostVehicleConfig
    position: Vector3
    rotation: Quaternion
    isReady: boolean;
    vehicle: ExtendedObject3D


    constructor(config: GhostVehicleConfig) {
        this.config = config
        this.position = new Vector3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 0)
        this.isReady = false

        this.vehicle = new ExtendedObject3D()
        // this.loadModel().then(() => {
        //     this.isReady = true
        // })
    }

    setRotation(rotation: Quaternion) {
        if (!this.isReady) return
        this.rotation = rotation
        this.vehicle.setRotationFromQuaternion(rotation)
    };

    setPosition(position: Vector3) {
        if (!this.isReady) return
        this.position = position

        this.vehicle.position.set(position.x, position.y, position.z)
    };

    async loadModel() {
        const promise = new Promise<void>((resolve, reject) => {

            const loader = new GLTFLoader()

            loader.load(getStaticPath(`models/${vehicleConfigs[this.config.vehicleType].path}`), (gltf: GLTF) => {
                let tires = [] as ExtendedObject3D[]
                let chassis: ExtendedObject3D
                let extraCarStuff: ExtendedObject3D;
                let opacity = 0.5
                for (let child of gltf.scene.children) {
                    if (child.type === "Mesh" || child.type === "Group") {

                        if (child.name.includes("chassis")) {
                            let _chassis = (child as ExtendedObject3D);
                            chassis = _chassis
                            // import to clone the material since the tires share material
                            const material = (chassis.material as MeshStandardMaterial).clone();

                            (chassis.material as MeshStandardMaterial) = material;
                            (chassis.material as MeshStandardMaterial).color = new Color(this.config.color);
                            (chassis.material as MeshStandardMaterial).opacity = opacity;
                            (chassis.material as MeshStandardMaterial).transparent = true
                        } else if (child.name.includes("extra-car-stuff")) {
                            extraCarStuff = (child as ExtendedObject3D);
                            ((child as ExtendedObject3D).material as MeshStandardMaterial).opacity = opacity;
                            ((child as ExtendedObject3D).material as MeshStandardMaterial).transparent = true

                        } else if (child.name === "tire") {
                            const tire = (child as ExtendedObject3D)

                            tires.push(tire)
                        } else {
                            //for (let tireConfig of tiresConfig) {
                            if (child.name.includes("tire")) {
                                tires.push(child as ExtendedObject3D);
                                ((child as ExtendedObject3D).material as MeshStandardMaterial).opacity = opacity;
                                ((child as ExtendedObject3D).material as MeshStandardMaterial).transparent = true
                                // if (!onlyLoad) {
                                //     tires[tireConfig.number].geometry.center()
                                // }
                            }
                            //  }
                        }
                    }
                }


                // if (extraCarStuff) {
                //     chassis.add(extraCarStuff)
                // }

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
// const FRONT_LEFT = 0
// const FRONT_RIGHT = 1
// const BACK_LEFT = 2
// const BACK_RIGHT = 3

// const tiresConfig = [
//     {
//         name: "back-right-tire",
//         number: BACK_RIGHT
//     },
//     {
//         name: "back-left-tire",
//         number: BACK_LEFT
//     },
//     {
//         name: "front-left-tire",
//         number: FRONT_LEFT
//     },
//     {
//         name: "front-right-tire",
//         number: FRONT_RIGHT
//     },
// ]