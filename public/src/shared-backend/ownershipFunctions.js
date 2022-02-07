"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allCosts = exports.getDefaultOwnership = exports.getDefaultVehicleColorOwnership = exports.getDefaultTrackOwnership = exports.getDefaultVehicleOwnership = void 0;
var shared_stuff_1 = require("./shared-stuff");
function itemInArray(st, arr) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var t = arr_1[_i];
        if (t === st)
            return true;
    }
    return false;
}
var defaultOwnedVehicles = [
    "f1",
    "normal2",
    "offRoader",
];
var getDefaultVehicleOwnership = function () {
    // @ts-ignore
    var defaultVehicleOwnership = {};
    for (var _i = 0, allVehicleTypes_1 = shared_stuff_1.allVehicleTypes; _i < allVehicleTypes_1.length; _i++) {
        var v = allVehicleTypes_1[_i];
        defaultVehicleOwnership[v.type] = itemInArray(v.type, defaultOwnedVehicles);
    }
    return defaultVehicleOwnership;
};
exports.getDefaultVehicleOwnership = getDefaultVehicleOwnership;
var vehicleCosts = {
    f1: 0,
    normal: 0,
    tractor: 50,
    test: 0,
    offRoader: 0,
    sportsCar: 3000,
    normal2: 0,
    simpleSphere: 500,
    simpleCylindar: 50000,
    gokart: 3000,
    future: 20000
};
var defaultOwnedTracks = [
    "farm-track",
    "nurn-track",
    "f1-track",
    "f1-track-2",
    "sea-side-track",
    "simple-tag-course"
];
var getDefaultTrackOwnership = function () {
    // @ts-ignore
    var defaultTrackOwnership = {};
    for (var _i = 0, allTrackNames_1 = shared_stuff_1.allTrackNames; _i < allTrackNames_1.length; _i++) {
        var v = allTrackNames_1[_i];
        defaultTrackOwnership[v.type] = itemInArray(v.type, defaultOwnedTracks);
    }
    return defaultTrackOwnership;
};
exports.getDefaultTrackOwnership = getDefaultTrackOwnership;
var trackCosts = {
    "farm-track": 0,
    "basic-track": 0,
    "basic-track2": 100,
    "basic-track3": 1000,
    "f1-track": 0,
    "sea-side-track": 0,
    "f1-track-2": 2000,
    "russia-track": 500,
    "ferrari-track": 1000,
    "spa-track": 10000,
    "nurn-track": 0,
    "speed-test-track": 0,
    "small-track": 0,
    "small-jump-track": 0,
    "farmers-little-helper-map": 0,
    "skii-map": 0,
    "monaco-track": 100000000,
    "town-track": 0,
    "simple-tag-course": 0,
    "test-course": 0
};
var defaultOwnedColors = [
    "#1d8a47",
    "#8b0000",
];
var getDefaultVehicleColorOwnership = function () {
    // @ts-ignore
    var defaultOwnership = {};
    for (var _i = 0, vehicleColors_1 = shared_stuff_1.vehicleColors; _i < vehicleColors_1.length; _i++) {
        var v = vehicleColors_1[_i];
        defaultOwnership[v.value] = itemInArray(v.value, defaultOwnedColors);
    }
    return defaultOwnership;
};
exports.getDefaultVehicleColorOwnership = getDefaultVehicleColorOwnership;
var colorCosts = {
    "#1d8a47": 0,
    "#8b0000": 0,
    "#185676": 0,
    "#f07900": 50,
    "#61f72a": 10,
    "#bf923b": 100,
    "#97b0ba": 2 * (Math.pow(10, 6))
};
var getDefaultOwnership = function () {
    return __assign(__assign(__assign({}, (0, exports.getDefaultVehicleOwnership)()), (0, exports.getDefaultTrackOwnership)()), (0, exports.getDefaultVehicleColorOwnership)());
};
exports.getDefaultOwnership = getDefaultOwnership;
exports.allCosts = __assign(__assign(__assign({}, vehicleCosts), trackCosts), colorCosts);
