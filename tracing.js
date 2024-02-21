const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { NodeTracerProvider } = require('@opentelemetry/node');
const FileExporter = require('./fileSpanExporter');

const trace = () => {
    const provider = new NodeTracerProvider({
        logLevel: 30,
    });

    provider.register();

    provider.addSpanProcessor(
        new SimpleSpanProcessor(
            new FileExporter('data/traces/tracing.log'),
        ),
    );

    return provider;
};

module.exports = trace;
