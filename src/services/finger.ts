import net from 'net'
import { getMessage } from '../blocks/message';

export function fingerService(finger_port: number){
    const server = net.createServer(async (socket) => {
        let message = await getMessage()
        message = asciiFold(message);
        socket.write(message);
        socket.end();
    }).on('error', (err) => {
        console.error('finger server error', err);
    });

    server.listen(finger_port, () => {
        console.log('opened finger server on', server.address());
    });
}

function asciiFold(st: string) {
    st = st.replace(/█/g,'#');
    st = st.replace(/▀/g,'"');
    st = st.replace(/▌/g,';');
    st = st.replace(/▐/g,':');
    st = st.replace(/▄/g,'.');
    // remove accents such as á -> a, é -> e, because raw TCP doesn't like it...
    st = st.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    // remove non ascii characters
    return st.split('').map(
        character => character.charCodeAt(0) < 127 ? character : ' '
    ).join('');
}