/** biome-ignore-all lint/suspicious/noExplicitAny: File specific */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

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

const pathToSourceBg: string = join(spritesDir, "branch");
const pathToBg: string = join(publicDir, "redraw-v1", "branch");

const excludeFromShow: string[] = ["branch", "README.md", "mon+v2"];

function isVideoToExclude(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith(".mp4") || lowerFilename.endsWith(".webm")) {
    const extIndex = lowerFilename.lastIndexOf(".");
    const nameWithoutExt = filename.slice(0, extIndex);
    return !nameWithoutExt.endsWith("_loop");
  }

  return false;
}

const crawlRefName: string = basename(crawlRefDir);
const spritesName: string = basename(spritesDir);

let totalFiles = 0;
let copiedFiles = 0;
let skippedFiles = 0;
let removedFiles = 0;

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
    if (excludeFromShow.includes(item) || isVideoToExclude(item)) {
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
        // console.log(`Copied ${relative(publicDir, destPath)}`);
      } else {
        skippedFiles++;
        // console.log(`Skipped ${relative(publicDir, destPath)}, already exists`);
      }
    }
  }
}

console.log("\nStarting assets generation...\n");

// remove pathToBg
console.log(`Removing ${relative(publicDir, pathToBg)} directory...`);
if (existsSync(pathToBg)) {
  rmSync(pathToBg, { recursive: true, force: true });
}
console.log(`Removed ${relative(publicDir, pathToBg)} directory.`);

// crawl-ref (original, fully)
console.log(`Copying crawl-ref directory...`);
const crawlRefDest = join(publicDir, crawlRefName);
if (existsSync(crawlRefDest)) {
  rmSync(crawlRefDest, { recursive: true, force: true });
}
cpSync(crawlRefDir, crawlRefDest, { recursive: true });
console.log(`Copied crawl-ref directory.`);

// sprites (redraw, partially)
console.log(`Copying sprites directory...`);
copyDir(spritesDir, join(publicDir, spritesName));
console.log(`Copied sprites directory.`);

// filters.json
console.log("\nGenerating filters.json...\n");
const filters = buildFilters(join(publicDir, "redraw-v1"));
mkdirSync(join(publicDir, "data"), { recursive: true });
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
const pngFilesInGui = existsSync(guiDir)
  ? getAllFiles(guiDir, ".png").map((p) => p.replace(/\\/g, "/"))
  : [];

const images: Array<{
  path: string;
  pathWidth: number;
  pathHeight: number;
  name: string;
  note: string;
  icon: string;
  video: string;
}> = [];

(async () => {
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

    // find a first video
    const videoExtensions = [".webm", ".mp4"];
    let video = "";
    for (const ext of videoExtensions) {
      const videoPath = webpPath.replace(".webp", ext);
      if (existsSync(join(redrawV1Dir, videoPath))) {
        video = `redraw-v1/${videoPath}`.replace(/\\/g, "/");
        break;
      }
    }

    // get dimensions
    try {
      const metadata = await sharp(join(redrawV1Dir, webpPath)).metadata();
      if (!metadata.width || !metadata.height) {
        console.warn(`Could not get dimensions for ${webpPath}`);
        continue;
      }
      images.push({
        path,
        pathWidth: metadata.width,
        pathHeight: metadata.height,
        name,
        note,
        icon,
        video,
      });
    } catch (error) {
      console.warn(`Error getting dimensions for ${webpPath}: ${error}`);
    }
  }

  images.sort((a, b) => a.path.localeCompare(b.path));

  writeFileSync(
    join(publicDir, "data", "images.json"),
    JSON.stringify(images, null, 2),
  );
  console.log("images.json generated.");

  // Remove unused PNG files from crawl-ref
  console.log("\nRemoving unused PNG files from crawl-ref...\n");
  const usedIcons = new Set<string>();
  for (const img of images) {
    if (img.icon) {
      usedIcons.add(join(publicDir, img.icon));
    }
  }

  const allPngFiles = getAllFiles(crawlRefDirPublic, ".png");
  for (const pngPath of allPngFiles) {
    const fullPath = join(crawlRefDirPublic, pngPath);
    if (!usedIcons.has(fullPath)) {
      unlinkSync(fullPath);
      removedFiles++;
      // console.log(`Removed ${relative(publicDir, fullPath)}`);
    }
  }
  console.log(`Removed ${removedFiles} unused PNG files.`);

  // Copy sprites for background
  console.log("\nCopying sprites for background...\n");
  copyDir(pathToSourceBg, pathToBg);
  console.log("Sprites for background copied.\n");

  // backgrounds.json
  console.log("\nGenerating backgrounds.json...\n");
  const backgroundFiles = getAllFiles(
    pathToBg,
    ".webp",
    "redraw-v1/branch",
  ).map((p) => `/${p.split("\\").join("/")}`);
  backgroundFiles.sort();
  writeFileSync(
    join(publicDir, "data", "backgrounds.json"),
    JSON.stringify(backgroundFiles, null, 2),
  );
  console.log("backgrounds.json generated.\n");

  console.log(`\nTotal files: ${totalFiles}`);
  console.log(`Copied: ${copiedFiles}`);
  console.log(`Skipped: ${skippedFiles}`);
  console.log(`Removed: ${removedFiles}`);

  console.log("\nAssets generation completed.\n");
})();
