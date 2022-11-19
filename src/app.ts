"use strict";

import config from '../config.json';

import { fingerService } from './services/finger';
import { httpService } from './services/http';

if (config.finger_port) {
    fingerService(config.finger_port);
}
if (config.http_port) {
    httpService(config.http_port);
}
