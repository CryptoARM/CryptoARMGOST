"use strict";
const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const fs = require("fs");

const privateKey = fs.readFileSync("ssl/key.pem", "utf8");
const certificate = fs.readFileSync("ssl/cert.pem", "utf8");

const credentials = { key: privateKey, cert: certificate };

const httpServer = http.Server(app);
const httpsServer = https.Server(credentials, app);

const io = require("socket.io")(httpServer);

app.get("/", (req, res, next) => {
  return res.sendFile(__dirname + "/client/index.html");
});

app.get("/app.js", (req, res, next) => {
  return res.sendFile(__dirname + "/client/dist/app.js");
});

app.get("/socket.io.js", (req, res, next) => {
  return res.sendFile(__dirname + "/node_modules/socket.io-client/dist/socket.io.js");
});

app.get("/socket.io-file-client.js", (req, res, next) => {
  return res.sendFile(__dirname + "/node_modules/socket.io-file-client/socket.io-file-client.js");
});

app.get("/socket.io-stream.js", (req, res, next) => {
  return res.sendFile(__dirname + "/node_modules/socket.io-stream/socket.io-stream.js");
});

app.get("/resources/file1.txt", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file1.txt");
});

app.get("/resources/file2.txt", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file2.txt");
});

app.get("/resources/file3.txt", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file3.txt");
});

app.get("/resources/file4.sig", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file4.sig");
});

app.get("/resources/file5.enc", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file5.enc");
});

app.get("/resources/file7.pdf", (req, res, next) => {
  return res.sendFile(__dirname + "/resources/file7.pdf");
});

httpServer.listen(3000, () => {
  console.log("Server listening on port 3000");
});

httpsServer.listen(4000, () => {
  console.log("SSL server listening on port 4000");
});
