import express, { Express, NextFunction } from 'express';
import { traceMiddleware } from './tracing';
import { countAllRequests, countAllErrors, measureLatency, measureMemoryUsage } from './metrics';
import { config } from '../config/config.project';

const app: Express = express();

// middlewares
app.use(countAllRequests());
app.use(countAllErrors);
app.use(measureLatency());
app.use(traceMiddleware());
app.use(measureMemoryUsage());

let count: number = 0;

setInterval((): void => {
    count++;
}, 1000);

type Endpoint = {
  path: string;
  method: string;
};

// bind routes with methods
const methodMap: { [key: string]: Function } = {
  'get': app.get.bind(app),
  'post': app.post.bind(app),
};

// routes
config.endpoints.forEach((endpoint: Endpoint) => {
  const { path, method } = endpoint;

  if (methodMap[method]) {
    methodMap[method](path, (req: express.Request, res: express.Response) => {
      switch (path) {
        case '/':
          res.send(`
            <h2>Welcome to the homepage!</h2>
            <button onclick="window.location.href='/about'">About</button>
            <button onclick="window.location.href='/roll'">Roll</button>
            <button onclick="window.location.href='/uptime'">Count</button>
          `);
        break;

        case '/about':
          res.send('This is the just testing page for thesis.');
          break;

        case '/roll':
          res.send(`
            <p>Roll the D20:</p>
            <button onclick="rollDice()">Roll D20</button>
            <div id="diceResult" style="padding-top: 15px"></div>

            <script>
                function rollDice() {
                    fetch('/roll')
                        .then(response => {
                            const randomNumber = Math.floor(Math.random() * 20) + 1;
                            document.getElementById('diceResult').textContent = randomNumber.toString();
                        });
                }
            </script>
          `);
          break;

        case '/uptime':
          res.send(`Uptime: ${count} seconds have passed`);
          break;

        default:
          break;
      }
    });
  }
});

app.use(function(req: express.Request, res: express.Response, next: NextFunction) {
  res.status(404).send('404 Page Not Found');
});

// server
const PORT: string|9000 = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});