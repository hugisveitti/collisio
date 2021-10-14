import { Socket } from "socket.io-client"
import { IPlayerInfo } from "../classes/Game"
import { IVehicle } from "../models/IVehicle"
import { MobileControls, VehicleControls } from "./ControlsClasses"


let speed = 40
let maxAngle = 0.4
let angle = 40


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
    vehicle.turn(mobileControls.beta)


    if (mobileControls.lookBackwards) {
        vehicle.lookForwardsBackwards(true)
    } else {
        vehicle.lookForwardsBackwards(false)
    }

    if (mobileControls.resetVehicle) {
        vehicle.resetPosition()
    }
}



export const addControls = (vehicleControls: VehicleControls, socket: Socket, vehicles: IVehicle[]) => {
    socket.on("get-controls", (data) => {
        const { players } = data as { players: IPlayerInfo[] }
        for (let i = 0; i < players.length; i++) {
            driveVehicle(players[i].mobileControls, vehicles[players[i].playerNumber])
        }
    })




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
    }

    document.addEventListener("keydown", e => keyAction(e, true))
    document.addEventListener("keyup", e => keyAction(e, false))



}


export const driveVehicleWithKeyboard = (vehicle: IVehicle, vehicleControls: VehicleControls) => {
    if (vehicleControls.forward) {
        vehicle.goForward(true)
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
        vehicle.turnLeft(angle)
    } else if (vehicleControls.right) {
        vehicle.turnRight(-angle)
    } else {
        vehicle.noTurn()
    }
}
