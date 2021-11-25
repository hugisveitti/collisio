"use strict";
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
exports.adminFunctions = void 0;
var firebase_config_1 = require("./firebase-config");
var path = __importStar(require("path"));
var database_1 = require("@firebase/database");
var buildFolder = "dist";
var adminFunctions = function (app) {
    var adminsRefPath = "admins";
    var roomDataPath = "room-data";
    var getIsAdmin = function (userId, callback) {
        var adminsRef = (0, database_1.ref)(firebase_config_1.database, adminsRefPath + "/" + userId);
        (0, database_1.onValue)(adminsRef, function (snap) {
            if (snap.exists()) {
                /** is admin */
                callback(true);
            }
            else {
                callback(false);
            }
        }, function (err) {
            console.log("error getting admin data");
            callback(false);
        }, {
            onlyOnce: true
        });
    };
    var getRoomData = function (userId, callback) {
        /** first check if user is admin */
        getIsAdmin(userId, function (isAdmin) {
            if (isAdmin) {
                var roomDataRef = (0, database_1.ref)(firebase_config_1.database, roomDataPath);
                (0, database_1.onValue)(roomDataRef, function (snap) {
                    callback({
                        status: "success",
                        statusCode: 200,
                        data: snap.val(),
                        message: "Successfully gotten room data"
                    });
                }, function (err) {
                    console.log("error getting room data");
                    callback({
                        status: "error",
                        statusCode: 500,
                        message: "Unknown error"
                    });
                }, { onlyOnce: true });
            }
            else {
                callback({
                    status: "error",
                    statusCode: 403,
                    message: "User not admin"
                });
            }
        });
    };
    var adminHTMLPath = "../public/" + buildFolder + "/admin.html";
    app.get("/admin", function (req, res) {
        res.sendFile(path.join(__dirname, adminHTMLPath));
    });
    app.get("/admin-data/:userTokenId", function (req, res) {
        var data = req.params;
        var userTokenId = data.userTokenId;
        firebase_config_1.admin.auth().verifyIdToken(userTokenId).then(function (decodedToken) {
            console.log("userid", decodedToken.uid);
            getRoomData(decodedToken.uid, (function (roomDataRes) {
                res.status(200).send(JSON.stringify(roomDataRes));
            }));
        }).catch(function (err) {
            console.log("error", err);
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        });
    });
};
exports.adminFunctions = adminFunctions;
