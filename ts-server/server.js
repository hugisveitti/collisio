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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** toDO fix this shit */
var express = require("express");
var _a = require("@socket.io/sticky"), setupMaster = _a.setupMaster, setupWorker = _a.setupWorker;
var _b = require("@socket.io/cluster-adapter"), createAdapter = _b.createAdapter, setupPrimary = _b.setupPrimary;
var helperFunctions_1 = require("./utils/helperFunctions");
var router_1 = __importStar(require("./router"));
var adminTools_1 = require("./adminTools");
var ServerGame_1 = __importDefault(require("./one-monitor-game/ServerGame"));
var shared_stuff_1 = require("../public/src/shared-backend/shared-stuff");
var process_1 = __importDefault(require("process"));
var createApp = function (isPrimary) {
    var app = express();
    (0, adminTools_1.adminFunctions)(app);
    (0, helperFunctions_1.printMemoryInfo)();
    var port = (0, router_1.getPortLocalhost)().port;
    var server;
    (0, router_1.default)(app);
    server = app.listen(port, function () {
        console.log("---listening on port " + port + "---");
    });
    return { server: server, app: app };
};
console.log("Primary " + process_1.default.pid + " is running");
var _c = createApp(true), app = _c.app, server = _c.server;
var io = require("socket.io")(server); // { cors: { origin: "*" } })
var roomMaster = new ServerGame_1.default(io);
io.on("connection", function (socket) {
    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket);
    // printMemoryInfo()
    socket.once(shared_stuff_1.mdts_number_connected, function () {
        socket.emit(shared_stuff_1.stmd_number_connected, { data: roomMaster.getStats() });
    });
    socket.on("error", function (err) {
        console.warn("Error occured in socket:", err);
    });
});
