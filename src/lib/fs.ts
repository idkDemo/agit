import type { ProjectInfo } from './ableton';
import type { BunFile } from "bun";
import { readdir } from "fs/promises";
import { join } from "path";
import fs from "node:fs";

export function formatJSON(input: object) {
    return JSON.stringify(input, null, 2);
}

export function writeFile(path: string, data: Uint8Array | string | ArrayBuffer) {
    Bun.write(path, data);
}

export function readFile(path: string): BunFile {
    return Bun.file(path);
}

export function rmDir(path: string) {
    return fs.existsSync(path) && fs.rmdirSync(path, { recursive: true });
}

export function rmFile(path: string) {
    return fs.existsSync(path) && fs.rmSync(path);
}

export function mv(from: string, to: string) {
    return fs.renameSync(from, to);
}

export function findFileByExtention(directory: string, extention: string): { path: string | null, error: string | Error | null } {
    try {
        const file = fs
            .readdirSync(directory)
            .filter((file) => file.endsWith(extention))[0]
        if (!file) return { path: null, error: `No file with extention ${extention} found in ${directory}` };
        return {
            path: join(
                directory,
                file
            ), error: null
        };
    } catch (e) {
        return { path: null, error: e as Error };
    }
}

function isDirectory(path: string) {
    return fs.fstatSync(fs.openSync(path, "r")).isDirectory();
}

export function isAbletonProject(path: string) {
    return isDirectory(path) && findFileByExtention(path, ".als").error !== null;
}

export async function readDirRecursively(dir: string): Promise<string[]> {
    let files: string[] = [];

    async function readDirHelper(currentPath: string) {
        const entries = await readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = join(currentPath, entry.name);
            if (entry.isDirectory()) {
                await readDirHelper(entryPath);
            } else {
                files.push(entryPath);
            }
        }
    }

    await readDirHelper(dir);
    return files;
}

export function readProjectInfo(_path: string): ProjectInfo {
    return JSON.parse(fs.readFileSync(join(_path, "project.json"), "utf-8"));
}