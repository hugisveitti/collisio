/** will be similar to the game time class
 * as each vehicle will be asciated with one tagobjectclass
 */

import { Scene3D } from "enable3d"
import { chocolateColor, Coin, itColor, notItColor } from "../course/TagCourse"
import { IVehicle } from "../vehicles/IVehicle"

export class TagObject {

    isIt: boolean
    coinCount: number
    /** you get 3 number of resets? */
    numberOfResets: number
    totalNumberOfResets: number

    /** if is chocolate then cannot be it */
    isChocolate: boolean
    chocolateTime: number

    vehicle: IVehicle

    constructor(vehicle: IVehicle) {
        this.isIt = false
        this.coinCount = 0
        this.numberOfResets = 0
        this.totalNumberOfResets = 3
        this.isChocolate = false

        this.vehicle = vehicle

        this.chocolateTime = 6
    }

    coinCollision(coin: Coin, scene: Scene3D) {
        if (!this.isIt) {
            this.coinCount += 1
            coin.removeFromScene(scene)
            return true
        }
    }

    /**
     * 
     * @param isIt true if is it else false
     * @param noChocolate if another vehicle presses reset then noChocolate will be true
     */
    setIsIt(isIt: boolean, noChocolate?: boolean) {
        this.isIt = isIt
        if (!this.isIt) {
            if (!noChocolate) {

                this.isChocolate = true
                this.vehicle.setColor(chocolateColor)
                setTimeout(() => {
                    this.vehicle.setColor(notItColor)
                    this.isChocolate = false
                }, this.chocolateTime * 1000)
            } else {
                this.vehicle.setColor(notItColor)
            }
        } else {
            this.vehicle.setColor(itColor)
        }
    }

    /**
     * 
     * @returns true if will be it
     */
    resetPressed() {
        this.numberOfResets += 1
        if (this.numberOfResets === this.totalNumberOfResets) {
            this.numberOfResets = 0
            return true
        }
        return false
    }

    getRemainingResets() {
        return this.totalNumberOfResets - this.numberOfResets
    }
}