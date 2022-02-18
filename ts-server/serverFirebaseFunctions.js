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
exports.addCreatedRooms = exports.removeAvailableRoom = void 0;
var firestore_1 = require("@firebase/firestore");
var firebase_config_1 = require("./firebase-config");
var geoip = __importStar(require("geoip-lite"));
var firestore_2 = require("firebase-admin/firestore");
var availableRoomsRefPath = "availableRooms";
var createdRoomsPath = "created-rooms";
var removeAvailableRoom = function (userId) {
    var roomRef = (0, firestore_1.doc)(firebase_config_1.firestore, availableRoomsRefPath, userId);
    (0, firestore_1.deleteDoc)(roomRef).catch(function (err) {
        console.warn("Error removing room:", err);
    });
};
exports.removeAvailableRoom = removeAvailableRoom;
var addCreatedRooms = function (ip, roomId, userId) {
    if (firebase_config_1.onLocalHost) {
        console.log("on local host");
        return;
    }
    var ref = firebase_config_1.adminFirestore.collection(createdRoomsPath).doc();
    var geo = geoip.lookup(ip);
    var obj = {
        ip: ip,
        roomId: roomId,
        userId: userId,
        geo: geo,
        date: firestore_2.Timestamp.now()
    };
    var key;
    for (key in obj) {
        if (!obj[key]) {
            console.log("deleting key", key);
            delete obj[key];
        }
    }
    if (!geo) {
        console.log("No geo for ip:", ip);
    }
    ref.set(obj).then(function () {
        console.log("Saved created room");
    }).catch(function (err) {
        console.warn("Error saving created room", err);
    });
};
exports.addCreatedRooms = addCreatedRooms;
