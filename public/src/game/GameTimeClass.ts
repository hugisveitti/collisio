import { Clock } from "three"

const around = (num: number) => {
    return Math.floor(num * 100) / 100
}

export class GameTime {

    lapNumber: number
    bestLapTime: number
    currentLapStart: number
    isPaused: boolean
    currentLapTime: number
    clock: Clock
    pauseClock: Clock
    isCheckpointCrossed: boolean[]
    totalNumberOfLaps: number
    lapTimes: number[]
    totalTime: number
    hasSendRaceData: boolean

    constructor(totalNumberOfLaps: number, numberOfCheckpoints: number) {
        this.totalNumberOfLaps = totalNumberOfLaps
        this.lapNumber = 1
        this.bestLapTime = Infinity
        this.clock = new Clock(false)
        this.isPaused = true
        this.currentLapTime = 0
        this.isCheckpointCrossed = []
        for (let i = 0; i < numberOfCheckpoints; i++) {
            this.isCheckpointCrossed.push(false)
        }
        this.lapTimes = []
        this.totalTime = 0
        this.hasSendRaceData = false
    }

    resetCheckpoints() {
        for (let i = 0; i < this.isCheckpointCrossed.length; i++) {
            this.isCheckpointCrossed[i] = false
        }
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
        this.resetCheckpoints()
        if (this.finished()) {
            this.stop()
        } else {
            this.lapNumber += 1
        }
    }

    allCheckpointsCrossed() {

        for (let p of this.isCheckpointCrossed) {
            if (!p) return false
        }
        return true
    }

    getTotalTime() {
        if (this.finished()) return around(this.totalTime)
        return this.totalTime + this.getCurrentLapTime()
    }

    checkpointCrossed(checkpointNumber: number) {
        /**
         * checkpoints indexed at 1 in blender
         */
        this.isCheckpointCrossed[checkpointNumber - 1] = true
    }

    crossedCheckpoint(checkpointNumber: number) {
        return this.isCheckpointCrossed[checkpointNumber - 1]
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
        this.hasSendRaceData = false
    }


}