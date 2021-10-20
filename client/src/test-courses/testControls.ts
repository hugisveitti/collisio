import { Socket } from "socket.io-client"
import { IPlayerInfo } from "../classes/Game"
import { IVehicle } from "../models/IVehicle"
import { MobileControls, VehicleControls } from "../utils/ControlsClasses"


let speed = 40
let maxAngle = 0.4
let angle = 3


export const driveVehicle = (mobileControls: MobileControls, vehicle: IVehicle) => {
    if (mobileControls.forward) {
        vehicle.goForward(mobileControls.moreSpeed)
    } else if (mobileControls.backward) {
        vehicle.goBackward(speed)
    } else {
        vehicle.noForce()
    }

    if (mobileControls.break) {
        vehicle.break()
    } else {
        vehicle.break(true)
    }

    if (mobileControls.beta > 4) {
        vehicle.turnLeft(mobileControls.beta)
    } else if (mobileControls.beta < -4) {
        vehicle.turnRight(mobileControls.beta)
    } else {
        vehicle.noTurn()
    }

    if (mobileControls.lookBackwards) {
        vehicle.lookForwardsBackwards(true)
    } else {
        vehicle.lookForwardsBackwards(false)
    }

    if (mobileControls.resetVehicle) {
        vehicle.setPosition(0, 20, 0)
        vehicle.setRotation(0, 0, 0)
    }
}

let vehicleIdx = 0
let lookBackwards = false
let driveWithKeyboardEnabled = true


export const addTestControls = (vehicleControls: VehicleControls, socket: Socket, vehicle: IVehicle) => {


    if (!driveWithKeyboardEnabled) {

        socket.on("get-controls", (data) => {
            const { players } = data as { players: IPlayerInfo[] }
            // driveVehicle(vehicle)
        })
    }




    const keyAction = (e: KeyboardEvent, isDown: boolean) => {

        switch (e.key) {
            case "w":
                vehicleControls.forward = isDown
                break;
            case "d":
                vehicleControls.right = isDown
                break;
            case "a":
                vehicleControls.left = isDown
                break;
            case "s":
                vehicleControls.backward = isDown
                break;
            case " ":
                vehicleControls.break = isDown
                break
            default:
                break;
        }
        // doesn't work
        // vehicles[vehicleIdx].lookForwardsBackwards(lookBackwards)
    }

    document.addEventListener("keydown", e => keyAction(e, true))
    document.addEventListener("keyup", e => keyAction(e, false))

    // if (driveWithKeyboardEnabled) {
    //     setInterval(() => {
    //         driveVehicleWithKeyboard(vehicle, vehicleControls)
    //     }, 5)
    // }


}



export const testDriveVehicleWithKeyboard = (vehicle: IVehicle, vehicleControls: VehicleControls) => {
    if (vehicleControls.forward) {
        vehicle.goForward(false)
    } else if (vehicleControls.backward) {
        vehicle.goBackward(speed)
    } else {
        vehicle.noForce()
    }

    if (vehicleControls.break) {
        vehicle.break()
    } else {
        vehicle.break(true)
    }

    if (vehicleControls.left) {
        vehicle.turn(angle)
    } else if (vehicleControls.right) {
        vehicle.turn(-angle)
    } else {
        vehicle.turn(0)
    }
}
