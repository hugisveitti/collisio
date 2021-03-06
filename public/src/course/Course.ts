/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Euler, Group, MeshStandardMaterial, Object3D, PointLight, Quaternion, Raycaster, RGBAFormat, Vector3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MyScene } from "../game/MyScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { getStaticPath } from "../utils/settings";
import { shuffleArray, substrArrayInString } from "../utils/utilFunctions";
import { IPositionRotation, IVehicle } from "../vehicles/IVehicle";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import "./course.css";
import { CourseItemsLoader, loadPowerbox, notSeeThroughObjects } from "./CourseItemsLoader";
import { gameItems, keyNameMatch } from "./GameItems";
import { ICourse } from "./ICourse";
import { courseManager, setLoaderProgress } from "./loadingManager";
import { PowerupBox } from "./PowerupBox";




export class Course implements ICourse {
    gameScene: MyScene
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
    asteroids: ExtendedObject3D[]
    asteroidsOriginalPosition: Vector3[]

    ray = new Raycaster()
    botDirections: Object3D[]
    powerBoxes: PowerupBox[]

    constructor(gameScene: MyScene, trackName: TrackName) {
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
        this.botDirections = []
        this.asteroids = []
        this.asteroidsOriginalPosition = []
        this.powerBoxes = []
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

        for (let box of this.powerBoxes) {
            box.toggleShadow(useShadows)
        }
    }

    setToSpawnPostion(spawnPosition: number, vehicle: IVehicle) {
        let usableSpawns = this.spawns.filter(s => !s.name.includes("checkpoint-spawn") && s.name !== "goal-spawn" && !s.name.includes("align"))

        let aPos: Vector3
        if (this.sAlign) {
            aPos = this.sAlign.position
        } else if ("goal-align" in this.spawnAligners) {
            aPos = this.spawnAligners["goal-align"].position
        }

        let sortedSpawns = usableSpawns
        sortedSpawns.sort((a, b) => a.name < b.name ? -1 : 1)
        let spawnAligns: { spawn: Vector3, align: Vector3 }[] = []
        for (let i = 0; i < sortedSpawns.length; i++) {
            const alignKey = `align${i + 1}`
            spawnAligns.push({
                spawn: sortedSpawns[i].position,
                align: this.spawnAligners[alignKey]?.position ?? aPos.clone()
            })
        }

        let position: Vector3
        let rotation: Quaternion
        if (spawnPosition > usableSpawns.length - 1) {
            // need to find the largest spawn number it can use
            // e.g. if there are 2 usable spawns and spawnPosition is 3 (index 2) then we find spawn 1 
            // and the position will be behind spawn 1 relative to the aligner, plus offset
            let usableSpawnIndex = usableSpawns.length === 1 ? 0 : usableSpawns.length - 2 + (spawnPosition % 2)
            if (usableSpawnIndex < 0 || usableSpawnIndex > usableSpawns.length) {
                console.warn("Usable spawn index wrong, usableSpawnIndex", usableSpawnIndex, ", number of spawns", usableSpawns.length)
                usableSpawnIndex = 0
            }
            const usablePosition = spawnAligns[usableSpawnIndex].spawn
            let aligner = spawnAligns[usableSpawnIndex].align
            rotation = this.calcSpawnAngle(aligner, usablePosition)
            const alpha = 2 * Math.asin(rotation.y)
            const offSet = Math.floor(spawnPosition / 2 - 1) + 1
            const offSetLength = 13
            position = new Vector3(0, 0, 0)
            position.set(
                usablePosition.x - ((Math.sin(alpha) * (offSet * offSetLength)) * Math.sign(rotation.w)),
                usablePosition.y,
                usablePosition.z - ((Math.cos(alpha) * (offSet * offSetLength)))
            )
        } else {
            position = spawnAligns[spawnPosition].spawn
            let aligner = spawnAligns[spawnPosition].align
            rotation = this.calcSpawnAngle(aligner, position)
        }




        vehicle.setCheckpointPositionRotation({ position, rotation });
        vehicle.resetPosition();
        vehicle.stop();
    }

    checkIfObjectOutOfBounds(pos: Vector3) {
        // no map yet goes so deep
        //  if (pos.y < 10) return true

        return false
    }



    async createPowerBoxes() {
        return new Promise<void>(async (resolve, reject) => {
            if (!this.gameScene.roomSettings.usePowerups) {
                resolve()
                return
            }
            this.powerBoxes = []
            const boxObj = await loadPowerbox()

            // place powerup every 5 bot dir?
            for (let i = 2; i < this.botDirections.length; i = i + 7) {

                this.powerBoxes.push(new PowerupBox(this.botDirections[i].position.clone(), boxObj.clone(), this.gameScene))

                if (i + 1 < this.botDirections.length - 1) {

                    const q = this.calcSpawnAngle(this.botDirections[i].position, this.botDirections[i + 1].position)
                    const alpha = 2 * Math.asin(q.y)
                    const offSet = 10
                    const nextToPos = new Vector3(
                        this.botDirections[i].position.x - ((Math.sin(alpha + Math.PI / 2) * (offSet)) * Math.sign(q.w)),
                        this.botDirections[i].position.y,
                        this.botDirections[i].position.z - ((Math.cos(alpha + Math.PI / 2) * (offSet)))
                    )
                    this.powerBoxes.push(new PowerupBox(nextToPos, boxObj.clone(), this.gameScene))
                }
            }
            resolve()
        })
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
                for (let key of Object.keys(this.spawnAligners)) {
                    if ((this.spawnAligners[key] as ExtendedObject3D).body) {
                        this.gameScene.physics.destroy(this.spawnAligners[key] as ExtendedObject3D)
                    }
                }
                for (let spawn of this.spawns) {
                    if ((spawn as ExtendedObject3D).body) {
                        this.gameScene.physics.destroy(spawn as ExtendedObject3D)
                    }
                }

                for (let ast of this.asteroids) {
                    this.asteroidsOriginalPosition.push(ast.position.clone())
                }
                this.botDirections.sort((a, b) => +a.name.split("-")[1] > +b.name.split("-")[1] ? 1 : -1)

                await this.createPowerBoxes()

                resolve()
            })
        })
    }

    /**
     * 
     * @param currentDirNum, we have reached a dir with this num, also applies for first dir, then we input 0 
     * @returns pos, nextNum, goSlow
     * goSlow is true for corners and such
     */
    nextBotDir(currentDirNum: number) {
        if (this.botDirections.length === 0) {
            console.warn("No bot directions")
            return undefined
        }

        const getNextDir = (num: number) => {

            let nextDirNum = num + 1
            // names are like dir-1, dir-2, dir-3-slow,
            // indexed at 1
            if (nextDirNum > this.botDirections.length) {
                nextDirNum = 1
            }

            for (let dir of this.botDirections) {
                const dNameSplit = dir.name.split("-")
                const dirNum = +dNameSplit[1]
                let goSlow = false as boolean | number
                if (dNameSplit.length > 2 && dNameSplit[2] === "slow") {
                    goSlow = true
                    if (dNameSplit.length > 3) {
                        goSlow = +dNameSplit[3] / 100
                    }
                }
                if (dirNum === nextDirNum) {
                    return {
                        pos: dir.position,
                        nextNum: dirNum,
                        goSlow
                    }
                }
            }
            return undefined
        }

        const { pos, nextNum, goSlow } = getNextDir(currentDirNum)
        if (pos) {

            const { pos: nextPos, nextNum: nextNextNum } = getNextDir(nextNum)

            return { pos, nextNextNum, goSlow, nextPos, nextNum }
        }

        return undefined
    }

    findClosestDir(pos: Vector3) {
        let closestIdx = -1
        let closestDist = Infinity
        for (let i = 0; i < this.botDirections.length; i++) {
            const dist = pos.distanceTo(this.botDirections[i].position)
            if (dist < closestDist) {
                closestIdx = i
                closestDist = dist
            }
        }
        console.log("closest dist", closestDist)
        return closestIdx
    }

    needsNewPosRot(vehicle: IVehicle) {
        const idx = this.findClosestDir(vehicle.vehicleBody.position)
        const nextIdx = idx === this.botDirections.length - 1 ? 0 : idx + 1
        console.log("idx", idx, "next idx:", nextIdx)

        const rotation = this.calcSpawnAngle(this.botDirections[nextIdx].position, this.botDirections[idx].position)
        const position = this.botDirections[idx].position
        vehicle.setCheckpointPositionRotation({ position, rotation })
        vehicle.resetPosition()
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
                    const vehicles = this.gameScene.getVehicles()
                    vehicles[vehicleNumber].setCanDrive(false)
                    vehicles[vehicleNumber].zeroEngineForce()

                }
            })
        }

        for (let breakBlock of this.breakBlocks) {
            breakBlock.body.on.collision((otherObject, e) => {
                if (isVehicle(otherObject)) {
                    const vehicleNumber = getVehicleNumber(otherObject.name)
                    const vehicles = this.gameScene.getVehicles()
                    vehicles[vehicleNumber].setCanDrive(false)
                    vehicles[vehicleNumber].zeroEngineForce()
                    vehicles[vehicleNumber].break()
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

        for (let box of this.powerBoxes) {
            box.destroy()
        }
    }

    restartCourse() {

        const info = gameItems["asteroid"]
        for (let i = 0; i < this.asteroids.length; i++) {

            this.gameScene.physics.destroy(this.asteroids[i].body)
            this.asteroids[i].position.set(this.asteroidsOriginalPosition[i].x, this.asteroidsOriginalPosition[i].y, this.asteroidsOriginalPosition[i].z)
            this.gameScene.physics.add.existing(this.asteroids[i], { mass: CourseItemsLoader.GetMassFromName(this.asteroids[i].name) ?? info.mass, collisionFlags: 0, shape: info.shape })
            this.asteroids[i].body.setBounciness(info.bounciness)
            this.asteroids[i].body.setGravity(0, info.gravityY, 0)
        }

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

                spawnAligns.push({
                    spawn: sortedSpawns[i].position,
                    align: this.spawnAligners[alignKey]?.position ?? aPos.clone()
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

        for (let box of this.powerBoxes) {
            box.update()
        }

        this._updateCourse()
    }
    _updateCourse() {

    }
}

