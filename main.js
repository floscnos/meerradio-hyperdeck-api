import express from "express";
import apiRouter from "./router.js";
import {hyperdeckInit, pollStatus} from "./hyperdeck-controller.js";
import cors from "cors";
import ws from "ws";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config();


const app = express();

app.use(cors());


app.get('/', (req, res) => {
    res.send("hello world");
})

app.use('/api', apiRouter);

try {
    await hyperdeckInit();
} catch (error) {
    console.error("Connection to hyperdeck failed: " + error)
    process.exit(1);
}
const server = app.listen(3000, () => {
    console.log("listening on port 3000")
})

export const connectedStatusClients = [];
export const connectedJobClients = {};

const wsServer = new WebSocketServer({ server });
wsServer.on('connection', (socket, req) => {
    if (req.url === '/') {
        connectedStatusClients.push(socket);
    }

    if (req.url.startsWith('/job/')) {
        const urlparams = req.url.split('/');
        if (connectedJobClients[urlparams[2]] == null) {
            connectedJobClients[urlparams[2]] = [];
        }
        connectedJobClients[urlparams[2]].push(socket)
    }

    socket.on('message', message => {
        socket.send(`Reply on: ${message.toString()}`);
    })
})

pollStatus();