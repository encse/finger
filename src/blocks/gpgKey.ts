import fs from "fs";
import { center } from "../text/center";
import config from "../../config.json";

export function gpgKey() {
    let msg = "";
    try {
        const gpgkey = fs.readFileSync('public/encse.gpg', { encoding: 'utf8' });
        msg += "Gpg key, reach me at encse@csokavar.hu\n";
        msg += "\n";
        msg += center(gpgkey, config.screen_width);
        msg += "\n";
        msg += "\n";
    } catch (err) {
        console.error("Couldn't retrieve gpg key.", err);
    }
    return msg;
} 