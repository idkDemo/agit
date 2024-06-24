import { updateTrack } from "./update-track";
import { getNodeWithAttribute } from "./utils";

export function merge(opts: {
    ours: Node,
    base: Node,
    theirs: Node,
    type: 'AudioTrack' | 'MidiTrack' | 'MasterTrack' | 'Locators' | 'Scene' | 'PreHearTrack',
    nexPointeeId: number,
    nextTrackId: number,
    places: string[]
    overwrite: boolean
}) {
    switch (opts.type) {
        case 'AudioTrack' || 'MidiTrack':
            const res = updateTrack(opts.ours, opts.nexPointeeId);
            if (!res) throw new Error('Invalid update track');
            opts.ours = res.track;
            opts.nexPointeeId = res.nextPointeeId;

            const node = getNodeWithAttribute(opts.ours, opts.type, 'Id');
            if (!node) throw new Error(`Invalid node: ${opts.type}`);
            const old_id = node.getAttribute('Id');
            if (!old_id) throw new Error(`Invalid id: ${old_id}`);
            node.setAttribute('Id', opts.nextTrackId.toString());

            const oursPlace = opts.places.findIndex((a) => `tracks/${opts.type}-${old_id}-.xml`);
            opts.places.splice(oursPlace, 1, `tracks/${opts.type}-${opts.nextTrackId}-.xml`);

            break;
        case 'MasterTrack':
            if (!opts.overwrite)
                console.info('Conflict in MasterTrack please resolve manually');
            opts.ours = opts.theirs;
            break;
        case 'Locators':
            if (!opts.overwrite)
                console.info('Conflict in Locators please resolve manually');
            opts.ours = opts.theirs;
            break;
        case 'Scene':
            if (!opts.overwrite)
                console.info('Conflict in Scenes please resolve manually');
            opts.ours = opts.theirs;
            break;
        case 'PreHearTrack':
            if (!opts.overwrite)
                console.info('Conflict in PreHearTrack please resolve manually');
            opts.ours = opts.theirs;
            break;
    }

    return { ours: opts.ours, base: opts.base, theirs: opts.theirs, type: opts.type, nexPointeeId: opts.nexPointeeId, nextTrackId: opts.nextTrackId, places: opts.places }
}