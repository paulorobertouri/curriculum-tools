import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const sourceDir = resolve(projectRoot, 'wwwroot');
const targetDir = resolve(projectRoot, '../paulorobertouri.github.io/curriculum-tools');

const main = async () => {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });

  const sourceEntries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of sourceEntries) {
    await cp(resolve(sourceDir, entry.name), resolve(targetDir, entry.name), {
      recursive: true,
    });
  }

  console.log(`Published ${sourceDir} -> ${targetDir}`);
};

await main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
