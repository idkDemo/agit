import { Command } from 'commander';
import split from './split.script';
import format from './format.script';
import merge_driver from './merge-driver.script';
import combine from './combine.script';
import debug_xml from './debug.xml.script';
import debug_add_track from './debug.add-track'
import lfs_folder from './lfs/folder-agent/folder-agent'

import { $ } from 'bun';

const gitHelp = await $`git help`.quiet();
const program = new Command();
program
    .description('A git-wrapper with a few extra features that help you manage your ableton projects with ease !')
    .version('0.0.1')
    .addCommand(format)
    .addCommand(split)
    .addCommand(merge_driver)
    .addCommand(combine)
    .addCommand(debug_xml)
    .addCommand(debug_add_track)
    // //LFS Related commands
    .addCommand(lfs_folder)
    .addHelpText('afterAll', `
Git related commands: 
    ${gitHelp.stdout}
`)
    .showHelpAfterError();

program.on('command:*', async (operands) => {
    try {
        console.log(operands)
        if (operands[0] === 'help') return;
        await $`git ${operands.join(' ')}`;
    } catch (e) {
        console.error(e);
    }

})
await program.parseAsync(process.argv);
