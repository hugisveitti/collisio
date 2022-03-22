import { ExtendedObject3D } from "enable3d";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo, IRaceTimeInfo } from "../classes/Game";
import { IRaceCourse } from "../course/ICourse";
import { hideLoadDiv } from "../course/loadingManager";
import { RaceCourse } from "../course/RaceCourse";
import { VehicleColorType } from '../shared-backend/shared-stuff';
import { DriveRecorder, GhostDriver } from "../test-courses/GhostDriver";
import { addKeyboardControls, driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import { getDateNow } from "../utils/utilFunctions";
import { BotVehicle } from "../vehicles/BotVehicle";
import { GhostVehicle } from "../vehicles/GhostVehicle";
import { getVehicleNumber, loadLowPolyVehicleModels } from "../vehicles/LowPolyVehicle";
import { IVehicleClassConfig } from "../vehicles/Vehicle";
import { GameScene } from "./GameScene";
import { GameTime } from "./GameTimeClass";


export class RaceGameScene extends GameScene {

    winner: string
    winTime: number

    gameTimers: GameTime[]
    /** delete if reset */
    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout
    countDownInterval: NodeJS.Timer
    course: IRaceCourse

    /** the first race count down is longer then after pressing restart game */
    raceCountdownTime: number
    /**
     * this is if players change number of laps in middle of game
     */
    currentNumberOfLaps: number
    hasShowStartAnimation: boolean
    raceFinished: boolean


    ghostDriver: GhostDriver
    ghostVehicle: GhostVehicle
    driverRecorder: DriveRecorder



    constructor() {
        super()

        this.winner = ""
        this.winTime = -1
        this.gameTimers = []

        this.currentNumberOfLaps = this.getNumberOfLaps()

        this.hasShowStartAnimation = false
        this.raceFinished = false

        this.raceCountdownTime = 6


        if (inTestMode) {
            addKeyboardControls()
        }
    }



    async loadAssets(): Promise<void> {

        this.course = new RaceCourse(this, this.getTrackName(), (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D, checkpointNumber: number) => this.handleCheckpointCrossed(o, checkpointNumber))

        await this.course.createCourse()

        this.courseLoaded = true

        await this.createVehicles()
        await this.createBot()
        hideLoadDiv()

        this.updateVehicles(0.1)
        this.isReady = true


        this.currentNumberOfLaps = this.getNumberOfLaps()
        // adds font to vehicles, which displays names
        this.gameTimers = []
        for (let i = 0; i < this.players.length; i++) {
            this.gameTimers.push(new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints()))
        }
    }

    async createBot() {
        return new Promise<void>((resolve, reject) => {

            if (this.gameSettings.botDifficulty === "none") {
                resolve()
                return
            }
            const botConfig: IVehicleClassConfig = {
                name: "Bot Tamy",
                id: "bot-id",
                vehicleType: "normal2", //doesnt matter,
                vehicleSetup: {
                    vehicleColor: "#ff00ee" as VehicleColorType,
                    vehicleType: "normal2"
                },
                scene: this,
                vehicleNumber: -1,
                isBot: true
            }
            this.bot = new BotVehicle(this.gameSettings.botDifficulty, botConfig)
            loadLowPolyVehicleModels(this.bot.vehicleType, false).then(async ([tires, chassis]) => {
                await this.bot.addModels(tires, chassis)
                this.bot.setCanDrive(true)

                const { position, rotation } = this.course.getGoalCheckpoint()

                this.bot.setCheckpointPositionRotation({ position, rotation })
                this.bot.getNextDir()
                if (this.bot.vehicleBody?.body) {
                    this.bot.resetPosition()
                    //      this.bot.update(0.1)
                }
                resolve()
            })
        })
    }

    async createGhostVehicle() {
        return new Promise<void>((resolve, reject) => {

            this.ghostVehicle?.removeFromScene(this)

            const { trackName, numberOfLaps } = DriveRecorder.GetTrackNameNumberOfLapsFromFilename(this.gameSettings.ghostFilename)

            if (trackName && numberOfLaps && (trackName !== this.getTrackName() || numberOfLaps !== this.getNumberOfLaps())) {
                console.warn("Track name or number of laps of ghost don't match race settings, roomsettings:", this.roomSettings)
                resolve()
                return
            }

            this.ghostDriver = new GhostDriver(this.getTrackName(), this.getNumberOfLaps(), this.players[0].vehicleType)
            this.ghostDriver.loadDriveInstructions(this.gameSettings.ghostFilename ?? this.roomSettings.tournamentId, !!this.gameSceneConfig?.tournament?.id).then(async () => {

                const vt = this.ghostDriver.getVehicleType()
                if (vt) {
                    this.ghostVehicle = new GhostVehicle({
                        vehicleType: vt,
                        color: "#10eedd",
                        id: this.gameSettings.ghostFilename
                    })
                    await this.ghostVehicle.loadModel()
                    this.ghostVehicle.addToScene(this)
                    this.ghostDriver.setToStart(this.ghostVehicle)

                } else {
                    console.warn("no vt", vt)
                }
                resolve()
            }).catch(() => {
                resolve()
            })
        })
    }

    async create(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            this._clearTimeouts()
            if (this.gameSceneConfig?.tournament?.tournamentType === "global" || this.gameSettings.record) {
                if (this.gameSettings.useGhost && (this.roomSettings.tournamentId || this.gameSettings.ghostFilename)) {
                    await this.createGhostVehicle()
                }
                this.driverRecorder = new DriveRecorder({
                    tournamentId: this.gameSceneConfig?.tournament?.id,
                    active: true,
                    numberOfLaps: this.currentNumberOfLaps,
                    vehicleType: this.players[0].vehicleType,
                    trackName: this.getTrackName(),
                    playerId: this.players[0].id,
                    playerName: this.players[0].playerName,
                    vehicleSetup: this.vehicles[0].vehicleSetup
                })
            }


            this.createViews()
            this.createController()
            this.resetVehicles()

            await this.restartGame()
            this.isReady = true
            hideLoadDiv()
            resolve()
        })
    }

    async startRaceCountdown() {
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
                //      vehicle.setToGround()
                vehicle.start()
                vehicle.zeroEngineForce()
                vehicle.setCanDrive(false)
            }
        }, (.5) * 1000)

        clearTimeout(this.countDownInterval)
        this.countDownInterval = setInterval(() => {

            // while (0 <= this.raceCountdownTime) {
            if (this.raceCountdownTime < 4 && this.raceCountdownTime !== 0) {
                // dont always play beep
                this.playCountdownBeep()
            }

            this.showViewsImportantInfo(this.raceCountdownTime + "")
            if (this.raceCountdownTime > 0) {

                // await this.nSecWait(1)
                // this.raceCountdownTime -= 1
            } else {
                this.playStartBeep()
                this.showViewsImportantInfo("GO!", true)
                this.startAllVehicles()
                this.gameStarted = true
                clearInterval(this.countDownInterval)
                this.raceCountdownTime = 3

            }
            this.raceCountdownTime -= 1
            // }
        }, 1000)
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
        return this.gameSceneConfig?.tournament?.numberOfLaps ?? this.roomSettings.numberOfLaps
    }

    _resetVehicles() {
        for (let timer of this.gameTimers) {
            timer.stop()
        }

        //     this.gameTimers = []
        this.currentNumberOfLaps = this.getNumberOfLaps()
        if (this.gameTimers.length === 0) {

            for (let i = 0; i < this.players.length; i++) {
                this.gameTimers.push(new GameTime(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints()))
            }
        } else {
            for (let time of this.gameTimers) {
                time.restart(this.currentNumberOfLaps, this.course.getNumberOfCheckpoints())
            }
        }
        if (this.bot) {
            this.bot.resetPosition()
        }
    }

    _startAllVehicles() {
        this.raceFinished = false
        this.gameTicks = 0
        for (let i = 0; i < this.vehicles.length; i++) {
            this.gameTimers[i].start()
        }
    }

    _clearTimeouts() {
        clearTimeout(this.countDownTimeout)
        clearTimeout(this.gameStartingTimeOut)
        clearInterval(this.countDownInterval)
    }

    async _restartGame() {

        if (this.bot) {
            const posRot = this.course.getGoalCheckpoint()
            this.bot.setCheckpointPositionRotation(posRot)
            this.bot.restartBot()
        }

        this.currentNumberOfLaps = this.getNumberOfLaps()

        this._clearTimeouts()
        this.clearTimeouts()

        this.gameStarted = false
        this.winner = ""
        this.winTime = -1

        this.driverRecorder?.reset()
        this.ghostDriver?.reset()

        // hasn't this already been created
        await this.createGhostVehicle()

        this.resetVehicles()

        /**
         * There is a bug here, I dont know what
         * this works in inTestMode, but not otherwise
         */
        this.hasShowStartAnimation = true

        if (!this.hasShowStartAnimation) {
            const sec = 3
            this.hasShowStartAnimation = true

            this.showViewsImportantInfo("Race countdown starting in " + sec + " seconds")
            for (let i = 0; i < this.vehicles.length; i++) {
                // this.vehicles[i].chassisMesh.remove(this.views[i].camera)
                this.vehicles[i].removeCamera()
                this.vehicles[i].spinCameraAroundVehicle = true
                this.vehicles[i].resetPosition()
                const pos = this.vehicles[i].getPosition()

                const rot = this.vehicles[i].getRotation()
                this.views[i].camera.position.set(
                    pos.x + ((Math.sin(rot.y) * 100)),
                    pos.y + 75,
                    pos.z + ((Math.cos(rot.y) * 100) * Math.sign(Math.cos(rot.z)))
                )
            }
            this.gameStartingTimeOut = setTimeout(() => {
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
            const { position, rotation } = this.course.getGoalCheckpoint()

            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position, rotation })

            if (this.gameTimers[vehicleNumber].finished() && this.gameStarted) {
                const totalTime = this.gameTimers[vehicleNumber].getTotalTime()

                if (this.winner === "") {
                    this.winner = this.players[vehicleNumber].playerName
                    this.winTime = totalTime
                }

                if (!this.gameTimers[vehicleNumber].hasSendRaceData) {
                    let numPlayersFinished = 0
                    for (let i = 0; i < this.gameTimers.length; i++) {
                        if (i !== vehicleNumber && this.gameTimers[i].finished()) {
                            numPlayersFinished += 1
                        }
                    }
                    this.gameTimers[vehicleNumber].points += this.players.length - 1 - numPlayersFinished

                    const pName = this.players[vehicleNumber].playerName.toUpperCase().slice(0, 3)
                    this.viewsNameInfo[vehicleNumber].textContent = `${pName} - ${this.gameTimers[vehicleNumber].points}`

                    this.setViewImportantInfo(`Race finished, total time: ${totalTime.toFixed(2)}`, +vehicleNumber)
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

            this.gameTimers[vehicleNumber].checkpointCrossed(checkpointNumber)
            if (this.vehicles.length === 1) {

                this.setViewImportantInfo(`Checkpoint ${this.gameTimers[vehicleNumber].getCurrentLapTime().toFixed(2)}`, vehicleNumber, true)
            } else {
                const info = this.getCheckpointDiff(vehicleNumber, checkpointNumber)
                this.setViewImportantInfo(`Checkpoint ${info}`, vehicleNumber, true)
            }

            const { position, rotation } = this.course.getCheckpointPositionRotation(checkpointNumber)
            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: position.x, y: position.y + 1, z: position.z }, rotation: rotation })
        }
    }


    // get difference betwee first and this
    // if this is first just retun the current lap time
    getCheckpointDiff(vehicleNumber: number, checkpointNumber: number): string {
        let bestTime = Infinity
        const lapNumber = this.gameTimers[vehicleNumber].getCurrentLapNumber()
        for (let i = 0; i < this.gameTimers.length; i++) {
            if (i !== vehicleNumber) {

                const checkpTime = this.gameTimers[i].getCheckpointTime(checkpointNumber, lapNumber)
                if (checkpTime) {
                    bestTime = checkpTime
                }
            }
        }

        const currCheckpTime = this.gameTimers[vehicleNumber].getCheckpointTime(checkpointNumber, lapNumber)
        if (!currCheckpTime || currCheckpTime < bestTime) return this.gameTimers[vehicleNumber].getCurrentLapTime().toFixed(2)
        return `+${(currCheckpTime - bestTime).toFixed(2)}`
    }

    sendScoreInfo() {
        if (this.gameRoomActions.updateScoreInfo) {
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
                    numberOfLaps: this.currentNumberOfLaps,
                    points: this.gameTimers[i].points
                }
                timeInfos.push(timeInfoObject)

            }
            this.gameRoomActions.updateScoreInfo({ timeInfos })
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

            if (this.viewsLapsInfo[i]?.textContent) {

                this.viewsLapsInfo[i].textContent = `${this.gameTimers[i].lapNumber} / ${this.currentNumberOfLaps}`
            }
        }

        // if (this.gameRoomActions.updateScoreTable) {
        //     this.gameRoomActions.updateScoreTable({ timeInfos })
        // }

        this.totalTimeDiv.textContent = maxTotalTime.toFixed(2)
        // if (this.gameSceneConfig.onlyMobile) {
        //     this.viewsNameInfo[0].textContent = `${this.gameTimers[0].lapNumber} / ${this.currentNumberOfLaps}`
        // }



        if (this.gameStarted && !this.isPaused) {
            if (this.ghostVehicle && maxTotalTime > 0) {
                this.ghostDriver.setPlace(this.ghostVehicle, maxTotalTime, delta)
            }
            if (this.driverRecorder && maxTotalTime > 0) {
                this.driverRecorder.record(this.vehicles[0], maxTotalTime)
            }
        }
    }

    updateBot(delta: number) {
        if (this.bot) {

            this.bot.update(delta)
            if (this.gameStarted) {
                this.bot.driveBot()
            }
        }
    }


    _updateChild(time: number, delta: number) {
        this.time = time
        this.updateFps(time)


        if (this.everythingReady()) {
            this.course.updateCourse()
            this.updateBot(delta)


            if (inTestMode) {
                driveVehicleWithKeyboard(this.vehicles[0])
            }
            this.updateScoreTable(time, delta)

            this.updateVehicles(delta)

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
            totalPing: this.totalPing,
            totalPingsGotten: this.totalPingsGotten,
            avgFps: this.totalNumberOfFpsTicks === 0 ? -1 : this.totalFpsTicks / this.totalNumberOfFpsTicks,
            vehicleSetup: this.vehicles[i].vehicleSetup,
            userAgent: window.navigator?.userAgent ?? "undefined"
        }

        if (this.gameSettings.record && this.driverRecorder) {
            playerData.recordingFilename = this.driverRecorder.getRecordingFilename()
        }

        // need to do it this way because firestore cannot have undefined
        if (this.roomSettings.tournamentId) {
            playerData.tournamentId = this.roomSettings.tournamentId
        }

        if (this.gameRoomActions.playerFinished) {
            this.gameRoomActions.playerFinished(playerData)
        }

        if (i === 0 && this.driverRecorder && this.roomSettings?.tournamentId) {
            this.driverRecorder.saveTournamentRecording(+this.gameTimers[i].getTotalTime().toFixed(2), this.players[i].playerName, this.players[i].id,)
        }
    }


    prepareEndOfGameData() {
        const playerGameInfos: IPlayerGameInfo[] = []
        this.sendScoreInfo()

        for (let i = 0; i < this.vehicles.length; i++) {

            playerGameInfos.push({
                id: this.players[i].id,
                name: this.players[i].playerName,
                totalTime: +this.gameTimers[i].getTotalTime().toFixed(2),
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
            roomSettings: this.roomSettings,
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

    saveDriveRecording(playerId: string): void {
        if (this.gameSettings.record && this.driverRecorder?.instructions) {
            this.driverRecorder.saveRecordedInstructions()
        }
    }
}


