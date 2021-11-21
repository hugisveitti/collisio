/** will be similar to the game time class
 * as each vehicle will be asciated with one tagobjectclass
 */

import { Scene3D } from "enable3d"
import { Coin } from "../course/TagCourse"

export class TagObject {

    isIt: boolean
    coinCount: number
    /** you get 3 number of resets? */
    numberOfResets: number
    totalNumberOfResets: number

    constructor() {
        this.isIt = false
        this.coinCount = 0
        this.numberOfResets = 0
        this.totalNumberOfResets = 3
    }

    coinCollision(coin: Coin, scene: Scene3D) {
        if (!this.isIt) {
            this.coinCount += 1
            coin.removeFromScene(scene)
            return true
        }
    }

    setIsIt(isIt: boolean) {
        this.isIt = isIt
    }

    /**
     * 
     * @returns true if will be it
     */
    resetPressed() {
        this.numberOfResets += 1
        if (this.numberOfResets > this.totalNumberOfResets) {
            this.numberOfResets = 0
            return true
        }
        return false
    }
}