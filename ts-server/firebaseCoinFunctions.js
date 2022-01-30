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
exports.updatePlayersTokens = void 0;
var firebase_config_1 = require("./firebase-config");
var medalFuncions_1 = require("../public/src/shared-backend/medalFuncions");
var tokenRefPath = "tokens";
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
// setTimeout(() => {
//     updatePlayersTokens({
//         playerId: "test2",
//         trackName: "farm-track",
//         numberOfLaps: 2,
//         totalTime: 100,
//         lapTimes: [50, 50],
//         isAuthenticated: true,
//         roomTicks: 100,
//         gameTicks: 100,
//     })
// }, 500)
