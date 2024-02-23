import fs from 'fs';
import path from 'path';
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { MetricExporter, MetricRecord } from "@opentelemetry/metrics";
import { Result } from "./exportResult/Result";

/**
 * File Metrics Exporter
 */
export class FileMetricsExporter implements MetricExporter {
    private readonly filename: string = '';

    /**
     * FileMetricsExporter constructor
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
     * Shutdown the exporter with error
     *
     * @return {Promise<void>}
     */
    shutdown(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    /**
     * Export metrics to log file
     *
     * @param {MetricRecord[]} metrics
     * @param {(result: ExportResult) => void} resultCallback
     *
     * @return {void}
     */
    export(metrics: MetricRecord[], resultCallback: (result: ExportResult) => void): void {
        const formattedMetrics: string = metrics.map(metric => this.formatMetric(metric)).join('\n');

        if (formattedMetrics !== "") {
            fs.appendFile(this.filename, formattedMetrics + '\n', 'utf8', (err) => {
                if (err) {
                    console.error('Error writing metrics to file:', err);
                    resultCallback(new Result(ExportResultCode.FAILED, new Error('Error writing metrics to file:' + err.message)));
                } else {
                    console.log('Metrics written to file:', this.filename);
                    resultCallback(new Result(ExportResultCode.SUCCESS));
                }
            });
        }
    }

    /**
     * Format metric for log
     *
     * @param {MetricRecord} metric
     *
     * @return {string}
     */
    formatMetric(metric: MetricRecord): string {
        return JSON.stringify(metric);
    }
}
