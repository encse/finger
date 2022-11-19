

export function lineBreak(text: string, width: number, cont: string = '') {
    let lines = text.split("\n")

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let ichSpace = 0;
        let escape = false;
        let nonEscapedChars = 0;

        for (let ich = 0; ich < line.length; ich++) {
            if (escape) {
                if (line[ich] == ';') {
                    escape = false;
                }
            } else {
                nonEscapedChars++;
                if (line[ich] == ' ') {
                    ichSpace = ich;
                }
                if (nonEscapedChars > width) {
                    if (ichSpace > 0) {
                        let linePrefix = line.startsWith(cont) ? cont : '';
                        lines.splice(i + 1, 0, linePrefix + line.substring(ichSpace + 1));
                        lines[i] = line.substring(0, ichSpace).trimEnd();
                    }
                    break;
                }
            }
        }
    }
    return lines.join('\n');
}
