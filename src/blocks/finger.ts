import { lineBreak } from "../text/lineBreak";
import { githubSkyline } from "./githubSkyline";
import { recentTweets } from "./recentTweets";
import { footer } from "./footer";
import { gpgKey } from "./gpgKey";
import { banner } from "./banner";
import config from "../../config.json";
import { User } from "../server/users";
import { logo } from "./logo";


export async function getFingerMessage(user: User | undefined) {

    let msg = "";
    msg += "\n";
    msg += "\n";
    msg += await banner();
    msg += "\n";
    msg += "\n";
    if (user) {
        msg += await recentTweets(user);
        msg += await githubSkyline(user);
        msg += await gpgKey(user);
    }
    msg += await logo();
    msg += "\n";
    msg += "\n";
    return lineBreak(msg, config.screen_width, '| ');
}
