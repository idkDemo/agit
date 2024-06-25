import { findFileByExtention, isAbletonProject, mv, readDirRecursively, readFile, readProjectInfo, rmDir, writeFile } from './lib/fs';
import { build, parse, unzip, validate, zip } from "./lib/parser";
import { ableton_11_paths, ableton_12_paths } from "./lib/paths";
import { changeNextPointeeId, getAbletonVersion } from "./lib/ableton";
import { join } from 'path';
import { exists } from 'fs/promises';
import { combine } from './lib/combiner';

import { createCommand } from 'commander';
import { hookConsole, Levels } from './lib/logger';
import { $ } from 'bun';

const command = createCommand('combine')
    .description('Combine an Ableton project')
    .option('-p, --path <path>', 'Path to the Ableton project')
    .option('-d, --debug', 'Enable debug mode')
    .action(async (flags, command) => {
        const _path = flags.path || await $`git rev-parse --show-toplevel`.text();

        const project = await readProjectInfo(_path);
        if (!project) {
            console.error('No project info found');
            process.exit(1);
        }

        const ableton_project = isAbletonProject(_path);
        if (!ableton_project) {
            console.error('Cannot find an Ableton project in the current directory or the specified');
            process.exit(1);
        }

        const ableton_file = findFileByExtention(_path, '.als');
        if (!ableton_file.path && ableton_file.error) throw ableton_file.error;

        const hasWorkingDir = exists(join(_path, project.output));
        if (!hasWorkingDir) {
            console.error('No working directory found');
            process.exit(1);
        }

        const abletonFilePath = findFileByExtention(_path, '.als');
        if (!abletonFilePath.path && abletonFilePath.error) throw abletonFilePath.error;

        const file = readFile(abletonFilePath.path!);
        const parsed = parse(unzip(await file.arrayBuffer()));

        console.debug('Ableton file path:', abletonFilePath);

        const version = getAbletonVersion(parsed);
        const split_rules = version.major === 5 ? ableton_11_paths : ableton_12_paths;

        const files = await readDirRecursively(join(_path, project.output));
        const mappings: Record<string, Node[]> = {};

        for (const file of files) {
            if (file.endsWith('.als')) { console.debug('Skipped file: ', file); continue };
            if (!file.endsWith('.xml')) { console.debug('Skipped file: ', file); continue };

            const parsed = parse(await readFile(file).text());
            const type = file.split(/\/{1,2}|\\{1,2}/).at(-2);

            if (!type) throw new Error(`Invalid type: ${file}`);
            console.debug('Type:', type, 'File:', file)

            const key = split_rules.extract[type];
            if (!key) continue/*throw new Error(`Invalid key: ${type}`);*/
            mappings[key] ? mappings[key].push(parsed) : mappings[key] = [parsed];

        }

        Object.keys(mappings).forEach(k => {
            console.info('Key: ', k, 'isArray', Array.isArray(mappings[k]), 'Length: ', mappings[k].length);
        })

        const combined = combine(parsed, mappings, project.places);
        const next_project = changeNextPointeeId(combined, Number(project.infos.nextPointeeId));

        const res = validate(build(next_project));
        if (!res) throw new Error('Invalid XML Format');

        console.info('Moving Ableton file to backup');
        mv(abletonFilePath.path!, join(_path, 'Backup', abletonFilePath.path!.split(/\/{1,2}|\\{1,2}/).pop()!));
        console.info('Writing new Ableton file')
        writeFile(join(_path, project.name + '.als'), zip(build(next_project)));

        if (flags.debug) {
            console.info('Writing debug files');
            writeFile(join(_path, 'debug', 'parsed.xml'), build(parsed));
            writeFile(join(_path, 'debug', 'combined.xml'), build(next_project));
        }
    })
export default command;
