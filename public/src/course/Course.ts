/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Euler, Group, Object3D, PointLight, Quaternion, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GameScene } from "../game/GameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { shuffleArray } from "../utils/utilFunctions";
import { IPositionRotation, IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import "./course.css";
import { CourseItemsLoader } from "./CoursetemsLoader";
import { gameItems, keyNameMatch } from "./GameItems";
import { ICourse } from "./ICourse";
import { courseManager } from "./loadingManager";


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

    /** if vehicle drives over this, its engine will turn off. */
    engineOffObjects: ExtendedObject3D[]

    /** if vehicle drives over this, it will break */
    breakBlocks: ExtendedObject3D[]

    courseItemsLoader: CourseItemsLoader

    vehicles: ExtendedObject3D[]
    wagons: ExtendedObject3D[]

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

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return false
    }

    async createCourse(): Promise<void> {

        const loader = new GLTFLoader(courseManager)
        const promise = new Promise<void>(async (resolve, reject) => {

            await loader.loadAsync(getStaticPath(`models/${this.trackName}.glb`)).then(async (gltf: GLTF) => {
                this.gameScene.scene.add(gltf.scene)
                this.courseScene = gltf.scene

                this.courseItemsLoader.loadGameItemsToCourse(gltf)


                this.addParentCollision()
                this.filterAndOrderCheckpoints()
                await this._createCourse()

                resolve()
            })
        })

        return promise
    }


    // for this parent class
    addParentCollision() {
        for (let engineOffObject of this.engineOffObjects) {
            engineOffObject.body.on.collision((otherObject, e) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    this.gameScene.vehicles[vehicleNumber].canDrive = false
                    this.gameScene.vehicles[vehicleNumber].zeroEngineForce()

                }
            })
        }

        for (let breakBlock of this.breakBlocks) {
            breakBlock.body.on.collision((otherObject, e) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    this.gameScene.vehicles[vehicleNumber].canDrive = false
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
            let sortedSpawns = usableSpawns
            sortedSpawns.sort((a, b) => a.name < b.name ? -1 : 1)
            /**
             * Make the spawns be in order (spawn1, spawn2, etc.)
             * and remove unwanted spawns
             * since if there are 2 players, they could start one in front of the other instead of side by side
             */

            sortedSpawns = sortedSpawns.slice(0, vehicles.length)
            shuffleArray(sortedSpawns)

            // use predefined spawns


            for (let i = 0; i < vehicles.length; i++) {
                const p = sortedSpawns[i].position
                const r = sortedSpawns[i].rotation

                // this wont work if i randomize the spawns
                // need to create objects which have their own aligns
                const alignKey = `align${i + 1}`
                if (alignKey in this.spawnAligners) {
                    aPos = this.spawnAligners[alignKey].position
                }

                if (aPos) {
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



    updateCourse() {
        // not sure if this slows down stuff
        if (this.gameScene.gameSettings.graphics === "high") {
            for (let item of this.rotatingObjects) {
                item.object.rotateX(item.speed)
            }
        }
        this._updateCourse()
    }

    _updateCourse() {

    }
}