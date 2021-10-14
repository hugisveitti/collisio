import { Socket } from "socket.io-client"
import { MobileControls } from "../utils/ControlsClasses"
import { getDeviceType } from "../utils/settings"



const cRadius = 50
export let isPortrait = true
let height = 0;
let width = 0

export const getWidthHeight = () => {
    return {
        width: screen.width - 50,
        height: screen.height - 50
    }
}

const getButtonsPos = () => {
    const { width: _w, height: _h } = getWidthHeight()
    width = _w
    height = _h


    let cXAcc = width - (10 + cRadius)
    let cXDecc = width - (10 + cRadius)
    let cXBreak = width - (20 + (cRadius * 3))
    let cYAcc = 10 + (cRadius * 2)
    let cYDecc = height - (10 + cRadius * 2)
    let cYBreak = height - (10 + cRadius * 2)

    let cXReset = cRadius + 10
    let cYReset = height / 2

    let cXSettings = cRadius + 10
    let cYSettings = 10 + (cRadius * 2)


    let accPos = { x: cXAcc, y: cYAcc, px: cXAcc, py: cYAcc, lx: width - (2 * cRadius), ly: height - (10 + cRadius) }
    let breakPos = { x: cXBreak, y: cYBreak, px: cXBreak, py: cYBreak, lx: (cRadius * 2), ly: height - (20 + (cRadius * 3)) }
    let deccPos = { x: cXDecc, y: cYDecc, px: cXDecc, py: cYDecc, lx: (cRadius * 2), ly: height - (10 + cRadius) }
    let resetPos = { x: cXReset, y: cYReset, px: cXReset, py: cYReset, lx: width / 2, ly: cRadius + 10 }
    let settingsPos = { x: cXSettings, y: cYSettings, px: cXSettings, py: cYSettings, lx: width - (65 + cRadius), ly: 15 + cRadius }

    return [accPos, deccPos, breakPos, resetPos, settingsPos]
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
if (getDeviceType() === "mobile") {

    handleOrientationChanged()

    window.addEventListener("orientationchange", handleOrientationChanged)
}

export type touchActions = "forward" | "backward" | "break" | "reset" | "settings"

export const handleTouchStart = (e: TouchEvent, socket: Socket, controls: MobileControls, callback: (action: touchActions) => void) => {

    controls.forward = false
    controls.backward = false
    controls.break = false
    controls.resetVehicle = false

    for (let j = 0; j < buttonsPos.length; j++) {
        const cY = buttonsPos[j].y
        const cX = buttonsPos[j].x
        for (let i = 0; i < e.touches.length; i++) {
            const x = e.touches[i].clientX
            const y = e.touches[i].clientY
            if (x > cX - cRadius && x < cX + cRadius && y > cY - cRadius && y < cY + cRadius) {
                if (j === 0) {
                    controls.forward = true
                } else if (j === 1) {
                    controls.backward = true
                } else if (j === 2) {
                    controls.break = true
                } else if (j === 3) {
                    controls.resetVehicle = true
                } else if (j === 4) {
                    callback("settings")
                }
            }
        }
    }

}

export const handleTouchEnd = (socket: Socket, controls: MobileControls) => {
    controls.forward = false
    controls.backward = false
    controls.break = false
    controls.resetVehicle = false
}


export const drawAccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "backward", buttonsPos[0].x, buttonsPos[0].y, "Forward")

}

export const drawDeccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "forward", buttonsPos[1].x, buttonsPos[1].y, "Backward")
}


export const drawBreak = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "break", buttonsPos[2].x, buttonsPos[2].y, "Break")
}

export const drawResetButton = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, "resetVehicle", buttonsPos[3].x, buttonsPos[3].y, "Reset")
}

export const drawSettings = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    drawButton(ctx, controls, undefined, buttonsPos[4].x, buttonsPos[4].y, "Settings")
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