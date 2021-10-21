import * as THREE from "@enable3d/three-wrapper/node_modules/three"

export class GameTime {

    lapNumber: number
    totalTime: number
    bestLapTime: number
    currentLapStart: number
    isPaused: boolean
    currentLapTime: number
    clock: THREE.Clock
    pauseClock: THREE.Clock

    constructor() {
        console.log("creating game time class")
        this.lapNumber = 0
        this.totalTime = 0
        this.bestLapTime = Infinity
        this.clock = new THREE.Clock(false)
        this.pauseClock = new THREE.Clock(false)
        this.isPaused = true
        this.currentLapTime = 0
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
        console.log("lapTime", lapTime)
        this.bestLapTime = Math.min(lapTime, this.bestLapTime)
        this.lapNumber += 1
        this.clock.stop()
        this.clock.start()
        this.currentLapTime = 0
    }

    getBestLapTime() {
        return this.bestLapTime
    }

    restart() {
        this.clock.stop()
    }
}