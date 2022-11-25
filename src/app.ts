"use strict";

import config from '../config.json';

import { fingerService, fingerServiceOverHttp } from './services/finger';
import { bbsService } from './services/bbs';

if (config.finger_port) {
    fingerService(config.finger_port);
}
if (config.finger_over_http_port) {
    fingerServiceOverHttp(config.finger_over_http_port);
}
if (config.bbs_port) {
    bbsService(config.bbs_port);
}
