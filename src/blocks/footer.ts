"use strict";

import fs from 'fs';

import { center } from '../text/center';
import config from '../../config.json';

export function footer(): string {
    let msg = center(fs.readFileSync('public/footer.txt', {encoding: 'utf8'}), config.screen_width);
    msg += "\n";
    msg += "\n";
    return msg;
}