"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXPInfo = exports.getSizePrefix = exports.getPitchRollYawFromQuaternion = exports.getSteerAngleFromBeta = exports.createClassNames = exports.substrArrayInString = exports.get2DAngleBetweenPoints = exports.isBetweenAngles = exports.isBetweenNumbers = exports.getDateString = exports.dictToArray = exports.arrayToDict = exports.radToDeg = exports.degToRad = exports.getDateFromNumber = exports.getDateNow = exports.logScaler = exports.numberScaler = exports.removeUndefinedFromObject = exports.shuffleArray = exports.itemInArray = void 0;
var firestore_1 = require("@firebase/firestore");
function itemInArray(st, arr) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var t = arr_1[_i];
        if (t === st)
            return true;
    }
    return false;
}
exports.itemInArray = itemInArray;
/**
 *
 * @param arr array to shuffle
 * Shuffles the array in place, so it doesn't return anythin
 */
var shuffleArray = function (arr) {
    var n = 4 * arr.length;
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
/**
 *
 * @param object,
 * @returns a version of the object where undefined valeus are removed
 */
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
            }
        }
        else {
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
var numberScaler = function (a, b, min, max, precision) {
    return function (num) {
        return +(a + (((num - min) * (b - a)) / (max - min))).toPrecision(precision);
    };
};
exports.numberScaler = numberScaler;
var logScaler = function (a, min, max) {
    return function (num) {
        return Math.min(Math.max(Math.log2((2 / a) * num), min), max);
    };
};
exports.logScaler = logScaler;
var getDateNow = function () {
    return Date.now();
};
exports.getDateNow = getDateNow;
var getDateFromNumber = function (num) {
    if (typeof num === "number") {
        return new Date(num).toISOString();
    }
    return "-";
};
exports.getDateFromNumber = getDateFromNumber;
exports.degToRad = 0.017453;
exports.radToDeg = 57.2957795;
function arrayToDict(array, key) {
    if (array.length === 0)
        return {};
    var dict = {};
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var item = array_1[_i];
        var id = item[key];
        if (!id) {
            console.warn("Item doesn't have field " + key + " arrayToDict");
            return {};
        }
        // @ts-ignore
        dict[id] = item;
    }
    return dict;
}
exports.arrayToDict = arrayToDict;
function dictToArray(dict) {
    var array = [];
    for (var _i = 0, _a = Object.keys(dict); _i < _a.length; _i++) {
        var key = _a[_i];
        array.push(dict[key]);
    }
    return array;
}
exports.dictToArray = dictToArray;
// stupid
var getDateString = function (date) {
    if (date instanceof Date) {
        return date.toISOString();
    }
    if (date instanceof firestore_1.Timestamp) {
        return date.toDate().toISOString();
    }
    if (date === null || date === void 0 ? void 0 : date.seconds) {
        return new Date(date.seconds).toISOString();
    }
    if (typeof date === "string")
        return date;
    if (typeof date === "number")
        return new Date(date).toISOString();
    return "unknown date";
};
exports.getDateString = getDateString;
/**
 * First the number then the number to check
 * Order doesnt matter
 */
var isBetweenNumbers = function (a, b, num) {
    var max = Math.max(a, b);
    var min = Math.min(a, b);
    return max > num && num > min;
};
exports.isBetweenNumbers = isBetweenNumbers;
// 
// 
var isBetweenAngles = function (smallerAngle, biggerAngle, angle) {
    return smallerAngle < angle && angle < biggerAngle;
};
exports.isBetweenAngles = isBetweenAngles;
/**
 *
 * @param p1
 * @param p2
 * @returns 2d angle, ignoring y
 */
var get2DAngleBetweenPoints = function (p1, p2) {
    return Math.atan2((p2.z - p1.z), (p2.x - p1.x));
};
exports.get2DAngleBetweenPoints = get2DAngleBetweenPoints;
/**
 * @param str
 * @param arr: array of substring
 * returns true if content of str is included in any string in arr
 */
var substrArrayInString = function (str, arr) {
    for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
        var item = arr_2[_i];
        if (str.includes(item)) {
            return true;
        }
    }
    return false;
};
exports.substrArrayInString = substrArrayInString;
var createClassNames = function () {
    var str = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        str[_i] = arguments[_i];
    }
    return str.join(" ");
};
exports.createClassNames = createClassNames;
var getSteerAngleFromBeta = function (beta, noSteerNumber) {
    var angle = 0;
    if (Math.abs(beta) >= noSteerNumber) {
        angle = beta - (noSteerNumber * Math.sign(beta));
    }
    return angle;
};
exports.getSteerAngleFromBeta = getSteerAngleFromBeta;
/**
 *
 * @param q Quaterniton, Threejs
 * @returns Yaw is rotation around the z axis. Pitch is the rotation around the y axis. Roll is the rotation around the x axis.
 */
var getPitchRollYawFromQuaternion = function (q) {
    // Z
    var t3 = 2 * ((q.w * q.z) + (q.x * q.y));
    var t4 = (1 - (2 * ((q.y * q.y) + (q.z + q.z))));
    var yaw = Math.atan2(t3, t4);
    // Y
    var t2 = 2 * ((q.w * q.y) - (q.z * q.x));
    t2 = t2 > 1 ? 1 : t2;
    t2 = t2 < -1 ? -1 : t2;
    var pitch = Math.asin(t2);
    // Roll
    var t0 = 2 * ((q.w * q.x) + (q.y * q.z));
    var t1 = (1 - (2 * ((q.x * q.x) + (q.y * q.y))));
    var roll = Math.atan2(t0, t1);
    return { yaw: yaw, pitch: pitch, roll: roll };
};
exports.getPitchRollYawFromQuaternion = getPitchRollYawFromQuaternion;
var prefixSizes = {
    3: "K",
    6: "M",
    9: "G",
    12: "T"
};
var getSizePrefix = function (num) {
    if (!num)
        return "0";
    var str = num.toFixed(0);
    var l = str.length;
    var prefix = "";
    var prefixSize = 0;
    for (var _i = 0, _a = Object.keys(prefixSizes); _i < _a.length; _i++) {
        var p = _a[_i];
        if (+p < l && +p > prefixSize) {
            prefix = prefixSizes[p];
            prefixSize = +p;
        }
    }
    var prefixString = (num / (Math.pow(10, (prefixSize)))).toFixed(2) + " " + prefix;
    return prefixString;
};
exports.getSizePrefix = getSizePrefix;
// this is semi random right now
var XPtoNextLevel = [
    30, 50, 80, 90, 120, 130, 150, 170, 190, 200, 205, 210, 220, 220, 220, 230, 230, 240, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260, 260
];
/**
 *
 * @param XP how much xp the player has
 * @returns object {currentLevel, pointsToNextLevel, ratioOfLevelFinished}
 *  currentLevel is the level the player is in based off his XP
 *  points to next level are how much XP is needed to get to the next level
 *  ratioOfLevelFinished The ratio of how much of the level the player has completed
 */
var getXPInfo = function (XP) {
    var currentLevel = 0;
    var pointsToNextLevel = 0;
    var pointsFinishedInThisLevel = 0;
    var ratioOfLevelFinished = 0;
    var sumXP = 0;
    if (XPtoNextLevel[0] > XP) {
        return {
            currentLevel: 1, pointsToNextLevel: XPtoNextLevel[0] - XP, ratioOfLevelFinished: XP / XPtoNextLevel[0], pointsFinishedInThisLevel: XP
        };
    }
    for (var i = 0; i < XPtoNextLevel.length; i++) {
        sumXP += XPtoNextLevel[i];
        var lowerNumber = sumXP;
        var higherNumber = XPtoNextLevel[i + 1] + sumXP;
        if (lowerNumber <= XP && XP <= higherNumber) {
            currentLevel = i + 2;
            pointsToNextLevel = higherNumber - XP;
            pointsFinishedInThisLevel = XP - lowerNumber;
            ratioOfLevelFinished = pointsFinishedInThisLevel / (pointsFinishedInThisLevel + pointsToNextLevel);
            break;
        }
    }
    if (currentLevel === 0) {
        currentLevel = XPtoNextLevel.length;
        ratioOfLevelFinished = 1;
        pointsToNextLevel = 0;
        pointsFinishedInThisLevel = 260;
    }
    return { currentLevel: currentLevel, pointsToNextLevel: pointsToNextLevel, ratioOfLevelFinished: ratioOfLevelFinished, pointsFinishedInThisLevel: pointsFinishedInThisLevel };
};
exports.getXPInfo = getXPInfo;
