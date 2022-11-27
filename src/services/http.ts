import express from "express";
import cors from "cors";
import { server as WebSocketServer } from 'websocket';
import http from 'http';
import { banner } from "../blocks/banner";
import { recentTweets } from "../blocks/recentTweets";
import { githubSkyline } from "../blocks/githubSkyline";
import { gpgKey } from "../blocks/gpgKey";
import { footer } from "../blocks/footer";
import { logo } from "../blocks/logo";
import { getFingerMessage } from "../blocks/finger";
import { lookupUser, users } from "../server/users";
import { Duplex, Readable, Writable } from "stream";
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

export const Ascii = {
    Nul: '\x00',
    Soh: '\x01',
    Etx: '\x03',
    Eot: '\x04',
    Enq: '\x05',
    Tab: '\x09',
    Esc: '\x1b',
    Del: '\x7f',
    Dc1: '\x11',
    Dc2: '\x12',
    Dc3: '\x13',
    Dc4: '\x14',
    Spc: ' ',
    Cr: '\r',
    Nl: '\n',
}

export const Seq = {
    StartOfLine: Ascii.Soh,
    Interrupt: Ascii.Etx,
    EndOfText: Ascii.Eot,
    EndOfLine: Ascii.Enq,
    Backspace: Ascii.Del,
    NewLine: Ascii.Nl,
    F1: Ascii.Esc + 'OP',
    F2: Ascii.Esc + 'OQ',
    F3: Ascii.Esc + 'OR',
    F4: Ascii.Esc + 'OS',
    CtrlQ: Ascii.Dc1,
    CtrlR: Ascii.Dc2,
    CtrlS: Ascii.Dc3,
    CtrlT: Ascii.Dc4,

    CursorUp: Ascii.Esc + '[A',
    CursorDown: Ascii.Esc + '[B',
    CursorRight: Ascii.Esc + '[C',
    CursorLeft: Ascii.Esc + '[D',

    Delete: Ascii.Esc + '[3~',
    PageUp: Ascii.Esc + '[5~',
    PageDown: Ascii.Esc + '[6~',
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
                    if (data == Ascii.Cr) {
                        data = Ascii.Nl;
                    }
                    this.push(data);
                });
            },
            write(chunk: string | Buffer | Uint8Array, encoding: BufferEncoding, callback) {
                try {
                    if (chunk instanceof Buffer) {
                        chunk = chunk.toString('utf-8')
                    } else if (chunk instanceof Uint8Array) {
                        chunk = new TextDecoder('utf-8').decode(chunk);
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
            this.buffer.push(...message.split(''));
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
class IO {

    constructor(
        private inputChannel: Channel,
        private outputChannel: Channel
    ) {

    }

    getOutput(): Writable {
        return this.outputChannel.stream;
    }

    getInput(): Readable {
        return this.inputChannel.stream;
    }

    write(message: string | Buffer) {
        this.outputChannel.write(message);
    }

    writeLn(message: string) {
        this.outputChannel.write(message + '\n');
    }

    public async read(ctx?: Context): Promise<string> {

        let res = await this.inputChannel.read(ctx);
        if (res == Ascii.Cr) {
            res = Ascii.Nl;
        }

        // https://en.wikipedia.org/wiki/ANSI_escape_code#Control_characters
        if (res === Ascii.Esc) {

            let ch = await this.inputChannel.read(ctx);
            res += ch;
            while (ch === Ascii.Esc) {
                ch = await this.inputChannel.read(ctx);
                res += ch;
            }
            if (ch == '[') {
                // CSI sequence
                while (true) {
                    const ch = await this.inputChannel.read(ctx);
                    res += ch;
                    if ('@' <= ch && ch < Ascii.Del) {
                        break;
                    }
                }
            } else if (ch == ']') {
                // OSC sequence 
                while (!res.endsWith(Ascii.Esc + '\\')) {
                    res += await this.inputChannel.read(ctx);
                }
            } else if (ch == 'O') {
                res += await this.inputChannel.read(ctx);
            }
        }
        return res;
    }

    public readLn = (prompt = '', ok: ((st: string) => boolean) | null = null) =>
        this.readLineI(prompt, false, ok ?? (() => true));

    public readPassword = (prompt = '') =>
        this.readLineI(prompt, true, () => true);

    public readOption = (prompt: string, options: string) =>
        this.readLineI(`${prompt} [${options}]: `, false, (st) => st.length == 1 && options.includes(st[0]));

    private async readLineI(prompt = '', password = false, accept: (st: string) => boolean): Promise<string> {
        for (; ;) {
            await this.write(prompt);
            let buffer = '';
            while (true) {
                let ch = await this.read();
                if (ch == '\n') {
                    this.write(ch);
                    if (accept(buffer)) {
                        return buffer;
                    } else {
                        break;
                    }
                } else if (ch == Seq.Backspace) {
                    if (buffer.length > 0) {
                        buffer = buffer.substring(0, buffer.length - 1);
                        this.write('\b \b');
                    }
                } else if (ch.length == 1 && (ch >= ' ' || ch < Seq.Backspace)) {
                    this.write(password ? '*' : ch)
                    buffer += ch;
                }
            }
        }
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
            runSession(ctx, new IO(inputChannel, outputChannel))
                .finally(() => { console.log("session loop finished"); outputChannel.close() }),
            runWriter(bps, outputChannel, connection.sendUTF.bind(connection))
                .finally(() => { console.log("writer loop finished"); connection.close() }),
        ])
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    })
}

async function runSession(ctx: Context, io: IO) {
    io.writeLn(await banner());
    io.writeLn(`Enter your username or GUEST`);
    let username = await io.readLn('Username: ', (st) => st.trim() != '');
    if (username.toLowerCase() != 'guest') {
        for (let i = 0; i < 3; i++) {
            await io.readPassword('Password: ');
            io.writeLn(`Password incorrect`);
        }
    } else {
        io.writeLn(logo());
        io.writeLn(`Welcome ${username}`);
        io.writeLn(``);
        while (true) {
            io.writeLn(`BBS Menu`);
            io.writeLn(`------------`);
            io.writeLn(`t) latest [T]weets`);
            io.writeLn(`g) [G]itHub skyline`);
            io.writeLn(`c) [C]ontact sysop`);
            io.writeLn(`z) play [Z]ork`);
            io.writeLn(`x) e[X]it`);
            io.writeLn(``);
            const line = await io.readOption('Select a menu item', "tgczx");
            if (line == 't') {
                io.writeLn(await recentTweets(users.encse))
            } else if (line == 'g') {
                io.writeLn(await githubSkyline(users.encse))
            } else if (line == 'c') {
                io.writeLn(await gpgKey(users.encse))
            } else if (line == 'z') {
                await exec(ctx, io, '/usr/bin/dfrotz -r lt -R /tmp public/doors/zdungeon.z5');
            } else if (line == 'x') {
                break;
            }
        }
        io.writeLn(``);
        io.writeLn('Have a nice day!')
        io.writeLn(await footer())
    }
}

async function exec(parentCtx: Context, io: IO, cmd: string): Promise<void> {
    try {
        console.log('executing ' + cmd);
        var ptyProcess = spawn(cmd.split(' ')[0], cmd.split(' ').slice(1), {
            name: 'xterm-color',
            cols: 80,
            rows: 30
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
            io.write(data);
        });

        ptyProcess.onExit(() => {
            ctx.close();
        });

        while (true) {
            let ch = await io.read(ctx);
            ptyProcess.write(ch);
        }

    } catch (e) {
        console.log(e);
    } finally {
        console.log('quit from exec ' + cmd);
    }
}