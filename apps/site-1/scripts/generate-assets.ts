import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const publicDir: string = join(__dirname, "..", "public");
const crawlRefDir: string = join(__dirname, "..", "..", "crawl-ref");
const spritesDir: string = join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
);

const crawlRefName: string = basename(crawlRefDir);
const spritesName: string = basename(spritesDir);

let totalFiles = 0;
let copiedFiles = 0;
let skippedFiles = 0;

function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const items: string[] = readdirSync(src);
  for (const item of items) {
    const srcPath: string = join(src, item);
    const destPath: string = join(dest, item);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      totalFiles++;
      if (!existsSync(destPath)) {
        copyFileSync(srcPath, destPath);
        copiedFiles++;
        console.log(`Copied ${relative(publicDir, destPath)}`);
      } else {
        skippedFiles++;
        console.log(`Skipped ${relative(publicDir, destPath)}, already exists`);
      }
    }
  }
}

console.log("\nStarting assets generation...\n");

copyDir(crawlRefDir, join(publicDir, crawlRefName));
copyDir(spritesDir, join(publicDir, spritesName));

console.log(`\nTotal files: ${totalFiles}`);
console.log(`Copied: ${copiedFiles}`);
console.log(`Skipped: ${skippedFiles}`);

console.log("\nAssets generation completed.\n");
