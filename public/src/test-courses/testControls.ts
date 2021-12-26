import { Socket } from "socket.io-client"
import { IVehicle } from "../vehicles/IVehicle"
import { toast } from "react-toastify"
import { MobileControls, MTS_SENDINTERVAL_MS, std_controls, VehicleControls } from "../shared-backend/shared-stuff"


let speed = 40
let maxAngle = 40
let angle = 0
let dAngle = 4



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

    } else if (mobileControls.f) {
        vehicle.zeroBreakForce()
    }

    vehicle.turn(mobileControls.beta)


    if (mobileControls.resetVehicle) {
        vehicle.resetPosition()
    }
}





export const addTestControls = (vehicleControls: VehicleControls, socket: Socket, vehicle: IVehicle) => {

    let driveWithKeyboard = !!window.localStorage.getItem("driveWithKeyboard") ? eval(window.localStorage.getItem("driveWithKeyboard")) : false
    if (!eval(window.localStorage.getItem("k-info-done"))) {
        window.localStorage.setItem("k-info-done", "true")
        toast("Press 'k' to enable driving with keyboard")
    }

    window.addEventListener("keypress", (e) => {
        if (e.key === "k") {
            driveWithKeyboard = !driveWithKeyboard
            window.localStorage.setItem("driveWithKeyboard", driveWithKeyboard + "")
            toast("K pressed, driveWithKeyboard " + driveWithKeyboard)
        }
    })

    const testDriveVehicleWithKeyboard = (vehicle: IVehicle, vehicleControls: VehicleControls) => {
        if (vehicleControls.f) {
            vehicle.goForward(false)
        } else if (vehicleControls.b) {
            vehicle.goBackward(speed)
        } else {
            vehicle.noForce()
        }


        if (vehicleControls.left) {
            angle += dAngle
            angle = Math.min(angle, maxAngle)
            vehicle.turn(angle)
        } else if (vehicleControls.right) {
            angle -= dAngle
            angle = Math.max(angle, -maxAngle)
            vehicle.turn(angle)
        } else {
            if (angle > 0) {
                angle -= dAngle
            } else if (angle < 0) {
                angle += dAngle
            }
            vehicle.turn(angle)
        }
    }








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




    return () => {

        if (!driveWithKeyboard) {
            socket.once(std_controls, (data) => {
                const { mobileControls } = data as { mobileControls: MobileControls }
                if (mobileControls?.f !== undefined) {
                    driveVehicle(mobileControls, vehicle)
                }
            })
        } else {
            testDriveVehicleWithKeyboard(vehicle, vehicleControls)
        }
    }

}



