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
exports.getPortLocalhost = void 0;
var os = __importStar(require("os"));
var path = __importStar(require("path"));
/** toDO fix this shit */
var express = require("express");
var getPortLocalhost = function () {
    var port = process.env.PORT || 80;
    /** only works on my PC */
    var onLocalhost = false;
    if (os.hostname().includes("Lisa")) {
        console.log("On localhost");
        port = 5000;
        onLocalhost = true;
    }
    return { port: port, onLocalhost: onLocalhost };
};
exports.getPortLocalhost = getPortLocalhost;
var router = function (app) {
    var onLocalhost = (0, exports.getPortLocalhost)().onLocalhost;
    var isValidHost = function (host) {
        return onLocalhost || (host === null || host === void 0 ? void 0 : host.includes("collisio.club")) || (host === null || host === void 0 ? void 0 : host.includes("collisia.club"));
    };
    var buildFolder = "dist";
    var encrypt = require("../public/src/shared-backend/encryption.json");
    var _loop_1 = function (key) {
        app.get("/" + key, function (req, res) {
            res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/models/" + encrypt[key]));
        });
    };
    for (var _i = 0, _a = Object.keys(encrypt); _i < _a.length; _i++) {
        var key = _a[_i];
        _loop_1(key);
    }
    app.get("/models/front-page.glb", function (req, res) {
        console.log("getting model");
        res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/models/front-page.glb"));
    });
    app.use(express.static(path.join(__dirname, "../public/" + buildFolder), { index: false }));
    app.use(express.static(path.join(__dirname, "../public/src"), { index: false }));
    var indexHTMLPath = "../public/" + buildFolder + "/index.html";
    var sendTestHTML = function (req, res) {
        var host = req.get("host");
        console.log("host", host);
        if (isValidHost(host)) {
            res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/test.html"));
        }
        else {
            res.send("ERROR");
        }
    };
    app.get("/test", sendTestHTML);
    app.get("/mobileonly", sendTestHTML);
    app.get("/speedtest", sendTestHTML);
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
    app.get("/ammo.wasm.js", function (_, res) {
        res.sendFile(path.join(__dirname, "./public/" + buildFolder + "/ammo/ammo.wasm.js"));
    });
    var sendIndexHTML = function (req, res) {
        var host = req.get("host");
        console.log("sending index", "host", host, ", ip", req.socket.remoteAddress, ", url:", req.url, "date:", new Date().toISOString());
        if (isValidHost(host)) {
            res.status(200).sendFile(path.join(__dirname, indexHTMLPath));
        }
        else {
            res.status(500).send("ERROR");
        }
    };
    app.get("/", sendIndexHTML);
    app.get("/trophy", sendIndexHTML);
    app.get("/trophy/:id", sendIndexHTML);
    app.get("/tournament", sendIndexHTML);
    app.get("/tournament/:id", sendIndexHTML);
    // There must be some better way to do this shit
    app.get("/wait", sendIndexHTML);
    app.get("/wait/:gameId", sendIndexHTML);
    app.get("/game", sendIndexHTML);
    app.get("/premium", sendIndexHTML);
    app.get("/about", sendIndexHTML);
    app.get("/connect", sendIndexHTML);
    app.get("/controls", sendIndexHTML);
    app.get("/how-to-play", sendIndexHTML);
    app.get("/highscores", sendIndexHTML);
    app.get("/private-profile", sendIndexHTML);
    app.get("/user/:id", sendIndexHTML);
    app.get("/show-room", sendIndexHTML);
    var adminHTMLPath = "../public/" + buildFolder + "/admin.html";
    app.get("/admin", function (req, res) {
        res.sendFile(path.join(__dirname, adminHTMLPath));
    });
    app.get("/robot.txt", function (req, res) {
        res.status(200).sendFile(path.join(__dirname, "../robot.txt"));
    });
    app.get("/humans.txt", function (req, res) {
        res.status(200).sendFile(path.join(__dirname, "../humans.txt"));
    });
    app.get("*", function (req, res) {
        var host = req.get("host");
        console.log("notfound", "host", host, ", ip", req.socket.remoteAddress, ", url:", req.url, "date:", new Date().toISOString());
        if (isValidHost(host)) {
            // res.sendFile(path.join(__dirname, indexHTMLPath));
            res.status(404).sendFile(path.join(__dirname, indexHTMLPath));
        }
        else {
            res.send("ERROR");
        }
    });
};
exports.default = router;
