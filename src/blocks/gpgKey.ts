import fs from "fs";
import { center } from "../text/center";
import config from "../../config.json";
import { User } from "../server/users";

export function gpgKey(user: User) {
    let msg = "";
    try {
        const gpgkey = fs.readFileSync(`public/${user.name}.gpg`, { encoding: 'utf8' });
        msg += `Gpg key, reach me at ${user.email}\n`;
        msg += "\n";
        msg += center(gpgkey, config.screen_width);
        msg += "\n";
        msg += "\n";
    } catch (err) {
        console.error("Couldn't retrieve gpg key.", err);
    }
    return msg;
} 