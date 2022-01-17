import { ExtendedObject3D } from "enable3d";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo, IRaceTimeInfo } from "../classes/Game";
import { IRaceCourse } from "../course/ICourse";
import { RaceCourse } from "../course/RaceCourse";
import { VehicleControls } from '../shared-backend/shared-stuff';
import { DriveRecorder, TestDriver } from "../test-courses/TestDriver";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { getDateNow } from "../utils/utilFunctions";
import { GhostVehicle } from "../vehicles/GhostVehicle";
import { getStaticCameraPos } from "../vehicles/IVehicle";
import { getVehicleNumber } from "../vehicles/LowPolyVehicle";
import { GameScene } from "./GameScene";
import { GameTime } from "./GameTimeClass";


export class RaceGameScene extends GameScene {

    vehicleControls!: VehicleControls

    winner: string
    winTime: number

    gameTimers: GameTime[]
    /** delete if reset */
    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout
    course: IRaceCourse

    /** the first race count down is longer then after pressing restart game */
    raceCountdownTime: number
    /**
     * this is if players change number of laps in middle of game
     */
    currentNumberOfLaps: number
    hasShowStartAnimation: boolean
    raceFinished: boolean

    totalTimeDiv: HTMLDivElement

    testDriver: TestDriver
    ghostVehicle: GhostVehicle
    driverRecorder: DriveRecorder

    constructor() {
        super()

        this.totalTimeDiv = document.createElement("div")

        this.gameInfoDiv.appendChild(this.totalTimeDiv)
        this.totalTimeDiv.setAttribute("id", "totalTime")

        this.winner = ""
        this.winTime = -1
        this.gameTimers = []

        this.currentNumberOfLaps = this.getNumberOfLaps()

        this.hasShowStartAnimation = false
        this.raceFinished = false

        this.raceCountdownTime = 7
    }



    async loadAssets(): Promise<void> {

        this.gameTimers = []
        this.course = new RaceCourse(this, this.getTrackName(), (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D, checkpointNumber: number) => this.handleCheckpointCrossed(o, checkpointNumber))

        await this.course.createCourse()

        this.courseLoaded = true

        await this.createVehicles()

        this.currentNumberOfLaps = this.getNumberOfLaps()
        // adds font to vehicles, which displays names
        for (let i = 0; i < this.players.length; i++) {
            this.gameTimers.push(new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints()))
        }
    }

    async createGhostVehicle() {
        return new Promise<void>((resolve, reject) => {

            this.ghostVehicle?.removeFromScene(this)

            this.testDriver.loadTournamentInstructions(this.gameSceneConfig.tournament.id).then(async () => {

                const vt = this.testDriver.getVehicleType()
                if (vt) {
                    console.log("vt ", vt)
                    this.ghostVehicle = new GhostVehicle({
                        vehicleType: vt, color: "#10eedd"
                    })
                    await this.ghostVehicle.loadModel()
                    this.ghostVehicle.addToScene(this)

                } else {
                    console.warn("no vt", vt)
                }
                resolve()
            }).catch(() => {
                console.log("No ghost since there is no recording")
                resolve()
            })
        })
    }

    async create(): Promise<void> {

        this.testDriver = new TestDriver(this.getTrackName(), this.getNumberOfLaps())
        console.log("this config", this.gameSceneConfig)
        if (this.gameSceneConfig?.tournament?.tournamentType === "global") {
            console.log("gamesettings", this.gameSettings)
            if (this.gameSettings.useGhost) {
                await this.createGhostVehicle()
            }
            console.log("creating drive recorder")
            this.driverRecorder = new DriveRecorder({
                tournamentId: this.gameSceneConfig.tournament.id,
                active: true,
                numberOfLaps: this.currentNumberOfLaps,
                vehicleType: this.players[0].vehicleType,
                trackName: this.getTrackName()
            })
        }
        this.createViews()
        this.createController()
        await this.resetVehicles()

        this.restartGame()
    }

    startRaceCountdown() {
        this.currentNumberOfLaps = this.getNumberOfLaps()
        this.startGameSong()
        if (this.raceCountdownTime < 3) this.raceCountdownTime = 3
        // makes vehicle fall
        this.stopAllVehicles()

        if (this.raceCountdownTime > 3) {
            this.showImportantInfo(`Race starting in ${this.raceCountdownTime} seconds`, true)
        }

        /** hacky way to make vehicles stopp
         * TODO: not this, find a way to make vechicles reliably start on the ground paused..
         */
        setTimeout(() => {
            for (let vehicle of this.vehicles) {
                vehicle.setToGround()
                vehicle.start()
                vehicle.break()
            }
        }, (.5) * 1000)

        const timer = () => {
            if (this.raceCountdownTime < 4) {
                // dont always play beep
                this.playCountdownBeep()
            }
            // this.showImportantInfo(countdown + "")
            this.showViewsImportantInfo(this.raceCountdownTime + "")
            this.raceCountdownTime -= 1
            this.countDownTimeout = setTimeout(() => {
                if (this.raceCountdownTime > 0) {
                    timer()
                } else {
                    this.playStartBeep()
                    this.showViewsImportantInfo("GO!")
                    this.startAllVehicles()
                    this.gameStarted = true
                    this.raceCountdownTime = 3

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

    getNumberOfLaps() {
        return this.gameSceneConfig?.tournament?.numberOfLaps ?? this.gameSettings.numberOfLaps
    }

    _resetVehicles() {
        for (let timer of this.gameTimers) {
            timer.stop()
        }

        this.gameTimers = []
        this.currentNumberOfLaps = this.getNumberOfLaps()
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

        this.currentNumberOfLaps = this.getNumberOfLaps()

        window.clearTimeout(this.countDownTimeout)
        window.clearTimeout(this.gameStartingTimeOut)
        this.clearTimeouts()

        this.gameStarted = false
        this.winner = ""
        this.winTime = -1

        this.driverRecorder?.reset()
        this.testDriver?.reset()
        // if (this.gameSettings.useGhost) {
        //     this.createGhostVehicle()
        // }

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
                        const { x, y, z } = getStaticCameraPos(this.gameSceneConfig.onlyMobile ? 2 : this.vehicles[i].vehicleSettings.cameraZoom)
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

    _setGameSettings() {
        if (this.ghostVehicle) {
            if (!this.gameSettings.useGhost) {
                this.ghostVehicle.hide()
            } else {
                this.ghostVehicle.show()
            }
        }
    }

    /** function called if vehicle position is reset */
    resetVehicleCallback(vehicleNumber: number) {
        if (this.raceFinished) {
            this.raceFinished = false
            this.restartGame()
        }
    }


    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = getVehicleNumber(vehicle.body.name)
        if (this.gameTimers[vehicleNumber].allCheckpointsCrossed()) {
            const cLapTime = this.gameTimers[vehicleNumber].getCurrentLapTime()
            this.gameTimers[vehicleNumber].lapDone()
            const { position, rotation } = (this.course as RaceCourse).getGoalCheckpoint()

            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position, rotation })

            if (this.gameTimers[vehicleNumber].finished() && this.gameStarted) {
                const totalTime = this.gameTimers[vehicleNumber].getTotalTime()

                if (this.winner === "") {
                    this.winner = this.players[vehicleNumber].playerName
                    this.winTime = totalTime
                }

                if (!this.gameTimers[vehicleNumber].hasSendRaceData) {

                    this.setViewImportantInfo(`Race finished, total time: ${totalTime}`, +vehicleNumber)
                    this.prepareEndOfRacePlayer(+vehicleNumber)
                    this.checkRaceOver()
                    this.gameTimers[vehicleNumber].hasSendRaceData = true
                }
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
        // If player restarts game while inside the checkpoint it will register as a the checkpoint crossed in the new game
        if (!this.gameTimers[vehicleNumber].crossedCheckpoint(checkpointNumber) && this.gameStarted) {

            this.setViewImportantInfo(`Checkpoint ${this.gameTimers[vehicleNumber].getCurrentLapTime()}`, vehicleNumber, true)
            this.gameTimers[vehicleNumber].checkpointCrossed(checkpointNumber)

            const { position, rotation } = this.course.getCheckpointPositionRotation(checkpointNumber)


            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: position.x, y: position.y + 1, z: position.z }, rotation: rotation })
        }
    }


    updateScoreTable(time: number, delta: number) {
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
        this.totalTimeDiv.innerHTML = maxTotalTime.toFixed(2)
        if (this.gameSceneConfig.onlyMobile) {
            this.viewsNameInfo[0].innerHTML = `${this.gameTimers[0].lapNumber} / ${this.currentNumberOfLaps}`
        }


        if (this.gameStarted && !this.isGamePaused()) {
            if (this.ghostVehicle && maxTotalTime > 0) {
                this.testDriver.setPlace(this.ghostVehicle, maxTotalTime, delta)
            }
            if (this.driverRecorder && maxTotalTime > 0) {
                this.driverRecorder.record(this.vehicles[0], maxTotalTime)
            }
        }
    }


    _updateChild(time: number, delta: number) {
        this.time = time
        this.updateFps(time)

        this.gameTicks += 1
        this.roomTicks += 1
        if (this.everythingReady()) {
            this.course.updateCourse()

            if (inTestMode) {
                driveVehicleWithKeyboard(this.vehicles[0], this.vehicleControls)
            }
            this.updateScoreTable(time, delta)
            this.updateVehicles(delta)

            if (!this.isGameSongPlaying()) {
                this.startGameSong()
            }
            if (this.roomTicks % 90 === 0) {
                this.updatePing()
            }
        }
    }


    /**
     * Prepare and send data when player finished to save to highscore
     * @i player number
     */
    prepareEndOfRacePlayer(i: number) {
        console.log("prepare end of race player", i)
        const playerData: IEndOfRaceInfoPlayer = {
            totalTime: this.gameTimers[i].getTotalTime(),
            numberOfLaps: this.currentNumberOfLaps,
            playerName: this.players[i].playerName,
            playerId: this.players[i].id,
            bestLapTime: this.gameTimers[i].getBestLapTime(),
            trackName: this.getTrackName(),
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
            totalPingsGotten: this.totalPingsGotten,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks,
        }

        // need to do it this way because firestore cannot have undefined
        if (this.gameSettings.tournamentId) {
            playerData.tournamentId = this.gameSettings.tournamentId
        }

        if (this.gameRoomActions.playerFinished) {
            this.gameRoomActions.playerFinished(playerData)
        }

        if (i === 0 && this.driverRecorder) {
            this.driverRecorder.saveTournamentRecording(this.gameTimers[i].getTotalTime(), this.players[i].playerName, this.players[i].id,)
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
            gameTicks: this.gameTicks,
            avgPing: this.totalPingsGotten === 0 ? -1 : this.totalPing / this.totalPingsGotten,
            time: this.time,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks
        }
        if (this.gameRoomActions.gameFinished) {
            this.gameRoomActions.gameFinished({ endOfRaceInfo })
        }
        // wa
        // if save then update gameId
        this.gameId = uuid()
    }
}


