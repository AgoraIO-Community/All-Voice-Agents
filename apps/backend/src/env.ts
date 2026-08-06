import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const backendDirectory = resolve(sourceDirectory, "..");
const repoRoot = resolve(sourceDirectory, "../../..");

const envFiles = new Set([
  resolve(repoRoot, ".env"),
  resolve(backendDirectory, ".env"),
  resolve(process.cwd(), ".env"),
]);

for (const path of envFiles) {
  config({ path, quiet: true });
}

export const paths = {
  repoRoot,
};
