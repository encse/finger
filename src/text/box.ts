import { lineBreak } from "./lineBreak";

export function box(txt: string, label: string, width: number) {
    let res = '';
    res += '+' + '-'.repeat(width - 2) + '+' + '\n';
    for (let line of lineBreak(txt, width - 4).split('\n')) {
        res += '| ' + line.padEnd(width - 4, ' ') + ' |\n';
    }
    label = '--[' + label + ']--';
    res += '+' + label.padStart(width - 2, '-') + '+' + '\n';
    return res;
}
