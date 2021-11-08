import * as THREE from "@enable3d/three-wrapper/node_modules/three"

const around = (num: number) => {
    return Math.floor(num * 100) / 100
}

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
    totalTime: number

    constructor(totalNumberOfLaps: number) {
        this.totalNumberOfLaps = totalNumberOfLaps
        this.lapNumber = 1
        this.bestLapTime = Infinity
        this.clock = new THREE.Clock(false)
        this.isPaused = true
        this.currentLapTime = 0
        this.isCheckpointCrossed = false
        this.lapTimes = []
        this.totalTime = 0
    }

    start() {
        this.isPaused = false
        this.clock.start()
    }

    stop() {
        this.currentLapTime = this.getCurrentLapTime()
        this.clock.stop()
        this.isPaused = true
    }

    getCurrentLapTime() {
        if (this.isPaused) return this.currentLapTime
        return around(this.currentLapTime + this.clock.getElapsedTime())
    }

    lapDone() {
        if (this.finished()) return
        const lapTime = this.getCurrentLapTime()
        this.lapTimes.push(lapTime)
        this.totalTime += lapTime
        this.bestLapTime = Math.min(lapTime, this.bestLapTime)
        this.clock.stop()
        this.clock.start()
        this.currentLapTime = 0
        this.isCheckpointCrossed = false
        if (this.finished()) {
            this.stop()
        } else {
            this.lapNumber += 1
        }
    }

    getTotalTime() {
        if (this.finished()) return around(this.totalTime)
        return this.totalTime + this.getCurrentLapTime()
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
        this.totalTime = 0
        this.lapNumber = 1
        this.lapTimes = []
        this.bestLapTime = Infinity
    }
}