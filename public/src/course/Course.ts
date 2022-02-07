/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Euler, Group, MeshStandardMaterial, Object3D, RGBAFormat, PointLight, Quaternion, Raycaster, Vector2, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { itemInArray, shuffleArray, substrArrayInString } from "../utils/utilFunctions";
import { IPositionRotation, IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import "./course.css";
import { CourseItemsLoader, notSeeThroughObjects } from "./CourseItemsLoader";
import { gameItems, keyNameMatch } from "./GameItems";
import { ICourse } from "./ICourse";
import { courseManager, setLoaderProgress } from "./loadingManager";




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

    lights: PointLight[]
    rotatingObjects: { speed: number, object: Object3D }[]
    clouds: Object3D[]
    originalCloudPos: Vector3[]

    /** if vehicle drives over this, its engine will turn off. */
    engineOffObjects: ExtendedObject3D[]

    /** if vehicle drives over this, it will break */
    breakBlocks: ExtendedObject3D[]

    courseItemsLoader: CourseItemsLoader

    vehicles: ExtendedObject3D[]
    wagons: ExtendedObject3D[]

    // objects that are currently see through
    seeThroughObjects: ExtendedObject3D[] = []

    // objects which we need to check for intersection and can become see through
    // if they are between the camera and the player
    possibleIntersectObjects: Object3D[] = []

    isReady: boolean
    cloudSpeed: number[]

    ray = new Raycaster()

    constructor(gameScene: GameScene, trackName: TrackName) {
        this.gameScene = gameScene
        this.trackName = trackName
        this.gamePhysicsObjects = []
        this.spawns = []
        this.spawnAligners = {}
        this.checkpointSpawns = []
        this.checkpoints = []
        this.lights = []
        this.rotatingObjects = []
        this.engineOffObjects = []
        this.breakBlocks = []
        this.vehicles = []
        this.wagons = []
        this.courseItemsLoader = new CourseItemsLoader(this)
        this.isReady = false
        this.clouds = []
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

        for (let light of this.lights) {
            light.castShadow = useShadows
            if (useShadows) {
                light.shadow.bias = 0.01
            }
        }
    }

    checkIfObjectOutOfBounds(pos: Vector3) {
        // no map yet goes so deep
        //  if (pos.y < 10) return true

        return false
    }

    async createCourse(): Promise<void> {

        const loader = new GLTFLoader(courseManager)
        return new Promise<void>(async (resolve, reject) => {

            loader.loadAsync(getStaticPath(`${this.trackName}.glb`), (e => {
                if (e.lengthComputable) {
                    const completed = e.loaded / e.total
                    setLoaderProgress(completed)
                }
            })).then(async (gltf: GLTF) => {
                this.gameScene.scene.add(gltf.scene)
                this.courseScene = gltf.scene

                this.courseItemsLoader.loadGameItemsToCourse(gltf)
                // do this check for neccisary items, such as ground, road, goals and checkpoints?
                if (!this.ground) {
                    console.warn("No ground added to course")
                }


                this.addParentCollision()
                this.filterAndOrderCheckpoints()
                await this._createCourse()


                this.createPossibleIntersectObjectArray()
                this.cloudSpeed = []
                for (let c of this.clouds) {
                    this.cloudSpeed.push((Math.random() * .5) + .2)
                }
                resolve()
            })
        })


    }

    createPossibleIntersectObjectArray() {

        const createArray = (group: Group) => {
            for (let child of group.children) {
                if (child.type === "Group") {
                    createArray(child as Group)
                }
                else if (child.type === "Mesh" && !child.name.includes("hidden") && !substrArrayInString(child.name, notSeeThroughObjects)) {
                    ((child as ExtendedObject3D).material) = ((child as ExtendedObject3D).material as MeshStandardMaterial).clone();
                    ((child as ExtendedObject3D).material as MeshStandardMaterial).format = RGBAFormat;
                    this.possibleIntersectObjects.push(child)
                }
            }
        }
        createArray(this.courseScene)

    }

    // for this parent class
    addParentCollision() {
        for (let engineOffObject of this.engineOffObjects) {
            engineOffObject.body.on.collision((otherObject, e) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    this.gameScene.vehicles[vehicleNumber].setCanDrive(false)
                    this.gameScene.vehicles[vehicleNumber].zeroEngineForce()

                }
            })
        }

        for (let breakBlock of this.breakBlocks) {
            breakBlock.body.on.collision((otherObject, e) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    this.gameScene.vehicles[vehicleNumber].setCanDrive(false)
                    this.gameScene.vehicles[vehicleNumber].zeroEngineForce()
                    this.gameScene.vehicles[vehicleNumber].break()
                }
            })
        }

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
        this.possibleIntersectObjects = []
        this.gameScene.scene.remove(this.courseScene)
        for (let obj of this.gamePhysicsObjects) {
            this.gameScene.destroy(obj)
        }
    }

    restartCourse() {
        this._restartCourse()
    }

    _restartCourse() {

    }

    calcSpawnAngle(_p2: Vector3, _p1: Vector3) {
        const p1 = _p1.clone()
        const p2 = _p2.clone()
        const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z)
        const q = new Quaternion().setFromEuler((new Euler(0, angle, 0, "XYZ")))
        return q
    }

    async timeout(sec: number = 5) {
        return new Promise<void>((res, rej) => {

            setTimeout(() => {
                res()
            }, sec * 1000)
        })
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

            let sortedSpawns = usableSpawns
            sortedSpawns.sort((a, b) => a.name < b.name ? -1 : 1)
            let spawnAligns: { spawn: Vector3, align: Vector3 }[] = []
            for (let i = 0; i < sortedSpawns.length; i++) {
                const alignKey = `align${i + 1}`
                if (alignKey in this.spawnAligners) {
                    aPos = this.spawnAligners[alignKey].position
                }
                spawnAligns.push({
                    spawn: sortedSpawns[i].position,
                    align: aPos
                })
            }
            /**
             * Make the spawns be in order (spawn1, spawn2, etc.)
             * and remove unwanted spawns
             * since if there are 2 players, they could start one in front of the other instead of side by side
             */

            spawnAligns = spawnAligns.slice(0, vehicles.length)
            shuffleArray(spawnAligns)

            // use predefined spawns


            for (let i = 0; i < vehicles.length; i++) {
                const p = spawnAligns[i].spawn
                const r = spawnAligns[i].spawn

                // this wont work if i randomize the spawns
                // need to create objects which have their own aligns
                // const alignKey = `align${i + 1}`
                // if (alignKey in this.spawnAligners) {
                //     aPos = this.spawnAligners[alignKey].position
                // }

                let aligner = spawnAligns[i].align ?? aPos

                if (aPos) {
                    vehicles[i].setCheckpointPositionRotation({ position: p, rotation: this.calcSpawnAngle(aligner, p) })
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

                // vehicles[i].canDrive = false

                const sI = Math.floor(Math.random() * possibleStartingPos.length)
                const sPos = possibleStartingPos[sI]
                possibleStartingPos.splice(sI, 1)

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

    removeTransparentObjects() {
        for (let obj of this.seeThroughObjects) {
            (obj.material as MeshStandardMaterial).transparent = false;
        }
        this.seeThroughObjects = [];
    }

    makeObjectTransparent(object: ExtendedObject3D) {

        const material = object.material as MeshStandardMaterial
        if (material.transparent) return

        (object.material as MeshStandardMaterial).transparent = true;
        (object.material as MeshStandardMaterial).opacity = 0.5;
        this.seeThroughObjects.push(object)
    }

    /**
     * make items between object and camera transparent
     */
    seeObject(cameraPos: Vector3, objectPos: Vector3) {
        this.removeTransparentObjects()
        this.ray.far = cameraPos.distanceTo(objectPos)
        this.ray.set(cameraPos.clone(), objectPos.clone())
        this.ray.ray.lookAt(objectPos.clone())

        const intersects = this.ray.intersectObjects(this.possibleIntersectObjects)
        for (let i = 0; i < intersects.length; i++) {
            this.makeObjectTransparent(intersects[i].object as ExtendedObject3D)
        }
    }


    updateCourse() {
        // not sure if this slows down stuff
        if (this.gameScene.gameSettings.graphics === "high") {
            for (let item of this.rotatingObjects) {
                item.object.rotateX(item.speed)
            }

            for (let i = 0; i < this.clouds.length; i++) {
                const cloud = this.clouds[i]
                cloud.position.setX(cloud.position.x + this.cloudSpeed[i])
                if (cloud.position.x > this.ground.position.x + this.ground.scale.x + 100) {
                    cloud.position.setX(-(this.ground.position.x + this.ground.scale.x + 100))
                    const sizeZ = this.ground.position.z + this.ground.scale.z
                    cloud.position.setZ((Math.random() * sizeZ * 2) - sizeZ)
                    cloud.rotateY(Math.random() * 180)
                }
            }
        }
        this._updateCourse()
    }
    _updateCourse() {

    }
}

