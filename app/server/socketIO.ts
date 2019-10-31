import * as socketIO from "socket.io";
import https from "./https";

const io = socketIO.listen(https);

export default io;
