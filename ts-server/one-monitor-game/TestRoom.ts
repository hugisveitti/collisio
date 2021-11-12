import { Socket } from "socket.io"

import { MobileControls } from "../../public/src/shared-backend/shared-stuff"

export default class TestRoom {

    desktopSocket?: Socket
    mobileSocket?: Socket
    mobileControls

    constructor() {
        this.mobileControls = new MobileControls()
    }

    setDesktopSocket(socket: Socket) {
        this.desktopSocket = socket
        this.setupControlsListener()
        this.desktopSocket.on("disconnected", () => {
            console.log("test room desktop disconnected")
        })

        if (this.mobileSocket) {
            this.mobileSocket.emit("test-made-connection", {})
        }
    }

    handleGottenControls(mobileControls: MobileControls) {
        this.mobileControls = mobileControls
    }



    setMobileSocket(mobileSocket: Socket) {
        this.mobileSocket = mobileSocket
        this.mobileSocket.on("send-controls", (mobileControls: MobileControls) => this.handleGottenControls(mobileControls))
        this.setupUserSettingsListener()

        if (this.desktopSocket) {
            this.desktopSocket.emit("test-made-connection", {})
        }

        this.mobileSocket.once("disconnected", () => {
            this.mobileSocket!.off("settings-changed", this.handleSettingsChanged)
        })
    }



    setupControlsListener() {
        setInterval(() => {
            this.desktopSocket!.emit("get-controls", { mobileControls: this.mobileControls })
            // set fps
        }, 1000 / 90)
    }

    handleSettingsChanged(newUserSettings: any) {
        this.userSettingsChanged({ userSettings: newUserSettings, playerNumber: 0 })
    }

    setupUserSettingsListener() {
        this.mobileSocket!.on("settings-changed", (data: any) => this.handleSettingsChanged(data))
    }

    userSettingsChanged(data: any) {
        if (this.desktopSocket) {
            this.desktopSocket.emit("user-settings-changed", data)
        }
    }
}

