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
var fs = __importStar(require("fs"));
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
var printMemoryInfo = function () {
    si.mem()
        .then(function (data) {
        console.log("#### Memory Info #####");
        console.log("Total", byteToGig(data.total).toFixed(2), ", Free:", byteToGig(data.free).toFixed(2));
        console.log("##### END Memory INFO #####");
    })
        .catch(function (error) { return console.error(error); });
};
printMemoryInfo();
var port = process.env.PORT || 80;
var os = __importStar(require("os"));
/** only works on my PC */
if (os.hostname().includes("Lisa")) {
    console.log("On localhost");
    port = 5000;
}
var buildFolder = "dist";
app.use(express.static(path.join(__dirname, "../public/" + buildFolder)));
app.use(express.static(path.join(__dirname, "../public/src")));
var indexHTMLPath = "../public/" + buildFolder + "/index.html";
app.get("/test", function (_, res) {
    res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/test.html"));
});
app.get("/mobileonly", function (_, res) {
    res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/test.html"));
});
app.get("/speedtest", function (_, res) {
    res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/test.html"));
});
app.get("/driveinstructions/:filename", function (req, res) {
    var filename = req.params.filename;
    console.log("filename", filename);
    res.sendFile(path.join(__dirname, "./testDriving/recordings/" + filename));
});
app.get("/vehicleconfig/:filename", function (req, res) {
    var filename = req.params.filename;
    console.log("filename", filename);
    res.sendFile(path.join(__dirname, "./testDriving/" + filename));
});
var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "20mb" }));
app.post("/saverecording", function (req, res) {
    var data = req.body;
    var date = new Date().toISOString().slice(0, 10);
    var trackName = data.trackName;
    var numberOfLaps = data.numberOfLaps;
    var vehicleType = data.vehicleType;
    //const fn = path.join(__dirname, `./testDriving/recordings/recording_${trackName}_${numberOfLaps}_${vehicleType}_${date}.txt`)
    var fn = path.join(__dirname, "./testDriving/recordings/recording_" + trackName + "_" + numberOfLaps + "_" + vehicleType + ".txt");
    // fs.open(fn)
    fs.writeFile(fn, data.instructions, function (err) {
        if (err) {
            console.warn("Error saving recording:", err);
            res.status(500).send({ "message": "Error saving file", err: err });
        }
        else {
            res.status(200).send({ "message": "nice", fn: fn });
        }
    });
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
app.get("/tournament", sendIndexHTML);
app.get("/tournament/:id", sendIndexHTML);
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
var shared_stuff_1 = require("../public/src/shared-backend/shared-stuff");
var Worker = require('worker_threads').Worker;
var io = require("socket.io")(server); // { cors: { origin: "*" } })
var roomMaster = new ServerGame_1.default(io);
io.on("connection", function (socket) {
    //  const worker = new Worker("./one-monitor-game/ServerGame.js", { socket })
    roomMaster.addSocket(socket);
    printMemoryInfo();
    socket.once(shared_stuff_1.mdts_number_connected, function () {
        socket.emit(shared_stuff_1.stmd_number_connected, { data: roomMaster.getStats() });
    });
    socket.on("error", function (err) {
        console.warn("Error occured in socket:", err);
    });
});
app.get("*", function (_, res) {
    res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
});
