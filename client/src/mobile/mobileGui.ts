import { Socket } from "socket.io-client"
import { MobileControls } from "../utils/ControlsClasses"

export let width = screen.width
export let height = screen.height
export let isPortrait = width < height

const cRadius = 50

const getButtonsPos = () => {

    let cXAcc = width - (10 + cRadius)
    let cXDecc = width - (10 + cRadius)
    let cXBreak = (cRadius * 4)
    let cYAcc = 10 + (cRadius * 2)
    let cYDecc = height - (10 + cRadius * 2)
    let cYBreak = height - (10 + cRadius * 2)

    let cXReset = cRadius + 10
    let cYReset = height / 2

    let cXResetOrient = cRadius + 10
    let cYResetOrient = 10 + (cRadius * 2)


    let accPos = { x: cXAcc, y: cYAcc, px: cXAcc, py: cYAcc, lx: width - (2 * cRadius), ly: height - (10 + cRadius) }
    let breakPos = { x: cXBreak, y: cYBreak, px: cXBreak, py: cYBreak, lx: (cRadius * 2), ly: height - (20 + (cRadius * 3)) }
    let deccPos = { x: cXDecc, y: cYDecc, px: cXDecc, py: cYDecc, lx: (cRadius * 2), ly: height - (10 + cRadius) }
    let resetPos = { x: cXReset, y: cYReset, px: cXReset, py: cYReset, lx: width / 2, ly: cRadius + 10 }
    let resetOrientPos = { x: cXResetOrient, y: cYResetOrient, px: cXResetOrient, py: cYResetOrient, lx: width - (65 + cRadius), ly: 15 + cRadius }

    return [accPos, deccPos, breakPos, resetPos, resetOrientPos]
}

let buttonsPos = getButtonsPos()

const handleOrientationChanged = () => {

    height = screen.height - 50
    width = screen.width
    isPortrait = screen.width < screen.height
    // if (!isPortrait) {
    //     height = window.innerHeight
    //     width = window.innerWidth
    // }
    console.log("is protrait", isPortrait)
    console.log("w", width, "h", height)
    console.log("screen w", screen.width, screen.height)

    buttonsPos = getButtonsPos()
    for (let i = 0; i < buttonsPos.length; i++) {
        if (isPortrait) {
            buttonsPos[i].x = buttonsPos[i].px
            buttonsPos[i].y = buttonsPos[i].py
        } else {
            buttonsPos[i].x = buttonsPos[i].lx
            buttonsPos[i].y = buttonsPos[i].ly
        }
    }
}
handleOrientationChanged()

window.addEventListener("orientationchange", handleOrientationChanged)

export type touchActions = "forward" | "backward" | "break" | "reset" | "resetOrientation"

export const handleTouchStart = (e: TouchEvent, socket: Socket, controls: MobileControls, callback: (action: touchActions) => void) => {



    // const buttons = [
    //     { x: cXAcc, y: cYAcc, value: controls.isAccelerating },
    //     { x: cXDecc, y: cYDecc, value: controls.isDeccelerating },
    //     { x: cXBreak, y: cYBreak, value: controls.breaking },
    //     { x: cXReset, y: cYReset, value: controls.resetVehicle },
    //     { x: cXResetOrient, y: cYResetOrient, value: undefined }
    // ]

    controls.isAccelerating = false
    controls.isDeccelerating = false
    controls.breaking = false
    controls.resetVehicle = false

    for (let j = 0; j < buttonsPos.length; j++) {
        const cY = buttonsPos[j].y
        const cX = buttonsPos[j].x
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
                    console.log("breaking")
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
    drawButton(ctx, controls, "isAccelerating", buttonsPos[0].x, buttonsPos[0].y, "Forward")

}

export const drawDeccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "isDeccelerating", buttonsPos[1].x, buttonsPos[1].y, "Backward")
}


export const drawBreak = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "breaking", buttonsPos[2].x, buttonsPos[2].y, "Break")
}

export const drawResetButton = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "resetVehicle", buttonsPos[3].x, buttonsPos[3].y, "Reset")
}

export const drawResetOrientations = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, undefined, buttonsPos[4].x, buttonsPos[4].y, "Reset Orient")
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
    if (isPortrait) {
        ctx.rotate(-Math.PI / 2)
    }
    if (!key || !controls[key]) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"

    ctx.fillText(text, -32, 10)
    ctx.restore()
}