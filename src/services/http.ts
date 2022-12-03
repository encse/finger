import express from "express";
import cors from "cors";
import { server as WebSocketServer } from 'websocket';
import http from 'http';
import { getFingerMessage } from "../blocks/finger";
import { lookupUser } from "../server/users";
import { Duplex } from "stream";
import { TextDecoder } from "util";
import {spawn} from "node-pty";

class Context {
    handlers: Array<() => void> = [];
    on(e: 'close', handler: () => void){
        this.handlers.push(handler);
    }

    close() {
        for (let handler of this.handlers) {
            try {
                handler();
            } catch(err) {
                console.log(err);
            }
        }
    }
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

class Channel {

    private buffer: string[] = [];
    private received = () => { };
    private closed: boolean = false;
    readonly stream: Duplex;
    
    constructor(ctx: Context, public name: string) {
        const self = this;
        ctx.on('close', () => this.close());
        this.stream = new Duplex({
            read(size: number) {
                self.read().then(data => {
                    this.push(data);
                });
            },
            write(chunk: string | Buffer | Uint8Array, encoding: BufferEncoding, callback) {
                try {
                    if (chunk instanceof Buffer) {
                        chunk = chunk.toString('utf8')
                    } else if (chunk instanceof Uint8Array) {
                        chunk = new TextDecoder('utf8').decode(chunk);
                    }
                    self.write(chunk);
                    callback();
                } catch (err) {
                    console.log(err);
                }
            }
        })
    }

    close() {
        if (this.closed) {
            return;
        } else {
            this.closed = true;
            this.received();
        }
    }

    write(message: string | Buffer) {
        if (this.closed) {
            return;
        } else {
            if (message instanceof Buffer) {
                message = message.toString('utf8');
            }
            this.buffer.push(...Array.from(message));
            this.received();
        }
    }

    read(ctx?: Context): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (ctx) {
                ctx.on('close', () => reject('cancelled'))
            }
            if (this.buffer.length > 0) {
                resolve(this.buffer.shift()!);
            } else if (this.closed) {
                reject(this.name + ' closed');
            } else {
                this.received = async () => {
                    this.received = () => { };
                    if (this.buffer.length > 0) {
                        resolve(this.buffer.shift()!);
                    } else {
                        reject(this.name + ' closed');
                    }
                }
            }
        });
    }
}

async function runWriter(bps: number, channel: Channel, send: (st: string) => void) {
    let sent = 0;
    let started: number = 0;
    while (true) {
        let ch = await channel.read();
        if (sent == bps / 10) {
            const timeSpent = (new Date().getTime() - started);
            if (timeSpent < 100) {
                await sleep(100 - timeSpent);
            }
            sent = 0;
        }

        if (sent == 0) {
            started = new Date().getTime();
        }
        send(ch);
        sent++;
    }
}

export function httpService(http_port: number) {
    const app = express();

    app.get('/~:user', cors(), async (req, res) => {
        res.type('text/plain');
        res.send(await getFingerMessage(lookupUser(req.params.user)));
    });

    app.use(express.static('public/www'))

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

        let bps = parseFloat(selectedSpeed) / 8;
        if (isNaN(bps)) {
            bps = Infinity;
        }

        const connection = request.accept(selectedSpeed, request.origin);
        const ctx = new Context();

        const inputChannel = new Channel(ctx, 'stdin');
        const outputChannel = new Channel(ctx, 'stdout');

        connection.on('close', () => {
            console.error("connection closed");
            ctx.close();
        });

        connection.on('message', (m) => {
            if (m.type === 'utf8') {
                inputChannel.write(m.utf8Data);
            }
        });

        await Promise.allSettled([
            exec(ctx, inputChannel, outputChannel, 'npm run --silent shell')
                .finally(() => { console.log("session loop finished"); outputChannel.close() }),
            runWriter(bps, outputChannel, connection.sendUTF.bind(connection))
                .finally(() => { console.log("writer loop finished"); connection.close() }),
        ])
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    })
}

async function exec(parentCtx: Context, input: Channel, output:Channel, cmd: string): Promise<void> {
    try {
        console.log('executing ' + cmd);
        let ptyProcess = spawn(cmd.split(' ')[0], cmd.split(' ').slice(1), {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
        });

        parentCtx.on('close', () => {
            try {
                ptyProcess.kill("SIGKILL");
            } catch (e) {
                console.log(e)
            }
        });

        let ctx = new Context();
        ptyProcess.onData((data: any) => {
            output.write(data);
        });

        ptyProcess.onExit(() => {
            ctx.close();
        });

        while (true) {
            let ch = await input.read(ctx);
            ptyProcess.write(ch);
        }

    } catch (e) {
        console.log(e);
    } finally {
        console.log('quit from exec ' + cmd);
    }
}