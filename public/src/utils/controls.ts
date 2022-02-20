import { Socket } from "socket.io-client"
import { MobileControls, std_controls, VehicleControls } from "../shared-backend/shared-stuff"
import { IVehicle } from "../vehicles/IVehicle"
import { logScaler, numberScaler } from "./utilFunctions"


let speed = 40
let maxAngle = 40
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



export const addControls = (vehicleControls: VehicleControls, socket: Socket | undefined, vehicles: IVehicle[]) => {

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




    const keyAction = (e: KeyboardEvent, isDown: boolean) => {
        switch (e.key) {
            case "w":
                vehicleControls.f = isDown
                break;
            case "d":
                vehicleControls.right = isDown
                break;
            case "a":
                vehicleControls.left = isDown
                break;
            case "s":
                vehicleControls.b = isDown
                break;
            case " ":
                vehicleControls.b = isDown
                break
            default:
                break;
        }
    }
    document.addEventListener("keydown", e => keyAction(e, true))
    document.addEventListener("keyup", e => keyAction(e, false))
}

export const addKeyboardControls = (vehicleControls: VehicleControls) => {
    const keyAction = (e: KeyboardEvent, isDown: boolean) => {

        switch (e.key) {
            case "w":
            case "ArrowUp":
                vehicleControls.f = isDown
                break;
            case "d":
            case "ArrowRight":
                vehicleControls.right = isDown
                break;
            case "a":
            case "ArrowLeft":
                vehicleControls.left = isDown
                break;
            case "s":
            case "ArrowDown":
            case " ":
                vehicleControls.b = isDown
                break;
            default:
                break;
        }
    }
    document.addEventListener("keydown", e => keyAction(e, true))
    document.addEventListener("keyup", e => keyAction(e, false))
}



let nSteerAngle = 0
let steerAngle = 0

const getSteering = () => {


    const angle = steerScaler(Math.log2(steerAngle))
    const nAngle = -steerScaler(Math.log2(-nSteerAngle))
    return angle + nAngle
}

let dSteer = 1
export const driveVehicleWithKeyboard = (vehicle: IVehicle, vehicleControls: VehicleControls) => {

    if (vehicleControls.f) {
        vehicle.goForward()
    } else if (vehicleControls.b) {
        vehicle.goBackward(speed)
    } else {
        vehicle.noForce()
    }


    if (vehicleControls.left) {
        steerAngle += (dSteer)
        nSteerAngle += (dSteer * 2)
        nSteerAngle = Math.min(nSteerAngle, -1)
        steerAngle = Math.min(maxNumber, steerAngle)
        const angle = getSteering()
        vehicle.turn(angle)
    } else if (vehicleControls.right) {
        nSteerAngle -= (dSteer * 2)
        steerAngle -= (dSteer)
        steerAngle = Math.max(steerAngle, 1)
        nSteerAngle = Math.max(-maxNumber, nSteerAngle)
        vehicle.turn(getSteering())
    } else {

        nSteerAngle += (dSteer * 4)
        steerAngle -= (dSteer * 4)
        steerAngle = Math.max(steerAngle, 1)
        nSteerAngle = Math.min(-1, nSteerAngle)

        vehicle.turn(getSteering())
    }
}
