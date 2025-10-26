import * as fs from "node:fs";
import * as path from "node:path";
import type { GoogleGenAI, ImageConfig } from "@google/genai";

export interface GenerateImageOptions {
  ai: GoogleGenAI;
  model?: string;
  imageConfig?: ImageConfig;
  name: string;
  description: string;
  originalPath: string;
  promptBuilder: (name: string, description: string) => string;
}

export async function generateImage(
  options: GenerateImageOptions,
): Promise<Buffer | null> {
  const model = options.model ?? "gemini-2.5-flash-image";
  const fullPrompt = options.promptBuilder(options.name, options.description);

  const imageBuffer = fs.readFileSync(options.originalPath);
  const imageBase64 = imageBuffer.toString("base64");

  const ext = path.extname(options.originalPath).toLowerCase();
  let mimeType: string;
  if (ext === ".png") {
    mimeType = "image/png";
  } else if (ext === ".jpg" || ext === ".jpeg") {
    mimeType = "image/jpeg";
  } else {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  try {
    const response = await options.ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
      config: { imageConfig: options.imageConfig },
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
