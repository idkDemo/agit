import { createCommand } from "commander";
import { formatJSON, readFile, readProjectInfo, writeFile } from "./lib/fs";
import { build, parse, formatXML } from './lib/parser';
import { getNode } from "./lib/utils";
import { getLastTrackId } from "./lib/ableton";
import { merge } from "./lib/merge";
import { join } from 'path';

const command = createCommand('merge-driver')
    .argument('<ours>', 'Ours file')
    .argument('<base>', 'Base file')
    .argument('<theirs>', 'Theirs file')
    .option('-ov, --overwrite', 'Overwrite the output file')
    .option('-d, --debug', 'Enable debug mode')
    .action(async (_oursPath, _basePath, _theirsPath, flags, command) => {
        const _overwrite = flags.overwrite || true;

        const project = readProjectInfo(process.cwd());
        if (!project) {
            console.error('No project info found');
            process.exit(1);
        }

        console.info('Merging files...');
        const _oursText = await readFile(_oursPath).text();
        const _baseText = await readFile(_basePath).text();
        const _theirsText = await readFile(_theirsPath).text();

        let _ours: Node | Document = parse(_oursText);
        let _base: Node | Document = parse(_baseText);
        let _theirs: Node | Document = parse(_theirsText);

        if (_ours.nodeType === _ours.DOCUMENT_NODE) _ours = _ours.firstChild!
        if (_base.nodeType === _base.DOCUMENT_NODE) _base = _base.firstChild!
        if (_theirs.nodeType === _theirs.DOCUMENT_NODE) _theirs = _theirs.firstChild!

        const type = _ours.nodeName;
        if (type !== 'AudioTrack' && type !== 'MidiTrack' && type !== 'MasterTrack' && type !== 'PreHearTrack' && type !== 'Scene' && type !== 'Locators') throw new Error('Invalid node type');
        const nexPointeeId = Number(project.infos.nextPointeeId);
        const nextTrackId = getLastTrackId(project.places) + 1;

        try {
            const res = merge({ ours: _ours, base: _base, theirs: _theirs, type, nexPointeeId, nextTrackId, places: project.places, overwrite: _overwrite });
            if (!res) throw new Error('Invalid merge result');
            writeFile(_oursPath, formatXML(build(_ours)));
            writeFile(join(project.output,
                type === 'AudioTrack' || type === 'MidiTrack' ? 'tracks/' : type.toLocaleLowerCase() +
                    type, '-' + String(nextTrackId) + '-.xml'
            ), build(res.ours));

            writeFile(join(process.cwd(), 'project.json'), formatJSON(project))
            console.info('Merged successfully');

            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }

    })
export default command;
