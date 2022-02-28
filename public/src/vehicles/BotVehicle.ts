import { Vector3 } from "three";
import { BotDifficulty } from "../classes/localGameSettings";
import { VehicleType } from "../shared-backend/shared-stuff";
import { vehicleItems } from "../shared-backend/vehicleItems";
import { angleBetweenVectors, radToDeg } from "../utils/utilFunctions";
import { loadLowPolyVehicleModels, LowPolyVehicle } from "./LowPolyVehicle";
import { IVehicleClassConfig } from "./Vehicle";



const getVehicleType = (difficulty: BotDifficulty): VehicleType => {
    switch (difficulty) {
        case "easy":
            return "normal2"
        case "medium":
            return "future"
        case "hard":
            return "f1"
        case "extreme":
            return "sportsCar"
        case "none":
            return "normal2"
    }
}

export class BotVehicle extends LowPolyVehicle {
    /** 
     * the dir it is looking for 
     */
    dirNum: number = 0
    nextDirNum: number = 0

    // The direction it is following
    direction: Vector3
    nextDirection: Vector3

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
        super({ ...config, vehicleType: getVehicleType(botDifficulty), vehicleSetup: { ...config.vehicleSetup, vehicleType: getVehicleType(botDifficulty), exhaust: vehicleItems[getVehicleType(botDifficulty)]["exhaust1"], spoiler: vehicleItems[getVehicleType(botDifficulty)]["spoiler1"] } })
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
        } else if (botDifficulty === "extreme") {
            this.botSpeed = 500
            this.slowMult = .5
        }


        if (botDifficulty === "none") {
        } else {

            //  this.loadModels()
        }
        this.setCanDrive(true)
    }

    _createVehicle() {
        this.vehicleConfig.frictionSlip = 27.5
        this.updateWheelsSuspension()
    }

    restartBot() {
        if (!this.vehicleBody) return
        this.resetPosition()

        this.noForce(true)
        this.noTurn()
        this.dirNum = 0
        this.targetReached = false
        this.getNextDir(false)
    }

    getNextDir(useNextNum?: boolean) {
        if (!this.targetReached) {
            this.dirNum -= 1
            this.dirNum = Math.max(0, this.dirNum)
        } if (useNextNum) {

            this.dirNum = this.nextDirNum
        }
        const info = this.scene.course.nextBotDir(this.dirNum)
        this.targetReached = false
        if (info) {
            this.dirNum = info.nextNum
            this.nextDirNum = info.nextNextNum
            this.nextDirection = info.nextPos
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

        const currDist = p.distanceTo(this.direction)
        const nextDist = p.distanceTo(this.nextDirection)
        if (currDist < 10 || nextDist < 10) {
            this.targetReached = true


            this.getNextDir(nextDist < currDist)
        }
    }

    getTurnDir() {

        if (!this.direction) return

        let angle = angleBetweenVectors(this.direction, this.getPosition())
        const q = this.vehicleBody.quaternion
        let y = 2 * Math.asin(q.y) * Math.sign(q.w)
        let turn = angle - y
        if (turn > Math.PI) {
            turn = - (turn % Math.PI)
        }
        else if (turn < -Math.PI) {
            turn = - (turn % Math.PI)
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