import { io, Socket } from "socket.io-client"
import { DefaultEventsMap } from "socket.io-client/build/typed-events"
import { width, height, drawAccelerator, changeOrientation, handleTouchStart, handleTouchEnd, drawDeccelerator, MobileControls, drawBreak } from "./mobileGui"

let moreSpeed = false
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

export const initGryoscope = (socket: Socket<DefaultEventsMap, DefaultEventsMap>) => {

    const canvas = document.createElement("canvas")
    canvas.setAttribute("id", "controller-canvas")
    canvas.height = height
    canvas.width = width
    ctx = canvas.getContext("2d")

    document.body.appendChild(canvas)

    window.addEventListener("touchstart", (e) => {
        handleTouchStart(e, socket, controls)
    }
    )
    window.addEventListener("touchend", () => handleTouchEnd(socket, controls))
    window.addEventListener("orientationchange", () => {
        changeOrientation(canvas)
    })


    window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => {
        const gamma = e.gamma ?? 0
        const beta = e.beta ?? 0
        const alpha = e.alpha ?? 0

        controls.alpha = alpha
        controls.gamma = gamma
        controls.beta = beta
        controls.moreSpeed = gamma > 0 && gamma < 40

        orientation = {
            gamma,
            beta,
            alpha
        }

    }, true)


    startLoop(socket)
}

const startLoop = (socket: Socket) => {
    console.log("starting loop")
    console.log(ctx)
    const loop = () => {
        socket.emit("send-controls", controls)


        requestAnimationFrame(loop)
        if (ctx) {

            ctx.clearRect(0, 0, width, height);
            // drawLeftArrow(ctx)
            // drawRightArrow(ctx)
            drawAccelerator(ctx, controls)
            drawDeccelerator(ctx, controls)
            drawBreak(ctx, controls)
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
            if (moreSpeed) {
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
    loop()
}