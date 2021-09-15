import { Socket } from "socket.io-client"
import { DefaultEventsMap } from "socket.io-client/build/typed-events"


export class MobileControls {

    moreSpeed: boolean
    beta: number
    alpha: number
    gamma: number
    isAccelerating: boolean
    isDeccelerating: boolean
    breaking: boolean
    lookBackwards: boolean
    resetVehicle: boolean

    constructor() {
        this.moreSpeed = false
        this.beta = 0
        this.gamma = 0
        this.alpha = 0
        this.isAccelerating = false
        this.isDeccelerating = false
        this.breaking = false
        this.lookBackwards = false
        this.resetVehicle = false
    }
}

export let width = window.innerWidth
export let height = window.innerHeight
export let isPortrait = screen.orientation.type === "portrait-primary" || screen.orientation.type === "portrait-secondary"


export let cRadius = 50
export let cXAcc = width - (10 + cRadius)
export let cXDecc = width - (10 + cRadius)
export let cXBreak = 40 + (cRadius * 4)
export let cYAcc = 10 + (cRadius * 2)
export let cYDecc = height - (10 + cRadius * 2)
export let cYBreak = height - (10 + cRadius * 2)

export let cXReset = cRadius + 10
export let cYReset = height / 2


export const changeOrientation = (canvas: HTMLCanvasElement) => {
    isPortrait = screen.orientation.type === "portrait-primary" || screen.orientation.type === "portrait-secondary"
    width = window.innerWidth
    height = window.innerHeight
    console.log("w", width)

    // canvas.height = isPortrait ? height : width
    // canvas.width = isPortrait ? width : height
    canvas.height = height
    canvas.width = width
    cRadius = isPortrait ? width / 2 - 50 : height / 2 - 50
    // cXDecc = width / 2
    cYDecc = height - 100
    cYAcc = 100
}

export const handleTouchStart = (e: TouchEvent, socket: Socket, controls: MobileControls) => {



    const buttons = [
        { x: cXAcc, y: cYAcc, value: controls.isAccelerating },
        { x: cXDecc, y: cYDecc, value: controls.isDeccelerating },
        { x: cXBreak, y: cYBreak, value: controls.breaking },
        { x: cXReset, y: cYReset, value: controls.resetVehicle }
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


export const drawLeftArrow = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return

    if (isPortrait) {

        /**left arrow */
        ctx.beginPath()
        ctx.moveTo(width / 2, 10)
        ctx.lineTo(width / 2, 200)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width / 2, 10)
        ctx.lineTo(width / 2 - 40, 80)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width / 2, 10)
        ctx.lineTo(width / 2 + 40, 80)
        ctx.stroke()
    } else {
        /**left arrow */
        ctx.beginPath()
        ctx.moveTo(10, height / 2)
        ctx.lineTo(200, height / 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(10, height / 2)
        ctx.lineTo(80, height / 2 - 40)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(10, height / 2)
        ctx.lineTo(80, height / 2 + 40)
        ctx.stroke()
    }
}

export const drawRightArrow = (ctx: CanvasRenderingContext2D | null) => {
    if (!ctx) return

    if (isPortrait) {

        ctx.beginPath()
        ctx.moveTo(width / 2, height - 10)
        ctx.lineTo(width / 2, height - 200)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width / 2, height - 10)
        ctx.lineTo(width / 2 - 40, height - 80)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width / 2, height - 10)
        ctx.lineTo(width / 2 + 40, height - 80)
        ctx.stroke()
    } else {
        ctx.beginPath()
        ctx.moveTo(width - 10, height / 2)
        ctx.lineTo(width - 200, height / 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width - 10, height / 2)
        ctx.lineTo(width - 80, height / 2 - 40)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(width - 10, height / 2)
        ctx.lineTo(width - 80, height / 2 + 40)
        ctx.stroke()
    }
}

export const drawAccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    /** draw circle */
    if (!ctx) return

    ctx.beginPath();
    ctx.arc(cXAcc, cYAcc, cRadius, 0, 2 * Math.PI);
    ctx.stroke();
    if (controls.isAccelerating) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }
    ctx.fill()

    ctx.save()
    ctx.translate(cXAcc, cYAcc)
    ctx.rotate(-Math.PI / 2)
    if (!controls.isAccelerating) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"
    let infoText = "Forward"
    ctx.fillText(infoText, -15, 0)
    ctx.restore()
}

export const drawDeccelerator = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    if (!ctx) return

    ctx.beginPath();
    ctx.arc(cXDecc, cYDecc, cRadius, 0, 2 * Math.PI);
    ctx.stroke();
    if (controls.isDeccelerating) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }
    ctx.fill()

    ctx.save()
    ctx.translate(cXDecc, cYDecc)
    ctx.rotate(-Math.PI / 2)
    if (!controls.isDeccelerating) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"
    let infoText = "Backward"
    ctx.fillText(infoText, -15, 0)
    ctx.restore()
}


export const drawBreak = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    if (!ctx) return

    ctx.beginPath();
    ctx.arc(cXBreak, cYBreak, cRadius, 0, 2 * Math.PI);
    ctx.stroke();
    if (controls.breaking) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }
    ctx.fill()



    ctx.save()
    ctx.translate(cXBreak, cYBreak)
    ctx.rotate(-Math.PI / 2)
    if (!controls.breaking) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"
    let infoText = "STOP"
    ctx.fillText(infoText, -15, 0)
    ctx.restore()
}

export const drawResetButton = (ctx: CanvasRenderingContext2D | null, controls: MobileControls) => {
    if (!ctx) return

    ctx.beginPath();
    ctx.arc(cXReset, cYReset, cRadius, 0, 2 * Math.PI);
    ctx.stroke();
    if (controls.resetVehicle) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }
    ctx.fill()



    ctx.save()
    ctx.translate(cXReset, cYReset)
    ctx.rotate(-Math.PI / 2)
    if (!controls.resetVehicle) {
        ctx.fillStyle = "green"
    } else {
        ctx.fillStyle = "red"
    }

    ctx.font = "30px Arial"
    let infoText = "Reset"
    ctx.fillText(infoText, -15, 0)
    ctx.restore()
}