import * as THREE from '@enable3d/three-wrapper/dist/index';
import { CollisionEvent } from "@enable3d/common/dist/types";
import { GLTF, GLTFLoader, LoadingManager, Group } from "@enable3d/three-wrapper/dist";
import { ExtendedObject3D, Scene3D } from "enable3d";

import { TrackType } from "../classes/Game";
import { IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { gameItems } from "./gameItems";
import { IRaceCourse } from "./ICourse";


const loadDiv = document.createElement("div")
loadDiv.setAttribute("id", "load-screen")
document.body.appendChild(loadDiv)

const manager = new LoadingManager()

manager.onStart = (url: string, loaded: number, itemsTotal: number) => {
    loadDiv.innerHTML = "Loading files " + loaded + " / " + itemsTotal
}

manager.onProgress = (url: string, loaded: number, itemsTotal: number) => {
    loadDiv.innerHTML = "Loading files " + loaded + " / " + itemsTotal
}

manager.onLoad = () => {
    loadDiv.innerHTML = ""
}

const keyNameMatch = (key: string, name: string) => {
    if (gameItems[key].exactMatch) {
        return key === name
    }
    return name.includes(key)
}

export class RaceCourse implements IRaceCourse {

    scene: Scene3D
    courseWidth: number
    courseDepth: number
    trackWidth: number
    goal: ExtendedObject3D
    goalSpawn: ExtendedObject3D
    ground: ExtendedObject3D
    checkpoint: ExtendedObject3D
    checkpointSpawn: ExtendedObject3D
    trackName: TrackType
    startRotation: THREE.Euler
    startPosition: THREE.Vector3
    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void

    /** all of the objects with physics */
    gamePhysicsObjects: ExtendedObject3D[]

    /** all of the objects added to the scene */

    courseScene: Group

    constructor(scene: Scene3D, trackName: TrackType, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {
        this.scene = scene
        this.courseWidth = 500
        this.courseDepth = 500
        this.trackWidth = 50
        this.trackName = trackName
        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback
        this.gamePhysicsObjects = []
    }

    toggleShadows(useShadows: boolean) {

        for (let object of this.gamePhysicsObjects) {
            for (let key of Object.keys(gameItems)) {
                if (keyNameMatch(key, object.name)) {
                    object.receiveShadow = useShadows && gameItems[key].receiveShadow
                    object.castShadow = useShadows && gameItems[key].castsShadow
                }
            }
        }
    }



    createCourse(useShadows: boolean, courseLoadedCallback: () => void) {

        const loader = new GLTFLoader(manager)

        loader.load(`models/${this.trackName}.gltf`, (gltf: GLTF) => {
            this.scene.scene.add(gltf.scene)
            this.courseScene = gltf.scene
            console.log("gltf", gltf)
            const itemKeys = Object.keys(gameItems)


            /* items named hidden-X in blender, will have physics but will be invisible
            *  items named ghost-X in blender won't have physics but will be visible
            *  using this we have have complex multi poly sturctures that are difficult to render like fences or tree
            *  but then render a box in their place for the physics
            */
            for (let child of gltf.scene.children) {

                if (child.type === "Mesh" || child.type === "Group") {

                    for (let key of itemKeys) {
                        if (keyNameMatch(key, child.name)) {

                            if (!child.name.includes("ghost") && !Boolean(gameItems[key].notAddPhysics)) {
                                const eObject = (child as ExtendedObject3D)
                                this.scene.physics.add.existing(eObject, { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape, mass: gameItems[key].mass, });
                                eObject.castShadow = useShadows && Boolean(gameItems[key].castsShadow);
                                eObject.receiveShadow = useShadows && Boolean(gameItems[key].receiveShadow);
                                eObject.visible = !Boolean(gameItems[key].notVisible);
                                eObject.body.checkCollisions = true
                                if (gameItems[key].bounciness) {
                                    eObject.body.setBounciness(gameItems[key].bounciness)
                                }
                                if (gameItems[key].friction) {
                                    eObject.body.setFriction(gameItems[key].friction)
                                }
                                if (gameItems[key].gravityY) {
                                    eObject.body.setGravity(0, gameItems[key].gravityY, 0)
                                }
                                if (child.name.includes("hidden")) {
                                    child.visible = false
                                }
                                this.gamePhysicsObjects.push(eObject)
                            } else if (child.name.includes("ghost")) {

                            }
                            if (gameItems[key].isCourseObject) {
                                // hacky ????

                                const code = `this.${gameItems[key].objectName} = child`
                                eval(code)
                            }
                            // child.visible = false
                        }
                    }
                }
            }
            this.setupCollisionListeners()
            courseLoadedCallback()
        })
    }

    setupCollisionListeners() {
        if (this.goal) {
            try {
                this.goal.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                    if (otherObject.name.slice(0, 7) === "vehicle") {
                        this.goalCrossedCallback(otherObject)
                    }
                })
            } catch {
                console.log("No goal object")
            }
        }
        if (this.checkpoint) {
            this.checkpoint.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                if (otherObject.name.slice(0, 7) === "vehicle") {
                    this.checkpointCrossedCallback(otherObject)
                }
            })
        }
        if (this.goalSpawn) {
            this.startPosition = this.goalSpawn.position
            this.startRotation = this.goalSpawn.rotation
        }
    }

    checkIfVechileCrossedGoal(vehicle: IVehicle) {
        if (this.goal) {

        }
    }

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return false
    }


    clearCourse() {
        this.scene.scene.remove(this.courseScene)
        for (let obj of this.gamePhysicsObjects) {
            this.scene.physics.destroy(obj)
        }
    }
}