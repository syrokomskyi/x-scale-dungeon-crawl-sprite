import * as fs from "node:fs";
import * as path from "node:path";
import { generateSlug } from "./tool";

export function getImageFiles(dir: string): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getImageFiles(fullPath));
    } else if (/\.(png|jpg|jpeg)$/i.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function findImage(dir: string, name: string): string | null {
  const pname = name.toLowerCase().replace(/^the\s+/, "");
  const slugName = generateSlug(pname, "");
  const imageFiles = getImageFiles(dir);
  for (const file of imageFiles) {
    const baseName = path.basename(file, path.extname(file));
    if (baseName === slugName) {
      return file;
    }
  }

  console.warn(`No image found for ${name} -> ${pname} -> ${slugName}.`);

  return null;
}
