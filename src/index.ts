import { chromium } from 'playwright';
import {DEFAULT_ROUTE, DEFAULT_URL_TO_PROFILE} from "../config";

type Arguments = { [key: string]: any };

async function profileWebPage(url: string, route: string) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.route(route, (r) => r.continue());
    await page.evaluate(() => {
        window.performance;
    });

    // Navigate to the web page
    await page.goto(url);

    // Inject code for profiling
    const profilingResults: any = await page.evaluate(() => {
        return window.performance;
    });

    console.log("Time info: ", profilingResults);
    await new Promise(resolve => setTimeout(resolve, 10000));
}

function argumentValueError(): never {
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
let urlToProfile: string = args.url ? args.url as string : DEFAULT_URL_TO_PROFILE;
let route: string        = args.route ? args.route as string : DEFAULT_ROUTE;

profileWebPage(urlToProfile, route)
    .catch(e => {
        console.error("Error: Web is not running");
        process.exit();
    });
