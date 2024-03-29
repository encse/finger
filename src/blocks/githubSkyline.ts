import fetch from 'node-fetch';
import { center } from '../text/center';
import config from '../../config.json';
import { cached } from './cache';
import { User } from '../server/users';

type GithubActivity = {
    username: string,
    year: string,
    min: number
    max: number,
    median: number,
    p80: number,
    p90: number
    p99: number,
    contributions: GithubContributions[];
}
type GithubContributions = {
    week: number,
    days: { count: number }[]
}

export async function githubSkyline(user: User): Promise<string> {

    let year = new Date().getFullYear()
    try {
        return cached(`skyline-${user.name}-${year}`, async () => {
            const rsp = await fetch(`https://skyline.github.com/${user.github}/${year}.json`);
            const json: GithubActivity = await rsp.json();
            const d = json.max / 8;
            let msg = '';
            msg += '\n';
            msg += `Github SkyLine for ${year}\n`;
            msg += '\n';
            msg += '\n';

            for (let j = 8; j >= 0; j--) {
                let row = "";
                for (let contibution of json.contributions) {
                    const maxPerWeek = Math.max(...contibution.days.map(d => d.count));
                    if (maxPerWeek >= d * j) {
                        row += '█';
                    } else {
                        row +=
                            Math.random() < 0.025 ? '*' :
                            Math.random() < 0.025 ? '.' :
                            Math.random() < 0.005 ? '(' :
                            ' ';
                    }
                }
                row += '\n';
                msg += center(row, config.screen_width);
            }
            msg += center(`https://github.com/${user.github}`, config.screen_width) + '\n';
            msg += '\n';
            msg += '\n';
            return msg;
        });
    } catch (err) {
        console.log(err);
        return "";
    }
}