"use strict";

async function main() {
    if (process.argv.length == 2) {
        const server = await import('./server');
        server.runServer();
    } else if (process.argv.length == 3) {
        const server = await import('./bbs');
        server.runSession();
    }
}

main();

