const fs = require('fs');
const path = require('path');

class FileSpanExporter {
    constructor(filename) {
        this._filename = filename;
        const logDir   = path.dirname(filename);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            fs.closeSync(fs.openSync(filename, 'w'));
            fs.chmodSync(logDir, '777');
            fs.chmodSync(filename, '777');
        }
    }

    export(spans, done) {
        const formattedSpans = spans.map(span => this.formatSpan(span)).join('\n');
        fs.appendFile(this._filename, formattedSpans + '\n', 'utf8', (err) => {
            if (err) {
                console.error('Error writing spans to file:', err);
                done(500);
            } else {
                console.log('Spans written to file:', this._filename);
                done(200);
            }
        });
    }

    formatSpan(span) {
        return JSON.stringify(span);
    }

    shutdown() {
        return Promise.resolve();
    }
}

module.exports = FileSpanExporter;
