## Description
Typescript profiler written with OpenTelemetry.

## Requirements
- Node.js 18.13 >=
- export express app containing routes their implementation
- npm -g install typescript-call-graph

```ts
import express from "express";

const app =  express();

export { app };
```

## Usage

```bash
yarn install
yarn build
yarn start --silent --path '~/Documents/BP/testProjects/dice/src/index'
```

Relative path like this `'../../testProjects/dice/src/index'` is option too, but don't
forget to add extra `../` because `app.ts` is  in src folder, not root.


- path: path to the project to profile, index file (required)
- silent: flag to disable console logs (optional)
