import { ExtendedObject3D } from "enable3d";
import { Audio, Color, Euler, Quaternion, Vector3 } from "three";
import { EndlessRunnerScene } from "../game/EndlessRunnerScene";
import { getBeep } from "../sounds/gameSounds";
import { numberScaler } from "../utils/utilFunctions";
import { IVehicle, SimpleVector } from "../vehicles/IVehicle";
import { isVehicle } from "../vehicles/LowPolyVehicle";
import { ICourse } from "./ICourse";

const tileZ = 30;
const tileX = 50;
const tileWidthScaler = numberScaler(tileX, tileX * .25, 0, 200, 3)

let pruneDistance = tileZ * 6.5

class BouncingObsticle {

    model: ExtendedObject3D
    course: EndlessRunnerCourse
    sound: Audio


    constructor(course: EndlessRunnerCourse, pos: Vector3, idx: number) {
        this.course = course

        this.model = this.course.gameScene.add.sphere({ x: pos.x, y: pos.y, z: pos.z, radius: 2 }, { lambert: { color: 0xff511a } })
        this.model.castShadow = true
        this.course.gameScene.physics.add.existing(this.model, { mass: 3, collisionFlags: 0 })
        this.model.name = "ball_" + idx
        //  this.model.body.applyForceX(1)
        this.model.body.setBounciness(.95)
        this.model.body.setGravity(0, -40, 0)
        this.model.body.applyForceZ(-80)
        this.loadSound()
        this.model.body.on.collision((other, ev) => {
            if (isVehicle(other)) {
                this.destroy()
                this.course.gameScene.vehicleHitBouncingObsticle(other.name)
                this.sound?.play()
                this.course.gameScene.addPowerupColor(0, "bad")
                this.course.deleteBall(this)
            }
        })
    }

    loadSound() {
        getBeep("/sound/powerup-bad.ogg", this.course.gameScene.listener, (sound) => {
            sound.setVolume(0.1)
            this.sound = sound
        })
    }

    destroy() {
        this.course.gameScene.physics.physicsWorld.removeCollisionObject(this.model.body.ammo)
    }

    update() {
        // check if need delete
        if (this.model.position.y < -5) {
            this.course.deleteBall(this)
        }
    }
}

class Collectable {

    course: EndlessRunnerCourse
    model: ExtendedObject3D

    r: number = 0
    dr: number = 0.02
    sound: Audio

    constructor(course: EndlessRunnerCourse, startPos: Vector3, idx: number) {
        this.course = course
        const { x, y, z } = startPos

        this.model = this.course.gameScene.add.box({ height: 4, width: 2, depth: .5, x, y: 3, z }, { lambert: { color: 0x222222 } })
        this.model.castShadow = true
        this.model.name = "collectable_" + idx

        this.course.gameScene.physics.add.existing(this.model, { mass: 0, collisionFlags: 5 })
        this.model.rotateY(Math.random())
        this.model.body.needUpdate = true
        this.loadSound()

        this.model.body.on.collision((other, ev) => {
            if (isVehicle(other)) {
                this.course.gameScene.vehicleHitCollectible(other.name)
                this.sound?.play()
                this.course.deleteCollectable(this)
                this.course.gameScene.addPowerupColor(0, "good")
                setTimeout(() => {
                    this.course.gameScene.removePowerupColor(0)
                }, 250)
            }
        })
    }

    destroy() {
        this.course.gameScene.physics.physicsWorld.removeCollisionObject(this.model.body.ammo)
    }
    loadSound() {
        getBeep("/sound/powerup-good.ogg", this.course.gameScene.listener, (sound) => {
            sound.setVolume(0.1)
            this.sound = sound
        })
    }

    update(vehiclePos: Vector3) {
        if (this.model.position.distanceTo(vehiclePos) > pruneDistance) {
            this.course.deleteCollectable(this)
        }
        this.model.rotateY(this.dr)

    }
}


// number of tiles we render ahead
const tileRenderDistance = 4
export class EndlessRunnerCourse implements ICourse {

    gameScene: EndlessRunnerScene
    ground: ExtendedObject3D;
    startPosition: Vector3;
    startRotation: Euler;
    //  tileColor: number[] = [45, 40, 40]
    tileColor: Color = new Color(.2, .2, .2)
    colIdx: number = 0
    colDx: number = 0.05
    isAddingTile: boolean = false

    balls: BouncingObsticle[]
    ballsNum: number = 0
    collectables: Collectable[]
    collectablesNum: number = 0

    xOffset: number = 0

    tiles: {
        i: number,
        j: number,
        obj: ExtendedObject3D
    }[];

    constructor(scene: EndlessRunnerScene) {
        this.gameScene = scene
        this.startPosition = new Vector3(0, 1, 0)
        this.startRotation = new Euler(0, 0, 0)
        this.tiles = []
        this.balls = []
        this.collectables = []

    }

    checkIfObjectOutOfBounds(pos: SimpleVector) {
        return pos.y < -10
    };
    toggleShadows(useShadows: boolean) {

    };

    pruneTiles(pos: Vector3) {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].obj.position.distanceTo(pos) > pruneDistance) {
                this.gameScene.destroy(this.tiles[i].obj)
                this.tiles.splice(i, 1)
            }
        }
    }

    addTile(i: number, j: number = 0, notRecures: boolean = false) {

        for (let tile of this.tiles) {
            if (tile.i === i) {
                return
            }
        }
        if (this.isAddingTile) {
            return
        }

        this.isAddingTile = true


        const z = i * tileZ

        let width = tileWidthScaler(i)
        let x = j * width
        // width = tileX
        //   x = (Math.random() * width / 4) - width / 8

        if (i > 4) {
            if (i < 50 || i % 5 === 0) {
                // when the player get far, then fewer balls
                this.addBall(x, z, width)
            }
            this.addCollectable(x, z, width)
        }

        width = Math.max(width, tileX * .1)
        this.gameScene.newTilePoints()
        const tile = this.gameScene.add.box({ width, height: 1, depth: tileZ }, { lambert: { color: this.tileColor } });

        // we drive along the Z axis
        tile.position.setZ(z)
        tile.position.setX(x)
        this.gameScene.physics.add.existing(tile, { mass: 0, collisionFlags: 1 })
        tile.receiveShadow = true
        tile.body.setBounciness(0.5)
        this.tiles.push({
            obj: tile,
            i,
            j
        })
        this.updateColor()

        // if (Math.random() < .1) {
        if (i > 10 && i % 4 === 0 && !notRecures) {
            this.xOffset += .5 * Math.sign(Math.random() - .5)
            this.addTile(i + 1, this.xOffset, true)
        }
        this.isAddingTile = false
    }



    addBall(x: number, z: number, offset: number) {
        const y = (Math.random() * 5) + 8

        x = x + (Math.random() * offset) - (offset / 2)
        z = z + (Math.random() * offset) - (offset / 2) + 12
        const ball = new BouncingObsticle(this, new Vector3(x, y, z), this.ballsNum)
        this.ballsNum += 1
        this.balls.push(ball)
    }

    createCourse() {
        return new Promise<void>((resolve, reject) => {

            this.ground = this.gameScene.add.box({ width: 30, height: 1, depth: 30, y: -1 }, { lambert: { color: "red" } });
            this.gameScene.physics.add.existing(this.ground, { collisionFlags: 1 })

            this.restart()
            resolve()
        })
    }

    restart() {
        this.clearCourse()
        this.tileColor.r = .2
        this.tileColor.g = .2
        this.tileColor.b = .2
        // this.ballsNum = 0
        // this.collectablesNum = 0
        this.xOffset = 0
        this.addTile(0, 0)
        for (let i = 1; i <= tileRenderDistance; i++) {
            this.addTile(i)
        }
    }


    clearCourse() {
        for (let ball of this.balls) {
            this.gameScene.destroy(ball.model)
        }
        for (let item of this.collectables) {
            this.gameScene.destroy(item.model)
        }
        for (let tile of this.tiles) {
            this.gameScene.destroy(tile.obj)
        }
        this.balls = []
        this.collectables = []
        this.tiles = []
    };

    deleteBall(ball: BouncingObsticle) {
        const i = this.balls.indexOf(ball)
        this.gameScene.destroy(this.balls[i].model)
        this.balls.splice(i, 1)
    }

    deleteBallByName(name: string, playSound: boolean) {
        let delIdx = -1
        for (let i = 0; i < this.balls.length; i++) {
            if (this.balls[i].model.name === name) {
                delIdx = i
            }
        }
        if (delIdx !== -1) {
            if (playSound) {
                this.balls[delIdx].sound?.play()
            }
            this.gameScene.destroy(this.balls[delIdx].model)
            this.balls.splice(delIdx, 1)
        }
    }

    findCollectable(item: Collectable) {
        for (let i = 0; i < this.collectables.length; i++) {
            if (this.collectables[i].model.name === item.model.name) {
                return i
            }
        }
        return -1
    }

    deleteCollectable(item: Collectable) {
        const i = this.findCollectable(item)
        if (i === -1) return
        this.gameScene.destroy(this.collectables[i].model)
        this.collectables.splice(i, 1)
    }



    addCollectable(x: number, z: number, offset: number) {
        const y = 2
        x = x + (Math.random() * offset) - (offset / 2)
        z = z + (Math.random() * offset) - (offset / 2) + 15
        const coll = new Collectable(this, new Vector3(x, y, z), this.collectablesNum)
        this.collectablesNum += 1
        this.collectables.push(coll)
    }

    updateCourse() {
        // some endless logic
        if (!this.gameScene.isReady || !this.gameScene.isPlaying) return
        const vehicle = this.gameScene.getVehicles()[0]
        const pos = vehicle.getPosition()
        const index = Math.ceil(pos.z / tileZ)

        // this.addTile(index)
        this.addTile(index + (tileRenderDistance - 1), this.xOffset)

        this.pruneTiles(vehicle.vehicleBody.position)

        for (let ball of this.balls) {
            ball.update()
        }

        for (let item of this.collectables) {
            item.update(vehicle.vehicleBody.position)
        }
    };

    updateColor() {
        this.tileColor.b += this.colDx
        if (this.tileColor.b >= 1 || this.tileColor.b <= 0) {
            this.colDx = -this.colDx
        }
        // let r = Math.floor(Math.random() * 3)
        // r = 0
        // this.tileColor[r] += this.colDx
        // if (this.tileColor[r] >= 250 || this.tileColor[r] <= 5) {
        //     this.colDx = - this.colDx
        // }
        // console.log("this.tileColor[r]", this.tileColor[0], this.tileColor[1], this.tileColor[2], this.tileColor[0] / 255, this.tileColor[1] / 255, this.tileColor[2] / 255)
    }

    setStartPositions(vehicles: IVehicle[]) {
        for (let i = 0; i < vehicles.length; i++) {
            const position = new Vector3(this.startPosition.x + (i * 5), 1, this.startPosition.z + (i * 5))
            const rotation = new Quaternion(0, 0, 0, Math.PI / 2)
            vehicles[i].setCheckpointPositionRotation({ position, rotation })
        }
    }

    setToSpawnPostion(spawnPosition: number, vehicle: IVehicle) {
        console.warn("setToSpawnPostion does nothing")
    }

    getCheckpointPositionRotation(checkpointNumber: number) {
        console.warn("getCheckpointPositionRotation does nothing")
        return { position: this.startPosition, rotation: this.startRotation }

    };
    seeObject(cameraPos: Vector3, objectPos: Vector3) {

        console.warn("seeObject does nothing")
    }
    nextBotDir(currentDirNum: number) {
        console.warn("nextBotDir does nothing")

        return {
            pos: this.startPosition, nextNum: 0, goSlow: true, nextPos: this.startPosition, nextNextNum: 0
        }
    }
    restartCourse() {

    }
}