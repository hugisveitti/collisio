/** will be similar to the game time class
 * as each vehicle will be asciated with one tagobjectclass
 */

import { Scene3D } from "enable3d"
import { Coin } from "../course/TagCourse"

export class TagObject {

    isIt: boolean
    coinCount: number

    constructor() {
        this.isIt = false
        this.coinCount = 0
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
}