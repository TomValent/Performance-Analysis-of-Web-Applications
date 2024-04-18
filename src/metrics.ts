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
const cpuTimeMeter: Meter = meterProvider.getMeter(METER_NAME);
const fsMeter: Meter = meterProvider.getMeter(METER_NAME);
const vcsMeter: Meter = meterProvider.getMeter(METER_NAME);

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

const latencySummary = latencyMeter.createUpDownCounter('request_latency_summary', {
    description: 'Latency of requests in milliseconds',
    unit: 'ms',
});

const memoryUsageCounter = memoryMeter.createUpDownCounter('memory_usage_counter', {
    description: 'Total memory usage',
    unit: 'MB',
});

const throughputSummary = throughputMeter.createUpDownCounter('throughput', {
    description: 'Throughput of requests',
    unit: 'requests per second',
});

const userCpuUsageCounter = cpuUsageMeter.createUpDownCounter('user_cpu_usage', {
    description: 'User CPU usage',
    unit: 'seconds',
});

const systemCpuUsageCounter = cpuUsageMeter.createUpDownCounter('system_cpu_usage', {
    description: 'System CPU usage',
    unit: 'seconds',
});

const userCpuTimeCounter = cpuTimeMeter.createUpDownCounter('user_cpu_time', {
    description: 'User CPU time',
    unit: 'seconds',
});

const systemCpuTimeCounter = cpuTimeMeter.createUpDownCounter('system_cpu_time', {
    description: 'System CPU time',
    unit: 'seconds',
});

const fsReadCounter = fsMeter.createCounter('fs_read', {
    description: 'File system reads',
});

const fsWriteCounter = fsMeter.createCounter('fs_write', {
    description: 'File system writes',
});

const voluntaryContextSwitchesCounter = vcsMeter.createCounter('voluntary_context_switches', {
    description: 'Voluntary context switches',
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

export const countAllErrors = (req: express.Request, res: express.Response, next: NextFunction): void => {
    res.once('finish', (): void => {
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

export const measureLatency = () => {
    return async (req: express.Request, res: express.Response, next: NextFunction): Promise<void> => {
        const start: bigint = process.hrtime.bigint();

        res.on('finish', async (): Promise<void> => {
            const end: bigint = process.hrtime.bigint();
            const elapsed: bigint = end - start;
            const latencyMs: number = Number(elapsed) / 1e6;
            const labels: {route: string} = { route: req.path };

            await latencySummary.clear();
            await latencySummary.add(latencyMs > 0 ? latencyMs : 0, labels);
        });

        next();
    };
};

export const measureMemoryUsage = () => {
    return async (req: express.Request, res: express.Response, next: NextFunction): Promise<void> => {
        const labels: {route: string} = { route: req.path };
        const memoryUsageInBytes: number = process.memoryUsage().heapUsed;
        const memoryUsageInMB: number = memoryUsageInBytes / (1024 * 1024);

        await memoryUsageCounter.clear();
        await memoryUsageCounter.add(memoryUsageInMB > 0 ? memoryUsageInMB : 0, labels);

        next();
    };
};

export const recordThroughput = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const labels: {route: string} = { route: req.path };
        const start: bigint = process.hrtime.bigint();

        res.on('finish', (): void => {
            const end: bigint = process.hrtime.bigint();
            const elapsed: bigint = end - start;
            const latencySeconds: number = Number(elapsed) / 1e9;
            const throughput: number = 1 / (latencySeconds);

            throughputSummary.add(throughput, labels);
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

export const measureFSOperations = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const labels: {route: string} = { route: req.path };

        fsReadCounter.add(process.resourceUsage().fsRead, labels);
        fsWriteCounter.add(process.resourceUsage().fsWrite, labels);
        next();
    };
};

export const measureVoluntaryContextSwitches = () => {
    return (req: express.Request, res: express.Response, next: NextFunction): void => {
        const labels: {route: string} = { route: req.path };

        voluntaryContextSwitchesCounter.add(process.resourceUsage().voluntaryContextSwitches, labels);
        next();
    };
};
