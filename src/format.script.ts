import { createCommand } from "commander";
import { readDirRecursively, readFile, writeFile } from "./lib/fs";
import { formatXML } from "./lib/parser";
import { join } from 'path';
import { $ } from 'bun';

const command = createCommand('format')
    .description('Format an Ableton project xml file')
    .option('-p, --path <path>', 'Path to the Ableton project')
    .action(async (flags, command) => {
        const _path = flags.path || await $`git rev-parse --show-toplevel`.text();

        for (const file of await readDirRecursively(join(_path, '.working'))) {
            console.info('Formatting:', file);
            const content = await readFile(file).text();
            formatXML(content);
            await writeFile(file, content);
        }

        console.info('All files formatted !')
    })
export default command;
