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
    // for each checkpoint there are lap times
    checkpointTimes: number[][]
    // if player starts when game has started
    offset: number
    /** Points in splitscreen */
    points: number

    constructor(totalNumberOfLaps: number, numberOfCheckpoints: number) {
        this.clock = new Clock(false)
        this.restart(totalNumberOfLaps, numberOfCheckpoints)
    }

    resetCheckpoints() {
        for (let i = 0; i < this.isCheckpointCrossed.length; i++) {
            this.isCheckpointCrossed[i] = false
        }
    }

    getLatestLapTime() {
        if (this.lapTimes.length === 0) {
            return -1
        }

        return this.lapTimes[this.lapTimes.length - 1]
    }

    start(offset?: number) {
        if (offset) {
            this.offset = offset / 1000
        }
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
        return (this.currentLapTime + this.clock.getElapsedTime() + this.offset)
    }

    lapDone() {
        if (this.finished()) return
        const lapTime = this.getCurrentLapTime()
        this.offset = 0
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
        if (this.finished()) return (this.totalTime)
        return this.totalTime + this.getCurrentLapTime()
    }

    checkpointCrossed(checkpointNumber: number) {

        if (!this.isCheckpointCrossed[checkpointNumber - 1]) {
            this.checkpointTimes[checkpointNumber - 1].push(around(this.getTotalTime()))
        }
        /**
         * checkpoints indexed at 1 in blender
         */
        this.isCheckpointCrossed[checkpointNumber - 1] = true
    }

    /**
     * 
     * @param checkpointNumber 
     * @param lapNumber 
     * @returns undefined if hasn't crossed the checkpoint that lap number 
     */
    getCheckpointTime(checkpointNumber: number, _lapNumber: number): number | undefined {
        const lapNumberIndex = _lapNumber - 1
        const checkpointIndex = checkpointNumber - 1
        if (this.checkpointTimes.length > checkpointIndex && this.checkpointTimes[checkpointIndex].length > lapNumberIndex) {
            return this.checkpointTimes[checkpointIndex][lapNumberIndex]
        }
        return undefined
    }

    getCurrentLapNumber() {
        return this.lapNumber
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

    restart(totalNumberOfLaps: number, numberOfCheckpoints: number) {
        this.clock.stop()
        this.totalTime = 0
        this.lapNumber = 1
        this.lapTimes = []
        this.bestLapTime = Infinity
        this.hasSendRaceData = false
        this.totalNumberOfLaps = totalNumberOfLaps
        this.offset = 0
        this.lapNumber = 1
        this.bestLapTime = Infinity
        this.isPaused = true
        this.currentLapTime = 0
        this.isCheckpointCrossed = []
        this.checkpointTimes = []
        for (let i = 0; i < numberOfCheckpoints; i++) {
            this.isCheckpointCrossed.push(false)
            this.checkpointTimes.push([])
        }
        this.lapTimes = []
        this.totalTime = 0
        this.hasSendRaceData = false
        this.points = 0
    }


}