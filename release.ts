import { $ } from 'bun';
import { writeFile } from './src/lib/fs';
import { join } from 'path';

const _path = await $`git rev-parse --show-toplevel`.text();
const path = _path.replaceAll('\n', '');

await $`bun ${join(path, 'src', 'template', 'bundle.ts')}`;
await $`bun ${join(path, 'build.ts')}`;

const file = await Bun.file(join(path, 'agit.json')).text();
const app = await Bun.file(join(path, 'release', 'agit.exe')).arrayBuffer();

const appInfo = JSON.parse(file);
const hash = new Bun.CryptoHasher('md5').update(app).digest('hex');
appInfo.hash = hash;

writeFile(join(path, 'agit.json'), JSON.stringify(appInfo, null, 2));