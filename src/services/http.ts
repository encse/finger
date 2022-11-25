import express from "express";
import { server as WebSocketServer } from 'websocket';
import http from 'http';
import { banner } from "../blocks/banner";
import { recentTweets } from "../blocks/recentTweets";
import { githubSkyline } from "../blocks/githubSkyline";
import { gpgKey } from "../blocks/gpgKey";
import { footer } from "../blocks/footer";
import { logo } from "../blocks/logo";
import { getFingerMessage } from "../blocks/finger";

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function* chunks(st: string, size: number): Iterable<string> {
    for (let i = 0; i < st.length;) {
        yield st.substring(i, i + size);
        i += size;
    }
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

    constructor(public name: string) { }
    
    close() {
        if (this.closed) {
            return;
        } else {
            this.closed = true;
            this.received();
        }
    }

    write(message: string) {
        if (this.closed) {
            return;
        } else {
            this.buffer.push(...message.split(''));
            this.received();
        }
    }

    read(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.buffer.length > 0) {
                resolve(this.buffer.shift()!);
            } else if (this.closed) {
                reject(this.name + ' closed');
            }else {
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
        if (sent == bps / 10 ) {
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

    write(message: string){
        this.outputChannel.write(message)
    }

    writeLn(message: string) {
        this.outputChannel.write(message + '\n');
    }

    public async read(): Promise<string> {
      
        let res = await this.inputChannel.read();
        if (res == Ascii.Cr) {
            res = Ascii.Nl;
        }

        // https://en.wikipedia.org/wiki/ANSI_escape_code#Control_characters
        if (res === Ascii.Esc) {

            let ch = await this.inputChannel.read();
            res += ch;
            while (ch === Ascii.Esc) {
                ch = await this.inputChannel.read();
                res += ch;
            }
            if (ch == '[') {
                // CSI sequence
                while (true) {
                    const ch = await this.inputChannel.read();
                    res += ch;
                    if ('@' <= ch && ch < Ascii.Del) {
                        break;
                    }
                }
            } else if (ch == ']') {
                // OSC sequence 
                while (!res.endsWith(Ascii.Esc + '\\')) {
                    res += await this.inputChannel.read();
                }
            } else if (ch == 'O') {
                res += await this.inputChannel.read();
            }
        }
        return res;
    }

    public readLn = (prompt = '', ok: ((st:string) => boolean) | null= null) => 
        this.readLineI(prompt, false, ok ?? (() => true));

    public readPassword = (prompt = '') => 
        this.readLineI(prompt, true, () => true);   
    
    public readOption = (prompt: string, options: string) => 
        this.readLineI(`${prompt} [${options}]: `, false, (st) => st.length == 1 && options.includes(st[0]));

    private async readLineI(prompt = '', password = false, accept: (st:string) => boolean) : Promise<string> {
        for(;;) {
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
                        console.log(buffer);
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

    app.get('/finger', async (req, res) => {
        res.send(await getFingerMessage())
    });

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

        let bps = parseFloat(selectedSpeed) / 8;
        if (isNaN(bps)) {
            bps = Infinity;
        }

        const connection = request.accept(selectedSpeed, request.origin);
        const inputChannel = new Channel('stdin');
        const outputChannel = new Channel('stdout');

        connection.on('close', (m) => { 
            console.error("connection closed");
            inputChannel.close(); 
            outputChannel.close();
        });

        connection.on('message', (m) => { 
            if (m.type === 'utf8') { 
                inputChannel.write(m.utf8Data); 
            }
        });

        await Promise.allSettled([
            runSession(new IO(inputChannel, outputChannel))
                .finally(() => {console.log("session loop finished"); outputChannel.close()}),
            runWriter(bps, outputChannel, connection.sendUTF.bind(connection))
                .finally(() => {console.log("writer loop finished"); connection.close()}),
        ])
    });

    httpServer.listen(http_port, () => {
        console.log(`Server started on port ${http_port} :)`);
    })
}

async function runSession(io: IO) {
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
            io.writeLn(`t) latest tweets`);
            io.writeLn(`g) GitHub skyline`);
            io.writeLn(`p) PGP key`);
            io.writeLn(`x) exit`);
            io.writeLn(``);
            const line = await io.readOption('Select a menu item', "tgpx");
            if (line == 't') {
                io.writeLn(await recentTweets())
            } else if (line == 'g') {
                io.writeLn(await githubSkyline())
            } else if (line == 'p') {
                io.writeLn(await gpgKey())
            } else if (line == 'x') {
                break;
            }
        }
        io.writeLn(``);
        io.writeLn('Have a nice day!')
        io.writeLn(await footer())
    }
}