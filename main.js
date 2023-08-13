import express from "express";
import apiRouter from "./router.js";
import {hyperdeckInit, pollStatus} from "./hyperdeck-controller.js";
import cors from "cors";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());

app.use(express.static('frontend'))

app.use('/api', apiRouter);

try {
    if (!process.env.HYPERDECK_IP) throw new Error("Hyperdeck IP not set in .env")
    await hyperdeckInit();
} catch (error) {
    console.error("Connection to hyperdeck failed: " + error)
    process.exit(1);
}
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on port ${process.env.PORT || 3000}`)
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