import * as fs from "node:fs";
import * as path from "node:path";
import type { GoogleGenAI, ImageConfig } from "@google/genai";
import sharp from "sharp";
import { getRelativePath } from "./search";

export interface AiImageProcessing {
  // monster, item, god, etc.
  name: string;

  originalDir: string;
  drawDir: string;
  file: string;

  generateImageOptions: GenerateImageOptions;

  // config
  saveAsOriginal: boolean;
  saveAsWebp: boolean;
  webpLossless: boolean;
  webpQuality: number;

  // service
  nonFatalReasons: string[];
}

export type skippedOrProcessed = "skipped" | "processed" | "throwed";

export async function aiImageProcessing(
  options: AiImageProcessing,
): Promise<skippedOrProcessed> {
  const relativePath = getRelativePath(options.originalDir, options.file);
  const outputPath = path.join(options.drawDir, relativePath);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const webpPath = outputPath.replace(/\.[^/.]+$/, ".webp");
  if (fs.existsSync(outputPath) || fs.existsSync(webpPath)) {
    console.log(`Skipping ${relativePath}, already exists.`);
    return "skipped";
  }

  console.log(`Generating '${options.name}' with '${relativePath}'...`);
  try {
    const buffer = await generateImage(options.generateImageOptions);
    if (!buffer) {
      options.nonFatalReasons.push(relativePath);
      console.log(`\tSkipping ${relativePath}, non-fatal reason.`);
      return "skipped";
    }

    // save as original
    if (options.saveAsOriginal) {
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved ${outputPath}`);
    }

    // save as webp
    if (options.saveAsWebp) {
      await sharp(buffer)
        .webp({ lossless: options.webpLossless, quality: options.webpQuality })
        .toFile(webpPath);
      console.log(`Saved ${webpPath}`);
    }

    if (!options.saveAsOriginal && !options.saveAsWebp) {
      console.warn(`Skipping '${relativePath}': no output format specified.`);
    }
    return "processed";
  } catch (error) {
    console.error(`Error generating ${options.name}:`, error);
    return "throwed";
  }
}

export interface GenerateImageOptions {
  ai: GoogleGenAI;
  model?: string;
  imageConfig?: ImageConfig;
  name: string;
  description: string;
  // no path = no image
  originalImagePath?: string;
  promptBuilder: (name: string, description: string) => string;
}

export async function generateImage(
  options: GenerateImageOptions,
): Promise<Buffer | null> {
  const model = options.model ?? "gemini-2.5-flash-image";
  const fullPrompt = options.promptBuilder(options.name, options.description);

  let imageBase64: string | undefined;
  let mimeType: string | undefined;
  if (options.originalImagePath) {
    const imageBuffer = fs.readFileSync(options.originalImagePath);
    imageBase64 = imageBuffer.toString("base64");

    const ext = path.extname(options.originalImagePath).toLowerCase();
    if (ext === ".png") {
      mimeType = "image/png";
    } else if (ext === ".jpg" || ext === ".jpeg") {
      mimeType = "image/jpeg";
    } else {
      throw new Error(`Unsupported image format: ${ext}`);
    }
  }

  const c = {
    model,
    contents: {
      parts:
        imageBase64 && mimeType
          ? [
              { text: fullPrompt },
              {
                inlineData: { mimeType, data: imageBase64 },
              },
            ]
          : [{ text: fullPrompt }],
    },
    config: { imageConfig: options.imageConfig },
  };

  console.log(`${JSON.stringify(c, null, 2)}\n`);

  try {
    const response = await options.ai.models.generateContent(c);

    // get image
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        if (!imageData) {
          throw new Error("No image data");
        }

        return Buffer.from(imageData, "base64");
      }
    }

    // non-fatal image reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "IMAGE_SAFETY") {
      console.warn(`\tImage safety reason for ${options.name}.\n`, fullPrompt);
      return null;
    }

    // unrecognized error
    throw new Error("No image generated", { cause: JSON.stringify(response) });
  } catch (error) {
    console.error(`Error generating ${options.name}:`, error);
    throw new Error("No image generated", { cause: error });
  }
}
