export class MobileControls {

    moreSpeed: boolean
    beta: number
    alpha: number
    gamma: number
    isAccelerating: boolean
    isDeccelerating: boolean
    breaking: boolean
    lookBackwards: boolean
    resetVehicle: boolean

    constructor() {
        this.moreSpeed = false
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.isAccelerating = false
        this.isDeccelerating = false
        this.breaking = false
        this.lookBackwards = false
        this.resetVehicle = false
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
