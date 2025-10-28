/** biome-ignore-all lint/suspicious/noExplicitAny: File read specific */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
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

const exclude: string[] = ["README.md", "mon+v2"];

const crawlRefName: string = basename(crawlRefDir);
const spritesName: string = basename(spritesDir);

let totalFiles = 0;
let copiedFiles = 0;
let skippedFiles = 0;

function buildFilters(dir: string): Record<string, any> {
  const result: Record<string, any> = {};
  const items = readdirSync(dir);
  for (const item of items) {
    const itemPath = join(dir, item);
    if (statSync(itemPath).isDirectory()) {
      result[item] = buildFilters(itemPath);
    }
  }

  return result;
}

function getAllFiles(
  dir: string,
  ext: string,
  relativeTo: string = "",
): string[] {
  const result: string[] = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const relPath = relativeTo ? join(relativeTo, item) : item;
    if (statSync(fullPath).isDirectory()) {
      result.push(...getAllFiles(fullPath, ext, relPath));
    } else if (item.endsWith(ext)) {
      result.push(relPath);
    }
  }

  return result;
}

function parseDescriptions(): Map<string, string> {
  const descriptions = new Map<string, string>();
  const files = [
    join(crawlRefDir, "source", "dat", "descript", "gods.txt"),
    join(crawlRefDir, "source", "dat", "descript", "monsters.txt"),
  ];

  for (const file of files) {
    if (!existsSync(file)) {
      console.warn(`Description file not found: ${file}`);
      continue;
    }

    const content = readFileSync(file, "utf-8");
    const sections = content.split(/%%%%/);
    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const lines = trimmed.split("\n");
      const name = lines[0].trim();
      const note = lines.slice(2).join("\n").trim(); // Skip name and blank line
      if (name && note) {
        descriptions.set(name.toLowerCase(), note);
      }
    }
  }

  return descriptions;
}

function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const items: string[] = readdirSync(src);
  for (const item of items) {
    const destPath: string = join(dest, item);
    if (exclude.includes(item)) {
      console.log(`Skipped ${relative(publicDir, destPath)}, excluded`);
      continue;
    }

    const srcPath: string = join(src, item);
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

// crawl-ref (original)
copyDir(crawlRefDir, join(publicDir, crawlRefName));

// sprites (redraw)
copyDir(spritesDir, join(publicDir, spritesName));

// filters.json
console.log("\nGenerating filters.json...\n");
const filters = buildFilters(join(publicDir, "redraw-v1"));
writeFileSync(
  join(publicDir, "data", "filters.json"),
  JSON.stringify(filters, null, 2),
);
console.log("filters.json generated.");

// images.json
console.log("\nGenerating images.json...\n");
const descriptions = parseDescriptions();
const redrawV1Dir = join(publicDir, "redraw-v1");
const crawlRefDirPublic = join(publicDir, "crawl-ref");
const guiDir = join(crawlRefDirPublic, "source", "rltiles", "gui");

const webpFiles = getAllFiles(redrawV1Dir, ".webp").map((p) =>
  p.replace(/\\/g, "/"),
);
const pngFilesInGui = getAllFiles(guiDir, ".png").map((p) =>
  p.replace(/\\/g, "/"),
);

const images: Array<{
  path: string;
  name: string;
  note: string;
  icon: string;
}> = [];

for (const webpPath of webpFiles) {
  const path = `redraw-v1/${webpPath}`;
  const basenameNoExt = basename(webpPath, ".webp");
  if (/\d$/.test(basenameNoExt)) {
    continue;
  }
  const name = basenameNoExt
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const note = descriptions.get(name.toLowerCase()) ?? "";

  // find icon
  const iconPath = webpPath.replace(".webp", ".png");
  let icon = "";
  if (existsSync(join(crawlRefDirPublic, "source", "rltiles", iconPath))) {
    icon = `crawl-ref/source/rltiles/${iconPath}`.replace(/\\/g, "/");
  } else {
    const candidate = pngFilesInGui.find((png) =>
      basename(png).startsWith(`${basenameNoExt}_`),
    );
    if (candidate) {
      icon = `crawl-ref/source/rltiles/gui/${candidate}`.replace(/\\/g, "/");
    }
  }

  images.push({ path, name, note, icon });
}

images.sort((a, b) => a.path.localeCompare(b.path));

writeFileSync(
  join(publicDir, "data", "images.json"),
  JSON.stringify(images, null, 2),
);
console.log("images.json generated.");
console.log(`\nTotal files: ${totalFiles}`);
console.log(`Copied: ${copiedFiles}`);
console.log(`Skipped: ${skippedFiles}`);

console.log("\nAssets generation completed.\n");
