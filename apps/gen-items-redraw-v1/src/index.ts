import * as fs from "node:fs";
import * as path from "node:path";
import { VertexAI } from "@google-cloud/vertexai";

// Initialize VertexAI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || "your-project-id",
  location: "us-central1",
});

// Static prompt part
const STATIC_PROMPT =
  "Redraw this dungeon crawl sprite in a modern pixel art style";

// Directories
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

// Function to recursively get all image files
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

// Function to get relative path from original dir
function getRelativePath(filePath: string): string {
  return path.relative(ORIGINAL_DIR, filePath);
}

// Function to get folders and filename without extension
function getPromptParts(relativePath: string): string {
  const parsed = path.parse(relativePath);
  const folders = parsed.dir.split(path.sep).filter((f) => f);
  const name = parsed.name;
  return [...folders, name].join(", ");
}

// Function to generate image using Imagen
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

  // Use Imagen for image generation with conditioning
  const imagenModel = vertexAI.imageGeneration("imagen-3.0-generate-001");

  const request = {
    prompt: fullPrompt,
    image: {
      bytesBase64Encoded: imageBase64,
      mimeType,
    },
    // Other parameters like aspectRatio, etc. can be added
  };

  const response = await imagenModel.generateImage(request);
  // Assuming response has image data
  const generatedImageBase64 = response.generatedImages[0].bytesBase64Encoded;
  return Buffer.from(generatedImageBase64, "base64");
}

// Main function
async function main() {
  const imageFiles = getImageFiles(ORIGINAL_DIR);
  for (const file of imageFiles) {
    const relativePath = getRelativePath(file);
    const outputPath = path.join(REDRAW_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if already exists
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
