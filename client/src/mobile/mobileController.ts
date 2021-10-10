import { toast } from "react-toastify"
import { Socket } from "socket.io-client"
import { MobileControls } from "../utils/ControlsClasses"
import { drawAccelerator, drawBreak, drawDeccelerator, drawResetButton, drawResetOrientations, handleTouchEnd, handleTouchStart, touchActions } from "./mobileGui"

let motion: DeviceMotionEventAcceleration | null = {
    x: 0,
    y: 0,
    z: 0
}


const controls = new MobileControls()

export interface IOrientation {
    alpha: number
    beta: number
    gamma: number
}

let orientation: IOrientation = {
    alpha: 0,
    beta: 0,
    gamma: 0
}

let ctx: CanvasRenderingContext2D | null
let deviceorientationCreated = false
const height = window.innerHeight
const width = window.innerWidth

// const createScreenError = () => {
//     if (screen.orientation.type.slice(0, 9) === "landscape") {
//         toast.error("Please use portrait mode and lock your screen.")
//     }
// }

const createDeviceOrientationListener = () => {
    if (!window.DeviceMotionEvent) {
        toast.error("Device motion not supported in the browser, please use Google Chrome or add 'https://' instead of 'http://'")
    }
    if (deviceorientationCreated) {
        toast("Creating new device orientation listener")
    } else {
        deviceorientationCreated = true
    }

    window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
        const gamma = e.gamma ?? 0
        const beta = e.beta ?? 0
        const alpha = e.alpha ?? 0

        controls.alpha = alpha
        controls.gamma = gamma
        controls.beta = beta
        controls.moreSpeed = gamma > 0 && gamma < 30

        orientation = {
            gamma,
            beta,
            alpha
        }
    }, true)
}

export const initGryoscope = (socket: Socket) => {
    document.body.setAttribute("overflow", "hidden")

    const canvas = document.createElement("canvas")
    canvas.setAttribute("id", "controller-canvas")

    canvas.height = height
    canvas.width = width
    ctx = canvas.getContext("2d")

    document.body.appendChild(canvas)

    window.addEventListener("touchstart", (e) => {
        handleTouchStart(e, socket, controls, (touchAction: touchActions) => {
            if (touchAction === "resetOrientation") {
                createDeviceOrientationListener()
            }
        })
    }
    )
    window.addEventListener("touchend", () => handleTouchEnd(socket, controls))

    createDeviceOrientationListener()

    // Something needs to be in fullscreen to lock the element.
    // document.body.requestFullscreen().then(() => {
    //     screen.orientation.lock("portrait").then(() => {
    //         console.log("screen orientation locked")
    //     }).catch((e) => {
    //         console.log(e)
    //     })
    // }).catch((e) => {
    //     console.log("req fullscreen error", e)
    // })

    // screen.orientation.addEventListener("change", () => {
    //     createScreenError()
    // })
    // createScreenError()

    startLoop(socket)
}




const startLoop = (socket: Socket) => {
    let controlsZeroCounter = 0
    const loop = () => {
        if (controls.beta === 0 && controls.alpha === 0 && controls.gamma === 0) {
            controlsZeroCounter += 1;
            if (controlsZeroCounter === 1000) {
                console.log("creating new orientation listener")
                createDeviceOrientationListener()
                controlsZeroCounter = 0
            }
        } else {
            controlsZeroCounter = 0
        }

        socket.emit("send-controls", controls)


        // requestAnimationFrame(loop)
        if (ctx) {

            ctx.clearRect(0, 0, width, height);
            drawAccelerator(ctx, controls)
            drawDeccelerator(ctx, controls)
            drawBreak(ctx, controls)
            drawResetButton(ctx, controls)
            drawResetOrientations(ctx, controls)
            if (motion) {
                ctx.save()
                ctx.translate(width / 2, height / 2)
                ctx.rotate(-Math.PI / 2)

                ctx.font = "30px Arial"
                let infoText = "alpha: " + Math.round(orientation.alpha)
                ctx.fillText(infoText, 0, 0)
                infoText = "gamma: " + Math.round(orientation.gamma)
                ctx.fillText(infoText, 0, 25)

                infoText = " beta:" + Math.round(orientation.beta)
                ctx.fillText(infoText, 0, 50)
                ctx.restore()
            }
            if (controls.moreSpeed) {
                ctx.save()
                ctx.translate(width / 2, height / 2)
                ctx.rotate(-Math.PI / 2)

                ctx.font = "60px Arial"
                let infoText = "MORE SPEED!"
                ctx.fillText(infoText, -100, -50)
                ctx.restore()
            }
        } else {
            console.log("no context!")
        }

    }
    setInterval(() => {
        loop()

        // set fps
    }, 1000 / 30)
}