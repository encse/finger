import readline from 'readline/promises';

export class IO {
    write(st: string) {
        process.stdout.write(st)
    }
    writeLn(st: string) {
        this.write(st + '\n');
    }

    menu(prompt: string, options: string[]): Promise<string> {
        let chars = '';
        for (let option of options){
            let o = /\[(\w)\]/.exec(option)?.[1] ?? '';
            o = o.toLowerCase();
            if (o != '') {
                this.writeLn(`: ${option}`);
                chars += o;
            }
        }
        return this.readOption(prompt, chars);
    }

    async readOption(prompt: string, chars: string): Promise<string> {
        return this.readLn(`${prompt} [${chars}]:`, (st) => st.length == 1 && chars.includes(st))
    }
    async readLn(prompt: string, accept: (st: string) => boolean): Promise<string> {
        const rli = readline.createInterface({input:process.stdin, output:process.stdout});
        while (true) {
            let res = await rli.question(prompt);
            if (accept(res)) {
                rli.close();
                return res;
            }
        }
    }

    async readPassword(prompt: string): Promise<string> {
        const rli = readline.createInterface({input:process.stdin, output:process.stdout});
        return rli.question(prompt);
    }
}
