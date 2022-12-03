"use strict";

import { banner } from "./blocks/banner";
import { footer } from "./blocks/footer";
import { logo } from "./blocks/logo";
import { githubSkyline } from "./blocks/githubSkyline";
import { gpgKey } from "./blocks/gpgKey";
import { recentTweets } from "./blocks/recentTweets";
import { users } from "./server/users";
import { IO } from "./server/io";
import {spawnSync} from 'node:child_process';

export async function runSession() {
    process.on('SIGINT', function () {});
    
    process.stdout.write(await banner());
    const io = new IO();
    // // await lookupIp() 
    // // https://ipapi.co/188.36.12.119/json/

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
            const line = await io.menu('Select an item', [
                'Latest [T]weets',
                '[G]itHub skyline',
                '[C]ontact sysop',
                process.env["DFROTZ"] != null ? 'play [I]dőrégész' : '',
                'e[X]it'
            ])
            if (line == 't') {
                io.writeLn(await recentTweets(users.encse))
            } else if (line == 'g') {
                io.writeLn(await githubSkyline(users.encse))
            } else if (line == 'c') {
                io.writeLn(await gpgKey(users.encse))
            } else if (line == 'i') {
                spawnSync(
                    process.env["DFROTZ"]!, 
                    '-r lt -R /tmp public/doors/idoregesz.z5'.split(' '), 
                    {shell: false, stdio: "inherit"}
                );
            } else if (line == 'x') {
                break;
            }
        }
        io.writeLn(``);
        io.writeLn('Have a nice day!')
        io.writeLn(await footer())
    }
}
