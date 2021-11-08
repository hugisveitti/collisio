

export const hasAskedDeviceOrientation = eval(
    window.localStorage.getItem("hasAskedDeviceOrientation")
);

export const setHasAskedDeviceOrientation = (b: boolean) => {
    window.localStorage.setItem("hasAskedDeviceOrientation", b + "")
}

export const requestDeviceOrientation = (callback: (permissionGranted: boolean, message: string) => void) => {
    // I think it is only needed for iphones

    if (
        navigator.userAgent.toLowerCase().includes("iphone") &&
        DeviceOrientationEvent &&
        // @ts-ignore
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        // @ts-ignore
        DeviceOrientationEvent.requestPermission()
            .then((response) => {
                if (response == "granted") {
                    setHasAskedDeviceOrientation(true)
                    callback(true, "Permission granted!")
                } else {
                    callback(false, "Permission not granted.")
                }
            })
            .catch((err) => {
                callback(false, "Error occured when asking for permission")
            });
    } else {
        callback(false, "Permission access not available, you might not need to worry.")
        console.log("Device motion permission access method not available");
        setHasAskedDeviceOrientation(true)
    }
}

export interface IDeviceOrientationEvent {
    gamma: number
    beta: number
    alpha: number
}

export class MobileControls {

    beta: number
    alpha: number
    gamma: number

    /* two main buttons, f and b */
    /** f for forward */
    f: boolean
    /** b for break and backward */
    b: boolean

    resetVehicle: boolean

    pause: boolean

    constructor(data?: Object) {
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.f = false
        this.b = false

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
