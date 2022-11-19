"use strict";
import os from 'os';
import fs from 'fs';

import { center } from '../text/center';
import config from '../../config.json';

export function banner(): string {

    let msg ="";

    msg += fs.readFileSync('public/logo.txt', {encoding: 'utf8'});
    const loadAvg = os.loadavg().map(x => x.toFixed(2)).join(' ')

    msg += "\n";
    msg += "\n";
    msg += center(`Server: ${os.arch()} ${os.platform()}, cpus: ${os.cpus().length}, load average: ${loadAvg}`, config.screen_width) + "\n";
    msg += center("uptime: " + uptime(), config.screen_width) + "\n";
    msg += "\n";
    msg += center("This is csokavar.hu Encse's home on the web. Happy surfing.", config.screen_width) + "\n";
    msg += center("admin: encse@csokavar.hu", config.screen_width) + "\n";
    msg += "\n";

    return msg;
}

function uptime() {
    let ut_sec = os.uptime();
    let ut_min = ut_sec / 60;
    let ut_hour = ut_min / 60;
    let ut_day = ut_hour / 24;

    ut_sec = Math.floor(ut_sec) % 60;
    ut_min = Math.floor(ut_min) % 60;
    ut_hour = Math.floor(ut_hour) % 24;
    ut_day = Math.floor(ut_day);

    return (ut_day + " Days(s) "
        + ut_hour + " Hour(s) "
        + ut_min + " minute(s) and "
        + ut_sec + " second(s)");
}
