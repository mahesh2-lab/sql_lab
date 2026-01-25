import { NodeVM } from "vm2";
import { Volume, createFsFromVolume } from "memfs";

console.log("Verifying NodeVM + memfs logic...");

const vol = new Volume();
const virtualFs = createFsFromVolume(vol);

const logs: string[] = [];

const vm = new NodeVM({
    timeout: 1000,
    console: 'redirect',
    require: {
        external: false,
        builtin: ['path', 'events', 'util', 'os', 'buffer', 'assert'],
        mock: {
            fs: virtualFs,
        }
    }
});

vm.on('console.log', (...args) => logs.push(args.join(' ')));
vm.on('console.error', (...args) => logs.push('Error: ' + args.join(' ')));

const code = `
const fs = require('fs');
console.log('Writing file...');
fs.writeFileSync('/test.txt', 'Virtual Content');
console.log('File written.');
const content = fs.readFileSync('/test.txt', 'utf8');
console.log('Content read: ' + content);
`;

try {
    vm.run(code, 'index.js');
    console.log("Execution successful. Logs:");
    console.log(logs.join('\n'));
} catch (e) {
    console.error("Execution failed:", e);
}
