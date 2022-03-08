"use strict";
/**
 * Here should only be functions that cannot be executed on the client for some reason
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInEurope = exports.getGeoInfo = exports.deleteUndefined = exports.addCreatedRooms = exports.removeAvailableRoom = void 0;
var firestore_1 = require("@firebase/firestore");
var firestore_2 = require("firebase-admin/firestore");
var geoip = __importStar(require("geoip-lite"));
var europe_1 = require("./europe");
var firebase_config_1 = require("./firebase-config");
var availableRoomsRefPath = "availableRooms";
var createdRoomsPath = "created-rooms";
var removeAvailableRoom = function (userId) {
    var roomRef = (0, firestore_1.doc)(firebase_config_1.firestore, availableRoomsRefPath, userId);
    (0, firestore_1.deleteDoc)(roomRef).catch(function (err) {
        console.warn("Error removing room:", err);
    });
};
exports.removeAvailableRoom = removeAvailableRoom;
var addCreatedRooms = function (roomId, userId, extraData) {
    if (firebase_config_1.onLocalHost) {
        return;
    }
    var ref = firebase_config_1.adminFirestore.collection(createdRoomsPath).doc();
    var obj = {
        roomId: roomId,
        userId: userId,
        date: firestore_2.Timestamp.now(),
        extraData: extraData
    };
    obj = (0, exports.deleteUndefined)(obj);
    try {
        ref.set(obj).then(function () {
        }).catch(function (err) {
            console.warn("Error saving created room", err);
        });
    }
    catch (err) {
        console.warn("ERROR SAVING ROOM", err);
    }
};
exports.addCreatedRooms = addCreatedRooms;
/**
 * recursively delete all undefined
 * @param obj
 * @returns obj with all undefined or null removed
 */
var deleteUndefined = function (obj) {
    var key;
    for (key in obj) {
        if (obj[key] === undefined || obj[key] === null) {
            delete obj[key];
        }
        if (typeof obj[key] === "object") {
            obj[key] = (0, exports.deleteUndefined)(obj[key]);
        }
    }
    return obj;
};
exports.deleteUndefined = deleteUndefined;
var getGeoInfo = function (socket) {
    var _a;
    var ip = (_a = socket.handshake.headers['x-forwarded-for']) !== null && _a !== void 0 ? _a : socket.conn.remoteAddress;
    if (Array.isArray(ip)) {
        ip = ip.join("");
    }
    var geo = geoip.lookup(ip);
    var inEurope = (0, exports.isInEurope)(geo === null || geo === void 0 ? void 0 : geo.country);
    return { geo: geo, ip: ip, inEurope: inEurope };
};
exports.getGeoInfo = getGeoInfo;
var isInEurope = function (country) {
    if (!country)
        return false;
    var inEurope = false;
    for (var _i = 0, europeArray_1 = europe_1.europeArray; _i < europeArray_1.length; _i++) {
        var c = europeArray_1[_i];
        if (c === country) {
            inEurope = true;
            break;
        }
    }
    return inEurope;
};
exports.isInEurope = isInEurope;
