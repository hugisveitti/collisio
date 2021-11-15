"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shared_stuff_1 = require("../../public/src/shared-backend/shared-stuff");
var TestRoom = /** @class */ (function () {
    function TestRoom() {
        this.mobileControls = new shared_stuff_1.MobileControls();
    }
    TestRoom.prototype.setDesktopSocket = function (socket) {
        this.desktopSocket = socket;
        this.setupControlsListener();
        this.desktopSocket.on("disconnected", function () {
            console.log("test room desktop disconnected");
        });
        if (this.mobileSocket) {
            this.mobileSocket.emit("test-made-connection", {});
        }
    };
    TestRoom.prototype.handleGottenControls = function (mobileControls) {
        this.mobileControls = mobileControls;
    };
    TestRoom.prototype.setMobileSocket = function (mobileSocket) {
        var _this = this;
        this.mobileSocket = mobileSocket;
        this.mobileSocket.on("send-controls", function (mobileControls) { return _this.handleGottenControls(mobileControls); });
        this.setupUserSettingsListener();
        if (this.desktopSocket) {
            this.desktopSocket.emit("test-made-connection", {});
        }
        this.mobileSocket.once("disconnected", function () {
            _this.mobileSocket.off(shared_stuff_1.mts_user_settings_changed, _this.handleSettingsChanged);
        });
    };
    TestRoom.prototype.setupControlsListener = function () {
        var _this = this;
        setInterval(function () {
            _this.desktopSocket.emit("get-controls", { mobileControls: _this.mobileControls });
            // set fps
        }, 1000 / 90);
    };
    TestRoom.prototype.handleSettingsChanged = function (newUserSettings) {
        this.userSettingsChanged({ userSettings: newUserSettings, playerNumber: 0 });
    };
    TestRoom.prototype.setupUserSettingsListener = function () {
        var _this = this;
        this.mobileSocket.on(shared_stuff_1.mts_user_settings_changed, function (data) { return _this.handleSettingsChanged(data); });
    };
    TestRoom.prototype.userSettingsChanged = function (data) {
        if (this.desktopSocket) {
            this.desktopSocket.emit(shared_stuff_1.std_user_settings_changed, data);
        }
    };
    return TestRoom;
}());
exports.default = TestRoom;
