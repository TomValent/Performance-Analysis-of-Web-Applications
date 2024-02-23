import fs from 'fs';
import path from 'path';
import { ReadableSpan, SpanExporter } from "@opentelemetry/tracing";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { Result } from './exportResult/Result';

/**
 * File Span Exporter for tracing
 */
export class FileSpanExporter implements SpanExporter {
    private readonly filename: string = "";

    /**
     * FileSpanExporter constructor
     *
     * @param {string} filename
     */
    constructor(filename: string) {

        this.filename = filename;
        const logDir: string = path.dirname(filename);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            fs.closeSync(fs.openSync(filename, 'w'));
            fs.chmodSync(logDir, '777');
            fs.chmodSync(filename, '777');
        }
    }

    /**
     * Export spans to log file
     *
     * @param {ReadableSpan[]} spans
     * @param {(result: ExportResult) => void} done
     *
     * @return {void}
     */
    export(spans: ReadableSpan[], done: (result: ExportResult) => void): void {
        const formattedSpans: string = spans.map(span => this.formatSpan(span)).join('\n');

        if (formattedSpans !== "") {
            fs.appendFile(this.filename, formattedSpans + '\n', 'utf8', (err) => {
                if (err) {
                    done(new Result(ExportResultCode.FAILED, new Error('Error writing spans to file:' + err.message)));
                } else {
                    console.log('Spans written to file:', this.filename);
                    done(new Result(ExportResultCode.SUCCESS));
                }
            });
        }
    }

    /**
     * Format span for log
     *
     * @param {ReadableSpan} span
     *
     * @return {string}
     */
    formatSpan(span: ReadableSpan): string {
        return JSON.stringify(span);
    }

    /**
     * Shutdown the exporter
     *
     * @return {Promise<void>}
     */
    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}
