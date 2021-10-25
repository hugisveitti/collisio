import { toast } from "react-toastify";

export const requestDeviceOrientation = () => {
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
                    toast.success("Permission granted")
                    console.log("deivce permission granted, do nothing");
                } else {
                    toast.error(
                        "You need to grant permission to the device's orientation to be able to play the game, please refresh the page."
                    );
                }
            })
            .catch((err) => {
                toast.error("Error occured when asking for permission.", err)
                console.log(err);
            });
    } else {
        toast.warn("Device motion permission access method not available")
        console.log("Device motion permission access method not available");
    }
}

export interface IDeviceOrientationEvent {
    gamma: number
    beta: number
    alpha: number
}

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
