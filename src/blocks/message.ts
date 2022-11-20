import { lineBreak } from "../text/lineBreak";
import { githubSkyline } from "./githubSkyline";
import { recentTweets } from "./recentTweets";
import { footer } from "./footer";
import { gpgKey } from "./gpgKey";
import { banner } from "./banner";
import config from "../../config.json";


export async function getMessage() {

    let msg = "";
    msg += "\n";
    msg += "\n";
    msg += await banner();
    msg += await recentTweets();
    msg += await githubSkyline();
    msg += await gpgKey();
    msg += await footer();
    msg += "\n";
    msg += "\n";
    return lineBreak(msg, config.screen_width, '| ');
}
