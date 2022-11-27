"use strict";

async function main() {
    if (process.argv.length == 2) {
        const server = await import('./server');
        server.runServer();
    } else if(process.argv.length == 4 && process.argv[2] == 'zrunner') {
        const zrunner = await import('./zrunner/zrunner');
        zrunner.run(process.argv[3]);
    }
}

main();

