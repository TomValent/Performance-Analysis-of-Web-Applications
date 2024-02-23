import express, { NextFunction } from "express";
import { MeterProvider } from "@opentelemetry/metrics";
import { FileMetricsExporter } from './exporters/FileMetricsExporter';
import { Counter, ValueType } from "@opentelemetry/api";

const requestMeter = new MeterProvider({
    exporter: new FileMetricsExporter('data/metrics/metrics.log'),
    interval: 1000,
}).getMeter("OpenTelemetry-metrics");

const requestCount = requestMeter.createCounter('page_requests', {
    description: 'Request count:',
    unit: "times",
});

const errorMeter = new MeterProvider({
    exporter: new FileMetricsExporter('data/metrics/metrics.log'),
    interval: 1000,
}).getMeter("OpenTelemetry-metrics");

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

const latencyMeter = new MeterProvider({
    exporter: new FileMetricsExporter('data/metrics/metrics.log'),
    interval: 1000,
}).getMeter("OpenTelemetry-metrics");

const boundInstruments = new Map();

export const countAllRequests = () => {
    return (req: express.Request, res: express.Response, next: NextFunction) => {
        if (!boundInstruments.has(req.path)) {
            const labels = { route: req.path };
            const boundCounter = requestCount.bind(labels);
            boundInstruments.set(req.path, boundCounter);
        }

        boundInstruments.get(req.path).add(1);
        next();
    };
};

export const countAllErrors = (req: express.Request, res: express.Response, next: NextFunction) => {
    res.once('finish', () => {
        const isError = res.statusCode >= 400;
        console.log(res.statusMessage);

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
    return (req: express.Request, res: express.Response, next: NextFunction) => {
        const start = process.hrtime();

        res.on('finish', () => {
            const elapsed = process.hrtime(start);
            const latencyMs = elapsed[0] * 1000 + elapsed[1] / 1000000;
            const labels = { route: req.path };
            const latencySummary = latencyMeter.createValueRecorder('request_latency_summary', {
                description: 'Latency of requests',
                unit: 'ms',
            });

            latencySummary.record(latencyMs, labels);
        });

        next();
    };
};
