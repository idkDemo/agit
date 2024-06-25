import { Command } from "commander";
import { $ } from "bun";
import template from "./template.bundle.ts";
const command = new Command('init')
    .description('Initialize a new project')
    .action(async () => {
        await $`git init`;
        for (const [name, content] of Object.entries(template)) {
            if (name.split('/')[0] === 'hooks')
                await $`echo ${content} > .git/hooks/${name.split('/')[1]}`;
            else
                await $`echo ${content} > ${name}`;
        }
    })

export default command;