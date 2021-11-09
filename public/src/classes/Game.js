"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPreGameSettings = exports.allTrackTypes = void 0;
exports.allTrackTypes = [
    {
        name: "Test", type: "test-course"
    },
    { name: "Farm track", type: "low-poly-farm-track" },
    { name: "F1 track", type: "low-poly-f1-track" },
];
exports.defaultPreGameSettings = {
    ballRadius: 1,
    gameType: "race",
    numberOfLaps: 3,
    trackName: "low-poly-farm-track",
};
