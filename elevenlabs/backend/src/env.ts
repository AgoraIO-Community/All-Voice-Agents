import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(sourceDirectory, "../../..");

const envFiles = [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")];

for (const path of envFiles) {
  config({ override: false, path, quiet: true });
}

export const paths = {
  repoRoot,
};
