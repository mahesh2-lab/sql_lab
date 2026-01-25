import { VM } from "vm2";

console.log("Testing VM2 capabilities...");

const logs: string[] = [];
const vm = new VM({
    timeout: 1000,
    sandbox: {
        console: {
            log: (...args: any[]) => logs.push(args.map(a => String(a)).join(" ")),
            error: (...args: any[]) => logs.push("Error: " + args.map(a => String(a)).join(" ")),
        }
    }
});

try {
    console.log("Running code to check for 'fs'...");
    vm.run(`
        try {
            const fs = require('fs');
            console.log("fs module is available");
        } catch (e) {
            console.log("fs module is NOT available: " + e.message);
        }
    `);
    console.log("Logs:", logs);
} catch (e) {
    console.error("VM execution failed:", e);
}
