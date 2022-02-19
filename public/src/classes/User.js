"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTypeName = exports.defaultUserSettings = exports.defaultVehicleSettings = exports.minEngineForce = exports.maxEngineForce = exports.steeringSensitivityStep = exports.maxSteeringSensitivity = exports.minSteeringSensitivity = void 0;
var shared_stuff_1 = require("../shared-backend/shared-stuff");
exports.minSteeringSensitivity = 0.1;
exports.maxSteeringSensitivity = 3;
exports.steeringSensitivityStep = 0.1;
exports.maxEngineForce = 20000;
exports.minEngineForce = 500;
exports.defaultVehicleSettings = {
    steeringSensitivity: 0.2,
    chaseCameraSpeed: .25,
    useChaseCamera: true,
    vehicleType: shared_stuff_1.defaultVehicleType,
    cameraZoom: 4,
    noSteerNumber: 1,
    useDynamicFOV: true
};
exports.defaultUserSettings = {
    vehicleSettings: exports.defaultVehicleSettings,
};
var getUserTypeName = function (userType) {
    switch (userType) {
        case "premium":
            return "Premium";
        case "standard":
            return "Standard";
        default:
            return "Basic";
    }
};
exports.getUserTypeName = getUserTypeName;
