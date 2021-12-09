"use strict";
exports.__esModule = true;
exports.getDateNow = exports.numberScaler = exports.removeUndefinedFromObject = exports.shuffleArray = exports.itemInArray = void 0;
var itemInArray = function (st, arr) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var t = arr_1[_i];
        if (t === st)
            return true;
    }
    return false;
};
exports.itemInArray = itemInArray;
var shuffleArray = function (arr) {
    var n = 10;
    var j = 0;
    while (j < n) {
        for (var i = 0; i < arr.length; i++) {
            var temp = arr[i];
            var ri = Math.floor(Math.random() * arr.length);
            arr[i] = arr[ri];
            arr[ri] = temp;
        }
        j += 1;
    }
};
exports.shuffleArray = shuffleArray;
var removeUndefinedFromObject = function (object) {
    var keys = Object.keys(object);
    var newObject = {};
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (object[key] !== undefined) {
            if (object[key] !== null && object[key] !== undefined) {
                if (typeof object[key] === "object") {
                    newObject[key] = (0, exports.removeUndefinedFromObject)(object[key]);
                }
                else {
                    newObject[key] = object[key];
                }
            }
            else {
                console.log("not includeing", key, object[key]);
            }
        }
        else {
            console.log("not includeing", key, object[key]);
        }
    }
    return newObject;
};
exports.removeUndefinedFromObject = removeUndefinedFromObject;
/**
 * scale number
 * @param a
 * @param b
 * @param min
 * @param max
 * @returns a number scaler, a function that scales changes the range of a number
 * https://en.wikipedia.org/wiki/Feature_scaling
 * goes from  range min - max to range [a-b]
 */
var numberScaler = function (a, b, min, max) {
    return function (num) {
        return a + (((num - min) * (b - a)) / (max - min));
    };
};
exports.numberScaler = numberScaler;
var getDateNow = function () {
    return new Date().toISOString();
};
exports.getDateNow = getDateNow;
