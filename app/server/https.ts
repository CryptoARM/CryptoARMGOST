import * as fs from "fs";
import * as https from "https";
import { DEFAULT_PATH } from "../constants";

const privateKey  = fs.readFileSync(DEFAULT_PATH + "/ssl/key.pem", "utf8");
const certificate = fs.readFileSync(DEFAULT_PATH +  "/ssl/cert.pem", "utf8");

const credentials = {key: privateKey, cert: certificate};

export default https.createServer(credentials, (req, res) => {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.end("CryptoARM server is alive and working\n");
}).listen(4040);
