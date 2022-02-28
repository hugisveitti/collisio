import { Vector3 } from "three";
import { BotDifficulty } from "../classes/localGameSettings";
import { angleBetweenVectors, radToDeg } from "../utils/utilFunctions";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "./LowPolyVehicle";
import { IVehicleClassConfig } from "./Vehicle";



const getVehicleType = (difficulty: BotDifficulty) => {
    switch (difficulty) {
        case "easy":
            return "normal2"
        case "medium":
            return "future"
        case "hard":
            return "f1"
        case "none":
            return "normal2"
    }
}

export class BotVehicle extends LowPolyVehicle {
    /** 
     * the dir it is looking for 
     */
    dirNum: number = 0

    // The direction it is following
    direction: Vector3

    goSlow: boolean | number
    prevPosition: Vector3
    stuckTicks: number

    botDifficulty: BotDifficulty
    botSpeed: number
    speedMult: number
    slowMult: number
    turnAngle: number
    targetReached: boolean

    constructor(botDifficulty: BotDifficulty, config: IVehicleClassConfig) {
        super({ ...config, vehicleType: getVehicleType(botDifficulty), vehicleSetup: { ...config.vehicleSetup, vehicleType: getVehicleType(botDifficulty) } })
        this.stuckTicks = 0
        this.prevPosition = new Vector3(0, 0, 0)
        this.botDifficulty = botDifficulty
        this.botSpeed = 100
        this.speedMult = 1
        this.turnAngle = 0
        this.targetReached = false

        if (botDifficulty === "easy") {
            this.botSpeed = 200
            this.slowMult = 1
        } else if (botDifficulty === "medium") {
            this.botSpeed = 210
            this.slowMult = 0.8
        } else if (botDifficulty === "hard") {
            this.botSpeed = 400
            this.slowMult = .5
        }

        if (botDifficulty === "none") {
        } else {

            //  this.loadModels()
        }
        this.setCanDrive(true)
    }

    restartBot() {
        if (!this.vehicleBody) return
        this.resetPosition()

        this.noForce(true)
        this.noTurn()
        this.dirNum = 0
        this.targetReached = false
        this.getNextDir()
    }

    getNextDir() {
        if (!this.targetReached) {
            this.dirNum -= 1
            this.dirNum = Math.max(0, this.dirNum)
        }
        const info = this.scene.course.nextBotDir(this.dirNum)
        this.targetReached = false
        if (info) {
            this.dirNum = info.nextNum
            this.direction = info.pos
            this.goSlow = info.goSlow
            if (typeof this.goSlow === "number") {
                this.speedMult = this.goSlow
            } else if (this.goSlow) {
                this.speedMult = this.slowMult
                this.break()
            } else {
                this.speedMult = 1
            }
        }
    }

    checkReachedNextPos() {
        const p = this.getPosition()

        if (p.distanceTo(this.direction) < 20) {
            this.targetReached = true
            this.getNextDir()
        }
    }

    getTurnDir() {

        if (!this.direction) return

        let angle = angleBetweenVectors(this.direction, this.getPosition())
        // let angle = angleBetweenVectors(this.getPosition(), this.direction)
        const q = this.vehicleBody.quaternion
        //  angle = -Math.abs(angle)// * //Math.sign(q.w)

        let y = 2 * Math.asin(q.y) * Math.sign(q.w)
        //  let y = this.vehicleBody.rotation.y
        // if (Math.abs(angle) - Math.abs(y) < .01) {
        //     angle = y
        // }

        let turn = angle - y
        if (turn > Math.PI) {
            turn = Math.PI - turn
            turn = turn % Math.PI
        }
        else if (turn < -Math.PI) {
            turn = Math.PI - turn
            turn = turn % Math.PI
        }

        return turn
    }

    checkIfStuck() {
        if (this.prevPosition.distanceTo(this.vehicleBody.position) < 4) {
            this.stuckTicks += 1
            this.stuckTicks = Math.min(this.stuckTicks, 190)

        } else {
            this.prevPosition = this.vehicleBody.position.clone()
            this.stuckTicks = 0
        }
    }

    // need to have orientation of vehicle
    driveBot() {
        if (!this.vehicleBody || !this.direction) return
        const angle = this.getTurnDir()

        const deg = angle * radToDeg

        this.turn(deg)

        if (this.stuckTicks > 60) {
            this.turn(-deg)
            this.goBackward()
            this.stuckTicks -= 1
        } else if (this.getCurrentSpeedKmHour() < this.botSpeed * this.speedMult) {
            this.goForward()

        } else {
            this.noForce()
        }



        this.checkReachedNextPos()
        this.checkIfStuck()
    }

    loadModels() {


    }

}