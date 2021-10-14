

export class MobileControls {

    moreSpeed: boolean
    beta: number
    alpha: number
    gamma: number
    forward: boolean
    backward: boolean
    break: boolean
    lookBackwards: boolean
    resetVehicle: boolean
    pause: boolean

    constructor(data?: Object) {
        this.moreSpeed = false
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.forward = false
        this.backward = false
        this.break = false
        this.lookBackwards = false
        this.resetVehicle = false
        this.pause = false

        if (data) {
            const keys = Object.keys(data)
            for (let key of keys) {
                this[key] = data[key]
            }
        }
    }
}


export class VehicleControls {
    left: boolean
    forward: boolean
    backward: boolean
    right: boolean
    steerValue: number
    break: boolean



    constructor() {
        this.left = false
        this.right = false
        this.forward = false
        this.backward = false
        this.steerValue = 0
        this.break = false
    }
}
