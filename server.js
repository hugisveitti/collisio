const express = require("express");
const app = express();
const path = require("path");
const si = require('systeminformation');

// promises style - new since version 3
si.cpu()
    .then(data => {
        console.log("####CPU Info#####")
        console.log(data)
        console.log("#####END CPU INFO#####")
    })
    .catch(error => console.error(error));

const byteToGig = (byte) => {
    return byte / (1024 ** 3)
}

si.mem()
    .then(data => {
        console.log("####Memory Info#####")
        console.log("Total", byteToGig(data.total))
        console.log("Free", byteToGig(data.free))
        console.log("#####END Memory INFO#####")
    })
    .catch(error => console.error(error));



// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });



const buildFolder = "dist"

app.use(express.static(path.join(__dirname, `./client/${buildFolder}`)));
app.use(express.static(path.join(__dirname, `./client/src`)));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/test", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/test.html`));
});

// There must be some better way to do this shit
app.get("/wait", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/wait/:gameId", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/game", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/game/:id", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/controls", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/how-to-play", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/highscores", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/private-profile", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/public-profile/:id", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/show-room", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/index.html`));
});

app.get("/ammo.wasm.js", (req, res) => {
    res.sendFile(path.join(__dirname, `./client/${buildFolder}/ammo/ammo.wasm.js`));
})

app.get("/hello", (req, res) => {
    res.send("hello please")
})

const port = process.env.PORT || 5000
const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})


const GameMaster = require("./one-monitor-game/ServerGame")


const io = require("socket.io")(server,) // { cors: { origin: "*" } })
const gameMaster = new GameMaster(io)
io.on("connection", (socket) => {
    gameMaster.addSocket(socket)
})



