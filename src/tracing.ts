import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { NodeTracerProvider } from '@opentelemetry/node';
import { Span, Tracer } from '@opentelemetry/api';
import express, { NextFunction } from 'express';
import { FileSpanExporter } from './exporters/FileSpanExporter';

// constants
const FILENAME: string = 'data/tracing/tracing.log';

// middleware
export const traceMiddleware = () => {
    // config trace provider
    const provider: NodeTracerProvider = new NodeTracerProvider({
        spanLimits: {
            attributeCountLimit: 512,
            linkCountLimit: 512,
            eventCountLimit: 512,
        }
    });

    provider.register();

    provider.addSpanProcessor(
        new SimpleSpanProcessor(
            new FileSpanExporter(FILENAME),
        ),
    );

    return (req: express.Request, res: express.Response, next: NextFunction) => {
        const tracer: Tracer = provider.getTracer('tracer');
        const span: Span = tracer.startSpan('request');

        span.setAttribute('http.method', req.method);
        span.setAttribute('http.url', req.url);

        const childSpan: Span = tracer.startSpan('processing', { parent: span } as any);

        if (req.method === 'GET') {
            const buttonClickHandler = () => {
                const buttonClickSpan: Span = tracer.startSpan('button_click', { parent: span } as any);
                buttonClickSpan.end();
            };

            res.locals.tracingButtonClickHandler = buttonClickHandler;
            res.send = ((send: any) => function(this: any, ...args: any[]) {
                buttonClickHandler();

                return send.apply(this, args);
            })(res.send);
        }

        childSpan.end();
        span.end();

        next();
    };
};
