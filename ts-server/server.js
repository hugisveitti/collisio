"use strict";
exports.__esModule = true;
/** toDO fix this shit */
var express = require("express");
var path = require("path");
var si = require("systeminformation");
var app = express();
// promises style - new since version 3
si.cpu()
    .then(function (data) {
    console.log("####CPU Info#####");
    console.log(data);
    console.log("#####END CPU INFO#####");
})["catch"](function (error) { return console.error(error); });
var byteToGig = function (byte) {
    return byte / (Math.pow(1024, 3));
};
si.mem()
    .then(function (data) {
    console.log("####Memory Info#####");
    console.log("Total", byteToGig(data.total));
    console.log("Free", byteToGig(data.free));
    console.log("#####END Memory INFO#####");
})["catch"](function (error) { return console.error(error); });
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
app.get("/public-profile/:id", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
app.get("/show-room", function (_, res) {
    res.sendFile(path.join(__dirname, indexHTMLPath));
});
var server = app.listen(port, function () {
    console.log("listening on port " + port);
});
var ServerGame_1 = require("./one-monitor-game/ServerGame");
var io = require("socket.io")(server); // { cors: { origin: "*" } })
var gameMaster = new ServerGame_1["default"](io);
io.on("connection", function (socket) {
    gameMaster.addSocket(socket);
});
