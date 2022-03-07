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
        this.mobileSocket.on(shared_stuff_1.mts_controls, function (mobileControls) { return _this.handleGottenControls(mobileControls); });
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
            _this.desktopSocket.emit(shared_stuff_1.std_controls, { mobileControls: _this.mobileControls });
            // set fps
        }, shared_stuff_1.STD_SENDINTERVAL_MS);
    };
    TestRoom.prototype.handleSettingsChanged = function (_a) {
        var userSettings = _a.userSettings;
        this.userSettingsChanged({ userSettings: userSettings, playerNumber: 0 });
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
