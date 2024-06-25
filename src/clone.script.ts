import { Command } from "commander";
import { $ } from "bun";
import template from "./template.bundle.ts";
const command = new Command('clone')
    .description('Clone a project')
    .action(async (args) => {
        await $`git clone ${args}`;
        for (const [name, content] of Object.entries(template)) {
            if (name.split('/')[0] === 'hooks')
                await $`echo ${content} > .git/hooks/${name.split('/')[1]}`;
            else
                await $`echo ${content} > ${name}`;
        }
    })

export default command;