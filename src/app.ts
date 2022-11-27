"use strict";

async function main() {
    if (process.argv.length == 2) {
        const server = await import('./server');
        server.runServer();
    }
}

main();

