import fetch from 'node-fetch';
import { center } from '../text/center';
import config from '../../config.json';

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

export async function githubSkyline(): Promise<string> {
    
    let user = config.github_user;
    let year = new Date().getFullYear()
    
    try {

        const rsp = await fetch(`https://skyline.github.com/${user}/${year}.json`);
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
                if (maxPerWeek >= d * j){
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
        msg += '\n';
        msg += '\n';
        return msg;
    } catch (err) {
        console.error("Couldn't retrieve skyline.", err);
        return "";
    }
}