import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { CollisionEvent } from "@enable3d/common/dist/types";
import Stats from "stats.js";
import { Clock } from "three";
import { ITagScoreInfo } from "../classes/Game";
import { ITagCourse } from "../course/ICourse";
import { Coin, itColor, notItColor, TagCourse } from "../course/TagCourse";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { stringInArray } from "../utils/utilFunctions";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import { GameScene } from "./GameScene";
import { TagObject } from "./TagObjectClass";


/** times to show on the players view
       * e.g. 60 seconds left
       */
let importantTimes = ["60", "30", "10", "5", "4", "3", "2", "1"]



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

    isItTimeoutObject: NodeJS.Timeout



    constructor() {
        super()

        this.gameInfoDiv.appendChild(totalTimeDiv)
        totalTimeDiv.setAttribute("id", "totalTime")

        this.tagObjects = []

        stats.showPanel(0)
        this.gameInfoDiv.appendChild(stats.dom)

        this.isItTimeout = false
        this.gameClock = new Clock(false)

        this.gameOver = false
        this.ticks = 0

    }


    async create() {
        this.course = new TagCourse(this, this.gameSettings.trackName, (name, coin) => this.handleCoinCollidedCallback(name, coin))
        this.course.createCourse(this.useShadows, () => {

            this.courseLoaded = true
            const createVehiclePromise = new Promise((resolve, reject) => {
                this.createVehicles(() => {
                    for (let vehicle of this.vehicles) {
                        vehicle.useBadRotationTicks = false
                    }
                    resolve("successfully created all vehicles")

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



    handleVehicleTagged(newIt: number, oldIt: number) {

        if (!this.tagObjects[newIt].isChocolate) {

            this.tagObjects[newIt].setIsIt(true)
            this.tagObjects[oldIt].setIsIt(false, false)

            this.setViewImportantInfo("You are it!", newIt, true)
            const playerName = this.players[newIt].playerName
            for (let i = 0; i < this.vehicles.length; i++) {
                if (i !== newIt) {
                    this.setViewImportantInfo(`${playerName} is it!`, i, true)
                }
            }
        }
    }



    createColliderListeners() {
        for (let i = 0; i < this.vehicles.length; i++) {

            this.vehicles[i].chassisMesh.body.on.collision((otherObject: ExtendedObject3D, ev: CollisionEvent) => {


                if (!this.isItTimeout && !this.gameOver && this.tagObjects[i].isIt && isVehicle(otherObject)) {
                    /** change colors */
                    const vn = getVehicleNumber(otherObject.name)
                    this.handleVehicleTagged(vn, i)

                }
            })
        }
    }

    resetTagObjects() {
        this.tagObjects = []
        for (let i = 0; i < this.vehicles.length; i++) {
            this.tagObjects.push(new TagObject(this.vehicles[i]))
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
        let time = (this.gameSettings.tagGameLength * 60 - this.gameClock.getElapsedTime()).toFixed(0)

        this.showImportantInfo(time)
        if (time === "0") {
            this.gameClock.stop()
            this.handleGameOver()
        }

        if (stringInArray(time, importantTimes)) {
            this.showViewsImportantInfo(`${time} sec left`, true)
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

        if (this.tagObjects[vehicleNumber].isIt || this.tagObjects[vehicleNumber].isChocolate) {

            return
        }

        const changeTags = this.tagObjects[vehicleNumber].resetPressed()


        if (changeTags) {
            let oldIt = -1
            for (let i = 0; i < this.vehicles.length; i++) {
                if (this.tagObjects[i].isIt) {

                    oldIt = i
                    this.tagObjects[i].setIsIt(false, true)

                }
            }

            if (oldIt !== -1) {
                this.handleVehicleTagged(vehicleNumber, oldIt)
            } else if (oldIt === vehicleNumber) {

            }
        } else {
            this.setViewImportantInfo(`${this.tagObjects[vehicleNumber].getRemainingResets()} resets left`, vehicleNumber, true)
        }
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
            this.course.updateCourse()


            if (!this.isGameSongPlaying()) {
                this.startGameSong()
            }

            if (this.ticks % 60 === 0) {

                this.updatePing()
            }
            stats.end()
        }
    }
}

