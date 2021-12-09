"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFunctions = void 0;
var firestore_1 = require("@firebase/firestore");
var firestore_2 = require("firebase/firestore");
var firebase_config_1 = require("./firebase-config");
var buildFolder = "dist";
var adminFunctions = function (app) {
    var adminsRefPath = "admins";
    var roomDataPath = "roomData";
    var gameDataPath = "allGames";
    var getIsAdmin = function (userId, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var adminsRef, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    adminsRef = (0, firestore_1.doc)(firebase_config_1.firestore, adminsRefPath, userId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, firestore_1.getDoc)(adminsRef)];
                case 2:
                    data = _a.sent();
                    if (data.exists()) {
                        callback(true);
                    }
                    else {
                        callback(false);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.warn("Error getting isAdmin", e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    app.get("/role/:userTokenId", function (req, res) {
        var data = req.params;
        var userTokenId = data.userTokenId;
        firebase_config_1.admin.auth().verifyIdToken(userTokenId).then(function (decodedToken) {
            getIsAdmin(decodedToken.uid, function (isAdmin) {
                if (isAdmin) {
                    res.status(200).send(JSON.stringify({
                        status: "success",
                        statusCode: 200,
                        message: "Welcome admin"
                    }));
                }
                else {
                    res.status(403).send(JSON.stringify({
                        status: "error",
                        statusCode: 403,
                        message: "Unauthorized"
                    }));
                }
            });
        });
    });
    var getRoomData = function (userId, queryParams, callback) {
        /** first check if user is admin */
        getIsAdmin(userId, function (isAdmin) { return __awaiter(void 0, void 0, void 0, function () {
            var roomDataRef, q, data, rooms_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isAdmin) return [3 /*break*/, 5];
                        roomDataRef = (0, firestore_2.collection)(firebase_config_1.firestore, roomDataPath);
                        q = (0, firestore_1.query)(roomDataRef, (0, firestore_1.orderBy)("date", "desc"));
                        if (queryParams.n) {
                            q = (0, firestore_1.query)(q, (0, firestore_1.limit)(queryParams.n));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                    case 2:
                        data = _a.sent();
                        rooms_1 = [];
                        data.forEach(function (doc) {
                            rooms_1.push(doc.data());
                        });
                        callback({
                            status: "success",
                            statusCode: 200,
                            data: rooms_1,
                            message: "Successfully gotten room data"
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        console.warn("Error getting room data", e_2);
                        callback({
                            status: "error",
                            statusCode: 500,
                            message: "Error gotten room data"
                        });
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        callback({
                            status: "error",
                            statusCode: 403,
                            message: "User not admin"
                        });
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    var getGameData = function (userId, queryParams, callback) {
        getIsAdmin(userId, function (isAdmin) { return __awaiter(void 0, void 0, void 0, function () {
            var gameDataRef, q, data, games_1, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isAdmin) return [3 /*break*/, 5];
                        gameDataRef = (0, firestore_2.collection)(firebase_config_1.firestore, gameDataPath);
                        q = (0, firestore_1.query)(gameDataRef, (0, firestore_1.orderBy)("date", "desc"));
                        if (queryParams.n) {
                            q = (0, firestore_1.query)(q, (0, firestore_1.limit)(queryParams.n));
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                    case 2:
                        data = _a.sent();
                        games_1 = [];
                        data.forEach(function (doc) {
                            games_1.push(doc.data());
                        });
                        callback({
                            status: "success",
                            statusCode: 200,
                            data: games_1,
                            message: "Successfully gotten room data"
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        console.warn("Error getting game data", e_3);
                        callback({
                            status: "error",
                            statusCode: 500,
                            message: "Error"
                        });
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        callback({
                            status: "error",
                            statusCode: 403,
                            message: "User not admin"
                        });
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    var getQueryParams = function (req) {
        var n = req.query.n;
        var queryParams = {
            n: n && !isNaN(+n) ? +n : undefined
        };
        return queryParams;
    };
    /**
     * query params
     * n: number of latest entries to fetch
     */
    app.get("/room-data/:userTokenId", function (req, res) {
        var data = req.params;
        var userTokenId = data.userTokenId;
        var queryParams = getQueryParams(req);
        firebase_config_1.admin.auth().verifyIdToken(userTokenId).then(function (decodedToken) {
            getRoomData(decodedToken.uid, queryParams, (function (roomDataRes) {
                res.status(roomDataRes.statusCode).send(JSON.stringify(roomDataRes));
            }));
        }).catch(function (err) {
            console.warn("error", err);
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        });
    });
    /**
        * query params
        * n: number of latest entries to fetch
        */
    app.get("/game-data/:userTokenId", function (req, res) {
        var data = req.params;
        var userTokenId = data.userTokenId;
        var queryParams = getQueryParams(req);
        firebase_config_1.admin.auth().verifyIdToken(userTokenId).then(function (decodedToken) {
            getGameData(decodedToken.uid, queryParams, (function (gameDataRes) {
                res.status(gameDataRes.statusCode).send(JSON.stringify(gameDataRes));
            }));
        }).catch(function (err) {
            console.warn("error", err);
            res.status(403).send(JSON.stringify({ message: "Could not verify user", status: "error" }));
        });
    });
};
exports.adminFunctions = adminFunctions;
