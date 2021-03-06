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
var geoip_lite_1 = require("geoip-lite");
var os = __importStar(require("os"));
var path = __importStar(require("path"));
var firebaseCoinFunctions_1 = require("./firebaseCoinFunctions");
var serverFirebaseFunctions_1 = require("./serverFirebaseFunctions");
/** toDO fix this shit */
var express = require("express");
var getPortLocalhost = function () {
    var port = process.env.PORT || 80;
    /** only works on my PC */
    var onLocalhost = false;
    if (os.hostname().includes("Lisa")) {
        port = 5000;
        onLocalhost = true;
    }
    return { port: port, onLocalhost: onLocalhost };
};
exports.getPortLocalhost = getPortLocalhost;
var printRequestInfo = function (req) {
    var _a;
    var host = req.get("host");
    console.log("host", host, ", ip", req.socket.remoteAddress, ", behind proxy ip:", (_a = req.headers) === null || _a === void 0 ? void 0 : _a['x-forwarded-for'], ", express ip:", req.ip, ", url:", req.url, "date:", new Date().toISOString());
};
var router = function (app) {
    var bodyParser = require("body-parser");
    app.use(bodyParser.json({ limit: "20mb" }));
    var onLocalhost = (0, exports.getPortLocalhost)().onLocalhost;
    var isValidHost = function (host) {
        return onLocalhost || (host === null || host === void 0 ? void 0 : host.includes("collisio.club")) || (host === null || host === void 0 ? void 0 : host.includes("collisia.club"));
    };
    app.post("/buyitem", function (req, res) {
        var _a = req.body, userId = _a.userId, item = _a.item, vehicleType = _a.vehicleType;
        console.log("Buy item", userId, item);
        if (userId && item) {
            (0, firebaseCoinFunctions_1.buyItem)(userId, item, vehicleType).then(function (data) {
                res.status(200).send(data);
            });
        }
        else {
            res.status(404).send({
                message: "Unknown user or item",
                completed: false
            });
        }
    });
    app.get("/country", function (req, res) {
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (Array.isArray(ip)) {
            ip = ip.join("");
        }
        var inEurope = onLocalhost;
        var country = "unknown";
        if (ip) {
            var geo = (0, geoip_lite_1.lookup)(ip);
            if (geo) {
                country = geo === null || geo === void 0 ? void 0 : geo.country;
                inEurope = (0, serverFirebaseFunctions_1.isInEurope)(country);
            }
        }
        res.send(JSON.stringify({ inEurope: inEurope, country: country }));
    });
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
        res.sendFile(path.join(__dirname, "../public/" + buildFolder + "/models/front-page.glb"));
    });
    app.use(express.static(path.join(__dirname, "../public/" + buildFolder), { index: false }));
    app.use(express.static(path.join(__dirname, "../public/src"), { index: false }));
    var indexHTMLPath = "../public/" + buildFolder + "/index.html";
    var sendTestHTML = function (req, res) {
        var host = req.get("host");
        //     printRequestInfo(req)
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
    app.get("/ammo.wasm.js", function (_, res) {
        res.sendFile(path.join(__dirname, "./public/" + buildFolder + "/ammo/ammo.wasm.js"));
    });
    var sendIndexHTML = function (req, res) {
        var host = req.get("host");
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
    app.get("/highscores/*", sendIndexHTML);
    app.get("/private-profile", sendIndexHTML);
    app.get("/user/:id", sendIndexHTML);
    app.get("/show-room", sendIndexHTML);
    app.get("/garage", sendIndexHTML);
    app.get("/tracks", sendIndexHTML);
    app.get("/login", sendIndexHTML);
    app.get("/privacy-policy", sendIndexHTML);
    app.get("/mobile-only-wait", sendIndexHTML);
    app.get("/buycoins", sendIndexHTML);
    app.get("/successfulpayment", sendIndexHTML);
    app.get("/cancelpayment", sendIndexHTML);
    app.get("/multiplayer", sendIndexHTML);
    app.get("/multiplayer/*", sendIndexHTML);
    app.get("/cookies", sendIndexHTML);
    app.get("/termsOfUse", sendIndexHTML);
    app.get("/singleplayer", sendIndexHTML);
    app.get("/singleplayer/*", sendIndexHTML);
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
        //  printRequestInfo(req)
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
