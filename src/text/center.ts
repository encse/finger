
export function center(st: string, width: number) {
    
    const lines = st.split("\n");
    const maxWidth = Math.max(...lines.map(x=>x.length));
    return lines.map(line => line == '' ? '' :  ' '.repeat((width - maxWidth) / 2) + line).join('\n');
}