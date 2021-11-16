import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { ITagCourse } from "../course/ICourse";
import { Coin, TagCourse } from "../course/TagCourse";
import { GameScene } from "./GameScene";


export class TagGameScene extends GameScene {

    course: ITagCourse

    isIt: number



    constructor() {
        super()

        this.isIt = 0
    }


    async create() {
        this.course = new TagCourse(this, this.preGameSettings.trackName, (name, coin) => this.handleCoinCollidedCallback(name, coin))
        this.course.createCourse(this.useShadows, () => {
            this.courseLoaded = true
            const createVehiclePromise = new Promise((resolve, reject) => {
                this.createVehicles(() => {
                    resolve("successfully created all vehicles")
                })
            })

            createVehiclePromise.then(() => {
                this.loadFont()
                this.createViews()
                this.createController()
                this.resetVehicles()
                this.startGameCountdown()
            })
        })
    }


    startGameCountdown() {
        this.isIt = Math.floor(Math.random() * this.players.length)
    }

    handleCoinCollidedCallback(vehicleName: string, coin: Coin) {
        const vehicleNumber = vehicleName.slice(8, 9)

    }
}

