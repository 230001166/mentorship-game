const cool = require("cool-ascii-faces");
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

express()
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  .get("/cool", (req, res) => res.send(cool()))
  .get("/times", (req, res) => {
    let result = "";
    const times = process.env.TIMES || 5;
    for (i = 0; i < times; i++) {
      result += i + " ";
    }
    res.send(result);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send('data');
      }
    });
  });

  ws.send("something");
});
