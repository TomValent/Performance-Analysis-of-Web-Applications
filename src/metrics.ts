import express, {NextFunction, response} from "express";
import { MeterProvider, Meter } from "@opentelemetry/metrics";
import { Counter } from "@opentelemetry/api-metrics";
import { FileMetricsExporter } from './exporters/FileMetricsExporter';

// // constants
const PATH: string       = "data/metrics/metrics.log";
const INTERVAL: number   = 1000;
const METER_NAME: string = "OpenTelemetry-metrics";

const exporter: FileMetricsExporter = new FileMetricsExporter(PATH);

const meterProvider: MeterProvider = new MeterProvider({
    exporter: exporter,
    interval: INTERVAL,
});

// metrics
const requestMeter: Meter = meterProvider.getMeter(METER_NAME);
const errorMeter: Meter = meterProvider.getMeter(METER_NAME);
const latencyMeter: Meter = meterProvider.getMeter(METER_NAME);

// create counters
const requestCount = requestMeter.createCounter('page_requests', {
    description: 'Request count:',
    unit: "times",
});

const errorCountMetric: Counter = errorMeter.createCounter('error_count', {
    description: 'Counts total occurrences of errors',
    unit: "times",
});

const errorCodeMetric = errorMeter.createCounter('error_code_count', {
    description: 'Counts occurrences of different error codes',
    unit: "times",
});

const errorMessageMetric = errorMeter.createCounter('error_message_count', {
    description: 'Counts occurrences of different error messages',
    unit: "times",
});

const boundInstruments = new Map();

// middleware implementations
export const countAllRequests = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        if (!boundInstruments.has(req.path)) {
            const labels = { route: req.path };
            const boundCounter = requestCount.bind(labels);
            boundInstruments.set(req.path, boundCounter);
        }

        boundInstruments.get(req.path).add(1);
        next();
    };
};

export const countAllErrors = (req: express.Request, res: express.Response, next: NextFunction) : void => {
    res.once('finish', () => {
        const isError = res.statusCode >= 400;

        if (isError) {
            errorCountMetric.add(1);

            const errorCode = res.statusCode.toString();
            errorCodeMetric.bind({ error_code: errorCode }).add(1);

            let errorMessage: string = "Route: " + req.path + " - ";
            errorMessage += res.statusMessage ?? "Unknown error";

            const labels = {
                route: req.path,
                errorMessage: errorMessage,
            };

            errorMessageMetric.bind(labels).add(1);
        }
    });

    next();
};


export const measureLatency = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const start = process.hrtime();

        res.on('finish', () => {
            const elapsed = process.hrtime(start);
            const latencyMs = elapsed[0] * 1000 + elapsed[1] / 1000000;
            const labels = { route: req.path };

            // create a summary value recorder
            const latencySummary = latencyMeter.createValueRecorder('request_latency_summary', {
                description: 'Latency of requests',
                unit: 'ms',
            });

            latencySummary.record(latencyMs, labels);
        });

        next();
    };
};
