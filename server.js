const express = require("express");
const app = express();
const path = require("path");


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(express.static(path.join(__dirname, "./client/src")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/src/index.html"));
});


app.get("/wait", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/src/index.html"));
});

app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/src/index.html"));
});

app.get("/controls", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/src/index.html"));
});



const port = process.env.port || 5000
const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})



const GameMaster = require("./one-monitor-game/OneMonitorGame")


const io = require("socket.io")(server, { cors: { origin: "*" } })
const gameMaster = new GameMaster(io)
io.on("connection", (socket) => {
    gameMaster.addSocket(socket)
})



