import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { NodeTracerProvider } from '@opentelemetry/node';
import { Span, Tracer } from "@opentelemetry/api";
import express, { NextFunction } from 'express';
import { FileSpanExporter } from './exporters/FileSpanExporter';

export const traceMiddleware = () => {
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

    return (req: express.Request, res: express.Response, next: NextFunction) => {
        const tracer: Tracer = provider.getTracer('tracer');
        const span: Span = tracer.startSpan('request');

        span.setAttribute('http.method', req.method);
        span.setAttribute('http.url', req.url);

        const childSpan: Span = tracer.startSpan('processing', { parent: span } as any);

        childSpan.end();
        span.end();

        next();
    };
};
