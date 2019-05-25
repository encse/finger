#! /usr/local/bin/node
"use strict";
const net = require('net');
const WebSocketServer = require('websocket').server;
const http = require('http');
const Twitter = require('twitter');
const config = require('./config.js');
require('console-stamp')(console);

async function getMessage() {
    let msg =
        `|                                       99X                                      
        |                                 riG   @@@   Gi;                                
        |                                 B@@G  @@@  @@@9                                
        |                                  @@@; @@@ i@@G                                 
        |                                   @@@:B@G,@@@                                  
        |                                   :@@@BBB@@@                                   
        |                                    ,@BBBB@@                                    
        |                     5M525252525253ir@BBBBBBri3225252525259i                    
        |                     @@@@@@@@@@@@@@@@BBBBBBB@@@@@@@@@@@@@@@@                    
        |                    :@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                    
        |                    r@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@:                   
        |                    9@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@r                   
        |                    @@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@G                   
        |                    @@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                   
        |                   :@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@                   
        |                   i@BBBBBBB@@@@@BBBBBBBBBBBBBB@@@@@BBBBBBBB@,                  
        |                   9@BBBBBB@BrrrG@@BBBBBBBBBBB@BirrM@@BBBBBB@i                  
        |                   @@BBBBB@r     ;@BBBBBBBBBB@5      @BBBBBB@G                  
        |                   @@BBBBB@;     :@BBBBBBBBBB@3      @@BBBBB@@                  
        |                  :@BBBBBBB@X;:;2@BBBB@@@@BBBB@Gr:,i@@BBBBBB@@                  
        | :                i@BBBBBBBB@@@@@@B@@@@M3@@@@B@@@@@@@BBBBBBBB@;                 
        | 3@@@@@@@@@@@@@@@@@BBBBBBBBBBBBBB@@@Br    ,G@@@@BBBBBBBBBBBBB@@@@@@@@@@@@@@@@@@r
        |  :@@@@@@@@@@@@@@@@BBBBBBBBBBBBB@Gr          ;XBBBBBBBBBBBBBBB@@@@@@@G@@@@@@@B: 
        |    r@@@BBB; :,;:3@BBBBBBBBBBBBB@r   5B@GBBi   BBBBBBBBBBBBBBB@:     r@BB@@@r   
        |      B@@B@B     i@BBBBBBBBBBBBBB@@G, :9@M;,3@@BBBBBBBBBBBBBBB@r    B@@B@@9     
        |       r@@@@@G   B@BBBBBBBBBBBBBBB@@@@r  ;9@@@BBBBBBBBBBBBBBBB@9  5@@@@@@,      
        |         9@@@@@; @@BBBBBBBBBBBBBBBBBB@@@@@@BBBBBBBBBBBBBBBBBBB@B:@@@@@@2        
        |          ,@@@@@B@BBBBBBBBBBBBBBBBBBBBB@BBBBBBBBBBBBBBBBBBBBBBB@@@B@@@          
        |            5@@@@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@@i           
        |             :@@@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@B             
        |               r@BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB@@r              
        |                G@BBBBBBBBB@@@@BBBBBBBBBBBBBBBBBB@@@@@BBBBBBBBB@i               
        |                @@BBB@@@@@@GBGB@@@@@BBBBBBBB@@@@@BBBBB@@@@@BBBB@B               
        |               :@@BBBGr:;@B   ;@9 ;i@BBBBBB@9r r@G   i@5 ;3@BBB@@               
        |               r@BBB@B   9@   3@   r@BBBBBB@G   @@   9@   i@BBBB@               
        |               M@BBBB@G   B   5r  ,@BBBBBBBB@9   B   G:  r@@BBBB@r              
        |               B@BBBBB@i          @@BBBBBBBB@@r         :@@BBBBB@X              
        |               @@BBBBB@@,        @@BBBBBBBBBB@@:        @@BBBBBB@@              
        |              :@@BBBBBB@@       9@BBBBBBBBBBBB@@       G@BBBBBBB@@              
        |              r@BBGBGBGB@@@@@@@@@BGBGBGBGGGBGBB@@@@@@@@@BBGGGBGBB@              
        |                                                                                
        |           This is csokavar.hu Encsé's home on the web. Happy surfing.          
        |                                                                                
        |                       contact: encse@csokavar.hu                               
        |                                                                                \n`.replace(/.*\|/g, "");

    msg += 'Latest tweets:';
    msg += await recent_tweets();
    return msg;
}

const tweetCache = {};

async function recent_tweets() {
    if (tweetCache != null && tweetCache.time + (10 * 60 * 1000) >= Date.now()) {
        console.log("Returning tweets from cache");
        return tweetCache.text;
    }

    console.log("Retreiving tweets...");

    return new Promise((resolve, reject) => {

        var params = {
            q: '#nodejs',
            count: 10,
            result_type: 'recent',
            screen_name: config.twitter_user,
            lang: 'en'
        }
        new Twitter(config).get('statuses/user_timeline', params, (err, data) => {
            if (!err) {
                let res = '';
                for (let tweet of data) {
                    res += `${tweet.created_at}\n`;
                    res += `${tweet.text}\n`;
                    res += `\n`;
                }

                tweetCache.time = Date.now();
                tweetCache.text = res
                console.log("Got tweets");
                resolve(tweetCache.text);
            } else {
                console.error("Couldn't retrieve tweets");
                console.error('Params', params);
                console.error(err);
                reject(err);
            }
        });
    });
}

if (config.finger_port) {
    const server = net.createServer(async (socket) => {
        socket.write(await getMessage());
        socket.end();
    }).on('error', (err) => {
        console.error('finger server error', err);
    });

    server.listen(config.finger_port, () => {
        console.log('opened finger server on', server.address());
    });
}

if (config.websocket_port) {
    const httpServer = http.createServer(() => {
        response.end();
    }).on('error', (err) => {
        console.error('http server error', err);
    });

    httpServer.listen(config.websocket_port, () => { 
        console.log('opened http server on', httpServer.address());
    });

    const wsServer = new WebSocketServer({ httpServer: httpServer });

    wsServer.on('request', async (request) => {
        var connection = request.accept('finger-protocol', request.origin);
        connection.sendUTF(await getMessage());
        connection.close();
        connection.on('error', (err) => {
            console.error("websocket connection error", err);
        })
    });
}