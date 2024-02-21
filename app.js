const express = require('express');
const trace = require('./tracing');
const { countAllRequests } = require('./metrics');
const test = require('../../../testProjects/dice/dist');

const app = express();
app.use(countAllRequests());

app.use((req, res, next) => {

  const tracer = trace().getTracer('example-tracer');
  const span = tracer.startSpan('incoming-request');

  span.setAttribute('http.method', req.method);
  span.setAttribute('http.url', req.url);

  const childSpan = tracer.startSpan('processing', { parent: span });

  childSpan.end();
  span.end();

  next();
});

try {
  let count = 0;
  setInterval(() => {
      count++;
  }, 1000);

  app.get('/', (req, res) => {
    res.send(`
      <h2>Welcome to the homepage!</h2>
      <button onclick="window.location.href='/about'">About</button>
      <button onclick="window.location.href='/roll'">Roll</button>
      <button onclick="window.location.href='/uptime'">Count</button>
    `);
  });

  app.get('/about', (req, res) => {
    res.send('This is the just testing page for thesis.');
  });

  app.get('/roll', (req, res) => {
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

  app.get('/uptime', (req, res) => {
    res.send(`Uptime: ${count} seconds have passed`);
  });
} catch (error) {
  console.error('Error loading project: ', error);
}

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});