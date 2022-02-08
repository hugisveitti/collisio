"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsFromSetup = exports.defaultItemsOwnership = exports.getDefaultItemsOwnership = exports.vehicleItems = exports.possibleVehicleMods = exports.getVehicleItemNameFromType = exports.possibleVehicleItemTypes = void 0;
exports.possibleVehicleItemTypes = ["exhaust", "spoiler", "wheelGuards"];
var getVehicleItemNameFromType = function (type) {
    switch (type) {
        case "exhaust":
            return "Exhaust";
        case "spoiler":
            return "Spoiler";
        case "wheelGuards":
            return "Wheel guards";
        default:
            return type;
    }
};
exports.getVehicleItemNameFromType = getVehicleItemNameFromType;
var defaultVehicleProps = {
    mass: 0,
    engineForce: 0,
    frictionSlip: 0,
    suspensionRestLength: 0,
    suspensionStiffness: 0
};
exports.possibleVehicleMods = [
    {
        name: "Acceleration", type: "engineForce", max: 12000, min: 3000,
    },
    {
        name: "Speed", type: "maxSpeed", max: 400, min: 100,
    },
    {
        name: "Mass", type: "mass", max: 1200, min: 0
    },
    {
        name: "Handling", type: "frictionSlip", max: 22, min: 0
    },
    {
        name: "Suspension stiffness", type: "suspensionStiffness", max: 180, min: 30
    },
    {
        name: "Suspension Rest Length", type: "suspensionRestLength", min: 0, max: 2
    }
];
var sportsCarItems = {
    exhaust1: {
        path: "exhaust1",
        id: "sportsCar-exhaust1",
        name: "Willie",
        type: "exhaust",
        cost: 10,
        engineForce: 200,
        maxSpeed: 10
    },
    exhaust2: {
        path: "exhaust2",
        id: "sportsCar-exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 250,
        cost: 200,
        maxSpeed: 20
    },
    exhaust3: {
        id: "sportsCar-exhaust3",
        path: "exhaust3",
        name: "Executive",
        type: "exhaust",
        cost: 800,
        engineForce: 400,
        frictionSlip: -5,
        maxSpeed: -10
    },
    exhaust4: {
        id: "sportsCar-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Ernie Johnson",
        engineForce: 950,
        cost: 1000,
        maxSpeed: -5
    },
    exhaust5: {
        id: "sportsCar-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Sad Charlie",
        engineForce: 1200,
        frictionSlip: -1,
        mass: 500,
        cost: 200000
    },
    spoiler1: {
        id: "sportsCar-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 100,
        engineForce: -1000,
        maxSpeed: -15
    },
    spoiler2: {
        id: "sportsCar-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 3.2,
        mass: -120,
        engineForce: -1500,
        maxSpeed: -10
    },
    spoiler3: {
        id: "sportsCar-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 2.3,
        mass: 130
    },
    spoiler4: {
        id: "sportsCar-spoiler4",
        path: "spoiler4",
        type: "spoiler",
        name: "Sarah",
        cost: 2500,
        frictionSlip: 3,
        mass: 230,
        engineForce: -500,
        maxSpeed: -2
    },
    spoiler5: {
        id: "sportsCar-spoiler5",
        path: "spoiler5",
        type: "spoiler",
        name: "Sylvester",
        cost: 5000,
        frictionSlip: 3,
        mass: -390,
        engineForce: 500
    },
    wheelGuards1: {
        id: "sportsCar-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 2,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
};
var f1Items = {
    exhaust1: {
        id: "f1-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100,
        maxSpeed: 10
    },
    exhaust2: {
        id: "f1-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        id: "f1-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        id: "f1-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 400,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
    exhaust5: {
        id: "f1-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Everlyn",
        cost: 5000,
        engineForce: 800,
        frictionSlip: -2,
        maxSpeed: 25
    },
    spoiler1: {
        id: "f1-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 100
    },
    spoiler2: {
        id: "f1-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 2.2,
        mass: 120
    },
    spoiler3: {
        id: "f1-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 2.3,
        mass: 130
    },
    spoiler4: {
        id: "f1-spoiler4",
        path: "spoiler4",
        type: "spoiler",
        name: "Sarah",
        cost: 2500,
        frictionSlip: 3,
        mass: 230,
        engineForce: 500
    },
    wheelGuards1: {
        id: "f1-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        id: "f1-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Wendy",
        cost: 20000,
        frictionSlip: 1.5,
        mass: -100,
        engineForce: 25,
        suspensionRestLength: .2
    },
};
var normalItems = {};
var testItems = {};
var tractorItems = {};
var normal2Items = {
    exhaust1: {
        id: "normal2-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100,
        maxSpeed: 40
    },
    exhaust2: {
        id: "normal2-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200,
        maxSpeed: 35
    },
    exhaust3: {
        id: "normal2-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
        maxSpeed: 30
    },
    exhaust4: {
        id: "normal2-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Cofefe",
        cost: 2000,
        engineForce: 500,
        frictionSlip: -1,
        mass: 50,
        suspensionRestLength: -.05,
        maxSpeed: 100
    },
    exhaust5: {
        id: "normal2-exhaust5",
        path: "exhaust5",
        type: "exhaust",
        name: "Crazy Cofefe",
        cost: 10000,
        engineForce: 800,
        frictionSlip: -1,
        suspensionRestLength: -.05,
        mass: 25,
        maxSpeed: 110
    },
    spoiler1: {
        id: "normal2-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 100,
        engineForce: -1000
    },
    spoiler2: {
        id: "normal2-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Summer",
        cost: 500,
        frictionSlip: 3.2,
        mass: -120,
        engineForce: -1500
    },
    spoiler3: {
        id: "normal2-spoiler3",
        path: "spoiler3",
        type: "spoiler",
        name: "Sonja",
        cost: 500,
        frictionSlip: 2.3,
        mass: 130
    },
    wheelGuards1: {
        id: "normal2-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        cost: 20000,
        name: "Wonkie",
        frictionSlip: 3,
        engineForce: 1000,
        mass: -50
    },
    wheelGuards2: {
        id: "normal2-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        cost: 25000,
        name: "Bonkie",
        frictionSlip: -2,
        engineForce: 1200,
        mass: -150
    },
    wheelGuards3: {
        id: "normal2-wheelGuards3",
        path: "wheelGuards3",
        type: "wheelGuards",
        cost: 35000,
        name: "Schlonkie",
        frictionSlip: 3.8,
        engineForce: 1500,
        mass: 120,
        suspensionRestLength: 1,
        suspensionStiffness: 20
    }
};
var offRoaderItems = {
    spoiler1: {
        id: "offRoader-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 10,
        engineForce: 100
    },
    spoiler2: {
        id: "offRoader-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Fry",
        cost: 500,
        frictionSlip: 2.5,
        mass: 20,
        engineForce: 120
    },
    exhaust1: {
        id: "offRoader-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100
    },
    exhaust2: {
        id: "offRoader-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        id: "offRoader-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        id: "offRoader-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 200,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
};
var simpleSphereItems = {
    spoiler1: {
        id: "simpleSphere-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Lincon",
        cost: 5000,
        engineForce: 50,
        mass: 18
    },
    spoiler2: {
        id: "simpleSphere-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Peter",
        cost: 7500,
        engineForce: 75,
        mass: 12
    },
    exhaust1: {
        id: "simpleSphere-exhaust1",
        path: "exhaust1",
        name: "Oogle",
        type: "exhaust",
        cost: 1500,
        engineForce: 50,
        mass: 10
    },
};
var gokartItems = {
    spoiler1: {
        id: "gokart-spoiler1",
        path: "spoiler1",
        type: "spoiler",
        name: "Steve",
        cost: 150,
        frictionSlip: 2,
        mass: 10,
        engineForce: 100
    },
    spoiler2: {
        id: "gokart-spoiler2",
        path: "spoiler2",
        type: "spoiler",
        name: "Fry",
        cost: 500,
        frictionSlip: 2.5,
        mass: 20,
        engineForce: 120
    },
    exhaust1: {
        id: "gokart-exhaust1",
        path: "exhaust1",
        name: "Jimmy",
        type: "exhaust",
        cost: 10,
        engineForce: 50,
        mass: 100
    },
    exhaust2: {
        id: "gokart-exhaust2",
        path: "exhaust2",
        type: "exhaust",
        name: "Jonny",
        engineForce: 220,
        cost: 200
    },
    exhaust3: {
        id: "gokart-exhaust3",
        path: "exhaust3",
        type: "exhaust",
        name: "Eve",
        cost: 500,
        engineForce: 300,
        frictionSlip: -1,
    },
    exhaust4: {
        id: "gokart-exhaust4",
        path: "exhaust4",
        type: "exhaust",
        name: "Eva",
        cost: 2000,
        engineForce: 200,
        frictionSlip: -1,
        suspensionRestLength: -.05
    },
    wheelGuards1: {
        id: "gokart-wheelGuards1",
        path: "wheelGuards1",
        type: "wheelGuards",
        name: "Willis",
        cost: 2500,
        frictionSlip: 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
    wheelGuards2: {
        id: "gokart-wheelGuards2",
        path: "wheelGuards2",
        type: "wheelGuards",
        name: "Billis",
        cost: 2500,
        frictionSlip: 1,
        mass: -75,
        engineForce: -50,
        suspensionRestLength: .2
    },
};
var futureItems = {};
var simpleCylindarItems = {};
exports.vehicleItems = {
    normal: normalItems,
    tractor: tractorItems,
    f1: f1Items,
    test: testItems,
    offRoader: offRoaderItems,
    sportsCar: sportsCarItems,
    normal2: normal2Items,
    simpleSphere: simpleSphereItems,
    simpleCylindar: simpleCylindarItems,
    gokart: gokartItems,
    future: futureItems
};
var getDefaultItemsOwnership = function (vehicleType) {
    var keys = Object.keys(exports.vehicleItems[vehicleType]);
    var obj = {};
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        // @ts-ignore
        obj[key] = false;
    }
    return obj;
};
exports.getDefaultItemsOwnership = getDefaultItemsOwnership;
exports.defaultItemsOwnership = {
    normal: undefined,
    tractor: undefined,
    f1: undefined,
    test: undefined,
    offRoader: undefined,
    sportsCar: undefined,
    normal2: undefined,
    simpleSphere: undefined,
    simpleCylindar: undefined,
    gokart: undefined,
    future: undefined
};
var getStatsFromSetup = function (setup) {
    var _a, _b;
    var stats = {};
    for (var _i = 0, possibleVehicleItemTypes_1 = exports.possibleVehicleItemTypes; _i < possibleVehicleItemTypes_1.length; _i++) {
        var item = possibleVehicleItemTypes_1[_i];
        if (setup[item]) {
            for (var _c = 0, possibleVehicleMods_1 = exports.possibleVehicleMods; _c < possibleVehicleMods_1.length; _c++) {
                var mod = possibleVehicleMods_1[_c];
                if (stats[mod.type] === undefined) {
                    stats[mod.type] = 0;
                }
                if ((_a = setup === null || setup === void 0 ? void 0 : setup[item]) === null || _a === void 0 ? void 0 : _a[mod.type]) {
                    // @ts-ignore
                    stats[mod.type] += ((_b = setup[item][mod.type]) !== null && _b !== void 0 ? _b : 0);
                }
            }
        }
    }
    return stats;
};
exports.getStatsFromSetup = getStatsFromSetup;
