import { NodeVM } from "vm2";
import { Volume, createFsFromVolume } from "memfs";

console.log("Verifying NodeVM structured logs...");

interface LogEntry {
    type: 'log' | 'error' | 'warn';
    content: string;
}

const logs: LogEntry[] = [];

// Create a new isolated virtual file system for this run
const vol = new Volume();
const virtualFs = createFsFromVolume(vol);

const vm = new NodeVM({
    timeout: 1000,
    console: 'redirect',
    require: {
        external: false,
        builtin: ['path', 'events', 'util', 'os', 'buffer', 'assert'],
        mock: {
            fs: virtualFs,
        }
    },
    sandbox: {}
});

const formatArgs = (args: any[]) => args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(" ");

vm.on('console.log', (...args) => logs.push({ type: 'log', content: formatArgs(args) }));
vm.on('console.error', (...args) => logs.push({ type: 'error', content: formatArgs(args) }));
vm.on('console.warn', (...args) => logs.push({ type: 'warn', content: formatArgs(args) }));

const code = `
const fs = require('fs');
console.log('Log message');
console.error('Error message');
console.warn('Warn message');

try {
  fs.readFileSync('nonexistent.txt');
} catch (e) {
  console.error(e.message);
}
`;

try {
    vm.run(code, 'index.js');
    console.log("Execution successful. JSON Logs:");
    console.log(JSON.stringify(logs, null, 2));
} catch (e) {
    console.error("Execution failed:", e);
}
