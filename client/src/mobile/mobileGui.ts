import { Socket } from "socket.io-client"
import { MobileControls } from "../utils/ControlsClasses"

const width = window.innerWidth
const height = window.innerHeight

const cRadius = 50
const cXAcc = width - (10 + cRadius)
const cXDecc = width - (10 + cRadius)
const cXBreak = (cRadius * 4)
const cYAcc = 10 + (cRadius * 2)
const cYDecc = height - (10 + cRadius * 2)
const cYBreak = height - (10 + cRadius * 2)

const cXReset = cRadius + 10
const cYReset = height / 2

const cXResetOrient = cRadius + 10
const cYResetOrient = 10 + (cRadius * 2)

export type touchActions = "forward" | "backward" | "break" | "reset" | "resetOrientation"

export const handleTouchStart = (e: TouchEvent, socket: Socket, controls: MobileControls, callback: (action: touchActions) => void) => {



    const buttons = [
        { x: cXAcc, y: cYAcc, value: controls.isAccelerating },
        { x: cXDecc, y: cYDecc, value: controls.isDeccelerating },
        { x: cXBreak, y: cYBreak, value: controls.breaking },
        { x: cXReset, y: cYReset, value: controls.resetVehicle },
        { x: cXResetOrient, y: cYResetOrient, value: undefined }
    ]

    controls.isAccelerating = false
    controls.isDeccelerating = false
    controls.breaking = false
    controls.resetVehicle = false

    for (let j = 0; j < buttons.length; j++) {
        const cY = buttons[j].y
        const cX = buttons[j].x
        for (let i = 0; i < e.touches.length; i++) {
            const x = e.touches[i].clientX
            const y = e.touches[i].clientY
            if (x > cX - cRadius && x < cX + cRadius && y > cY - cRadius && y < cY + cRadius) {
                if (j === 0) {
                    controls.isAccelerating = true

                } else if (j === 1) {
                    controls.isDeccelerating = true
                } else if (j === 2) {
                    controls.breaking = true
                } else if (j === 3) {
                    controls.resetVehicle = true
                } else if (j === 4) {

                    callback("resetOrientation")
                }
            }
        }
    }

}

export const handleTouchEnd = (socket: Socket, controls: MobileControls) => {
    controls.isAccelerating = false
    controls.isDeccelerating = false
    controls.breaking = false
    controls.resetVehicle = false
}


export const drawAccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "isAccelerating", cXAcc, cYAcc, "Forward")

}

export const drawDeccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "isDeccelerating", cXDecc, cYDecc, "Backward")
}


export const drawBreak = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "breaking", cXBreak, cYBreak, "Break")
}

export const drawResetButton = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "resetVehicle", cXReset, cYReset, "Reset")
}

export const drawResetOrientations = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, undefined, cXResetOrient, cYResetOrient, "Reset Orient")
}


const drawButton = (ctx: CanvasRenderingContext2D | null, controls: MobileControls, key: keyof MobileControls | undefined, x: number, y: number, text: string) => {
    if (!ctx) return

    ctx.beginPath();
    ctx.arc(x, y, cRadius, 0, 2 * Math.PI);
    ctx.stroke();
    if (key && controls[key]) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }
    ctx.fill()

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 2)
    if (!key || !controls[key]) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"

    ctx.fillText(text, -32, 10)
    ctx.restore()
}