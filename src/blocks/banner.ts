"use strict";
import os from 'os';
import fs from 'fs';

import { center } from '../text/center';
import config from '../../config.json';

export function banner(): string {

    let msg = fs.readFileSync('public/logo.txt', {encoding: 'utf8'});
    msg += "\n";
    msg += center("This is csokavar.hu Encse's home on the web. Happy surfing.", config.screen_width) + "\n";
    msg += center("Server uptime: " + uptime(), config.screen_width) + "\n";
    msg += center("contact: encse@csokavar.hu", config.screen_width) + "\n";
    msg += "\n";

    return msg;
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
