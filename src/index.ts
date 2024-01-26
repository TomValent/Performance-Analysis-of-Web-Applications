import { firefox } from 'playwright';
import { DEFAULT_ROUTE, DEFAULT_URL_TO_PROFILE } from "../config";

type Arguments = { [key: string]: any };

async function profileWebPage(url: string, route: string) {
    const browser = await firefox.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.route(route, (r) => r.continue());
    await page.evaluate(() => {
        window.performance;
    });

    await page.goto(url);

    const profilingResults: any = await page.evaluate(() => {
        return window.performance;
    });

    console.log("Time info: ", profilingResults);

    const traceBuffer: any = context.tracing;

    await context.tracing.stop();

    if (traceBuffer) {
        console.log("Tracing data:", traceBuffer);
    }

    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
}

function argumentValueError(): void {
    console.error("Error: Argument value not found");
    process.exit();
}

function processArguments(): Arguments {
    let args: Arguments = {};
    for (const arg of process.argv) {
        if (arg === "--url" || arg === "-u") {
            const index = process.argv.indexOf(arg);

            if (index < process.argv.length - 1) {
                args.url = process.argv[index + 1];

                continue;
            }

            argumentValueError();
        } else if (arg === "--route" || arg === "-r") {
            const index = process.argv.indexOf(arg);

            if (index < process.argv.length - 1) {
                args.route = process.argv[index + 1];

                continue;
            }

            argumentValueError();
        }
    }

    return args;
}

let args: Arguments      = processArguments();
let route: string        = args.route ? args.route as string : DEFAULT_ROUTE;
let urlToProfile: string = args.url ? args.url as string : DEFAULT_URL_TO_PROFILE;

profileWebPage(urlToProfile, route)
    .catch(e => {
        console.error("Error: Web is not running");
        process.exit();
    });
