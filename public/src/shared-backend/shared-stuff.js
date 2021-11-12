"use strict";
/**
 * Here is stuff the backend also uses
 * I put this in one file since the backend will generate a .js file which
 * is useless to the front end.
 * So this limits the .js to one file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleControls = exports.MobileControls = void 0;
var MobileControls = /** @class */ (function () {
    function MobileControls(data) {
        this.beta = 0;
        this.gamma = 0;
        this.alpha = 0;
        this.f = false;
        this.b = false;
        this.resetVehicle = false;
        this.pause = false;
        if (data) {
            var keys = Object.keys(data);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                // @ts-ignore
                this[key] = data[key];
            }
        }
    }
    return MobileControls;
}());
exports.MobileControls = MobileControls;
var VehicleControls = /** @class */ (function () {
    function VehicleControls() {
        this.left = false;
        this.right = false;
        this.f = false;
        this.b = false;
        this.steerValue = 0;
    }
    return VehicleControls;
}());
exports.VehicleControls = VehicleControls;
