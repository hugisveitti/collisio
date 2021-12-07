"use strict";
/**
 * Here should only be functions that cannot be executed on the client for some reason
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAvailableRoom = void 0;
var firestore_1 = require("@firebase/firestore");
var firebase_config_1 = require("./firebase-config");
var availableRoomsRefPath = "availableRooms";
var removeAvailableRoom = function (userId) {
    var roomRef = (0, firestore_1.doc)(firebase_config_1.firestore, availableRoomsRefPath, userId);
    (0, firestore_1.deleteDoc)(roomRef).catch(function (err) {
        console.log("Error removing room:", err);
    });
};
exports.removeAvailableRoom = removeAvailableRoom;
