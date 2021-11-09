import * as THREE from '@enable3d/three-wrapper/dist/index';
import { ExtendedObject3D, PhysicsLoader, Project } from "enable3d";
import { Howl } from "howler";
import { Socket } from "socket.io-client";
import Stats from "stats.js";
import { v4 as uuid } from "uuid";
import { IEndOfGameInfoGame, IEndOfGameInfoPlayer, IPlayerGameInfo, IPreGameSettings } from "../classes/Game";
import { IUserGameSettings } from "../classes/User";
import { saveGameData } from "../firebase/firebaseFunctions";
import { VehicleControls, IPlayerInfo } from '../shared-backend/shared-stuff';
import { IRaceCourse } from "../shared-game-components/ICourse";
import { RaceCourse } from "../shared-game-components/RaceCourse";
import { driveVehicleWithKeyboard } from "../utils/controls";
import { inTestMode } from "../utils/settings";
import "./game-styles.css";
import { GameScene } from "./GameScene";
import { GameTime } from "./GameTimeClass";


const stats = new Stats()
const scoreTable = document.createElement("div")


export class RaceGameScene extends GameScene {

    vehicleControls!: VehicleControls

    winner: string
    winTime: number

    escPress: () => void
    pLight: THREE.PointLight

    gameTimers: GameTime[]

    /** delete if reset */
    countDownTimeout: NodeJS.Timeout
    gameStartingTimeOut: NodeJS.Timeout
    course: IRaceCourse

    constructor() {
        super()

        scoreTable.setAttribute("id", "score-info")
        document.body.appendChild(scoreTable)

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
                vehcile.stop()

            }
        }, (2) * 1000)

        const timer = () => {
            this.playCountdownBeep()
            this.showImportantInfo(countdown + "")
            countdown -= 1
            this.countDownTimeout = setTimeout(() => {
                if (countdown > 0) {

                    timer()

                } else {
                    this.playStartBeep()
                    this.showImportantInfo("GO!!!!")
                    this.startAllVehicles()
                    this.gameStarted = true

                    setTimeout(() => {
                        this.clearImportantInfo()
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

        this.gameStarted = false
        this.winner = ""
        this.winTime = -1



        const sec = 2
        this.showImportantInfo("Race starting in " + sec + " seconds")
        this.gameStartingTimeOut = setTimeout(() => {
            this.startRaceCountdown()
        }, sec * 1000)
    }


    handleGoalCrossed(vehicle: ExtendedObject3D) {

        const vehicleNumber = vehicle.body.name.slice(8, 9)
        if (this.gameTimers[vehicleNumber].isCheckpointCrossed) {
            this.gameTimers[vehicleNumber].lapDone()


            const cLapTime = this.gameTimers[vehicleNumber].getCurrentLapTime()

            const p = this.course.goalSpawn.position
            const r = this.course.goalSpawn.rotation
            this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: 4, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })

            if (this.gameTimers[vehicleNumber].finished() && this.gameStarted) {
                const totalTime = this.gameTimers[vehicleNumber].getTotalTime()

                if (this.winner === "") {
                    this.winner = this.players[vehicleNumber].playerName
                    this.winTime = totalTime
                }
                this.checkRaceOver()
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
            this.showImportantInfo(`Race over <br /> ${this.winner} won with total time ${this.winTime} <br /> Press 'r' to reset game`)
            this.gameStarted = false
            this.prepareEndOfGameData()
        }
    }

    handleCheckpointCrossed(vehicle: ExtendedObject3D) {
        const vehicleNumber = vehicle.body.name.slice(8, 9)
        this.gameTimers[vehicleNumber].checkpointCrossed()

        const p = this.course.checkpointSpawn.position
        const r = this.course.checkpointSpawn.rotation
        this.vehicles[vehicleNumber].setCheckpointPositionRotation({ position: { x: p.x, y: 4, z: p.z }, rotation: { x: 0, z: 0, y: r.y } })
    }


    updateScoreTable() {
        let s = "<table><th>Player |</th><th>Best LT |</th><th>Curr LT |</th><th>TT |</th><th>Ln</th>"
        for (let i = 0; i < this.vehicles.length; i++) {
            let cLapTime = this.gameTimers[i].getCurrentLapTime().toFixed(2)
            const bLT = this.gameTimers[i].getBestLapTime() === Infinity ? "-" : this.gameTimers[i].getBestLapTime()
            let totalTime = this.gameTimers[i].getTotalTime()
            if (this.gameTimers[i].finished()) {
                cLapTime = "Fin"
            }
            s += `<tr><td>${this.players[i].playerName}</td><td>${bLT}</td><td>${cLapTime}</td><td>${totalTime.toFixed(2)}</td><td>${this.gameTimers[i].lapNumber} / ${this.preGameSettings.numberOfLaps}</td></tr>`
        }
        s += "</table>"
        scoreTable.innerHTML = s
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

    prepareEndOfGameData() {
        const playerGameInfos: IPlayerGameInfo[] = []
        const playersData: IEndOfGameInfoPlayer[] = []
        for (let i = 0; i < this.vehicles.length; i++) {
            const playerData: IEndOfGameInfoPlayer = {
                totalTime: this.gameTimers[i].getTotalTime(),
                numberOfLaps: this.preGameSettings.numberOfLaps,
                playerName: this.players[i].playerName,
                playerId: this.players[i].id,
                bestLapTime: this.gameTimers[i].getBestLapTime(), //  this.bestLapTime[i],
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
            playersData.push(playerData)
            playerGameInfos.push({
                id: this.players[i].id ?? "undefined",
                name: this.players[i].playerName,
                totalTime: this.gameTimers[i].getTotalTime(),
                lapTimes: this.gameTimers[i].getLapTimes(),
                vehicleType: this.players[i].vehicleType,
                engineForce: this.vehicles[i].engineForce,
                breakingForce: this.vehicles[i].breakingForce,
                steeringSensitivity: this.vehicles[i].steeringSensitivity
            })
        }

        const endOfGameInfo: IEndOfGameInfoGame = {
            playersInfo: playerGameInfos,
            numberOfLaps: this.preGameSettings.numberOfLaps,
            trackType: this.preGameSettings.trackName,
            gameId: this.gameId,
            roomId: this.roomId,
            date: new Date()
        }

        saveGameData(playersData, endOfGameInfo)
        // if save then update gameId
        this.gameId = uuid()
    }
}


export const startRaceGame = (socket: Socket, players: IPlayerInfo[], gameSettings: IPreGameSettings, userGameSettings: IUserGameSettings, roomId: string, escPress: () => void, callback: (gameObject: RaceGameScene) => void) => {
    const config = { scenes: [RaceGameScene], antialias: true }
    PhysicsLoader("./ammo", () => {
        const project = new Project(config)

        const key = project.scenes.keys().next().value;

        // hacky way to get the project's scene
        const gameObject = (project.scenes.get(key) as RaceGameScene);
        gameObject.setSocket(socket);
        gameObject.setPlayers(players);
        gameObject.setPreGameSettings(gameSettings, roomId, escPress);
        gameObject.setUserGameSettings(userGameSettings);
        //setUnpauseFunc((project.scenes.get(key) as OneMonitorRaceGameScene).unpauseGame)
        console.log("starting game, players", players)
        callback(gameObject)

        return project
    })

}
