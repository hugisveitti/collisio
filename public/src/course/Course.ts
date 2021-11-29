/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Group, LoadingManager, Object3D, Vector3, Euler } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { gameItems } from "./GameItems";
import { ICourse } from "./ICourse";

const loadDiv = document.createElement("div")
loadDiv.setAttribute("id", "load-screen")
loadDiv.setAttribute("class", "game-text")
document.body.appendChild(loadDiv)

const manager = new LoadingManager()

let dotTimeout: NodeJS.Timeout

let numDots = 0

const loadingScreenTips = ["Lock the orientation of your mobile phone."]
let tipIndex = Math.floor(Math.random() * loadingScreenTips.length)

const setLoadingDivText = async (text: string) => {
    window.clearTimeout(dotTimeout)




    const createText = () => {

        let dotText = text + "<br>" + `Pro tip: ${loadingScreenTips[tipIndex]}` + "<br>"

        for (let i = 0; i < numDots; i++) {
            dotText += "."

        }

        loadDiv.innerHTML = dotText

        dotTimeout = setTimeout(async () => {
            numDots += 1
            if (numDots === 4) {
                numDots = 1
            }
            createText()
        }, 350)
    }
    createText()
}

// setTimeout(() => {

//     setLoadingDivText("hello")
// }, 100)

const clearLoadingDivText = () => {
    loadDiv.innerHTML = ""
    window.clearTimeout(dotTimeout)
}


manager.onStart = (url: string, loaded: number, itemsTotal: number) => {

    setLoadingDivText("Started loading files " + loaded + " / " + itemsTotal)
}


manager.onProgress = (url: string, loaded: number, itemsTotal: number) => {
    setLoadingDivText("Loading files " + loaded + " / " + itemsTotal)
}

manager.onLoad = () => {
    clearLoadingDivText()
}

const keyNameMatch = (key: string, name: string) => {
    if (gameItems[key].exactMatch) {
        return key === name
    }
    return name.includes(key)
}

export class Course implements ICourse {
    gameScene: GameScene
    trackName: TrackName
    ground: ExtendedObject3D


    startRotation: Euler
    startPosition: Vector3

    /** all of the objects with physics */
    gamePhysicsObjects: ExtendedObject3D[]


    courseScene: Group

    spawns: Object3D[]

    constructor(gameScene: GameScene, trackName: TrackName,) {
        this.gameScene = gameScene
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
            this.gameScene.scene.add(gltf.scene)
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
                                this.gameScene.physics.add.existing(eObject, { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape, mass: gameItems[key].mass, });
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
                                const waterObject = child
                                const texturesPromise = Promise.all([
                                    this.gameScene.load.texture('/textures/Water_1_M_Normal.jpg'),
                                    this.gameScene.load.texture('/textures/Water_2_M_Normal.jpg')
                                ])
                                texturesPromise.then(textures => {
                                    textures[0].needsUpdate = true
                                    textures[1].needsUpdate = true


                                    waterObject.visible = false
                                    this.gameScene.misc.water({
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
                                    console.log("key", key)
                                    console.log("${gameItems[key].objectName}", `${gameItems[key].objectName}`)
                                    console.log("code", code)
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
        this.gameScene.scene.remove(this.courseScene)
        for (let obj of this.gamePhysicsObjects) {
            this.gameScene.destroy(obj)

        }
    }

    setStartPositions(vehicles: IVehicle[]) {

        let usableSpawns = this.spawns.filter(s => !s.name.includes("checkpoint-spawn") && s.name !== "goal-spawn")
        console.log("useable", usableSpawns)
        if (usableSpawns.length >= vehicles.length) {
            // const sortedSpawns = new Array(usableSpawns.length)
            // for (let spawn of usableSpawns) {
            //     const idx = +spawn.name.slice(5, 6)
            //     sortedSpawns[idx - 1] = spawn
            // }
            const sortedSpawns = usableSpawns
            sortedSpawns.sort((a, b) => a.name > b.name ? -1 : 1)
            /**
             * Make the spawns be in order (spawn1, spawn2, etc.)
             * and remove unwanted spawns
             * since if there are 2 players, they could start one in front of the other instead of side by side
             */
            //  shuffleArray(sortedSpawns)

            // use predefined spawns
            console.log(" sortedSpawns", sortedSpawns)
            for (let i = 0; i < vehicles.length; i++) {
                const p = sortedSpawns[i].position
                const r = sortedSpawns[i].rotation

                vehicles[i].setCheckpointPositionRotation({ position: p, rotation: { x: 0, z: 0, y: r.y } })
                vehicles[i].resetPosition()
                vehicles[i].stop()
            }
        } else {


            const p = this.startPosition
            const r = this.startRotation

            const courseY = this.startPosition?.y ?? 2
            let possibleStartingPos = []
            let offset = 1
            for (let i = 0; i < vehicles.length; i++) {

                offset *= -1

                if (i % 2 !== 0) {
                    offset += (Math.sign(offset) * 5)
                }

                possibleStartingPos.push({ x: p.x + offset - 5, y: courseY, z: p.z + offset - 5 })
            }


            for (let i = 0; i < vehicles.length; i++) {

                vehicles[i].canDrive = false

                const sI = Math.floor(Math.random() * possibleStartingPos.length)
                const sPos = possibleStartingPos[sI]
                possibleStartingPos.splice(sI, 1)

                vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: { x: 0, y: r.y, z: 0 } })
                vehicles[i].resetPosition()
                vehicles[i].stop()
            }
        }
    }

    updateCourse() { }
}