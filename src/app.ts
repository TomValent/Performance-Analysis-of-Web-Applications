import express, { Express } from 'express';
import { traceMiddleware } from './tracing';
import { countAllRequests, countAllErrors, measureLatency, measureMemoryUsage, recordThroughput } from './metrics';

const app: Express = express();

// middlewares
app.use(countAllRequests());
app.use(countAllErrors);
app.use(measureLatency());
app.use(traceMiddleware());
app.use(measureMemoryUsage());
app.use(recordThroughput());

// get project routes (dynamic import)
const argv:string[] = process.argv.slice(2);

if (!argv.includes('--path')) {
  console.error('Path to test project directory not provided.');
  process.exit(1);
}

const pathIndex: number = argv.indexOf('--path');
let testProjectDir:string = '';

testProjectDir = argv[pathIndex + 1];

if (!testProjectDir) {
    console.error('Path to test project directory not provided.');
    process.exit(1);
}

import(testProjectDir).then((module): void => {
    const otherApp = module.app;
    app.use(otherApp);
}).catch((error): void => {
    console.error('Error importing module:', error);
    process.exit(1);
});

// start the server
const PORT: string|9000 = process.env.PORT || 9000;

app.listen(PORT, (): void => {
  console.log(`Profiler is running on http://localhost:${PORT}`);
});