import React from "react"
import { toast } from "react-toastify"
import { Socket } from "socket.io-client"
import { MobileControls } from "../utils/ControlsClasses"
import { getDeviceType } from "../utils/settings"
import { drawAccelerator, drawBreak, drawDeccelerator, drawResetButton, handleTouchEnd, handleTouchStart, touchActions, isPortrait, getWidthHeight, drawSettings } from "./mobileGui"

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
let canvas: HTMLCanvasElement



let { width, height } = getWidthHeight()

if (getDeviceType() === "mobile") {

    window.addEventListener("orientationchange", () => {
        const { width: _w, height: _h } = getWidthHeight()
        width = _w
        height = _h
        const screenWidthBigger = screen.height < screen.width
        const windowWidthBigger = window.innerHeight < window.innerWidth

        console.log("window dim", window.innerWidth, window.innerHeight)
        console.log("screen dim", screen.width, screen.height)


        if (screenWidthBigger !== windowWidthBigger) {
            console.log("screen and window resolution not the same")
        }

        canvas.height = height
        canvas.width = width
    })


}


const deviceOrientationHandler = (e: DeviceOrientationEvent) => {
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
}


const createDeviceOrientationListener = () => {
    if (!window.DeviceMotionEvent) {
        toast.error("Device motion not supported in the browser, please use Google Chrome or add 'https://' instead of 'http://'")
    }
    if (deviceorientationCreated) {
        toast("Creating new device orientation listener")
    } else {
        deviceorientationCreated = true
    }

    window.addEventListener("deviceorientation", deviceOrientationHandler)
}

export interface GyroscopeConfig {
    socket: Socket
    setSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const initGryoscope = (config: GyroscopeConfig) => {

    canvas = document.createElement("canvas")
    canvas.onselectstart = () => false

    canvas.setAttribute("id", "controller-canvas")

    canvas.height = height
    canvas.width = width
    ctx = canvas.getContext("2d")

    document.body.appendChild(canvas)

    window.addEventListener("touchstart", (e) => {
        handleTouchStart(e, config.socket, controls, (touchAction: touchActions) => {
            if (touchAction === "settings") {
                config.setSettingsModalOpen(true)
                // window.removeEventListener("deviceorientation", deviceOrientationHandler)
                // createDeviceOrientationListener()
            }
        })
    }
    )
    window.addEventListener("touchend", () => handleTouchEnd(config.socket, controls))

    createDeviceOrientationListener()

    startLoop(config.socket)
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

        if (ctx) {

            ctx.clearRect(0, 0, width, height);
            drawAccelerator(ctx, controls)
            drawDeccelerator(ctx, controls)
            drawBreak(ctx, controls)
            drawResetButton(ctx, controls)
            drawSettings(ctx, controls)
            if (motion) {
                ctx.save()
                ctx.translate(width / 2, height / 2)
                if (isPortrait) {
                    ctx.rotate(-Math.PI / 2)
                }

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
                if (isPortrait) {
                    ctx.rotate(-Math.PI / 2)
                }

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