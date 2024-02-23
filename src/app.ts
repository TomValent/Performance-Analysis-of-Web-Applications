import express, { Express, NextFunction } from 'express';
import { traceMiddleware } from './tracing';
import { countAllRequests, countAllErrors, measureLatency } from './metrics';
const test = require('../../testProjects/dice/dist/index.js');

const app: Express = express();

// middlewares
app.use(countAllRequests());
app.use(countAllErrors);
app.use(measureLatency());
app.use(traceMiddleware());

let count: number = 0;

setInterval((): void => {
    count++;
}, 1000);

// routes
app.get('/', (req: express.Request, res: express.Response) => {
  res.send(`
    <h2>Welcome to the homepage!</h2>
    <button onclick="window.location.href='/about'">About</button>
    <button onclick="window.location.href='/roll'">Roll</button>
    <button onclick="window.location.href='/uptime'">Count</button>
  `);
});

app.get('/about', (req: express.Request, res: express.Response) => {
  res.send('This is the just testing page for thesis.');
});

app.get('/roll', (req: express.Request, res: express.Response) => {
  const htmlContent = `
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
  `;

  res.send(htmlContent);
});

app.get('/uptime', (req: express.Request, res: express.Response) => {
  res.send(`Uptime: ${count} seconds have passed`);
});

app.use(function(req: express.Request, res: express.Response, next: NextFunction) {
  res.status(404).send('404 Page Not Found');
});

// server
const PORT: string|9000 = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});