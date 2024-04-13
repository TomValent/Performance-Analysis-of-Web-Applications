import express, { NextFunction } from 'express';
import { Meter, MeterProvider } from '@opentelemetry/metrics';
import { FileMetricsExporter } from './exporters/FileMetricsExporter';

// constants
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
const memoryMeter: Meter = meterProvider.getMeter(METER_NAME);
const throughputMeter: Meter = meterProvider.getMeter(METER_NAME);
const cpuUsageMeter: Meter = meterProvider.getMeter(METER_NAME);

// create counters
const requestCount = requestMeter.createCounter('page_requests', {
    description: 'Request count',
});

const errorCountMetric = errorMeter.createCounter('error_count', {
    description: 'Counts total occurrences of errors',
});

const errorCodeMetric = errorMeter.createCounter('error_code_count', {
    description: 'Counts occurrences of different error codes',
});

const errorMessageMetric = errorMeter.createCounter('error_message_count', {
    description: 'Counts occurrences of different error messages',
});

const memoryUsageCounter = memoryMeter.createUpDownCounter('memory_usage_counter', {
    description: 'Total memory usage',
    unit: 'MB',
});

const userCpuUsageCounter = cpuUsageMeter.createUpDownCounter('user_cpu_usage', {
    description: 'User CPU usage',
    unit: 'seconds',
});

const systemCpuUsageCounter = cpuUsageMeter.createUpDownCounter('system_cpu_usage', {
    description: 'System CPU usage',
    unit: 'seconds',
});

const userCpuTimeCounter = cpuUsageMeter.createUpDownCounter('user_cpu_time', {
    description: 'User CPU time',
    unit: 'seconds',
});

const systemCpuTimeCounter = cpuUsageMeter.createUpDownCounter('system_cpu_time', {
    description: 'System CPU time',
    unit: 'seconds',
});

// middleware implementations
export const countAllRequests = () => {
    const boundInstruments: Map<string, any> = new Map();

    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        if (!boundInstruments.has(req.path)) {
            const labels: { route: string } = { route: req.path };
            const boundCounter = requestCount.bind(labels);
            boundInstruments.set(req.path, boundCounter);
        }

        boundInstruments.get(req.path).add(1);
        next();
    };
};

export const countAllErrors = (req: express.Request, res: express.Response, next: NextFunction) : void => {
    res.once('finish', () => {
        const isError: boolean = res.statusCode >= 400 && req.path !== "/favicon.ico";

        if (isError) {
            errorCountMetric.bind({route: req.path}).add(1);

            const errorCode: string = res.statusCode.toString();
            const labelCode: {route: string, error_code: string} = {
                route: req.path,
                error_code: errorCode,
            };

            errorCodeMetric.bind(labelCode).add(1);

            let errorMessage: string = 'Route: ' + req.path + ' - ';
            errorMessage += res.statusMessage ?? 'Unknown error';

            const labels: {route: string, errorMessage: string} = {
                route: req.path,
                errorMessage: errorMessage,
            };

            errorMessageMetric.bind(labels).add(1);
        }
    });

    next();
};


export const measureLatency: any = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const start: [number, number] = process.hrtime();

        res.on('finish', (): void => {
            const elapsed: [number, number] = process.hrtime(start);
            const latencyMs: number = elapsed[0] * 1000 + elapsed[1] / 1000000;
            const labels: {route: string} = { route: req.path };

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
        const labels: {route: string} = { route: req.path };
        const memoryUsageInBytes: number = process.memoryUsage().heapUsed;
        const memoryUsageInMB: number = memoryUsageInBytes / (1024 * 1024);

        memoryUsageCounter.add(memoryUsageInMB, labels);

        next();
    };
};

export const recordThroughput = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const startTime: [number, number] = process.hrtime();
        const labels: {route: string} = { route: req.path };

        res.on('finish', () => {
            const endTime: [number, number] = process.hrtime(startTime);
            const latencySeconds: number = (endTime[0] + endTime[1] / 1e9);

            const throughput: number = 1 / (latencySeconds);

            const throughputSummary = throughputMeter.createValueRecorder('throughput', {
                description: 'Throughput of requests',
                unit: 'requests per second',
            });

            throughputSummary.record(throughput, labels);
        });

        next();
    };
};

export const measureCPUUsage = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const labels: {route: string} = { route: req.path };
        const cpuUsageMicroseconds: NodeJS.CpuUsage = process.cpuUsage();
        const cpuUsageSeconds: {user: number, system: number} = {
            user: cpuUsageMicroseconds.user / 1e6,
            system: cpuUsageMicroseconds.system / 1e6,
        };

        userCpuUsageCounter.add(cpuUsageSeconds.user, labels);
        systemCpuUsageCounter.add(cpuUsageSeconds.system, labels);
        next();
    };
};

export const measureCPUTime = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const labels: {route: string} = { route: req.path };
        const resourceUsage: NodeJS.ResourceUsage = process.resourceUsage();
        const userCPUTimeSeconds: number = resourceUsage.userCPUTime / 1e6;
        const systemCPUTimeSeconds: number = resourceUsage.systemCPUTime / 1e6;

        userCpuTimeCounter.add(userCPUTimeSeconds, labels);
        systemCpuTimeCounter.add(systemCPUTimeSeconds, labels);

        next();
    };
};
