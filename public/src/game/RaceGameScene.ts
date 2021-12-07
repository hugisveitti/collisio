import { ExtendedObject3D } from "enable3d";
import Stats from "stats.js";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo, IRaceTimeInfo } from "../classes/Game";
import { IRaceCourse } from "../course/ICourse";
import { RaceCourse } from "../course/RaceCourse";
import { VehicleControls } from '../shared-backend/shared-stuff';
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { getDateNow } from "../utils/utilFunctions";
import { getVehicleNumber, staticCameraPos } from "../vehicles/LowPolyVehicle";
import { GameScene } from "./GameScene";
import { GameTime } from "./GameTimeClass";



const stats = new Stats()
const totalTimeDiv = document.createElement("div")


export class RaceGameScene extends GameScene {

    vehicleControls!: VehicleControls

    winner: string
    winTime: number


    gameTimers: GameTime[]

    /** delete if reset */
    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout
    course: IRaceCourse

    roomTicks: number
    gameTicks: number

    /**
     * this is if players change number of laps in middle of game
     */
    currentNumberOfLaps: number

    hasShowStartAnimation: boolean

    raceFinished: boolean



    constructor() {
        super()


        this.gameInfoDiv.appendChild(totalTimeDiv)
        totalTimeDiv.setAttribute("id", "totalTime")


        this.winner = ""
        this.winTime = -1
        this.gameTimers = []

        stats.showPanel(0)
        this.gameInfoDiv.appendChild(stats.dom)

        this.roomTicks = 0
        this.gameTicks = 0
        this.currentNumberOfLaps = this.gameSettings.numberOfLaps

        this.hasShowStartAnimation = false
        this.raceFinished = false

    }

    async create() {
        this.gameTimers = []
        this.course = new RaceCourse(this, this.gameSettings.trackName, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D, checkpointNumber: number) => this.handleCheckpointCrossed(o, checkpointNumber))
        this.course.createCourse(this.useShadows, () => {
            this.courseLoaded = true
            const createVehiclePromise = new Promise((resolve, reject) => {
                this.createVehicles(() => {
                    resolve("successfully created all vehicles")
                })
            })

            createVehiclePromise.then(() => {
                this.currentNumberOfLaps = this.gameSettings.numberOfLaps
                // adds font to vehicles, which displays names
                for (let i = 0; i < this.players.length; i++) {
                    this.gameTimers.push(new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints()))
                }
                this.loadFont()
                this.createViews()
                this.createController()
                this.resetVehicles()
                this.restartGame()


            })

        })
    }

    startRaceCountdown() {
        this.currentNumberOfLaps = this.gameSettings.numberOfLaps
        let countdown = 3
        this.startGameSong()
        // makes vehicle fall
        for (let vehicle of this.vehicles) {
            vehicle.canDrive = false
            vehicle.stop()
        }
        /** hacky way to make vehicles stopp
         * TODO: not this, find a way to make vechicles reliably start on the ground paused..
         */
        setTimeout(() => {
            for (let vehicle of this.vehicles) {
                const r = vehicle.getRotation()
                // const gR = this.course.startRotation
                // vehcile.setRotation(0, gR.y, 0)
                //     vehicle.stop()
                vehicle.start()

            }
        }, (2) * 1000)

        const timer = () => {
            this.playCountdownBeep()
            // this.showImportantInfo(countdown + "")
            this.showViewsImportantInfo(countdown + "")
            countdown -= 1
            this.countDownTimeout = setTimeout(() => {
                if (countdown > 0) {
                    timer()
                } else {
                    this.playStartBeep()
                    this.showViewsImportantInfo("GO!")
                    this.startAllVehicles()
                    this.gameStarted = true

                    setTimeout(() => {
                        this.clearViewsImportantInfo()
                    }, 2000)
                }
            }, 1000)
        }
        timer()
    }


    _togglePauseGame(wasPaused: boolean) {

        if (!this.gameStarted) return
        for (let i = 0; i < this.vehicles.length; i++) {
            if (wasPaused) {
                this.gameTimers[i].start()
            } else {
                this.gameTimers[i].stop()
            }
        }
    }

    _resetVehicles() {
        for (let timer of this.gameTimers) {
            timer.stop()
        }

        this.gameTimers = []
        this.currentNumberOfLaps = this.gameSettings.numberOfLaps
        for (let i = 0; i < this.players.length; i++) {
            this.gameTimers.push(new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints()))
        }
    }

    _startAllVehicles() {
        this.raceFinished = false
        this.gameTicks = 0
        for (let i = 0; i < this.vehicles.length; i++) {
            this.gameTimers[i].start()
        }
    }


    _restartGame() {
        this.currentNumberOfLaps = this.gameSettings.numberOfLaps

        window.clearTimeout(this.countDownTimeout)
        window.clearTimeout(this.gameStartingTimeOut)
        this.clearTimouts()

        this.gameStarted = false
        this.winner = ""
        this.winTime = -1



        this.hasShowStartAnimation = true
        /**
         * There is a bug here, I dont know what
         * this works in inTestMode, but not otherwise
         */

        if (!this.hasShowStartAnimation) {
            const sec = 3
            this.hasShowStartAnimation = true

            this.showViewsImportantInfo("Race countdown starting in " + sec + " seconds")
            for (let i = 0; i < this.vehicles.length; i++) {
                // this.vehicles[i].chassisMesh.remove(this.views[i].camera)
                this.vehicles[i].removeCamera()
                this.vehicles[i].spinCameraAroundVehicle = true

                const pos = this.vehicles[i].getPosition()

                const rot = this.vehicles[i].getRotation()
                this.views[i].camera.position.set(
                    pos.x + ((Math.sin(rot.y) * 100)),
                    pos.y + 75,
                    pos.z - ((Math.cos(rot.y) * 50) * Math.sign(Math.cos(rot.z)))
                )



            }
            this.gameStartingTimeOut = setTimeout(() => {

                for (let i = 0; i < this.vehicles.length; i++) {

                    if (!this.vehicles[i].useChaseCamera) {
                        const { x, y, z } = staticCameraPos
                        this.camera.position.set(x, y, z)
                        this.vehicles[i].addCamera(this.views[i].camera)
                    }
                    this.vehicles[i].spinCameraAroundVehicle = false
                }
                this.startRaceCountdown()

            }, sec * 1000)
        }
        else {

            this.startRaceCountdown()
        }
    }

    _resetPlayer(idx: number) {
        if (this.raceFinished) {
            this.restartGame()
        }
    }


    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = getVehicleNumber(vehicle.body.name)
        if (this.gameTimers[vehicleNumber].allCheckpointsCrossed()) {
            const cLapTime = this.gameTimers[vehicleNumber].getCurrentLapTime()
            this.gameTimers[vehicleNumber].lapDone()



            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: p.y + 1, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })

            if (this.gameTimers[vehicleNumber].finished() && this.gameStarted) {
                const totalTime = this.gameTimers[vehicleNumber].getTotalTime()

                if (this.winner === "") {
                    this.winner = this.players[vehicleNumber].playerName
                    this.winTime = totalTime

                }
                this.setViewImportantInfo(`Race finished, total time: ${totalTime}`, +vehicleNumber)
                this.prepareEndOfRacePlayer(+vehicleNumber)
                this.checkRaceOver()
            } else {
                this.setViewImportantInfo(`Lap time: ${cLapTime.toFixed(2)}`, +vehicleNumber, true)
            }
        }
    }

    checkRaceOver() {
        let isRaceOver = true
        for (let i = 0; i < this.vehicles.length; i++) {
            if (!this.gameTimers[i].finished()) {
                isRaceOver = false
            }
        }
        if (isRaceOver) {

            this.gameStarted = false
            this.raceFinished = true
            this.prepareEndOfGameData()
        }
        return isRaceOver
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D, checkpointNumber: number) {
        const vehicleNumber = getVehicleNumber(vehicle.body.name)
        if (!this.gameTimers[vehicleNumber].crossedCheckpoint(checkpointNumber)) {
            this.setViewImportantInfo(`Checkpoint ${this.gameTimers[vehicleNumber].getCurrentLapTime()}`, vehicleNumber, true)

        }
        this.gameTimers[vehicleNumber].checkpointCrossed(checkpointNumber)

        const p = this.course.checkpointSpawns[checkpointNumber - 1].position
        const r = this.course.checkpointSpawns[checkpointNumber - 1].rotation

        this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: p.y + 1, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })
    }


    updateScoreTable() {
        const timeInfos: IRaceTimeInfo[] = []
        let maxTotalTime = 0
        for (let i = 0; i < this.gameTimers.length; i++) {
            let cLapTime = this.gameTimers[i].getCurrentLapTime()
            const bLT = this.gameTimers[i].getBestLapTime()
            let totalTime = this.gameTimers[i].getTotalTime()
            maxTotalTime = Math.max(totalTime, maxTotalTime)
            if (this.gameTimers[i].finished()) {
                cLapTime = -1
            }
            const timeInfoObject: IRaceTimeInfo = {
                playerName: this.players[i].playerName,
                bestLapTime: bLT,
                currentLapTime: cLapTime,
                totalTime,
                lapNumber: this.gameTimers[i].lapNumber,
                numberOfLaps: this.currentNumberOfLaps
            }
            timeInfos.push(timeInfoObject)
        }

        if (this.gameRoomActions.updateScoreTable) {
            this.gameRoomActions.updateScoreTable({ timeInfos })
        }

        totalTimeDiv.innerHTML = maxTotalTime.toFixed(2)
    }



    update(time: number) {
        this.gameTicks += 1
        this.roomTicks += 1
        if (this.everythingReady()) {
            stats.begin()
            if (inTestMode) {
                driveVehicleWithKeyboard(this.vehicles[0], this.vehicleControls)
            }
            this.updateScoreTable()
            this.updateVehicles()

            if (!this.isGameSongPlaying()) {
                this.startGameSong()
            }
            if (this.roomTicks % 90 === 0) {

                this.updatePing()
            }
            stats.end()
        }
    }


    /**
     * Prepare and send data when player finished to save to highscore
     * @i player number
     */
    prepareEndOfRacePlayer(i: number) {
        const playerData: IEndOfRaceInfoPlayer = {
            totalTime: this.gameTimers[i].getTotalTime(),
            numberOfLaps: this.currentNumberOfLaps,
            playerName: this.players[i].playerName,
            playerId: this.players[i].id,
            bestLapTime: this.gameTimers[i].getBestLapTime(),
            trackName: this.gameSettings.trackName,
            lapTimes: this.gameTimers[i].getLapTimes(),
            gameId: this.gameId,
            date: getDateNow(),
            private: false,
            isAuthenticated: this.players[i].isAuthenticated,
            vehicleType: this.vehicles[i].vehicleType,
            engineForce: this.vehicles[i].engineForce,
            breakingForce: this.vehicles[i].breakingForce,
            steeringSensitivity: this.vehicles[i].steeringSensitivity,
            roomTicks: this.roomTicks,
            gameTicks: this.gameTicks,
            userAgent: navigator.userAgent,
            totalPing: this.totalPing,
            totalPingsGotten: this.totalPingsGotten
        }

        if (this.gameRoomActions.playerFinished) {
            this.gameRoomActions.playerFinished(playerData)
        }
    }


    prepareEndOfGameData() {
        const playerGameInfos: IPlayerGameInfo[] = []

        for (let i = 0; i < this.vehicles.length; i++) {

            playerGameInfos.push({
                id: this.players[i].id,
                name: this.players[i].playerName,
                totalTime: this.gameTimers[i].getTotalTime(),
                lapTimes: this.gameTimers[i].getLapTimes(),
                vehicleType: this.players[i].vehicleType,
                engineForce: this.vehicles[i].engineForce,
                breakingForce: this.vehicles[i].breakingForce,
                steeringSensitivity: this.vehicles[i].steeringSensitivity,
                isAuthenticated: this.players[i].isAuthenticated
            })
        }

        const endOfRaceInfo: IEndOfRaceInfoGame = {
            playersInfo: playerGameInfos,
            gameSettings: this.gameSettings,
            gameId: this.gameId,
            roomId: this.roomId,
            date: getDateNow(),
            roomTicks: this.roomTicks,
            gameTicks: this.gameTicks
        }
        if (this.gameRoomActions.gameFinished) {
            this.gameRoomActions.gameFinished({ endOfRaceInfo })
        }
        // wa
        // if save then update gameId
        this.gameId = uuid()
    }
}


