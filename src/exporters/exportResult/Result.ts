import { ExportResult, ExportResultCode } from "@opentelemetry/core";

/**
 * Result of the export
 */
export class Result implements ExportResult {
    public code: ExportResultCode;
    public error?: Error;

    /**
     * Result constructor
     *
     * @param {number} code
     * @param {Error} error
     */
    constructor(code: ExportResultCode, error?: Error) {
        this.code = code;
        this.error = error;
    }
}
