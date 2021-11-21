import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import Stats from "stats.js";
import { CollisionEvent } from "@enable3d/common/dist/types";
import { ITagScoreInfo } from "../classes/Game";
import { ITagCourse } from "../course/ICourse";
import { Coin, freezeColor, itColor, notItColor, TagCourse } from "../course/TagCourse";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import { GameScene } from "./GameScene";
import { TagObject } from "./TagObjectClass";
import { Clock } from "@enable3d/three-wrapper/dist";




const stats = new Stats()

const totalTimeDiv = document.createElement("div")

export class TagGameScene extends GameScene {

    course: ITagCourse

    tagObjects: TagObject[]

    gameClock: Clock

    ticks: number

    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout

    /** if true then tags cannot exchange */
    isItTimeout: boolean

    gameOver: boolean

    constructor() {
        super()

        console.log("creating tag game scene")

        document.body.appendChild(totalTimeDiv)
        totalTimeDiv.setAttribute("id", "totalTime")

        this.tagObjects = []

        stats.showPanel(0)
        document.body.appendChild(stats.dom)

        this.isItTimeout = false
        this.gameClock = new Clock(false)

        this.gameOver = false

    }


    async create() {
        this.course = new TagCourse(this, this.preGameSettings.trackName, (name, coin) => this.handleCoinCollidedCallback(name, coin))
        this.course.createCourse(this.useShadows, () => {
            console.log("create course")
            this.courseLoaded = true
            const createVehiclePromise = new Promise((resolve, reject) => {
                this.createVehicles(() => {
                    for (let vehicle of this.vehicles) {
                        vehicle.useBadRotationTicks = false
                    }
                    resolve("successfully created all vehicles")
                    console.log("created all vehicles")
                })
            })

            createVehiclePromise.then(() => {
                this.loadFont()
                this.createViews()
                this.createController()
                this.resetVehicles()
                this.resetTagObjects()
                this.createColliderListeners()
                this.startGameCountdown()
            })
        })
    }



    handleVehicleTagged(vehicleNumber: number) {
        console.log("tagged vehicle", vehicleNumber)
        this.vehicles[vehicleNumber].setColor(freezeColor)
        this.tagObjects[vehicleNumber].setIsIt(true)
        this.setIsItTimeout(vehicleNumber)
        this.setViewImportantInfo("You are it!", vehicleNumber, true)
    }

    setIsItTimeout(vehicleNumber: number) {
        console.log("setting is it timeout")
        this.isItTimeout = true
        setTimeout(() => {
            console.log("stopping is it timeout")
            this.vehicles[vehicleNumber].setColor(itColor)
            this.isItTimeout = false
        }, 1500)
    }

    createColliderListeners() {
        for (let i = 0; i < this.vehicles.length; i++) {

            this.vehicles[i].chassisMesh.body.on.collision((otherObject: ExtendedObject3D, ev: CollisionEvent) => {


                if (!this.isItTimeout && !this.gameOver && this.tagObjects[i].isIt && isVehicle(otherObject)) {
                    /** change colors */
                    this.vehicles[i].setColor(notItColor)
                    this.tagObjects[i].setIsIt(false)
                    const vn = getVehicleNumber(otherObject.name)
                    this.handleVehicleTagged(vn)

                }
            })
        }
    }

    resetTagObjects() {
        this.tagObjects = []
        for (let i = 0; i < this.vehicles.length; i++) {
            this.tagObjects.push(new TagObject())
        }
    }

    restartGame() {
        this.gameStarted = false
        this.gameOver = false
        this.gameClock.stop()
        this.gameClock = new Clock(false)
        this.course.setupGameObjects()
        this.resetTagObjects()
        this.stopAllVehicles()
        this.resetVehicles()
        this.startGameCountdown()
    }

    /**
     * can also be called when game is restarted
     */
    startGameCountdown() {

        const isIt = Math.floor(Math.random() * this.players.length)
        this.tagObjects[isIt].setIsIt(true)
        for (let i = 0; i < this.vehicles.length; i++) {
            if (this.tagObjects[i].isIt) {
                this.vehicles[i].setColor(itColor)
            } else {
                this.vehicles[i].setColor(notItColor)
            }
        }

        let countdown = 1

        const timer = () => {
            this.playCountdownBeep()
            // this.showImportantInfo(countdown + "")
            this.showViewsImportantInfo(countdown + "")
            countdown -= 1
            this.countDownTimeout = setTimeout(() => {
                if (countdown > 0) {
                    timer()
                } else {
                    this.startGame()
                }
            }, 1000)
        }
        timer()
    }

    startGame() {
        this.playStartBeep()
        this.showViewsImportantInfo("GO!!!!", true)
        this.startAllVehicles()
        this.startGameClock()
        this.gameStarted = true
    }

    startGameClock() {
        this.gameClock.start()
    }

    updateClock() {
        if (this.gameOver) return
        const time = this.preGameSettings.tagGameLength * 60 - this.gameClock.getElapsedTime()
        this.showImportantInfo(time.toFixed(0))
        if (time.toFixed(0) === "0") {
            this.gameClock.stop()
            this.handleGameOver()
        }
    }

    handleGameOver() {
        this.showImportantInfo("GAME OVER!")
        this.gameOver = true
        this.gameStarted = false
    }


    handleCoinCollidedCallback(vehicleName: string, coin: Coin) {
        if (this.gameOver) return
        const vehicleNumber = getVehicleNumber(vehicleName)
        this.tagObjects[vehicleNumber].coinCollision(coin, this)
    }

    resetVehicleCallback(vehicleNumber: number) {
        if (!this.gameStarted) return
        for (let i = 0; i < this.vehicles.length; i++) {
            if (this.tagObjects[i].isIt) {
                if (this.tagObjects[i].resetPressed()) {

                    this.vehicles[i].setColor(notItColor)
                    this.tagObjects[i].setIsIt(false)
                }
            }
        }
        this.handleVehicleTagged(vehicleNumber)
    }

    updateScoreTable() {
        const tagInfos: ITagScoreInfo[] = []
        for (let i = 0; i < this.tagObjects.length; i++) {
            tagInfos.push(
                {
                    playerName: this.players[i].playerName,
                    score: this.tagObjects[i].coinCount
                }
            )
        }
        this.gameRoomActions.updateScoreTable({ tagInfos })

    }


    update(time: number) {
        this.ticks += 1
        if (this.everythingReady()) {
            stats.begin()
            if (inTestMode) {
                driveVehicleWithKeyboard(this.vehicles[0], this.vehicleControls)
            }
            this.updateScoreTable()
            this.updateVehicles()
            this.updateClock()


            if (!this.isGameSongPlaying()) {
                this.startGameSong()
            }
            // console.log("time", time, this.ticks)
            if (this.ticks % 60 === 0) {

                this.updatePing()
            }
            stats.end()
        }
    }
}

