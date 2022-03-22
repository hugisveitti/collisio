import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { CollisionEvent } from "@enable3d/common/dist/types";
import { Clock } from "three";
import { ITagScoreInfo } from "../classes/Game";
import { ITagCourse } from "../course/ICourse";
import { hideLoadDiv } from "../course/loadingManager";
import { Coin, itColor, notItColor, TagCourse } from "../course/TagCourse";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { itemInArray } from "../utils/utilFunctions";
import { getVehicleNumber, isVehicle } from "../vehicles/LowPolyVehicle";
import { GameScene } from "./GameScene";
import { TagObject } from "./TagObjectClass";


/** times to show on the players view
       * e.g. 60 seconds left
       */
let importantTimes = ["60", "30", "10", "5", "4", "3", "2", "1"]




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

    totalTimeDiv: HTMLDivElement


    constructor() {
        super()
        this.totalTimeDiv = document.createElement("div")
        this.gameInfoDiv.appendChild(this.totalTimeDiv)
        this.totalTimeDiv.setAttribute("id", "totalTime")
        this.tagObjects = []

        this.isItTimeout = false
        this.gameClock = new Clock(false)

        this.gameOver = false
        this.ticks = 0

    }


    async create() {
        this.course = new TagCourse(this, this.roomSettings.trackName, (name, coin) => this.handleCoinCollidedCallback(name, coin))
        await this.course.createCourse()

        this.courseLoaded = true

        await this.createVehicles() //() => {
        for (let vehicle of this.vehicles) {
            vehicle.useBadRotationTicks = false
        }
        hideLoadDiv()

        this.createViews()
        this.createController()
        this.resetVehicles()
        this.resetTagObjects()
        this.createColliderListeners()
        this.startGameCountdown()
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

            this.vehicles[i].vehicleBody.body.on.collision((otherObject: ExtendedObject3D, ev: CollisionEvent) => {



                if (!this.isItTimeout && !this.gameOver && isVehicle(otherObject)) {
                    const otherVN = getVehicleNumber(otherObject.name)
                    if (this.tagObjects[i].isIt) {
                        /** change colors */
                        this.handleVehicleTagged(otherVN, i)
                    } else if (this.tagObjects[otherVN].isIt) {
                        this.handleVehicleTagged(i, otherVN)
                    }
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

    _restartGame() {
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
        let time = (this.roomSettings.tagGameLength * 60 - this.gameClock.getElapsedTime()).toFixed(0)

        this.showImportantInfo(time)
        if (time === "0") {
            this.gameClock.stop()
            this.handleGameOver()
        }

        if (itemInArray(time, importantTimes)) {
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
            this.viewsLapsInfo[i].textContent = this.tagObjects[i].coinCount.toString()
        }
        //    this.gameRoomActions.updateScoreTable({ tagInfos })

    }


    _updateChild(time: number, delta: number) {
        this.ticks += 1
        this.updateFps(time)

        if (this.everythingReady()) {

            if (inTestMode) {
                driveVehicleWithKeyboard(this.vehicles[0])
            }
            this.updateScoreTable()
            this.updateVehicles(delta)
            this.updateClock()
            this.course.updateCourse()


            if (!this.isGameSongPlaying()) {
                this.startGameSong()
            }

            if (this.ticks % 60 === 0) {

                this.updatePing()
            }

        }
    }
}

