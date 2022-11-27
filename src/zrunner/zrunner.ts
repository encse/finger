/// <reference path="./ifvms.d.ts" />
"use strict";
import * as readline from 'readline';
import {ZVM} from 'ifvms';
import fs from 'fs';
import {GlkOte} from 'glkote-term';
import MuteStream from 'mute-stream';

class MyGlkOte extends GlkOte {
    accept_specialinput(data: any) {
        setImmediate(() => this.send_response('specialresponse', null, 'fileref_prompt', { ref: 'x.x' }));
    }
}

class MyDialog {
    file_write() {
        return false;
    }
    file_ref_exists() {
        return false;
    }
}

export function run(zfile: string) {
    let vm:any = new ZVM();
    let Glk = MyGlkOte.Glk;

    const stdout:any = new MuteStream();
    stdout.pipe(process.stdout);

    const rl = readline.createInterface({
        input: process.stdin,
        output: stdout,
        prompt: '',
    })

    const rl_opts = {
        rl: rl,
        stdin: process.stdin,
        stdout: stdout,
    }

    const glkOte = new MyGlkOte(rl_opts)
    let options = {
        vm: vm,
        Dialog: new MyDialog(),
        Glk: Glk,
        GlkOte: glkOte
    };

    vm.prepare(fs.readFileSync(zfile), options);
    Glk.init(options);
}