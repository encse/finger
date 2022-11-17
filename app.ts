"use strict";
import express from 'express';
import net from 'net'
import { server as WebSocketServer } from 'websocket';
import http from 'http';
import Twitter from 'twitter';
import config from './config.json';
import os from 'os';
import fetch from 'node-fetch';
import fs from 'fs';

async function getMessage() {

    os.uptime()

    let msg = fs.readFileSync('logo.txt', {encoding: 'utf8'});

    msg += "\n";
    msg += center("This is csokavar.hu Encse's home on the web. Happy surfing.", 80) + "\n";
    msg += center("Server uptime: " + uptime(), 80) + "\n";
    msg += center("contact: encse@csokavar.hu", 80) + "\n";
    msg += "\n";

    try {
        msg += await github_skyline(config.twitter_user, new Date().getFullYear());
        msg += '\n';
    } catch (err) {
        console.error("Couldn't retrieve skyline.", err);
    }

    try {
        const tweets = await recent_tweets();
        msg += 'Latest tweets\n';
        msg += '\n';
        msg += tweets;
      
    } catch (err) {
        console.error("Couldn't retrieve tweets.", err);
    }

    msg += "\n";
    msg += center(fs.readFileSync('footer.txt', {encoding: 'utf8'}), 80);
    msg += "\n";
    msg += "\n";

    try {
        const gpgkey = fs.readFileSync('encse.gpg', {encoding: 'utf8'});
        msg += "Gpg key, reach me at encse@csokavar.hu\n";
        msg += "\n";
        msg += center(gpgkey, 80);
    } catch (err) {
        console.error("Couldn't retrieve gpg key.", err);
    }

    msg += "\n";
    msg += "\n";
    return lineBreak(msg, 80, '| ');
}
type TweetCache = { time: number, text: string }
let tweetCache: TweetCache | null = null;

function box(txt: string, label: string) {
    let res = '';
    res += '+' + '-'.repeat(78) + '+' + '\n';
    for (let line of lineBreak(txt, 76).split('\n')) {
        res += '| ' + line.padEnd(76, ' ') + ' |\n';
    }
    label = '--[' + label + ']--';
    res += '+' + label.padStart(78, '-') + '+' + '\n';
    return res;
}
async function recent_tweets() {

    if (tweetCache != null && tweetCache.time + (10 * 60 * 1000) >= Date.now()) {
        console.log("Returning tweets from cache");
        return tweetCache.text;
    }

    console.log("Retreiving tweets...");

    return new Promise((resolve, reject) => {

        var params = {
            q: '#nodejs',
            count: 20,
            result_type: 'recent',
            screen_name: config.twitter_user,
            tweet_mode: 'extended',
            lang: 'en'
        }
        new Twitter(config.twitter_auth).get('statuses/user_timeline', params, (err, data: any) => {
            if (!err) {
                console.log(data);

                const ids = new Set<string>();
                for (let tweet of data as any) {
                    ids.add(tweet.id_str);
                }

                const createThread = (tweet: any, tab = '') => {
                    let res = '';
                    res += `${tab}\n`;

                    let st = tweet.full_text
                    st = st.normalize("NFD").replace(/\p{Diacritic}/gu, "");

                    res += lineBreak(tab + st, 76, tab)+ `\n`;

                    for (let tweetNext of data as any) {
                        if (tweetNext.in_reply_to_status_id_str == tweet.id_str) {
                            res += createThread(tweetNext, '');
                        }
                    }

                    return res;
                }

                let res = '';
                for (let tweet of data as any) {
                    if (tweet.in_reply_to_status_id_str == null) {
                        res += box(createThread(tweet), new Date(tweet.created_at).toUTCString());
                        res += "\n";
                    }
                }

                tweetCache = {
                    time: Date.now(),
                    text: res
                };
                console.log("Got tweets");
                resolve(tweetCache.text);
            } else {
                console.log(err);
                reject({ params: params, err: err });
            }
        });
    });
}

type GithubActivity = {
    username: string,
    year: string,
    min: number
    max: number,
    median: number,
    p80: number,
    p90: number
    p99: number,
    contributions: GithubContributions[];
}
type GithubContributions = {
    week: number,
    days: { count: number }[]
}

async function github_skyline(user: string, year: number): Promise<string> {
    const rsp = await fetch(`https://skyline.github.com/${user}/${year}.json`);
    const json: GithubActivity = await rsp.json();
    const d = json.max / 8;
    let msg = '';
    msg += '\n';
    msg += `Github SkyLine for ${year}\n`;
    msg += '\n';
    msg += '\n';

    for (let j = 8; j >= 0; j--) {
        let row = "";
        for (let contibution of json.contributions) {
            const maxPerWeek = Math.max(...contibution.days.map(d => d.count));
            if (maxPerWeek >= d * j){
                row += '█';
            } else {
                const r = Math.random();
                row += 
                    Math.random() < 0.025 ? '✦' :
                    Math.random() < 0.025 ? '✧' :
                    Math.random() < 0.005 ? '☾' :
                    ' ';
            }
        }
        row += '\n';
        msg += center(row, 80);
    }
    return msg;
}

function lineBreak(text: string, width: number, cont: string = '') {
    let lines = text.split("\n")

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let ichSpace = 0;
        let escape = false;
        let nonEscapedChars = 0;

        for (let ich = 0; ich < line.length; ich++) {
            if (escape) {
                if (line[ich] == ';') {
                    escape = false;
                }
            } else {
                nonEscapedChars++;
                if (line[ich] == ' ') {
                    ichSpace = ich;
                }
                if (nonEscapedChars > width) {
                    if (ichSpace > 0) {
                        let linePrefix = line.startsWith(cont) ? cont : '';
                        lines.splice(i + 1, 0, linePrefix + line.substring(ichSpace + 1));
                        lines[i] = line.substring(0, ichSpace).trimEnd();
                    }
                    break;
                }
            }
        }
    }
    return lines.join('\n');
}

function center(st: string, width: number) {
    const lines = st.split("\n");
    const maxWidth = Math.max(...lines.map(x=>x.length));
    return lines.map(line => line == '' ? '' :  ' '.repeat((width - maxWidth) / 2) + line).join('\n');
}

function uptime() {
    var ut_sec = os.uptime();
    var ut_min = ut_sec / 60;
    var ut_hour = ut_min / 60;

    ut_sec = Math.floor(ut_sec);
    ut_min = Math.floor(ut_min);
    ut_hour = Math.floor(ut_hour);

    ut_hour = ut_hour % 60;
    ut_min = ut_min % 60;
    ut_sec = ut_sec % 60;

    return (ut_hour + " Hour(s) "
        + ut_min + " minute(s) and "
        + ut_sec + " second(s)");
}


function asciiFold(st: string) {
    st = st.replace(/█/g,'#');
    st = st.replace(/▀/g,'"');
    st = st.replace(/▌/g,';');
    st = st.replace(/▐/g,':');
    st = st.replace(/▄/g,'.');
    // remove accents such as á -> a, é -> e, because raw TCP doesn't like it...
    st = st.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    // remove non ascii characters
    return st.split('').map(
        character => character.charCodeAt(0) < 127 ? character : ' '
    ).join('');
}

if (config.finger_port) {
    const server = net.createServer(async (socket) => {
        let message = await getMessage()
        message = asciiFold(message);
        socket.write(message);
        socket.end();
    }).on('error', (err) => {
        console.error('finger server error', err);
    });

    server.listen(config.finger_port, () => {
        console.log('opened finger server on', server.address());
    });
}

if (config.websocket_port) {
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

    httpServer.listen(config.websocket_port, () => {
        console.log(`Server started on port ${config.websocket_port} :)`);
    });
}


