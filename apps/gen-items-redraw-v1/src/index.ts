import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import { config } from "dotenv";
import { getImageFiles, getPromptParts, getRelativePath } from "gen-shared";
import { generateRandomLetterString } from "gen-shared/src/tool";
import sharp from "sharp";

config({ path: ".env.local" });

const imageConfig: ImageConfig = {
  aspectRatio: "1:1",
};

// save as png
const saveAsOriginal = false;

// save as webp
const saveAsWebp = true;
const webpLossless = false;
const webpQuality = 100;

const randomPrompt = true;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  project: process.env.GEMINI_PROJECT_ID,
});

// v1.7.0
function prompt(description: string) {
  return `
Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and this description: "${description}"

The design must preserve the recognizable silhouette and color palette of the original art, but reimagine it as a richly textured artefact from a dark fantasy world, inspired by Dungeon Crawl and alchemical manuscripts. This is a **dramatic, cinematic detailed reinterpretation**, that feels ancient, mystical, and handcrafted, not a copy, not a pixel-art.

Render it with exquisite material detail — tarnished metal, aged leather, cracked gemstones, runes etched into surfaces, faint glow of ancient magic.

Background: neutral parchment or dark void with golden alchemical sigils and subtle vignette, so the focus stays on the object.

Lighting: candlelight or arcane glow, emphasizing texture and mystical depth.

Style: gothic renaissance + roguelike realism + H.R. Giger + Zdzisław Beksiński + medieval manuscript illumination. No inscriptions.

Medium: digital painting with painterly brushstrokes and fine engraving detail, as if restored from a forgotten grimoire.

Aspect ratio: ${imageConfig.aspectRatio}, centered composition.

One artefact only, hyper-detailed, concept art, artstation, fantasy illustration.

There should be no inscriptions or signatures on the image.

Optional additions:
– add faint hovering glyphs, energy particles, or reflections hinting at the item’s magical nature
– for cursed or demonic items, add shadow halos, black fire, or crimson smoke
– for holy or divine items, add gold dust light and sacred geometry symbols

${randomPrompt ? `${generateRandomLetterString()}` : ""}
`;
}

const ORIGINAL_DIR = path.join(
  __dirname,
  "..",
  "..",
  "crawl-ref",
  "source",
  "rltiles",
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

async function generateImage(originalPath: string): Promise<Buffer | null> {
  const relativePath = getRelativePath(ORIGINAL_DIR, originalPath);
  const promptParts = getPromptParts(relativePath);
  const fullPrompt = prompt(promptParts);

  const imageBuffer = fs.readFileSync(originalPath);
  const imageBase64 = imageBuffer.toString("base64");

  const ext = path.extname(originalPath).toLowerCase();
  let mimeType: string;
  if (ext === ".png") {
    mimeType = "image/png";
  } else if (ext === ".jpg" || ext === ".jpeg") {
    mimeType = "image/jpeg";
  } else {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
      config: { imageConfig },
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
      console.warn(`\tImage safety reason for ${name}.\n`, fullPrompt);
      return null;
    }

    throw new Error("No image generated", { cause: JSON.stringify(response) });
  } catch (error) {
    console.error(`Error generating ${name}:`, error);
    throw new Error("No image generated", { cause: error });
  }
}

async function main() {
  const imageFiles = getImageFiles(ORIGINAL_DIR);
  const nonFatalReasons: string[] = [];
  for (const file of imageFiles) {
    const relativePath = getRelativePath(ORIGINAL_DIR, file);
    const outputPath = path.join(REDRAW_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const webpPath = outputPath.replace(/\.[^/.]+$/, ".webp");
    if (fs.existsSync(outputPath) || fs.existsSync(webpPath)) {
      console.log(`Skipping ${relativePath}, already exists.`);
      continue;
    }

    console.log(`Generating '${relativePath}'...`);
    try {
      const buffer = await generateImage(file);

      if (!buffer) {
        nonFatalReasons.push(relativePath);
        console.log(`\tSkipping ${relativePath}, non-fatal reason.`);
        continue;
      }

      // save as original
      if (saveAsOriginal) {
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved ${outputPath}`);
      }

      // save as webp
      if (saveAsWebp) {
        await sharp(buffer)
          .webp({ lossless: webpLossless, quality: webpQuality })
          .toFile(webpPath);
        console.log(`Saved ${webpPath}`);
      }

      if (!saveAsOriginal && !saveAsWebp) {
        console.warn(`Skipping ${relativePath}: no output format specified.`);
      }
    } catch (error) {
      console.error(`Error generating ${relativePath}:`, error);
    }

    // test
    break;
  }

  if (nonFatalReasons.length > 0) {
    console.log(
      `\nSkipped ${nonFatalReasons.length} generations due to non-fatal reasons.`,
    );
    for (const relativePath of nonFatalReasons) {
      console.log(`\t${relativePath}`);
    }
  }
}

main().catch(console.error);
