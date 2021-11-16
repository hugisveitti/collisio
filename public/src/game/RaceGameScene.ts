import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Socket } from "socket.io-client";
import Stats from "stats.js";
import { v4 as uuid } from "uuid";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer, IPlayerGameInfo, IPreGameSettings, IRaceTimeInfo } from "../classes/Game";
import { IUserGameSettings } from "../classes/User";
import { IPlayerInfo, VehicleControls } from '../shared-backend/shared-stuff';
import { IRaceCourse } from "../course/ICourse";
import { RaceCourse } from "../course/RaceCourse";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import "./game-styles.css";
import { GameScene, IEndOfGameData, IGameRoomActions } from "./GameScene";
import { GameTime } from "./GameTimeClass";


const stats = new Stats()
const totalTimeDiv = document.createElement("div")


export class RaceGameScene extends GameScene {

    vehicleControls!: VehicleControls

    winner: string
    winTime: number

    pLight: THREE.PointLight

    gameTimers: GameTime[]

    /** delete if reset */
    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout
    course: IRaceCourse


    constructor() {
        super()

        document.body.appendChild(totalTimeDiv)
        totalTimeDiv.setAttribute("style", `
        position:absolute;
        top:25px;
        left:50%;
        transform:translate(-50%, 0);
        font-family:monospace;
        font-size:64px;
        text-shadow:1px 1px white;
        `)

        this.winner = ""
        this.winTime = -1
        this.gameTimers = []

        stats.showPanel(0)
        document.body.appendChild(stats.dom)
    }

    async create() {
        this.course = new RaceCourse(this, this.preGameSettings.trackName, (o: ExtendedObject3D) => this.handleGoalCrossed(o), (o: ExtendedObject3D) => this.handleCheckpointCrossed(o))
        this.course.createCourse(this.useShadows, () => {
            this.courseLoaded = true
            const createVehiclePromise = new Promise((resolve, reject) => {
                this.createVehicles(() => {
                    resolve("successfully created all vehicles")
                })
            })

            createVehiclePromise.then(() => {

                // adds font to vehicles, which displays names
                for (let i = 0; i < this.players.length; i++) {
                    this.gameTimers.push(new GameTime(this.preGameSettings.numberOfLaps))
                }
                this.loadFont()
                this.createViews()
                this.createController()
                this.resetVehicles()
                this.startRaceCountdown()

            })

        })
    }

    startRaceCountdown() {
        let countdown = 4
        this.startGameSong()
        // makes vehicle fall
        for (let vehcile of this.vehicles) {
            vehcile.start()
        }

        /** hacky way to make vehicles stopp
         * TODO: not this, find a way to make vechicles reliably start on the ground paused..
         */
        setTimeout(() => {
            for (let vehcile of this.vehicles) {
                const r = vehcile.getRotation()
                const gR = this.course.startRotation
                vehcile.setRotation(0, gR.y, 0)
                vehcile.stop()

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
                    this.showViewsImportantInfo("GO!!!!")
                    // this.showImportantInfo("GO!!!!")
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




    _togglePauseGame(isPaused: boolean) {
        for (let i = 0; i < this.vehicles.length; i++) {
            if (isPaused) {
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

        for (let i = 0; i < this.players.length; i++) {
            this.gameTimers.push(new GameTime(this.preGameSettings.numberOfLaps))
        }
    }

    _startAllVehicles() {
        for (let i = 0; i < this.vehicles.length; i++) {
            this.gameTimers[i].start()
        }
    }

    _restartGame() {

        window.clearTimeout(this.countDownTimeout)
        window.clearTimeout(this.gameStartingTimeOut)
        this.clearTimouts()

        this.gameStarted = false
        this.winner = ""
        this.winTime = -1

        const sec = 2

        this.showViewsImportantInfo("Race countdown starting in " + sec + " seconds")
        //this.showImportantInfo("Race starting in " + sec + " seconds")
        // this.showImportantInfo("Race starting in " + sec + " seconds")
        this.gameStartingTimeOut = setTimeout(() => {
            this.startRaceCountdown()
        }, sec * 1000)
    }


    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = vehicle.body.name.slice(8, 9)
        if (this.gameTimers[vehicleNumber].isCheckpointCrossed) {
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
            this.prepareEndOfGameData()
        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        const vehicleNumber = vehicle.body.name.slice(8, 9)
        this.gameTimers[vehicleNumber].checkpointCrossed()

        const p = this.course.checkpointSpawn.position
        const r = this.course.checkpointSpawn.rotation
        this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: p.y + 1, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })
    }


    updateScoreTable() {
        const timeInfos: IRaceTimeInfo[] = []
        let maxTotalTime = 0

        for (let i = 0; i < this.vehicles.length; i++) {
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
                numberOfLaps: this.preGameSettings.numberOfLaps
            }
            timeInfos.push(timeInfoObject)
        }

        if (this.gameRoomActions.updateScoreTable) {
            this.gameRoomActions.updateScoreTable(timeInfos)
        }

        totalTimeDiv.innerHTML = maxTotalTime.toFixed(2)
    }



    update() {
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
            numberOfLaps: this.preGameSettings.numberOfLaps,
            playerName: this.players[i].playerName,
            playerId: this.players[i].id,
            bestLapTime: this.gameTimers[i].getBestLapTime(),
            trackType: this.preGameSettings.trackName,
            lapTimes: this.gameTimers[i].getLapTimes(),
            gameId: this.gameId,
            date: new Date(),
            private: false,
            isAuthenticated: this.players[i].isAuthenticated,
            vehicleType: this.players[i].vehicleType,
            engineForce: this.vehicles[i].engineForce,
            breakingForce: this.vehicles[i].breakingForce,
            steeringSensitivity: this.vehicles[i].steeringSensitivity
        }

        console.log("end of race player prepare ", playerData)
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
            numberOfLaps: this.preGameSettings.numberOfLaps,
            trackType: this.preGameSettings.trackName,
            gameId: this.gameId,
            roomId: this.roomId,
            date: new Date()
        }
        console.log("prepare endo of race data")
        if (this.gameRoomActions.gameFinished) {
            this.gameRoomActions.gameFinished({ endOfRaceInfo })
        }
        // wa
        // if save then update gameId
        this.gameId = uuid()
    }
}


// export const startRaceGame = (socket: Socket, players: IPlayerInfo[], gameSettings: IPreGameSettings, userGameSettings: IUserGameSettings, roomId: string, gameRoomActions: IGameRoomActions, callback: (gameObject: RaceGameScene) => void) => {
//     const config = { scenes: [RaceGameScene], antialias: true }
//     PhysicsLoader("/ammo", () => {
//         const project = new Project(config)

//         const key = project.scenes.keys().next().value;

//         // hacky way to get the project's scene
//         const gameObject = (project.scenes.get(key) as RaceGameScene);
//         gameObject.setSocket(socket);
//         gameObject.setPlayers(players);
//         gameObject.setGameRoomActions(gameRoomActions)
//         gameObject.setPreGameSettings(gameSettings, roomId);
//         gameObject.setUserGameSettings(userGameSettings);
//         //setUnpauseFunc((project.scenes.get(key) as OneMonitorRaceGameScene).unpauseGame)
//         callback(gameObject)

//         return project
//     })
// }
