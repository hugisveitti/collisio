import { Socket } from "socket.io"

import {
    MobileControls,
    mts_controls,
    mts_user_settings_changed,
    std_controls,
    STD_SENDINTERVAL_MS,
    std_user_settings_changed
} from "../../public/src/shared-backend/shared-stuff"

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
        this.mobileSocket.on(mts_controls, (mobileControls: MobileControls) => this.handleGottenControls(mobileControls))
        this.setupUserSettingsListener()

        if (this.desktopSocket) {
            this.desktopSocket.emit("test-made-connection", {})
        }

        this.mobileSocket.once("disconnected", () => {
            this.mobileSocket!.off(mts_user_settings_changed, this.handleSettingsChanged)
        })
    }



    setupControlsListener() {
        setInterval(() => {
            this.desktopSocket!.emit(std_controls, { mobileControls: this.mobileControls })
            // set fps
        }, STD_SENDINTERVAL_MS)
    }

    handleSettingsChanged({ userSettings }: { userSettings: any, vehicleSetup: any }) {
        this.userSettingsChanged({ userSettings, playerNumber: 0 })
    }

    setupUserSettingsListener() {
        this.mobileSocket!.on(mts_user_settings_changed, (data: any) => this.handleSettingsChanged(data))
    }

    userSettingsChanged(data: any) {
        if (this.desktopSocket) {
            this.desktopSocket.emit(std_user_settings_changed, data)
        }
    }
}

