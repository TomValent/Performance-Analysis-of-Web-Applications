import express, { NextFunction } from 'express';
import { Meter, MeterProvider } from '@opentelemetry/metrics';
import { Counter, ValueType } from '@opentelemetry/api-metrics';
import { FileMetricsExporter } from './exporters/FileMetricsExporter';

// // constants
const FILENAME: string   = 'data/metrics/metrics.log';
const INTERVAL: number   = 1000;
const METER_NAME: string = 'OpenTelemetry-metrics';

const exporter: FileMetricsExporter = new FileMetricsExporter(FILENAME);

const meterProvider: MeterProvider = new MeterProvider({
    exporter: exporter,
    interval: INTERVAL,
});

// metrics
const requestMeter: Meter = meterProvider.getMeter(METER_NAME);
const errorMeter: Meter = meterProvider.getMeter(METER_NAME);
const latencyMeter: Meter = meterProvider.getMeter(METER_NAME);
const memoryMeter = meterProvider.getMeter(METER_NAME);

// create counters
const requestCount = requestMeter.createCounter('page_requests', {
    description: 'Request count:',
});

const errorCountMetric: Counter = errorMeter.createCounter('error_count', {
    description: 'Counts total occurrences of errors',
});

const errorCodeMetric = errorMeter.createCounter('error_code_count', {
    description: 'Counts occurrences of different error codes',
});

const errorMessageMetric = errorMeter.createCounter('error_message_count', {
    description: 'Counts occurrences of different error messages',
});

const memoryUsageCounter = memoryMeter.createUpDownCounter('memory_usage_counter', {
    description: 'Total memory usage in bits',
    unit: 'bits',
    valueType: ValueType.INT,
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
        const isError = res.statusCode >= 400 && req.path !== "/favicon.ico";

        if (isError) {
            errorCountMetric.add(1);

            const errorCode = res.statusCode.toString();
            errorCodeMetric.bind({ error_code: errorCode }).add(1);

            let errorMessage: string = 'Route: ' + req.path + ' - ';
            errorMessage += res.statusMessage ?? 'Unknown error';

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
                description: 'Latency of requests in milliseconds',
                unit: 'ms',
            });

            latencySummary.record(latencyMs, labels);
        });

        next();
    };
};

export const measureMemoryUsage = () => {
    return (req: express.Request, res: express.Response, next: NextFunction) => {
        const labels = { route: req.path };
        const memoryUsageInBytes = process.memoryUsage().heapUsed;

        memoryUsageCounter.add(memoryUsageInBytes, labels);

        next();
    };
};
