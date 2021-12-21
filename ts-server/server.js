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
var path = __importStar(require("path"));
var si = __importStar(require("systeminformation"));
var socket_io_1 = require("socket.io");
var app = express();
// promises style - new since version 3
si.cpu()
    .then(function (data) {
    console.log("####CPU Info#####");
    console.log("cores", data.cores);
    console.log("#####END CPU INFO#####");
})
    .catch(function (error) { return console.error(error); });
var byteToGig = function (byte) {
    return byte / (Math.pow(1024, 3));
};
si.mem()
    .then(function (data) {
    console.log("####Memory Info#####");
    console.log("Total", byteToGig(data.total).toFixed(2));
    console.log("Free", byteToGig(data.free).toFixed(2));
    console.log("#####END Memory INFO#####");
})
    .catch(function (error) { return console.error(error); });
console.log("Max event listeners", socket_io_1.Socket.EventEmitter.defaultMaxListeners);
var port = process.env.PORT || 5000;
// app.use(function (_:Request, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-_uested-With, Content-Type, Accept"
//     );
//     next();
// });
var buildFolder = "dist";
app.use(express.static(path.join(__dirname, "../public/" + buildFolder)));
app.use(express.static(path.join(__dirname, "../public/src")));
var indexHTMLPath = "../public/" + buildFolder + "/index.html";
app.get("/test", function (_, res) {
    res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/test.html"));
});
app.get("/ammo.wasm.js", function (_, res) {
    res.sendFile(path.join(__dirname, "./public/" + buildFolder + "/ammo/ammo.wasm.js"));
});
app.get("/", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
var sendIndexHTML = function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
};
app.get("/trophy", sendIndexHTML);
app.get("/trophy/:id", sendIndexHTML);
// There must be some better way to do this shit
app.get("/wait", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/wait/:gameId", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/game", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
// app.get("/game/:id", (_: Request, res: Response) => {
//     res.sendFile(path.join(__dirname, indexHTMLPath));
// });
app.get("/premium", sendIndexHTML);
app.get("/about", sendIndexHTML);
app.get("/connect", sendIndexHTML);
app.get("/controls", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/how-to-play", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/highscores", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/private-profile", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/user/:id", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/show-room", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
var adminHTMLPath = "../public/" + buildFolder + "/admin.html";
app.get("/admin", function (req, res) {
    res.sendFile(path.join(__dirname, adminHTMLPath));
});
var adminTools_1 = require("./adminTools");
(0, adminTools_1.adminFunctions)(app);
var server = app.listen(port, function () {
    console.log("listening on port " + port);
});
var ServerGame_1 = __importDefault(require("./one-monitor-game/ServerGame"));
var Worker = require('worker_threads').Worker;
var io = require("socket.io")(server); // { cors: { origin: "*" } })
var roomMaster = new ServerGame_1.default(io);
io.on("connection", function (socket) {
    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket);
});
app.get("*", function (_, res) {
    res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
});
