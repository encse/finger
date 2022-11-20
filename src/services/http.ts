import express from "express";
import { getMessage } from "../blocks/message";
import { server as WebSocketServer } from 'websocket';
import http from 'http';

function sleep(ms: number) { 
    return new Promise((r) => setTimeout(r, ms));
}

function* randomChunks(st: string) {
    let chunkLength = 0;

    for (let i = 0; i < st.length; i += chunkLength) {
        chunkLength = Math.floor(Math.random() * 500);
        yield st.substring(i, i + chunkLength);
    }
}

export function httpService(http_port: number) {
    const app = express();
    app.use(express.static('public'))
    const httpServer = http.createServer(app);
    const wsServer = new WebSocketServer({ httpServer: httpServer });

    wsServer.on('request', async (request) => {
        var connection = request.accept('finger-protocol', request.origin);
        connection.on('error', (err) => {
            console.error("websocket connection error", err);
        })
        let message = await getMessage();
        for (let chunk of randomChunks(message)) {
            connection.sendUTF(chunk);
            await sleep(50);
        }
        connection.close();
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    })
}