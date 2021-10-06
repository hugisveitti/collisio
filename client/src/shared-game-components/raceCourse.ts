import { CollisionEvent } from "@enable3d/common/dist/types";
import { Texture, GLTFLoader, GLTF, FBXLoader } from "@enable3d/three-wrapper/dist";
import THREE, { Object3D, ObjectLoader } from "@enable3d/three-wrapper/node_modules/three";
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ExtendedObject3D, Scene3D } from "enable3d";
import { IVehicle, SimpleVector } from "../models/IVehicle";



export class RaceCourse {

    scene: Scene3D
    courseWidth: number
    courseDepth: number
    trackWidth: number
    goal?: ExtendedObject3D
    ground?: ExtendedObject3D
    checkpoint?: ExtendedObject3D
    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void


    constructor(scene: Scene3D, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {
        this.scene = scene
        this.courseWidth = 500
        this.courseDepth = 500
        this.trackWidth = 50
        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback

    }

    createCourse() {
        const loader = new GLTFLoader()
        loader.load("models/track.gltf", (gltf: GLTF) => {
            this.scene.scene.add(gltf.scene)
            console.log("gltf", gltf)
            for (let child of gltf.scene.children) {

                if (child.type === "Mesh" || child.type === "Group") {
                    if (child.name === "ground" || child.name.slice(0, 4) === "road") {
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 1, shape: "concave" });
                        (child as ExtendedObject3D).body.checkCollisions = false;
                        (child as ExtendedObject3D).body.setFriction(0)
                    } else if (child.name.slice(0, 4) === "wall") {
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 1, shape: "concave" })
                    } else if (child.name.slice(0, 4) === "goal") {
                        // Collision flag 5 is GHOST STATIC, see docs https://enable3d.io/docs.html#physics-body
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 5, shape: "convex" })
                        this.goal = child as ExtendedObject3D
                    } else if (child.name.slice(0, 4) === "tire") {
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 1, shape: "convex" })
                    } else if (child.name === "checkered-flag") {
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 1, shape: "convex" });
                    } else if (child.name.slice(0, 4) === "tree") {
                        const tree = child as ExtendedObject3D
                        // create a simple box for collision with the tree trunk
                        const { x, z } = tree.position
                        this.scene.physics.add.box({ height: 4, depth: .3, width: .3, y: 2, z, x, collisionFlags: 1, }, { lambert: { wireframe: true } })
                    } else if (child.name === "checkpoint") {
                        this.checkpoint = child as ExtendedObject3D
                        this.scene.physics.add.existing(child as ExtendedObject3D, { collisionFlags: 5, shape: "convex" })
                    } else {
                        this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: 1, shape: "convex" })
                    }
                    // child.visible = false
                } else if (child.type === "Object3D") {
                    //   this.scene.add.existing(child as Object3D)
                }
            }
            this.setupCollisionListeners()
        })
    }

    setupCollisionListeners() {
        if (this.goal) {
            this.goal.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                if (otherObject.name.slice(0, 7) === "vehicle") {
                    this.goalCrossedCallback(otherObject)
                }
            })
        }
        if (this.checkpoint) {
            this.checkpoint.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                console.log("checkpoint")
                if (otherObject.name.slice(0, 7) === "vehicle") {
                    this.checkpointCrossedCallback(otherObject)
                }
            })
        }
    }

    checkIfVechileCrossedGoal(vehicle: IVehicle) {
        if (this.goal) {

        }
    }

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return false
    }
}