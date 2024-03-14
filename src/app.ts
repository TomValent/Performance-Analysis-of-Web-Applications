import express, { Express, NextFunction } from 'express';
import { traceMiddleware } from './tracing';
import { countAllRequests, countAllErrors, measureLatency, measureMemoryUsage } from './metrics';
import { app as otherApp } from '../../testProjects/dice/src/index';

const app: Express = express();

// middlewares
app.use(countAllRequests());
app.use(countAllErrors);
app.use(measureLatency());
app.use(traceMiddleware());
app.use(measureMemoryUsage());

// get project routes
app.use(otherApp);

// server
const PORT: string|9000 = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});