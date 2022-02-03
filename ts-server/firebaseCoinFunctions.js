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
exports.setDefaultOwnership = exports.buyItem = exports.updatePlayersTokens = void 0;
var firebase_config_1 = require("./firebase-config");
var medalFuncions_1 = require("../public/src/shared-backend/medalFuncions");
var ownershipFunctions_1 = require("../public/src/shared-backend/ownershipFunctions");
var tokenRefPath = "tokens";
var ownershipPath = "ownership";
var vehicleSetupPath = "vehicleSetup";
/**
 * Trying to eliminate cheaters, don't know if that will work
 * Do just some obvious shit for now
 */
var isValidRace = function (run) {
    if (run.gameTicks < 10) {
        return false;
    }
    if (run.roomTicks < 10) {
        return false;
    }
    if (run.numberOfLaps !== run.lapTimes.length) {
        return false;
    }
    // no map can be beat under 10 sec?
    if (run.totalTime < 4) {
        return false;
    }
    for (var _i = 0, _a = run.lapTimes; _i < _a.length; _i++) {
        var lapTime = _a[_i];
        // lap time under 3 sec is very fast
        if (lapTime < 3) {
            return false;
        }
    }
    if (!run.isAuthenticated)
        return false;
    return true;
};
/**
 * This might be vaunerable since playerId isn't verified with admin.auth().verifyIdToken(userTokenId)
 */
var updatePlayersTokens = function (data) {
    console.log("is valid race", isValidRace(data));
    if (isValidRace(data)) {
        var _a = (0, medalFuncions_1.getMedalAndTokens)(data.trackName, data.numberOfLaps, data.totalTime), medal_1 = _a.medal, XP_1 = _a.XP, coins_1 = _a.coins;
        console.log("medal", medal_1, "XP:", XP_1, "coins:", coins_1);
        var ref_1 = firebase_config_1.adminFirestore.doc(tokenRefPath + "/" + data.playerId); //doc(firestore, tokenRefPath, data.playerId) as FirebaseFirestore.DocumentReference<any>
        ref_1.get().then(function (snap) {
            var update;
            if (snap.exists) {
                update = __assign(__assign({}, medalFuncions_1.defaultTokenData), snap.data());
                update.XP += XP_1;
                update.coins += coins_1;
                update[medal_1] += 1;
            }
            else {
                update = __assign(__assign({}, medalFuncions_1.defaultTokenData), { XP: XP_1, coins: coins_1 });
                update[medal_1] = 1;
            }
            console.log("update", update);
            // at least 10 secs later then the last update
            if (!update.lastUpdate || Date.now() > update.lastUpdate + (1000 * 10)) {
                update.lastUpdate = Date.now();
                try {
                    ref_1.set(update).then(function () {
                        console.log("Updated coins!");
                    }).catch(function (err) {
                        console.warn("Error updating tokens:", err);
                    });
                }
                catch (err) {
                    console.warn("Error updating tokens:", err);
                }
            }
            else {
                console.warn("Less then 10 secs since last update of coins by", data.playerId);
            }
        });
    }
};
exports.updatePlayersTokens = updatePlayersTokens;
/**
 * Get user coins, get user items, see if user already owns item, see if user has enough coins
 * If user has enough coins and does not own the item, the item will be bought
 * @param userId
 * @returns object with {completed, message}
 */
var buyItem = function (userId, item) {
    return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
        var tokenRef, tokensRes, tokenData, coins, itemCost, ownershipRef, owned, ownership, newTokens, batch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tokenRef = firebase_config_1.adminFirestore.doc(tokenRefPath + "/" + userId);
                    return [4 /*yield*/, tokenRef.get()];
                case 1:
                    tokensRes = _a.sent();
                    tokenData = medalFuncions_1.defaultTokenData;
                    coins = 0;
                    if (tokensRes.exists) {
                        tokenData = __assign(__assign({}, medalFuncions_1.defaultTokenData), tokensRes.data());
                        coins = tokenData.coins;
                    }
                    itemCost = ownershipFunctions_1.allCosts[item];
                    console.log("item cost", itemCost);
                    if (itemCost === undefined) {
                        resolve({
                            completed: false,
                            message: "Unknown item " + item
                        });
                        return [2 /*return*/];
                    }
                    if (coins < itemCost) {
                        resolve({
                            completed: false,
                            message: "Not enough money, you need " + (itemCost - coins) + " coins to buy this item"
                        });
                        return [2 /*return*/];
                    }
                    ownershipRef = firebase_config_1.adminFirestore.doc(ownershipPath + "/" + userId);
                    return [4 /*yield*/, ownershipRef.get()];
                case 2:
                    owned = _a.sent();
                    ownership = (0, ownershipFunctions_1.getDefaultOwnership)();
                    console.log("owend", owned);
                    if (owned.exists) {
                        ownership = __assign(__assign({}, ownership), owned.data());
                    }
                    if (ownership[item]) {
                        resolve({
                            completed: false,
                            message: "Item " + item + " is already owned"
                        });
                        return [2 /*return*/];
                    }
                    // this should be atomic
                    // can buy
                    ownership[item] = true;
                    newTokens = __assign(__assign({}, tokenData), { coins: coins - itemCost });
                    batch = firebase_config_1.adminFirestore.batch();
                    batch.update(ownershipRef, ownership);
                    batch.update(tokenRef, newTokens);
                    batch.commit().then(function () {
                        resolve({
                            completed: true,
                            message: "Item " + item + " was bought!"
                        });
                    }).catch(function (err) {
                        console.warn("Error committing buy batch", err);
                        resolve({
                            completed: false,
                            message: "Unknow error buying item"
                        });
                    });
                    return [2 /*return*/];
            }
        });
    }); });
};
exports.buyItem = buyItem;
/**
 * Set default owner ship,
 * use merge, otherwise users could destroy accounts of each other
 */
var setDefaultOwnership = function (userId) {
    return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
        var ref, defaultOwnership, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ref = firebase_config_1.adminFirestore.doc(ownershipPath + "/" + userId) //doc(firestore, tokenRefPath, data.playerId) as FirebaseFirestore.DocumentReference<any>
                    ;
                    console.log("setting default ownership");
                    defaultOwnership = (0, ownershipFunctions_1.getDefaultOwnership)();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ref.set(defaultOwnership)];
                case 2:
                    _a.sent();
                    resolve();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.warn("error setting default ownership", err_1);
                    resolve();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
exports.setDefaultOwnership = setDefaultOwnership;
