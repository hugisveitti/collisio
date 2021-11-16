/** will be similar to the game time class
 * as each vehicle will be asciated with one tagobjectclass
 */

import { Coin } from "../course/TagCourse"

export class TagObject {

    isIt: boolean
    coinCount: number

    constructor() {
        this.isIt = false
        this.coinCount = 0
    }

    coinCollision(coin: Coin) {
        if (!this.isIt) {
            this.coinCount += 1
            return true
        }
    }



}