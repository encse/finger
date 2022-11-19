import express from "express";
import { getMessage } from "../blocks/message";
import { server as WebSocketServer } from 'websocket';
import http from 'http';

export function httpService(http_port: number) {
    const app = express();
    app.use(express.static('public'))
    const httpServer = http.createServer(app);
    const wsServer = new WebSocketServer({ httpServer: httpServer });

    wsServer.on('request', async (request) => {
        var connection = request.accept('finger-protocol', request.origin);
        connection.sendUTF(await getMessage());
        connection.close();
        connection.on('error', (err) => {
            console.error("websocket connection error", err);
        })
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    });
}