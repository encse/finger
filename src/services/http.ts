import express from "express";
import { getMessage } from "../blocks/message";
import { server as WebSocketServer } from 'websocket';
import http from 'http';

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function* chunks(st: string, size: number): Iterable<string> {
    for (let i = 0; i < st.length;) {
        yield st.substring(i, i + size);
        i += size;
    }
}

export function httpService(http_port: number) {
    const app = express();
    app.use(express.static('public'))
    const httpServer = http.createServer(app);
    const wsServer = new WebSocketServer({ httpServer: httpServer, fragmentOutgoingMessages: false });

    wsServer.on('request', async (request) => {
        let selectedSpeed = '';
        for (let modemSpeed of "2400, 4800, 9600, 14400, 19200, 28800, 33600, 56000, unlimited".split(', ')) {
            if (request.requestedProtocols.includes(modemSpeed)) {
                selectedSpeed = modemSpeed;
            }
        }
        if (selectedSpeed == '') {
            console.log('rejecting ', request.requestedProtocols);
            request.reject();
            return;
        }

        const connection = request.accept(selectedSpeed, request.origin);
        connection.on('error', (err) => {
            console.error("websocket connection error", err);
        })

        let bps = parseFloat(selectedSpeed) / 8;
        if (isNaN(bps)) {
            bps = Infinity;
        }

        let message = await getMessage();
        let first = true;
        for (let ch of chunks(message, bps/10)) {
            if (!first) { await sleep(100);}
            connection.sendUTF(ch);
            first = false;
        }
        console.log('done');
        connection.close();
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    })
}