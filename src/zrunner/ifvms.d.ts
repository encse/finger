"use strict";

declare module 'ifvms' {
    class ZVM {}
}

declare module 'glkote-term' {
    class GlkOte {
        constructor(rl_opts: any);
        send_response(...any): any;
        static Glk:any;
    }
}

declare module 'mute-stream' {
    export default class MuteStream{}
}