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

    constructor(botDifficulty: BotDifficulty, config: IVehicleClassConfig) {
        super({ ...config, vehicleType: getVehicleType(botDifficulty), vehicleSetup: { ...config.vehicleSetup, vehicleType: getVehicleType(botDifficulty) } })
        this.stuckTicks = 0
        this.prevPosition = new Vector3(0, 0, 0)
        this.botDifficulty = botDifficulty
        this.botSpeed = 100
        this.speedMult = 1
        this.turnAngle = 0

        if (botDifficulty === "easy") {
            this.botSpeed = 120
            this.slowMult = 1
        } else if (botDifficulty === "medium") {
            this.botSpeed = 210
            this.slowMult = 0.8
        } else if (botDifficulty === "hard") {
            this.botSpeed = 500
            this.slowMult = .5
        }

        if (botDifficulty === "none") {
            console.log("No bot difficulty selected")
        } else {

            //  this.loadModels()
        }
    }

    restartBot() {
        console.log("restarting bot")
        this.resetPosition()
        this.dirNum = 0
        this.getNextDir()
    }

    getNextDir() {
        const info = this.scene.course.nextBotDir(this.dirNum)

        console.log("got next dir", info)
        if (info) {
            this.dirNum = info.nextNum
            this.direction = info.pos
            this.goSlow = info.goSlow
            console.log("go slow", this.goSlow)
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

        // this.turnAngle = (this.turnAngle - ((this.turnAngle - turn) * .2))
        // if (this.dirNum === 7) {

        //     console.log("turn angle", this.turnAngle.toFixed(2), "turn:", turn.toFixed(2), "y:", y.toFixed(2), "angel:", angle.toFixed(2))
        // }
        //if (Math.abs(this.turnAngle) < Math.PI / 8) return 0
        return turn
        return this.turnAngle

    }

    checkIfStuck() {
        if (this.prevPosition.distanceTo(this.vehicleBody.position) < 4) {
            this.stuckTicks += 1
            this.stuckTicks = Math.min(this.stuckTicks, 170)
            // console.log("stuck")
        } else {
            this.prevPosition = this.vehicleBody.position.clone()
            this.stuckTicks = 0
        }
    }

    // need to have orientation of vehicle
    driveBot() {
        if (!this.vehicleBody || !this.direction) return
        const angle = this.getTurnDir()
        // console.log("angle", angle)
        const deg = angle * radToDeg
        //console.log("deg", deg)
        this.turn(deg)

        if (this.stuckTicks > 70) {
            this.turn(0)
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