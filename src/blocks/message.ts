import { lineBreak } from "../text/lineBreak";
import { githubSkyline } from "./githubSkyline";
import { recentTweets } from "./recentTweets";
import { footer } from "./footer";
import { gpgKey } from "./gpgKey";
import { banner } from "./banner";
import config from "../../config.json";


export async function getMessage() {

    let msg = "";
    msg += await banner();
    msg += await githubSkyline();
    msg += await recentTweets();
    msg += await gpgKey();
    msg += await footer();
   
    return lineBreak(msg, config.screen_width, '| ');
}
