'use strict'

const { MeterProvider, ConsoleMetricExporter } = require("@opentelemetry/metrics");
const FileMetricsExporter = require('./fileMetricsExporter');

const meter = new MeterProvider({
    exporter: new FileMetricsExporter('data/metrics/metrics.log'),
    interval: 1000,
}).getMeter("meter-name");



const requestCount = meter.createCounter('requests', {
    description: 'Request count:'
});

const boundInstruments = new Map();

module.exports.countAllRequests = () => {
    return (req, res, next) => {
        if (!boundInstruments.has(req.path)) {
            const labels = { route: req.path };
            const boundCounter = requestCount.bind(labels);
            boundInstruments.set(req.path, boundCounter);
        }

        boundInstruments.get(req.path).add(1);
        next();
    };
};
