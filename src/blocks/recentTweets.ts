
import config from '../../config.json';
import Twitter from 'twitter';
import { lineBreak } from '../text/lineBreak';
import { box } from '../text/box';
import {cached} from './cache';
import { User } from '../server/users';

export async function recentTweets(user: User) {

    try {
        return cached(`tweets-${user.name}`, async () => {
            const params = {
                q: '#nodejs',
                count: 20,
                result_type: 'recent',
                screen_name: user.twitter,
                tweet_mode: 'extended',
                lang: 'en'
            }
            const data = await twitterAsPromised('statuses/user_timeline', params);
    
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
    
            let res = `Latest tweets https://twitter.com/${user.twitter}\n`;
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

            console.log("Got tweets");
            return res;
        })
    } catch(err) {
        console.log(err);
        return "";
    }

}

function twitterAsPromised(url: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
        new Twitter(config.twitter_auth).get('statuses/user_timeline', params, (err, data: any) => {
            if (err) {
                reject({ params: params, err: err });
            } else {
                resolve(data);
            }
        });
    });
}