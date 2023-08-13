import {Hyperdeck} from "hyperdeck-js-lib";
import {connectedJobClients, connectedStatusClients} from "./main.js";
import {Client} from "basic-ftp";
import crypto from "crypto";
import fs from "fs";
import {response} from "express";

let hyperdeck = null;
let hyperdeckStatus = null
const hyperdeckPlayStatusses = {
    PLAYING: 'play',
    STOPPED: 'stopped'
}
export async function hyperdeckInit() {
    console.log(`Hyperdeck ip: ${process.env.HYPERDECK_IP}`);
    hyperdeck = new Hyperdeck(process.env.HYPERDECK_IP);

    console.log("Connecting to Hyperdeck..")
    await hyperdeck.onConnected();

    const response = await hyperdeck.makeRequest("device info");

    if (response.code >= 300 || response.code < 200) {
        console.log(response);
        throw new Error("Hyperdeck returned an error code");
    }
}

export async function getDiskInfo(req, res) {
    const client = new Client();
    try {
        await client.access({
            host: process.env.HYPERDECK_IP,
            user: "anonymous",
            password: "anonymous",
            secure: false
        })
        const list1 = await client.list('/1/');
        const list2 = await client.list('/2/');


        const result = [
            {
            files: list1,
            totalUsedSize: 0,
            },
            {
                files: list2,
                totalUsedSize: 0,
            }
        ]
        list1.forEach(file => {
            result[0].totalUsedSize += file.size
        })
        list2.forEach(file => {
            result[1].totalUsedSize += file.size
        })

        res.send(result);
    } catch (e) {
        res.status(500).send(e)
    }
}

const parseStatus = (data) => {
    const returnObject = {
       playState: data.params.status,
       timecode: data.params.timecode,
       loop: data.params.loop === "true",
       singleClip: data.params['single clip'] === "true",
       clipId: data.params['clip id'],
    }
    return returnObject;
}
const updateStatus = (newStatus) => {
    const newStatusParsed = parseStatus(newStatus);
    if (hyperdeckStatus == null || newStatusParsed.playState === hyperdeckPlayStatusses.PLAYING) {
        hyperdeckStatus = newStatusParsed;
        return;
    }

    hyperdeckStatus.playState = newStatusParsed.playState;
    hyperdeckStatus.timecode = newStatusParsed.timecode;
    hyperdeckStatus.clipId = newStatusParsed.clipId;
}

export function getStatus(req, res) {
    hyperdeck.transportInfo().then(hyperdeckResponse => {
        updateStatus(hyperdeckResponse);
        res.send(hyperdeckStatus);
    })
}

export async function pollStatus() {
    while (true) {
        const response = await hyperdeck.transportInfo();

        updateStatus(response);
        connectedStatusClients.forEach(socket => {
            socket.send(JSON.stringify(hyperdeckStatus))
        })
        await new Promise(r => setTimeout(r, 999));
    }
}

export function setPlay(req, res) {
    const params = {
        loop: hyperdeckStatus.loop ? "true" : "false",
        singleClip: hyperdeckStatus.singleClip ? "true" : "false",
    }
    hyperdeck.makeRequest(`play: loop: ${params.loop} single clip: ${params.singleClip}`).then(response => {
        res.sendStatus(200)
    }).catch(error => {
        res.sendStatus(500)
    })
}

export function setStop(req, res) {
    hyperdeck.stop().then(response => {
        res.sendStatus(200)
    }).catch(error => {
        res.sendStatus(500)
    })
}

export function toggleLoop(req, res) {
    hyperdeckStatus.loop = !hyperdeckStatus.loop;
    if (hyperdeckStatus.playState === hyperdeckPlayStatusses.PLAYING) {
        setPlay();
    }
    res.sendStatus(200)
}

export function toggleSingleClip(req, res) {
    hyperdeckStatus.singleClip = !hyperdeckStatus.singleClip;
    if (hyperdeckStatus.playState === hyperdeckPlayStatusses.PLAYING) {
        setPlay();
    }
    res.sendStatus(200)
}

export function getClips(req, res) {
    hyperdeck.makeRequest("clips get").then(response => {
        res.send(response.params)
    }).catch(error => {
        res.sendStatus(500).send("error retreving clips: " + error)
    })
}
export function setClip(req, res) {
    const playing = hyperdeckStatus.playState === hyperdeckPlayStatusses.PLAYING;
    hyperdeck.makeRequest(`goto: clip id: ${req.params.clipId}`).then(response => {
        if (playing) setPlay();
        res.sendStatus(200);
    }).catch(error => {
        res.status(500).send("Error selecting clip: " + error.text);
    })
}

export function uploadClip(req, res) {
    const jobId = crypto.randomUUID();

    uploadToHyperdeck(req.file, jobId);
    res.send({filesize: req.file.size, job: jobId});
}


function uploadStatusToWebsocketClients(jobId, info) {
    if (connectedJobClients[jobId]) {
        connectedJobClients[jobId].forEach(socket => {
            socket.send(JSON.stringify({info: info}))
        })
    }
}
async function uploadToHyperdeck(file, jobId) {

    const client = new Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: process.env.HYPERDECK_IP,
            user: "anonymous",
            password: "anonymous",
            secure: false
        })

        client.trackProgress(info => {
            uploadStatusToWebsocketClients(jobId, info)
        })

        await client.uploadFrom(file.path, `/1/${file.originalname}`);
        await client.uploadFrom(file.path, `/2/${file.originalname}`);

        fs.unlink(file.path, (err) => {
            if (err) console.log(err);
        });
    } catch (e) {
        console.log(e)
    }
    client.close()
}