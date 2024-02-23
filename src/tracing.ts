import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { NodeTracerProvider } from '@opentelemetry/node';
import { FileSpanExporter } from './exporters/FileSpanExporter';

export const trace = () => {
    const provider = new NodeTracerProvider({
        serviceName: 'tracing-service',
        logLevel: 30,
    } as any);

    provider.register();

    provider.addSpanProcessor(
        new SimpleSpanProcessor(
            new FileSpanExporter('data/traces/tracing.log'),
        ),
    );

    return provider;
};
