import { $ } from "bun";
import fs from 'node:fs';
import { basename, join } from 'path';
import { writeFile } from "../lib/fs";

const _path = (await $`git rev-parse --show-toplevel`.text()).replaceAll('\n', '')
const path = join(_path, 'src', 'template')

let files = await Array.fromAsync(await $`ls -a ${path}`.lines())

const content: Record<string, string> = {};

while (files.length > 0) {
    const file = files.pop()
    if (!file) continue;
    if (basename(file).split('.')[1] === 'ts') continue;

    const stats = fs.statSync(`${path}/${file}`);

    if (stats.isDirectory()) {
        let sub: string[] = await Array.fromAsync(await $`ls -a ${path}/${file}`.lines())
        console.log(sub)
        files = [...files, ...sub.filter(s => s !== "").map(s => `${file}/${s}`)]
    } else {
        const name = basename(file).split('.')[0]
        const subDir = file.replace(_path, '')
        const fileContent = await $`cat ${path}/${file}`.text()
        content[name + subDir] = fileContent;
        console.log('Stored:', name + subDir)
    }
}
console.log('Writing to', join(_path, 'src', 'template.bundle.ts'))
writeFile(join(_path, 'src', 'template.bundle.ts').replaceAll('\n', ''), `export default ${JSON.stringify(content, null, 4)};`)