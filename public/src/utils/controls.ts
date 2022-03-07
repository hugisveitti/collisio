import { Socket } from "socket.io-client"
import { MobileControls, std_controls, VehicleControls } from "../shared-backend/shared-stuff"
import { IVehicle } from "../vehicles/IVehicle"
import { logScaler, numberScaler } from "./utilFunctions"


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

    // if (vehicleControls.left) {
    //     steerAngle += (dSteer)
    //     nSteerAngle += (dSteer * 2)
    //     nSteerAngle = Math.min(nSteerAngle, -1)
    //     steerAngle = Math.min(maxNumber, steerAngle)
    //     const angle = getSteering()
    //     vehicle.turn(angle)
    // } else if (vehicleControls.right) {
    //     nSteerAngle -= (dSteer * 2)
    //     steerAngle -= (dSteer)
    //     steerAngle = Math.max(steerAngle, 1)
    //     nSteerAngle = Math.max(-maxNumber, nSteerAngle)
    //     vehicle.turn(getSteering())
    // } else {

    //     nSteerAngle += (dSteer * 4)
    //     steerAngle -= (dSteer * 4)
    //     steerAngle = Math.max(steerAngle, 1)
    //     nSteerAngle = Math.min(-1, nSteerAngle)

    //     steerAngle = Math.min(steerAngle, maxNumber / 3)
    //     nSteerAngle = Math.max(nSteerAngle, -maxNumber / 3)

    //     vehicle.turn(getSteering())
    // }
}
