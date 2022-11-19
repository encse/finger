
import config from '../../config.json';
import Twitter from 'twitter';
import { lineBreak } from '../text/lineBreak';
import { box } from '../text/box';

type TweetCache = { time: number, text: string }
let tweetCache: TweetCache | null = null;

export async function recentTweets() {

    if (tweetCache != null && tweetCache.time + (10 * 60 * 1000) >= Date.now()) {
        console.log("Returning tweets from cache");
        return tweetCache.text;
    }

    console.log("Retreiving tweets...");

    return new Promise((resolve, reject) => {

        var params = {
            q: '#nodejs',
            count: 20,
            result_type: 'recent',
            screen_name: config.twitter_user,
            tweet_mode: 'extended',
            lang: 'en'
        }
        new Twitter(config.twitter_auth).get('statuses/user_timeline', params, (err, data: any) => {
            if (!err) {
                console.log(data);

                const ids = new Set<string>();
                for (let tweet of data as any) {
                    ids.add(tweet.id_str);
                }

                const createThread = (tweet: any, tab = '') => {
                    let res = '';
                    res += `${tab}\n`;

                    let st = tweet.full_text
                    st = st.normalize("NFD").replace(/\p{Diacritic}/gu, "");

                    res += lineBreak(tab + st, 76, tab)+ `\n`;

                    for (let tweetNext of data as any) {
                        if (tweetNext.in_reply_to_status_id_str == tweet.id_str) {
                            res += createThread(tweetNext, '');
                        }
                    }

                    return res;
                }

                let res = 'Latest tweets\n';
                res += '\n';
                for (let tweet of data as any) {
                    if (tweet.in_reply_to_status_id_str == null) {
                        res += box(
                            createThread(tweet), 
                            new Date(tweet.created_at).toUTCString(), 
                            config.screen_width
                        );
                        res += "\n";
                    }
                }

                tweetCache = {
                    time: Date.now(),
                    text: res
                };
                console.log("Got tweets");

                resolve(tweetCache.text);
            } else {
                console.log(err);
                reject({ params: params, err: err });
            }
        });
    });
}
