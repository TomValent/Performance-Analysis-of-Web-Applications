## Description
Typescript profiler written with OpenTelemetry.

## Requirements
- Node.js 18.16 >=
- export express app containing routes their implementation

```ts
import express from "express";

const app =  express();

export { app };
```

## Usage

```bash
yarn install
yarn build
yarn start --silent --path '/path/to/express/file'
```

By express file it is meant file, where you exports the express application
as it is shown above.

### Supported parameters
- path: path to the project to profile, index file (required)
- silent: flag to disable console logs (optional)
