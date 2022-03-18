import { toast } from "react-toastify"
import { Socket } from "socket.io-client"
import { MobileControls, std_controls, VehicleControls } from "../shared-backend/shared-stuff"
import { IVehicle } from "../vehicles/IVehicle"
import { requestDeviceOrientation } from "./ControlsClasses"
import { numberScaler } from "./utilFunctions"


let speed = 40
const maxAngle = 40
let angle = 25
let gameIsPaused = false
const maxNumber = 100
const steerScaler = numberScaler(0, 40, Math.log2(1), Math.log2(maxNumber), 3)

export const driveVehicle = (mobileControls: MobileControls, vehicle: IVehicle) => {

    let btnDown = false
    if (mobileControls.f) {
        vehicle.goForward()
        btnDown = true
    }
    if (mobileControls.b) {
        vehicle.goBackward()
        btnDown = true
    }

    if (!btnDown) {
        vehicle.noForce()

    } else if (mobileControls.f) {
        vehicle.zeroBreakForce()
    }

    vehicle.turn(mobileControls.beta)

    if (mobileControls.resetVehicle) {
        vehicle.resetPosition()
    }
}



export const addControls = (socket: Socket | undefined, vehicles: IVehicle[]) => {

    /** I currently have 2 setIntervals that deal with the controls
     * 
     * In the ControlsRoom to send from device
     * In ServerGame.js to send from server, I need the one in the Server since if we have multiple players the data needs to be collected from all players and sent
     */
    socket?.on(std_controls, (data) => {
        const { players } = data
        for (let i = 0; i < players.length; i++) {
            driveVehicle(players[i].mobileControls, vehicles[players[i].playerNumber])
        }
    })
}

let vehicleControls: VehicleControls = new VehicleControls()

const keyAction = (e: KeyboardEvent, isDown: boolean) => {

    switch (e.key) {
        case "w":
        case "W":
        case "ArrowUp":
            e.preventDefault()
            vehicleControls.f = isDown
            break;
        case "d":
        case "D":
        case "ArrowRight":
            e.preventDefault()
            vehicleControls.right = isDown
            break;
        case "a":
        case "A":
        case "ArrowLeft":
            e.preventDefault()
            vehicleControls.left = isDown
            break;
        case "s":
        case "S":
        case "ArrowDown":
        case " ":
            e.preventDefault()
            vehicleControls.b = isDown
            break;
        default:
            break;
    }
}

export const addKeyboardControls = () => {
    removeKeyboardControls()
    vehicleControls = new VehicleControls()
    document.addEventListener("keydown", e => keyAction(e, true))
    document.addEventListener("keyup", e => keyAction(e, false))
}

export const removeKeyboardControls = () => {
    document.removeEventListener("keydown", e => keyAction(e, true))
    document.removeEventListener("keyup", e => keyAction(e, false))
}


let nSteerAngle = 0
let steerAngle = 0

const getSteering = () => {
    const angle = steerScaler(Math.log2(steerAngle))
    const nAngle = -steerScaler(Math.log2(-nSteerAngle))
    return angle + nAngle
}

let dSteer = 1
export const driveVehicleWithKeyboard = (vehicle: IVehicle) => {
    if (vehicleControls.f) {
        vehicle.goForward()
    } else if (vehicleControls.b) {
        vehicle.goBackward(speed)
    } else {
        vehicle.noForce()
    }
    if (vehicleControls.left) {
        angle += 2.5
        angle = Math.min(angle, maxAngle)
        if (!isFinite(angle)) {
            console.warn("Non fitite angle", angle)
            angle = 20
        }
        if (angle <= 2.5) {
            angle = 2.5
        }
        vehicle.turn(angle)
    } else if (vehicleControls.right) {
        angle -= 2.5
        angle = Math.max(angle, -maxAngle)
        if (!isFinite(angle)) {
            angle = -20
        }
        if (angle >= -2.5) {
            angle = -2.5
        }
        vehicle.turn(angle)
    } else {
        angle = 0
        vehicle.noTurn()
    }
}


let isPortrait = screen?.orientation?.type.includes("portrait")
const handleDeviceOrientChange = () => {
    if (screen.orientation?.type) {
        isPortrait = screen.orientation.type.slice(0, 8) === "portrait";
    } else {
        isPortrait = window.orientation === 0;
    }
};



const createAllowOrientation = () => {
    const div = document.createElement("div")

    const info = document.createElement("div")
    info.textContent = "Click the button to allow the use of your device orientation. (For the steering)."
    div.appendChild(info)


    const btn = document.createElement("button")
    btn.textContent = "Click me"
    btn.classList.add("btn")
    btn.addEventListener("click", () => {
        requestDeviceOrientation((permissionGranted, msg) => {
            if (permissionGranted) {
                console.log("removing child")
                document.body.removeChild(div)
                toast.success(msg)
            } else {
                toast.error("Permission not granted.")
            }
        })
    })

    div.appendChild(btn)
    document.body.appendChild(div)

    div.classList.add("modal")
}

const mControls = new MobileControls()
let mobileControlsActive = false
let hasOrientationPermission = false
const handleDeviceOr = (e: DeviceOrientationEvent) => {

    if (e.gamma === null) {
        removeMobileController()
        createAllowOrientation()
    } else {
        hasOrientationPermission = true
        mControls.alpha = e.alpha
        mControls.beta = e.beta
        mControls.gamma = e.gamma
        //  console.log("alpha", Math.round(e.alpha), "beta", Math.round(e.beta), "gamma", Math.round(e.gamma))
    }
}

const handleTouch = (e: TouchEvent, start: boolean) => {

    const yPos = e.changedTouches[0].clientY
    if (yPos > screen.availHeight / 2) {
        mControls.f = start
        mControls.b = false
    } else {
        mControls.f = false
        mControls.b = start
    }
}


export const addMobileController = () => {
    console.log("adding mobile controller")
    removeMobileController()
    handleDeviceOrientChange()
    setTimeout(() => {
        if (!hasOrientationPermission) {

            requestDeviceOrientation((granted, msg) => {
                if (!granted) {
                    createAllowOrientation()
                }
            })
        }
    }, 500)

    mobileControlsActive = true
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    window.addEventListener("deviceorientation", e => handleDeviceOr(e))
    window.addEventListener("touchstart", (e) => handleTouch(e, true))
    window.addEventListener("touchend", (e) => handleTouch(e, false))
}

export const removeMobileController = () => {
    mobileControlsActive = false
    window.removeEventListener("orientationchange", handleDeviceOrientChange);

    window.removeEventListener("deviceorientation", e => handleDeviceOr(e))
    window.removeEventListener("touchstart", (e) => handleTouch(e, true))
    window.removeEventListener("touchend", (e) => handleTouch(e, false))
}

export const driveVehicleWithMobile = (vehicle: IVehicle) => {
    if (!mobileControlsActive) return
    if (isPortrait) {
        vehicle.turn(-mControls.gamma)
    } else {
        vehicle.turn(mControls.beta)
    }


    let btnDown = false
    if (mControls.f) {
        vehicle.goForward()
        btnDown = true
    }
    if (mControls.b) {
        vehicle.goBackward()
        btnDown = true
    }

    if (!btnDown) {
        vehicle.noForce()

    } else if (mControls.f) {
        vehicle.zeroBreakForce()
    }
}