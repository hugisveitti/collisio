import { Socket } from "socket.io-client"
import { IPlayerInfo } from "../classes/Game"
import { IVehicle } from "../models/IVehicle"
import { MobileControls, VehicleControls } from "./ControlsClasses"




let speed = 40
let maxAngle = 0.4
let angle = 40


export const driveVehicle = (mobileControls: MobileControls, vehicle: IVehicle) => {
    if (mobileControls.isAccelerating) {

        vehicle.goForward(mobileControls.moreSpeed)
    } else if (mobileControls.isDeccelerating) {
        vehicle.goBackward(speed)
    } else {
        vehicle.noForce()
    }

    if (mobileControls.breaking) {
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
let driveWithKeyboardEnabled = false


export const addControls = (vehicleControls: VehicleControls, socket: Socket, vehicles: IVehicle[]) => {
    document.addEventListener("keypress", (ev) => {
        if (ev.key === "p") {
            vehicleIdx += 1
            vehicleIdx = vehicleIdx % vehicles.length
        } else if (ev.key === "o") {
            lookBackwards = !lookBackwards
        } else if (ev.key === "u") {
            console.log("driving with keyboard enabled")
            driveWithKeyboardEnabled = !driveWithKeyboardEnabled
        }
    })

    if (!driveWithKeyboardEnabled) {

        socket.on("get-controls", (data) => {
            const { players } = data as { players: IPlayerInfo[] }
            for (let i = 0; i < players.length; i++) {
                driveVehicle(players[i].mobileControls, vehicles[players[i].playerNumber])
            }
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

    if (driveWithKeyboardEnabled) {
        setInterval(() => {
            driveVehicleWithKeyboard(vehicles[vehicleIdx], vehicleControls)
        }, 5)
    }

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
