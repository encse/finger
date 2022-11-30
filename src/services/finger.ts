import net from 'net'
import * as readline from 'readline';

import { getFingerMessage } from '../blocks/finger';
import { lookupUser } from '../server/users';

export function fingerService(finger_port: number) {
    const server = net.createServer((socket) => {
        socket.on('error', (err) => { 
            console.log('socket', err) 
        });

        readline.createInterface({
            input: socket,
        }).on('line', async (line: string) => {
            try {
                let message = await getFingerMessage(lookupUser(line));
                socket.write(asciiFold(message));
            } catch(err){
                console.log('on:line', err);
            } finally {
                socket.end();
            }
        }).on('error', (err) => {
            console.log('readline', err);
        })

    }).on('error', (err) => {
        console.error('finger server error', err);
    })

    server.listen(finger_port, () => {
        console.log('opened finger server on', server.address());
    });
}

function asciiFold(st: string) {
    st = st.replace(/█/g, '#');
    st = st.replace(/▀/g, '"');
    st = st.replace(/▌/g, ';');
    st = st.replace(/▐/g, ':');
    st = st.replace(/▄/g, '.');
    // remove accents such as á -> a, é -> e, because raw TCP doesn't like it...
    st = st.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    // remove non ascii characters
    return st.split('').map(
        character => character.charCodeAt(0) < 127 ? character : ' '
    ).join('');
}