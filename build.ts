import { $ } from "bun";

await $`bun build --compile --target=bun-windows-x64 ./src/cli.ts --outfile ./release/agit`