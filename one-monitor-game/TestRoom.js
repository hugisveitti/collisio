const { MobileControls } = require("../utils/controls")

class TestRoom {

    players
    desktopSocket
    mobileSocket
    isConnected
    mobileControls
    vehicleType
    userSettings

    constructor() {
        this.mobileControls = new MobileControls()
    }

    setDesktopSocket(socket) {
        this.desktopSocket = socket
        this.setupControlsListener()
        this.desktopSocket.on("disconnected", () => {
            console.log("test room desktop disconnected") +
                this.desktopSocket.off("get-controls")
        })

        if (this.mobileSocket) {
            this.mobileSocket.emit("test-made-connection", {})
        }
    }



    setMobileSocket(mobileSocket) {
        this.mobileSocket = mobileSocket
        this.mobileSocket.on("send-controls", (mobileControls) => {
            this.mobileControls = mobileControls
        })
        this.setupUserSettingsListener()

        if (this.desktopSocket) {
            this.desktopSocket.emit("test-made-connection", {})
        }
    }

    setupControlsListener() {
        setInterval(() => {
            this.desktopSocket.emit("get-controls", { mobileControls: this.mobileControls })
            // set fps
        }, 1000 / 90)
    }

    setupUserSettingsListener() {
        this.mobileSocket.on("settings-changed", (newUserSettings) => {
            this.userSettings = newUserSettings
            // if user is the only player and logs in from a different browser, it will push the current user out, delete the game and thus there needs to be a check or something better?

            this.userSettingsChanged({ userSettings: this.userSettings, playerNumber: this.playerNumber })

        })
    }

    userSettingsChanged(data) {
        if (this.desktopSocket) {
            this.desktopSocket.emit("user-settings-changed", data)
        }
    }
}

module.exports = TestRoom