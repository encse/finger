"use strict";

import fs from 'fs';

import { center } from '../text/center';
import config from '../../config.json';

export function footer(): string {
    return center(fs.readFileSync('public/footer.txt', {encoding: 'utf8'}), config.screen_width);
}