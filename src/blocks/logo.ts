"use strict";
import fs from 'fs';

export function logo(): string {
    return fs.readFileSync('public/logo.txt', {encoding: 'utf8'});
}
