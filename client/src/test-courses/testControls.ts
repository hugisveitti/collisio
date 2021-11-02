import { Socket } from "socket.io-client"
import { IPlayerInfo } from "../classes/Game"
import { IVehicle } from "../vehicles/IVehicle"
import { MobileControls, VehicleControls } from "../utils/ControlsClasses"


let speed = 40
let maxAngle = 0.4
let angle = 30


export const driveVehicle = (mobileControls: MobileControls, vehicle: IVehicle) => {
    let btnDown = false
    if (mobileControls.f) {
        vehicle.goForward(false)
        btnDown = true
    }
    if (mobileControls.b) {
        vehicle.goBackward()
        btnDown = true
    }

    if (!btnDown) {
        vehicle.noForce()
        // vehicle.break(false)
    }



    vehicle.turn(mobileControls.beta)


    if (mobileControls.resetVehicle) {
        vehicle.resetPosition()
    }
}



export const addTestControls = (vehicleControls: VehicleControls, socket: Socket, vehicle: IVehicle, callback: (mc: MobileControls) => void) => {

    setInterval(() => {
        socket.once("get-controls", (data) => {
            const { players } = data as { players: IPlayerInfo[] }
            for (let i = 0; i < players.length; i++) {
                driveVehicle(players[i].mobileControls, vehicle)
                callback(players[i].mobileControls)
            }
        })
    }, 1000 / 120)





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



export const testDriveVehicleWithKeyboard = (vehicle: IVehicle, vehicleControls: VehicleControls, mobileControls: MobileControls) => {

    const mobileKeys = Object.keys(mobileControls)
    for (let key of mobileKeys) {
        // basically if using mobile controls then cant use vehicle controls
        if (mobileControls[key]) return
    }

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
