import { findFileByExtention, isAbletonProject, readFile, writeFile } from "./lib/fs";
import { exists } from 'fs/promises';
import { unzip } from './lib/parser';
import { createCommand } from "commander";
import { join } from 'path';

const command = createCommand('debug-als')
    .description('Extract an ableton project xml file and put it in a debug folder for debugging purposes')
    .option('-p, --path <path>', 'Path to the Ableton project')
    .action(async (flags, command) => {
        const _path = flags.path || process.cwd();

        const project = isAbletonProject(process.cwd()) || flags.path && isAbletonProject(flags.path);
        if (!project) {
            console.error('Not an Ableton project');
            process.exit(1);
        }

        const hasWorkingDir = exists(join(_path, '.working'));
        if (!hasWorkingDir) {
            console.error('No working directory found');
            process.exit(1);
        }

        const abletonFilePath = findFileByExtention(_path, '.als');
        if (!abletonFilePath.path && abletonFilePath.error) throw abletonFilePath.error;

        console.info('Parsing...')

        let i = new Date().toISOString();
        const file = await readFile(abletonFilePath.path!).arrayBuffer();
        writeFile(join(_path, 'debug', `parsed-${i}.xml`), unzip(file))

        console.info('Parsed !')

    })
export default command;
