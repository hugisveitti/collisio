import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedObject3D, Scene3D } from "enable3d";
import { TrackName } from "../shared-backend/shared-stuff";
import { IVehicle } from '../vehicles/IVehicle';
import { LowPolyVehicle } from '../vehicles/LowPolyVehicle';
import { possibleVehicleColors } from '../vehicles/VehicleConfigs';
import { Course } from "./Course";
import { ITagCourse } from "./ICourse";

export const itColor = possibleVehicleColors[2]
export const notItColor = possibleVehicleColors[1]

export class Coin {

    model: ExtendedObject3D

    /** rotate coins */
    ry: number

    /** speed of rotation */
    dry: number

    /** */
    py: number

    /** for naming */
    number: number

    coinCollidedCallback: (name: string, coin: Coin) => void

    deleteCallback: (coin: Coin) => void

    constructor(model: ExtendedObject3D, number: number, coinCollidedCallback: (otherObjectName: string, coin: Coin) => void, deleteCallback: (coin: Coin) => void) {
        this.number = number
        this.coinCollidedCallback = coinCollidedCallback
        this.deleteCallback = deleteCallback
        this.model = model.clone()

        this.model.visible = true
        this.model.castShadow = true
        this.model.receiveShadow = false
        this.model.name = `coin-${this.number}`

        this.ry = 0;
        this.dry = .02; //Math.random() / 35 + .005 //
    }

    addToScene(scene: Scene3D) {
        scene.add.existing(this.model)
        scene.physics.add.existing(this.model, { shape: "convex", })
        this.model.body.setCollisionFlags(6)

        this.model.body.needUpdate = true
        this.model.body.on.collision((otherObject, ev) => {
            if (otherObject.name.slice(0, 7) === "vehicle") {
                this.coinCollidedCallback(otherObject.name, this)
            }
        })
    }

    removeFromScene(scene: Scene3D) {
        scene.scene.remove(this.model)
        scene.physics.destroy(this.model)
        this.deleteCallback(this)
    }

    setPosition(x: number, y: number, z: number) {
        this.model.position.set(x, y, z)
    }

    setPositionOfObject(object: THREE.Object3D) {
        const p = object.position
        this.setPosition(p.x, p.y, p.z)
    }

    update() {
        this.model.rotation.y = this.ry //.set(0, this.ry, 0)
        this.ry += this.dry

        this.model.body.needUpdate = true
    }
}


export class TagCourse extends Course implements ITagCourse {

    coinModel: ExtendedObject3D
    coins: Coin[]
    coinPoints: THREE.Object3D[]
    coinCollidedCallback: (name: string, coin: Coin) => void
    constructor(scene: Scene3D, trackName: TrackName, coinCollidedCallback: (name: string, coin: Coin) => void) {
        super(scene, trackName)
        this.coinCollidedCallback = coinCollidedCallback
        this.startPosition = new THREE.Vector3(2, 2, 3)
        this.startRotation = new THREE.Euler(0, Math.PI, 0)
        this.coins = []
        this.coinPoints = []
    }



    deleteCoin(coin: Coin) {
        const index = this.coins.indexOf(coin)
        this.coins.splice(index, 1)
    }

    coinsFinished() {
        return this.coins.length === 0
    }

    _createCourse() {

        //this.scene.scene.remove(this.coin)

        let i = 0;
        for (let cp of this.coinPoints) {

            const coin = new Coin(this.coinModel, i, this.coinCollidedCallback, (coin) => this.deleteCoin(coin))
            coin.setPositionOfObject(cp)
            coin.addToScene(this.scene)
            this.coins.push(coin)
            i += 1
        }

    }

    updateCourse() {
        for (let coin of this.coins) {
            coin.update()
        }
    }

    setStartPositions(vehicles: IVehicle[]) {
        // shuffle the spawns?

        for (let i = 0; i < vehicles.length; i++) {
            const p = this.spawns[i % this.spawns.length].position
            const r = this.spawns[i % this.spawns.length].rotation

            vehicles[i].setCheckpointPositionRotation({ position: p, rotation: { x: 0, z: 0, y: r.y } })
            vehicles[i].resetPosition()
        }
    }
}