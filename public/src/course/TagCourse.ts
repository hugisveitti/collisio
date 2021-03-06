import { ExtendedObject3D, Scene3D } from "enable3d";
import { Euler, Object3D, Vector3 } from "three";
import { GameScene } from '../game/GameScene';
import { MyScene } from "../game/MyScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { Course } from "./Course";
import { ITagCourse } from "./ICourse";

export const itColor = "#FF8000"
export const notItColor = "#8B0000"
export const freezeColor = 0x1d8a47
/** a chocolate cannot be it */
export const chocolateColor = 0x61f72a

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

    /**
     * TODO:fix this
     * I am having a bad time removing the coins from the physics and world 
     * and the collision functions
     */
    destroyed: boolean

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

        this.destroyed

        this.ry = 0;
        this.dry = .02; //Math.random() / 35 + .005 //
    }

    addToScene(scene: Scene3D) {
        scene.add.existing(this.model)
        scene.physics.add.existing(this.model, { shape: "convex", })
        this.model.body.setCollisionFlags(6)

        this.model.body.needUpdate = true
        this.model.body.on.collision((otherObject, ev) => {

            if (!this.destroyed && otherObject.name.slice(0, 7) === "vehicle") {

                this.coinCollidedCallback(otherObject.name, this)
            }
        })
    }

    removeFromScene(gameScene: MyScene) {
        this.destroyed = true
        const obj = gameScene.scene.getObjectByName(this.model.name)
        if (!this.model?.body) return
        /**
         *  this does not work I think
         * 
         * mabey gameScene.physics.removeAllListeners( event )
         */
        //      gameScene.physics.physicsWorld.removeCollisionObject(this.model.body.ammo.getCollisionShape())
        this.model.body.checkCollisions = false
        this.model.clear()


        gameScene.destroy(this.model)

        this.deleteCallback(this)
    }

    setPosition(x: number, y: number, z: number) {
        this.model.position.set(x, y, z)
    }

    setPositionOfObject(object: Object3D) {
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
    coinPoints: Object3D[]

    coinCollidedCallback: (name: string, coin: Coin) => void
    constructor(gameScene: GameScene, trackName: TrackName, coinCollidedCallback: (name: string, coin: Coin) => void) {
        super(gameScene, trackName)
        this.coinCollidedCallback = coinCollidedCallback
        this.startPosition = new Vector3(2, 2, 3)
        this.startRotation = new Euler(0, Math.PI, 0)
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

    setupGameObjects() {

        /** remove existing coins */
        const nCoins = this.coins.length
        let i = 0
        while (i < nCoins) {
            this.coins[0].removeFromScene(this.gameScene)
            i += 1
            // delete this.coins[0]
        }

        this.coins = []
        /** setup coins */
        i = 0;
        for (let cp of this.coinPoints) {
            const coin = new Coin(this.coinModel, i, this.coinCollidedCallback, (coin) => this.deleteCoin(coin))
            coin.setPositionOfObject(cp)
            coin.addToScene(this.gameScene)
            this.coins.push(coin)
            i += 1
        }


    }

    async _createCourse() {

        this.setupGameObjects()

    }

    _updateCourse() {
        for (let coin of this.coins) {
            // too slow for now
            //   coin.update()
        }
    }

}