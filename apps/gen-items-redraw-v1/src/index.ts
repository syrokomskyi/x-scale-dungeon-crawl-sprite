import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const STATIC_PROMPT =
  "Redraw this dungeon crawl sprite in a modern pixel art style.";

const ORIGINAL_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "original",
  "item",
);
const REDRAW_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
  "item",
);

function getImageFiles(dir: string): string[] {
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

function getRelativePath(filePath: string): string {
  return path.relative(ORIGINAL_DIR, filePath);
}

// Get folders and filename without extension.
function getPromptParts(relativePath: string): string {
  const parsed = path.parse(relativePath);
  const folders = parsed.dir.split(path.sep).filter((f) => f);
  const name = parsed.name;

  return [...folders, name].join(", ");
}

async function generateImage(originalPath: string): Promise<Buffer> {
  const relativePath = getRelativePath(originalPath);
  const promptParts = getPromptParts(relativePath);
  const fullPrompt = `${STATIC_PROMPT}: ${promptParts}`;

  // Read image as base64
  const imageBuffer = fs.readFileSync(originalPath);
  const imageBase64 = imageBuffer.toString("base64");

  // Determine mimeType
  const ext = path.extname(originalPath).toLowerCase();
  let mimeType: string;
  if (ext === ".png") {
    mimeType = "image/png";
  } else if (ext === ".jpg" || ext === ".jpeg") {
    mimeType = "image/jpeg";
  } else {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: fullPrompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      if (!imageData) {
        throw new Error("No image data");
      }

      return Buffer.from(imageData, "base64");
    }
  }

  throw new Error("No image generated");
}

async function main() {
  const imageFiles = getImageFiles(ORIGINAL_DIR);
  for (const file of imageFiles) {
    const relativePath = getRelativePath(file);
    const outputPath = path.join(REDRAW_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (fs.existsSync(outputPath)) {
      console.log(`Skipping ${relativePath}, already exists.`);
      continue;
    }

    console.log(`Generating ${relativePath}...`);
    try {
      const generatedBuffer = await generateImage(file);
      fs.writeFileSync(outputPath, generatedBuffer);
      console.log(`Saved ${relativePath}`);
    } catch (error) {
      console.error(`Error generating ${relativePath}:`, error);
    }
  }
}

main().catch(console.error);
