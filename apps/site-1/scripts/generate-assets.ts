import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
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
      if (!existsSync(destPath)) {
        copyFileSync(srcPath, destPath);
        console.log(`Copied ${srcPath} to ${destPath}`);
      } else {
        console.log(`Skipped ${srcPath}, already exists`);
      }
    }
  }
}

console.log("Starting assets generation...");
copyDir(crawlRefDir, join(publicDir, crawlRefName));
copyDir(spritesDir, join(publicDir, spritesName));
console.log("Assets generation completed.");
