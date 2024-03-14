## Description
Typescript profiler written with OpenTelemetry.

## Requirements
- Node.js 18.16 >=

## Usage

```bash
yarn install
yarn build
yarn start --silent --path '../../testProjects/dice/src/index'
```

- silent: flag to disable console logs (optional)
- path: path to the project to profile, index file (required)
