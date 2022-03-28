"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTokenData = exports.getMedalAndTokens = exports.getNextMedal = exports.getMedal = void 0;
var times = {
    "farm-track": {
        gold: 20,
        silver: 25,
        bronze: 30,
        weight: 1
    },
    "basic-track1": {
        gold: 17,
        silver: 20,
        bronze: 22,
        weight: .9
    },
    "basic-track2": {
        gold: 23,
        silver: 25,
        bronze: 27,
        weight: 1.3
    },
    "basic-track3": {
        gold: 22.7,
        silver: 25,
        bronze: 28.5,
        weight: 1.3
    },
    "basic-track4": {
        gold: 22.7,
        silver: 25,
        bronze: 28.5,
        weight: 1.3
    },
    "basic-track5": {
        gold: 36.7,
        silver: 40,
        bronze: 46.5,
        weight: 1.9
    },
    "f1-track": {
        gold: 21,
        silver: 29,
        bronze: 35,
        weight: 1
    },
    "f1-track-2": {
        gold: 27.2,
        silver: 31,
        bronze: 35,
        weight: 1.4
    },
    // Beach
    "sea-side-track": {
        gold: 52,
        silver: 62,
        bronze: 69,
        weight: 2.1
    },
    "silverstone-track": {
        gold: 130,
        silver: 145,
        bronze: 180,
        weight: 4.1
    },
    "albert-park-track": {
        gold: 70,
        silver: 80,
        bronze: 90,
        weight: 2.8
    },
    // Mountain
    "russia-track": {
        gold: 28.5,
        silver: 33,
        bronze: 39,
        weight: 1.45
    },
    "ferrari-track": {
        gold: 41.5,
        silver: 48,
        bronze: 55,
        weight: 1.7
    },
    // Desert
    "spa-track": {
        gold: 45,
        silver: 55,
        bronze: 65,
        weight: 1.8
    },
    "nurn-track": {
        gold: 23,
        silver: 28,
        bronze: 33,
        weight: 1.1
    },
    "town-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "monaco-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "farmers-little-helper-map": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "speed-test-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "skii-map": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "small-track": {
        gold: 5,
        silver: 10,
        bronze: 15,
        weight: .1,
    },
    "small-jump-track": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "test-course": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "simple-tag-course": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
    "basic-tag-course": {
        gold: 1000,
        silver: 1000,
        bronze: 1000,
        weight: 0,
    },
};
var getMedal = function (trackName, numberOfLaps, totalTime) {
    if (trackName in times) {
        var _a = times[trackName], gold = _a.gold, silver = _a.silver, bronze = _a.bronze;
        // first lap is slowest
        if (numberOfLaps === 1) {
            if (totalTime < gold + 3) {
                return { medal: "gold", secToNext: undefined };
            }
            if (totalTime < silver + 3) {
                return { medal: "silver", secToNext: totalTime - (gold + 3) };
            }
            if (totalTime < bronze + 3) {
                return { medal: "bronze", secToNext: totalTime - (silver + 3) };
            }
            return { medal: "none", secToNext: totalTime - (bronze + 3) };
        }
        if (totalTime < gold * numberOfLaps) {
            return { medal: "gold", secToNext: undefined };
        }
        if (totalTime < silver * numberOfLaps) {
            return { medal: "silver", secToNext: totalTime - (gold) };
        }
        if (totalTime < bronze * numberOfLaps) {
            return { medal: "bronze", secToNext: totalTime - (silver) };
        }
        return { medal: "none", secToNext: totalTime - (bronze) };
    }
    return { medal: "none", secToNext: undefined };
};
exports.getMedal = getMedal;
/**
 * It makes the most sense to have <medal>Coins * numberOfLaps be the
 * amount of coins players receive, but it is more difficult to play longer games
 * So it could be something like <medal>Coins * (numberOfLaps ** 1.1)
 * But then if I show ads after every third game it would make sense to make players play more games instead of longer ones.
 *
 */
var getNextMedal = function (medal) {
    switch (medal) {
        case "none":
            return "bronze";
        case "bronze":
            return "silver";
        case "silver":
            return "gold";
        case "gold":
            return undefined;
    }
};
exports.getNextMedal = getNextMedal;
var coinsAmount = {
    "gold": 200,
    "silver": 100,
    "bronze": 50,
    "none": 15
};
/**
 *
 * @param trackName
 * @param numberOfLaps
 * @returns XP, I think it makes sense that XP is not determined by how well you play
 */
var getXP = function (trackName, numberOfLaps) {
    return Math.floor(10 * (Math.pow(numberOfLaps, 1.1))) * times[trackName].weight;
};
/**
 * Returns how much XP and coins a player recieves for
 *
 */
var getMedalAndTokens = function (trackName, numberOfLaps, totalTime) {
    var _a = (0, exports.getMedal)(trackName, numberOfLaps, totalTime), medal = _a.medal, secToNext = _a.secToNext;
    var trackWeight = times[trackName].weight;
    return {
        coins: Math.floor(coinsAmount[medal] * (Math.pow(numberOfLaps, 1.1))) * trackWeight,
        XP: getXP(trackName, numberOfLaps),
        medal: medal,
        secToNext: secToNext
    };
};
exports.getMedalAndTokens = getMedalAndTokens;
exports.defaultTokenData = {
    gold: 0,
    silver: 0,
    bronze: 0,
    none: 0,
    XP: 0,
    coins: 0,
    //  lastUpdate: Date.now()
};
