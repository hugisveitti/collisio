class MobileControls {
    moreSpeed
    beta
    alpha
    gamma
    isAccelerating
    isDec

    constructor() {
        this.moreSpeed = false
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
    }
}

class VehicleControls {
    left
    right
    forward
    backward
    stop

    constructor() {

        this.left = false
        this.right = false
        this.forward = false
        this.backward = false
        this.stop = false
    }
}

module.exports = {
    VehicleControls,
    MobileControls
}