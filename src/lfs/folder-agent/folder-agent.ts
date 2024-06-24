import { $ } from "bun";
import Path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { realpath, exists, mkdir } from 'fs/promises'
import progress from 'progress-stream';
import type { Event, UploadEvent, DownloadEvent, TransferError, FolderPath, FilePath } from './types';
import { createCommand } from "commander";

const command = createCommand('folder-agent')
    .description('Folder agent for git-lfs')
    .option('-p, --path <path>', 'Path to the git repository')
    .action(async (flags, command) => {
        const gitDir = await handle(getGirDir());
        const tempDir = await handle(getTempDir());
        const lfsDir = await handle(getLfsDir());
        if (!gitDir || !tempDir || !lfsDir) throw process.exit(1);

        const sender = Bun.stdout.writer();
        function send(event: Event) {
            sender.write(JSON.stringify(event));
        }
        async function entry() {
            await readStdInLineByLine();
        }



        async function readStdInLineByLine() {
            let buffer = '';
            const reader = Bun.stdin.stream().getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += new TextDecoder().decode(value);
                let eolIndex;
                while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                    const line = buffer.slice(0, eolIndex);
                    buffer = buffer.slice(eolIndex + 1);
                    processLine(line);
                }
            }
        }

        function processLine(line: string) {
            const writer = Bun.stdout.writer();

            const event = JSON.parse(line) as Event;
            try {
                switch (event.event) {
                    case 'upload':
                        upload(event);
                        break;
                    case 'download':
                        download(event);
                        break;
                    case 'complete':
                        break;
                    case 'progress':
                        break;
                    case 'terminate':
                        break;
                }
            } catch (e) {
                console.error(e);
                writer.write(JSON.stringify({ event: 'terminate' }));
                writer.end();
            }
        }

        function copyFile(source: { path: string, size: number }, target: string) {
            const size = source.size

            if (!exist(target)) throw new Error('');
            if (!exist(source.path)) throw new Error('');

            const reader = createReadStream(source.path);
            const writer = createWriteStream(target);
            const str = progress({
                length: size,
            });

            str.on('progress', (progress) => {
                send({ event: 'progress', oid: source.path, bytesSoFar: progress.transferred, bytesSinceLast: progress.delta })
            });

            reader.pipe(writer);
            reader.pipe(str);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        }

        async function upload(event: UploadEvent) {
            const path = event.path;
            const size = event.size;
            const oid = event.oid;
            if (!tempDir) return process.exit(1);
            if (!lfsDir) return process.exit(1);

            const target = getStoragePath(lfsDir, oid);
            const res = handle(copyFile({ path, size }, target), oid, { code: 2, message: 'Failed to copy file' });
            if (!res) return;

            send({ event: 'complete', oid, path: target });
        }

        async function download(event: DownloadEvent) {
            const size = event.size;
            const oid = event.oid;
            if (!tempDir) return process.exit(1);
            if (!lfsDir) return process.exit(1);

            const path = getStoragePath(lfsDir, event.oid);
            if (!exist(path)) return send({ event: 'complete', oid, error: { code: 3, message: 'File not found' } });

            const target = Path.join(tempDir, oid);

            const res = handle(copyFile({ path, size }, target), oid, { code: 4, message: 'Failed to copy file' });
            if (!res) return;

            send({ event: 'complete', oid, path: target });
        }

        function getStoragePath(folder: FolderPath, oid: string): FilePath {
            return Path.join(folder, oid.slice(0, 2), oid.slice(2, 4), oid);
        }
        async function getGirDir(): Promise<FolderPath> {
            const { stdout, exitCode } = await $`git rev-parse --git-dir`.nothrow().quiet();
            if (exitCode !== 0) {
                throw new Error('Not a git repository');
            }
            return stdout.toString().trim();
        }

        async function getLfsDir() {
            const path = command.opts().path
            const folder = await evalPath(path)
            if (!exist(folder)) await mkdir(folder, { recursive: true });
            return folder;
        }

        async function getTempDir(): Promise<FolderPath> {
            if (!gitDir) return process.exit(1);

            const tempDir = Path.join(gitDir, 'lfs', 'tmp');
            if (!exist(tempDir)) await mkdir(tempDir, { recursive: true });
            return Path.join(gitDir, 'lfs', 'tmp') as FolderPath;
        }

        async function evalPath(path: FilePath | FolderPath) {
            return realpath(path)
        }

        async function exist(path: FilePath | FolderPath) {
            try {
                await evalPath(path);
                return await exists(path);
            } catch (e) {
                return false;
            }
        }

        function handle<ErrorProps extends TransferError | null, Data>(promise: Promise<Data>, oid?: string, errorProps?: ErrorProps): Promise<Data | null> {
            return promise.then<Data | null>(data => {
                return data;
            }).catch(err => {
                err ? err.message = `${errorProps?.message} Details: ${err.message}` : null
                err = errorProps ?? { code: 1, message: err.message }
                if (oid) send({ event: 'complete', oid: oid, error: err })
                return null;
            });
        };
        entry();
    })
export default command;


