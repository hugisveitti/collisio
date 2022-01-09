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





export const addTestControls = (socket: Socket, vehicle: IVehicle) => {

    let mobileControls = new MobileControls()

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

    const testDriveVehicleWithKeyboard = () => {
        if (mobileControls.f) {
            vehicle.goForward(false)
        } else if (mobileControls.b) {
            vehicle.goBackward(speed)
        } else {
            vehicle.noForce()
        }

        //vehicle.turn(mobileControls.beta)
        if (mobileControls.beta > 0) {
            angle += dAngle

        } else if (mobileControls.beta < 0) {
            angle -= dAngle
        } else {
            angle += ((Math.sign(angle) * -1) * dAngle)
        }
        if (Math.abs(angle) > maxAngle) {
            angle = Math.min(Math.abs(angle), maxAngle) * Math.sign(angle)
        }
        vehicle.turn(angle)
    }








    const keyAction = (e: KeyboardEvent, isDown: boolean) => {
        switch (e.key) {
            case "w":
                mobileControls.f = isDown
                break;
            case "a":
                mobileControls.beta = isDown ? 40 : 0
                // if (isDown) {
                //     mobileControls.beta += dAngle
                //     mobileControls.beta = Math.min(mobileControls.beta, maxAngle)
                // } else if (mobileControls.beta > 0) {
                //     mobileControls.beta -= dAngle
                // }
                break;
            case "d":
                mobileControls.beta = isDown ? -40 : 0

                // if (isDown) {

                //     mobileControls.beta -= dAngle
                //     mobileControls.beta = Math.max(mobileControls.beta, - maxAngle)
                // } else if (mobileControls.beta < 0) {
                //     mobileControls.beta += dAngle
                // }
                break;
            case "s":
                mobileControls.b = isDown
                break;
            case " ":
                mobileControls.b = isDown
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
            socket.on(std_controls, (data) => {
                const { mobileControls: _mobileControls } = data as { mobileControls: MobileControls }
                mobileControls = _mobileControls
                if (mobileControls?.f !== undefined) {
                    driveVehicle(mobileControls, vehicle)
                }
            })
        } else {
            testDriveVehicleWithKeyboard()
        }
        return mobileControls
    }

}




export const getDriveInstruction = (time: number, controller: MobileControls) => {
    return `${time} ${controller.beta} ${controller.f} ${controller.b}`
}

export const setControllerFromInstruction = (str: string, controller: MobileControls) => {
    const instr = str.split(" ")
    controller.beta = +instr[1]
    controller.f = eval(instr[2])
    controller.b = eval(instr[3])
}