/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Quaternion, Group, LoadingManager, Object3D, Vector3, Euler, PointLight } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { getDeviceType, getStaticPath } from "../utils/settings";
import { IPositionRotation, IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { gameItems } from "./GameItems";
import { ICourse } from "./ICourse";
import "./course.css"
import { radToDeg } from "../utils/utilFunctions";
import { yellow2 } from "../providers/theme";

const loadImage = document.createElement("img")

loadImage.src = "https://imgur.com/rpPch3m.jpg"
loadImage.setAttribute("id", "load-image")
loadImage.classList.add("hide")

document.body.appendChild(loadImage)

const loadDiv = document.createElement("div")
loadDiv.setAttribute("id", "load-screen")
loadDiv.setAttribute("class", "game-text")
loadDiv.setAttribute("style", "z-index:999;")
document.body.appendChild(loadDiv)

const manager = new LoadingManager()

let dotTimeout: NodeJS.Timeout

let numDots = 0

let waterTextures: [THREE.Texture, THREE.Texture] | undefined

const loadingScreenTips = ["Lock the orientation of your mobile phone.", "The leader can change tracks, using the settings on the mobile.", "The leader can restart a game from the mobile."]
let tipIndex = Math.floor(Math.random() * loadingScreenTips.length)

const setLoadingDivText = async (text: string) => {
    window.clearTimeout(dotTimeout)
    loadImage.classList.remove("hide")



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



const clearLoadingDivText = () => {
    loadImage.classList.add("hide")
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

    sAlign: Object3D

    spawnAligners: { [key: string]: Object3D }

    checkpoints: ExtendedObject3D[]
    checkpointSpawns: ExtendedObject3D[]




    constructor(gameScene: GameScene, trackName: TrackName,) {
        this.gameScene = gameScene
        this.trackName = trackName
        this.gamePhysicsObjects = []
        this.spawns = []
        this.spawnAligners = {}
        this.checkpointSpawns = []
        this.checkpoints = []
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



    async createCourse(useShadows: boolean): Promise<void> {

        const loader = new GLTFLoader(manager)
        const promise = new Promise<void>(async (resolve, reject) => {

            await loader.loadAsync(getStaticPath(`models/${this.trackName}.gltf`)).then(async (gltf: GLTF) => {
                this.gameScene.scene.add(gltf.scene)
                this.courseScene = gltf.scene

                const itemKeys = Object.keys(gameItems)


                /* items named hidden-X in blender, will have physics but will be invisible
                *  items named ghost-X in blender won't have physics but will be visible
                *  using this we have have complex multi poly sturctures that are difficult to render like fences or tree
                *  but then render a box in their place for the physics
                */
                for (let child of gltf.scene.children) {
                    if (child.name.includes("light")) {
                        child.visible = false
                        if (this.gameScene.gameSettings.graphics === "high" && !child.name.includes("ghost")) {


                            let sDistance = child.name.split("_")[0]
                            let distance = 100
                            if (!isNaN(+sDistance)) {
                                distance = +sDistance
                            }

                            const pLight = new PointLight(yellow2, 1, distance, 1)

                            const p = child.position
                            pLight.position.set(p.x, p.y, p.z)
                            if (this.gameScene.useShadows) {
                                pLight.castShadow = true
                                pLight.shadow.bias = 0.01
                            }
                            this.gameScene.add.existing(pLight)
                        }
                    } else if (child.type === "Mesh" || child.type === "Group") {
                        if (child.name.includes("ghost")) {

                        }
                        else {

                            for (let key of itemKeys) {

                                if (keyNameMatch(key, child.name)) {
                                    child.visible = !Boolean(gameItems[key].notVisible);
                                    if (!Boolean(gameItems[key].notAddPhysics)) {
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
                                    }
                                    if (child.name.includes("water")) {
                                        if (this.gameScene.gameSettings.graphics === "high") {
                                            const waterObject = child
                                            if (!waterTextures) {

                                                const texturesPromise = Promise.all([
                                                    this.gameScene.load.texture('/textures/Water_1_M_Normal.jpg'),
                                                    this.gameScene.load.texture('/textures/Water_2_M_Normal.jpg')
                                                ])
                                                texturesPromise.then(textures => {
                                                    textures[0].needsUpdate = true
                                                    textures[1].needsUpdate = true
                                                    waterTextures = textures

                                                    waterObject.visible = false
                                                    this.gameScene.misc.water({
                                                        y: waterObject.position.y,
                                                        x: waterObject.position.x,
                                                        z: waterObject.position.z,


                                                        width: waterObject.scale.x * 2,
                                                        height: waterObject.scale.z * 2,
                                                        normalMap0: textures[0],
                                                        normalMap1: textures[1]
                                                    })


                                                }).catch(err => {
                                                    console.warn("Error loading water texture", err)
                                                })
                                            } else {
                                                waterObject.visible = false
                                                this.gameScene.misc.water({
                                                    y: waterObject.position.y,
                                                    x: waterObject.position.x,
                                                    z: waterObject.position.z,


                                                    width: waterObject.scale.z * 2,
                                                    height: waterObject.scale.x * 2,
                                                    normalMap0: waterTextures[0],
                                                    normalMap1: waterTextures[1],
                                                })
                                            }
                                        } else {
                                            // simply add the water with no physics
                                        }
                                    }


                                    if (gameItems[key].isCourseObject || gameItems[key].isCourseObjectArray || gameItems[key].isCourseObjectDict) {
                                        // hacky ????
                                        if (!gameItems[key].objectName) {
                                            console.warn(`Object with key '${key}' is course object but doesn't have an object name`)
                                        }
                                        if (gameItems[key].isCourseObjectArray) {
                                            const code = `this.${gameItems[key].objectName}.push(child)`
                                            eval(code)
                                        } else if (gameItems[key].isCourseObjectDict) {
                                            const code = `this.${gameItems[key].objectName}["${child.name}"] = child`
                                            eval(code)
                                        } else {
                                            const code = `this.${gameItems[key].objectName} = child`
                                            eval(code)

                                        }
                                    }
                                    // child.visible = false
                                }
                            }
                            if (child.name.includes("spawn") && !child.name.includes("align")) {
                                this.spawns.push(child)
                                child.visible = false
                            }
                        }
                    }
                }
                this.filterAndOrderCheckpoints()
                await this._createCourse()


                resolve()
            })
        })



        return promise
    }



    filterAndOrderCheckpoints() {

        const tempCheckpoints = []
        for (let p of this.checkpoints) {
            if (!p.name.includes("spawn") && !p.name.includes("align")) {
                tempCheckpoints.push(p)
            }

            this.checkpoints = tempCheckpoints

            /**
             * make sure
             * checkpoint 1 and spawn 1 have same index
             */
            this.checkpointSpawns.sort((a, b) => {
                if (a.name > b.name) return 1
                return -1
            })
            this.checkpoints.sort((a, b) => {
                if (a.name > b.name) return 1
                return -1
            })
        }
    }

    /** for child to override */
    async _createCourse() {

    }

    clearCourse() {
        this.gameScene.scene.remove(this.courseScene)
        for (let obj of this.gamePhysicsObjects) {
            this.gameScene.destroy(obj)

        }
    }

    calcSpawnAngle(_p2: Vector3, _p1: Vector3) {
        const p1 = _p1.clone()
        const p2 = _p2.clone()


        const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z)

        const q = new Quaternion().setFromEuler((new Euler(0, angle, 0, "XYZ")))

        return q
    }

    setStartPositions(vehicles: IVehicle[]) {

        // align position
        let aPos: Vector3
        if (this.sAlign) {

            aPos = this.sAlign.position
        } else if ("goal-align" in this.spawnAligners) {
            aPos = this.spawnAligners["goal-align"].position
        }

        let usableSpawns = this.spawns.filter(s => !s.name.includes("checkpoint-spawn") && s.name !== "goal-spawn" && !s.name.includes("align"))

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

            for (let i = 0; i < vehicles.length; i++) {
                const p = sortedSpawns[i].position
                const r = sortedSpawns[i].rotation

                const angle = aPos ? this.calcSpawnAngle(aPos, p) : r.y


                if (aPos) {
                    // vehicles[i].setPosition(p.x, p.y, p.z)
                    // vehicles[i].setRotation(this.calcSpawnAngle(aPos, p))
                    vehicles[i].setCheckpointPositionRotation({ position: p, rotation: this.calcSpawnAngle(aPos, p) })

                } else {


                    vehicles[i].setCheckpointPositionRotation({ position: p, rotation: { x: 0, z: 0, y: r.y } })
                }
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
                const angle = aPos ? this.calcSpawnAngle(aPos, sPos) : r.y


                if (aPos) {


                    vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: this.calcSpawnAngle(aPos, sPos) })


                } else {

                    vehicles[i].setCheckpointPositionRotation({ position: sPos, rotation: { x: 0, y: r.y, z: 0 } })
                }
                vehicles[i].resetPosition()
                vehicles[i].stop()
            }
        }
    }

    getCheckpointPositionRotation(checkpointNumber: number): IPositionRotation {


        const p = this.checkpointSpawns[checkpointNumber - 1].position
        const key = `checkpoint-align${checkpointNumber}`

        if (key in this.spawnAligners) {
            const aPos = this.spawnAligners[key].position

            return { position: p, rotation: this.calcSpawnAngle(aPos, p) }
        }

        const r = this.checkpointSpawns[checkpointNumber - 1].rotation

        return { position: p, rotation: r }
    }



    updateCourse() { }
}