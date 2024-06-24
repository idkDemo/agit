import { findFileByExtention, formatJSON, isAbletonProject, readFile, rmDir, rmFile, writeFile } from "./lib/fs";
import { build, parse, unzip, formatXML } from './lib/parser';
import { ableton_11_paths, ableton_12_paths } from "./lib/paths";
import { split } from "./lib/splitter";
import { getAbletonVersion, type ProjectInfo } from "./lib/ableton";
import { join, sep } from 'path';
import { Command, createCommand } from 'commander';

const command = createCommand('split')
    .description('Split an Ableton project into multiple xml files')
    .option('-p, --path <path>', 'Path to the Ableton project')
    .option('-o, --output <output>', 'Output path')
    .option('-d, --debug', 'Enable debug mode')
    .action(async (flags, command: Command) => {
        const _path = flags.path || process.cwd();
        const _debug: boolean = flags.debug || false;
        const _output = flags.output || join(_path, '.working');

        console.info('Splittings your project...');
        const project = isAbletonProject(process.cwd()) || flags.path && isAbletonProject(flags.path);

        if (!project) {
            console.error('Cannot find an Ableton project in the current directory or the specified path.');
            process.exit(1);
        }


        const abletonFilePath = findFileByExtention(_path, '.als');
        if (!abletonFilePath.path && abletonFilePath.error) throw console.error('ERROR!', 'project path', _path, '\n', 'output: ', _output, _debug ? '\n' + abletonFilePath.error : '');


        const file = readFile(abletonFilePath.path!);
        const parsed = parse(unzip(await file.arrayBuffer()));

        const version = getAbletonVersion(parsed);
        const split_rules = version.major === 5 ? ableton_11_paths : ableton_12_paths;
        const [mappings, places, infos] = split(parsed, split_rules);

        try {
            rmDir(join(_path, '.working')); // Ensure that everythings is clean + delete tracks;
            rmFile(join(_path, 'project.json')); // Delete project.json if exists;
        } catch (e) {
            console.error(e);
        }

        const project_info: ProjectInfo = {
            'name': abletonFilePath.path!.split(sep).pop()!.split('.').shift()!,
            'version': version,
            'output': _output,
            'infos': infos,
            'places': places
        }

        writeFile(join(_path, 'project.json'), formatJSON(project_info));

        for (let [key, value] of Object.entries(mappings)) {
            writeFile(join(_output, key.toLocaleLowerCase()), formatXML(value))
        }

        if (_debug) {
            writeFile(join(_output, 'debug', 'parsed.xml'), formatXML(build(parsed)))
        };
        console.info('Project contains', places.length, 'files.');
        console.info('Project informations saved to', join(_path, 'project.json'));
        console.info('Project has been splitted and saved to', join(_output));
    })


export default command;
