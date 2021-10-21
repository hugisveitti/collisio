import { CollisionEvent } from "@enable3d/common/dist/types";
import { GLTF, GLTFLoader, LoadingManager, MeshStandardMaterial } from "@enable3d/three-wrapper/dist";
import { ExtendedObject3D, Scene3D } from "enable3d";
import { IVehicle, SimpleVector } from "../models/IVehicle";


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


    constructor(scene: Scene3D, trackName: string, goalCrossedCallback: (vehicle: ExtendedObject3D) => void, checkpointCrossedCallback: (vehicle: ExtendedObject3D) => void) {
        this.scene = scene
        this.courseWidth = 500
        this.courseDepth = 500
        this.trackWidth = 50
        this.trackName = trackName
        this.goalCrossedCallback = goalCrossedCallback
        this.checkpointCrossedCallback = checkpointCrossedCallback
    }



    createCourse(courseLoadedCallback: () => void) {

        interface IGameItem {
            collisionFlags: number,
            shape: "convex" | "concave",
            receiveShadow?: boolean,
            notAddPhysics?: boolean,
            castsShadow?: boolean,
            /** see enable3d bounciness  */
            bounciness?: number
            isCourseObject?: boolean
            exactMatch?: boolean
            objectName?: string
        }
        const gameItems = {
            "ground": {
                collisionFlags: 1,
                shape: "concave",
                receiveShadow: true,
                bounciness: .1
            },
            "road": {
                collisionFlags: 5,
                shape: "convex",
                notAddPhysics: false,
                receiveShadow: true,
            },
            "checkered-flag": {
                collisionFlags: 1,
                shape: "convex"
            },
            "checkpoint": {
                collisionFlags: 5,
                shape: "convex",
                isCourseObject: true,
                exactMatch: true,
                castsShadow: true,
                receiveShadow: true,
                objectName: "checkpoint"
            },
            "goal": {
                collisionFlags: 5,
                shape: "convex",
                isCourseObject: true,
                exactMatch: true,
                objectName: "goal",
                castsShadow: true,
                receiveShadow: true,
            },
            "tree": {
                collisionFlags: 1,
                shape: "concave",
                castsShadow: true,
                receiveShadow: true
            },
            "pine": {
                collisionFlags: 1,
                shape: "concave",
                castsShadow: true,
                receiveShadow: true
            },
            "leaf": {
                collisionFlags: 1,
                shape: "concave",
                castsShadow: true,
                receiveShadow: true
            },
            "checkpoint-spawn": {
                collisionFlags: -1,
                shape: "concave",
                notAddPhysics: true,
                isCourseObject: true,
                exactMatch: true,
                objectName: "checkpointSpawn"
            },
            "goal-spawn": {
                collisionFlags: -1,
                shape: "concave",
                notAddPhysics: true,
                isCourseObject: true,
                exactMatch: true,
                objectName: "goalSpawn"
            },
            "bridge": {
                collisionFlags: 1,
                shape: "concave"
            },
            "pavement-marking": {
                collisionFlags: 5,
                shape: "concave",
                receiveShadow: true
            },
            "fence": {
                collisionFlags: 1,
                shape: "concave",
                castsShadow: true,
                receiveShadow: true,
                bounciness: 0.5
            },
            "wall": {
                collisionFlags: 1,
                shape: "concave",
                castsShadow: true,
                receiveShadow: true,
                bounciness: 0.5
            },
            "rock": {
                collisionFlags: 1,
                shape: "convex",
                bounciness: 0.7,
                castsShadow: true,
                receiveShadow: true
            },
            "barn": {
                collisionFlags: 1,
                shape: "concave",
                bounciness: 0.7,
                castsShadow: true,
                receiveShadow: true
            },
            "house": {
                collisionFlags: 1,
                shape: "concave",
                bounciness: 0.7,
                castsShadow: true,
                receiveShadow: true
            }

        } as { [key: string]: IGameItem }

        const loader = new GLTFLoader(manager)
        // const trackName = "track"
        const trackName = "town-track"
        loader.load(`models/${this.trackName}.gltf`, (gltf: GLTF) => {
            this.scene.scene.add(gltf.scene)
            console.log("gltf", gltf)
            const itemKeys = Object.keys(gameItems)

            const keyNameMatch = (key: string, name: string) => {
                if (gameItems[key].exactMatch) {
                    return key === name
                }
                return name.includes(key)
            }

            for (let child of gltf.scene.children) {

                if (child.type === "Mesh" || child.type === "Group") {

                    for (let key of itemKeys) {
                        if (keyNameMatch(key, child.name)) {
                            if (!Boolean(gameItems[key].notAddPhysics)) {

                                this.scene.physics.add.existing((child as ExtendedObject3D), { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape });
                                (child as ExtendedObject3D).castShadow = Boolean(gameItems[key].castsShadow);
                                (child as ExtendedObject3D).receiveShadow = Boolean(gameItems[key].receiveShadow);

                                if (gameItems[key].bounciness) {
                                    (child as ExtendedObject3D).body.setBounciness(gameItems[key].bounciness)
                                }
                            } else {
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
            this.goal.body.on.collision((otherObject: ExtendedObject3D, e: CollisionEvent) => {
                if (otherObject.name.slice(0, 7) === "vehicle") {
                    this.goalCrossedCallback(otherObject)
                }
            })
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