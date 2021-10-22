import { CollisionEvent } from "@enable3d/common/dist/types";
import { GLTF, GLTFLoader, LoadingManager, MeshStandardMaterial } from "@enable3d/three-wrapper/dist";
import { ExtendedObject3D, Scene3D } from "enable3d";
import { IVehicle, SimpleVector } from "../models/IVehicle";
import { gameItems } from "./gameItems";


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


export class RaceCourse {

    scene: Scene3D
    courseWidth: number
    courseDepth: number
    trackWidth: number
    goal?: ExtendedObject3D
    goalSpawn?: ExtendedObject3D
    ground?: ExtendedObject3D
    checkpoint?: ExtendedObject3D
    checkpointSpawn?: ExtendedObject3D
    trackName: string
    goalCrossedCallback: (vehicle: ExtendedObject3D) => void
    checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void
    gamePhysicsObjects: ExtendedObject3D[]


    constructor(scene: Scene3D, trackName: string, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {
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
                                this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape });
                                (child as ExtendedObject3D).castShadow = useShadows && Boolean(gameItems[key].castsShadow);
                                (child as ExtendedObject3D).receiveShadow = useShadows && Boolean(gameItems[key].receiveShadow);
                                (child as ExtendedObject3D).visible = !Boolean(gameItems[key].notVisible)
                                if (gameItems[key].bounciness) {
                                    (child as ExtendedObject3D).body.setBounciness(gameItems[key].bounciness)
                                }
                                if (child.name.includes("hidden")) {
                                    child.visible = false
                                }
                                this.gamePhysicsObjects.push(child as ExtendedObject3D)
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
    }

    checkIfVechileCrossedGoal(vehicle: IVehicle) {
        if (this.goal) {

        }
    }

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return false
    }
}