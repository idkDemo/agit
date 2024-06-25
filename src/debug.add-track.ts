import { formatJSON, isAbletonProject, readFile, readProjectInfo, writeFile } from "./lib/fs";
import { join, dirname } from 'path';
import { parse, build } from './lib/parser';
import { updateTrack } from "./lib/update-track";
import { createCommand } from "commander";
import { getLastTrackId } from "./lib/ableton";
import { $ } from 'bun';

const command = createCommand('debug-add-track')
    .description('Add a track to an Ableton project')
    .option('-p, --path <path>', 'Path to the Ableton project')
    .option('-n, --next-pointee-id <nextPointeeId>', 'Next pointee id')
    .action(async (flags, command) => {
        const _path = flags.path || await $`git rev-parse --show-toplevel`.text();

        const file = await readFile(_path).text();
        const parsed = parse(file);

        const project = await readProjectInfo(join(_path));
        if (!project || !project.places) {
            console.error('No project info found');
            process.exit(1);
        } else {
            const new_id = getLastTrackId(project.places) + 1;
            const new_track = updateTrack(parsed, Number(project.infos.nextPointeeId) ?? flags.nextPointeeId);
            const new_path = _path.replace(/-(.*?)-/, new_id);

            console.info('Writing to:', new_path);
            console.info('New Poitee: ', new_track.nextPointeeId);

            project.infos['nexPointeeId'] = new_track.nextPointeeId.toString();
            writeFile(join(dirname(_path), '../', 'project.json'), formatJSON(project))

            writeFile(new_path, build(new_track.track));
        }

    })
export default command;


