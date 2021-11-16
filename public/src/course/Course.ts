/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { GLTF, GLTFLoader, Group, LoadingManager } from "@enable3d/three-wrapper/dist";
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { Scene3D } from "enable3d";
import { TrackType } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { SimpleVector } from "../vehicles/IVehicle";
import { gameItems } from "./GameItems";
import { ICourse } from "./ICourse";

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

export class Course implements ICourse {
    scene: Scene3D
    trackName: TrackType
    ground: ExtendedObject3D


    startRotation: THREE.Euler
    startPosition: THREE.Vector3

    /** all of the objects with physics */
    gamePhysicsObjects: ExtendedObject3D[]


    courseScene: Group

    spawns: THREE.Object3D[]

    constructor(scene: Scene3D, trackName: TrackType,) {
        this.scene = scene
        this.trackName = trackName
        this.gamePhysicsObjects = []
        this.spawns = []
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

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return false
    }



    createCourse(useShadows: boolean, courseLoadedCallback: () => void) {

        const loader = new GLTFLoader(manager)

        loader.load(getStaticPath(`models/${this.trackName}.gltf`), (gltf: GLTF) => {
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
                            child.visible = !Boolean(gameItems[key].notVisible);
                            if (!child.name.includes("ghost") && !Boolean(gameItems[key].notAddPhysics)) {
                                const eObject = (child as ExtendedObject3D)
                                this.scene.physics.add.existing(eObject, { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape, mass: gameItems[key].mass, });
                                eObject.castShadow = useShadows && Boolean(gameItems[key].castsShadow);
                                eObject.receiveShadow = useShadows && Boolean(gameItems[key].receiveShadow);
                                //  eObject.visible = !Boolean(gameItems[key].notVisible);
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
                            if (child.name.includes("water")) {
                                console.log("water", child)
                                const waterObject = child
                                const texturesPromise = Promise.all([
                                    this.scene.load.texture('/textures/Water_1_M_Normal.jpg'),
                                    this.scene.load.texture('/textures/Water_2_M_Normal.jpg')
                                ])
                                texturesPromise.then(textures => {
                                    textures[0].needsUpdate = true
                                    textures[1].needsUpdate = true

                                    console.log("texutres", textures)

                                    waterObject.visible = false
                                    console.log("waterObject.scale", waterObject.scale)
                                    this.scene.misc.water({
                                        y: waterObject.position.y,
                                        x: waterObject.position.x,
                                        z: waterObject.position.z,

                                        width: waterObject.scale.z * 2,
                                        height: waterObject.scale.x * 2,
                                        normalMap0: textures[0],
                                        normalMap1: textures[1]
                                    })
                                })
                            }


                            if (gameItems[key].isCourseObject || gameItems[key].isCourseObjectArray) {
                                // hacky ????
                                if (!gameItems[key].objectName) {
                                    console.warn(`Object with key '${key}' is course object but doesn't have an object name`)
                                }

                                if (gameItems[key].isCourseObjectArray) {
                                    const code = `this.${gameItems[key].objectName}.push(child)`
                                    eval(code)
                                } else {
                                    const code = `this.${gameItems[key].objectName} = child`
                                    eval(code)

                                }
                            }
                            // child.visible = false
                        }
                    }
                    if (child.name.includes("spawn")) {
                        this.spawns.push(child)
                        child.visible = false
                    }
                }
            }
            this._createCourse()
            courseLoadedCallback()
        })
    }

    /** for child to override */
    _createCourse() {

    }

    clearCourse() {
        this.scene.scene.remove(this.courseScene)
        for (let obj of this.gamePhysicsObjects) {
            this.scene.physics.destroy(obj)
        }
    }

    updateCourse() { }
}