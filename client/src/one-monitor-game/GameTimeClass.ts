import * as THREE from "@enable3d/three-wrapper/node_modules/three"

export class GameTime {

    lapNumber: number
    bestLapTime: number
    currentLapStart: number
    isPaused: boolean
    currentLapTime: number
    clock: THREE.Clock
    pauseClock: THREE.Clock
    isCheckpointCrossed: boolean
    totalNumberOfLaps: number
    lapTimes: number[]

    constructor(totalNumberOfLaps: number) {
        this.totalNumberOfLaps = totalNumberOfLaps
        this.lapNumber = 1
        this.bestLapTime = Infinity
        this.clock = new THREE.Clock(false)
        this.isPaused = true
        this.currentLapTime = 0
        this.isCheckpointCrossed = false
        this.lapTimes = []
    }

    start() {
        this.isPaused = false
        console.log("starting game", this.currentLapTime)
        this.clock.start()
    }

    stop() {
        this.currentLapTime = this.getCurrentLapTime()
        this.clock.stop()
        console.log("stopping clock curr lap time", this.currentLapTime)
        this.isPaused = true
    }

    getCurrentLapTime() {
        if (this.isPaused) return this.currentLapTime
        return Math.round((this.currentLapTime + this.clock.getElapsedTime()) * 100) / 100
    }

    lapDone() {
        const lapTime = this.getCurrentLapTime()
        this.bestLapTime = Math.min(lapTime, this.bestLapTime)
        this.lapNumber += 1
        this.clock.stop()
        this.clock.start()
        this.lapTimes.push(lapTime)
        this.currentLapTime = 0
        this.isCheckpointCrossed = false
        if (this.finished()) {
            this.stop()
        }
    }

    getTotalTime() {
        let total = 0
        for (let lapTime of this.lapTimes) {
            total += lapTime
        }
        return Math.floor(total + this.getCurrentLapTime() * 100) / 100
    }

    checkpointCrossed() {
        this.isCheckpointCrossed = true
    }

    getBestLapTime() {
        return this.bestLapTime
    }

    getLapTimes() {
        return this.lapTimes
    }

    finished() {
        return this.lapNumber > this.totalNumberOfLaps
    }

    restart() {
        this.clock.stop()
    }
}