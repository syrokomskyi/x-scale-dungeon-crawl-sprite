import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import { config } from "dotenv";
import {
  aiImageProcessing,
  generateRandomLetterString,
  getImageFiles,
  getRelativePath,
  showNonFatalReasons,
} from "gen-shared";

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
const DRAW_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
  "item",
);

async function main() {
  const imageFiles = getImageFiles(ORIGINAL_DIR);
  const nonFatalReasons: string[] = [];
  for (const file of imageFiles) {
    const relativePath = getRelativePath(ORIGINAL_DIR, file);
    const itemName = relativePath.replace(/[\\/_]/g, " ");

    const r = await aiImageProcessing({
      name: itemName,
      originalDir: ORIGINAL_DIR,
      drawDir: DRAW_DIR,
      file,
      generateImageOptions: {
        ai,
        imageConfig,
        name: itemName,
        description: "",
        originalImagePath: file,
        promptBuilder: prompt,
      },
      // config
      saveAsOriginal,
      saveAsWebp,
      webpLossless,
      webpQuality,
      // service
      nonFatalReasons,
    });
    if (r === "skipped") {
      continue;
    }

    if (r === "throwed") {
      break;
    }

    // next item

    // test
    break;
  }

  showNonFatalReasons(nonFatalReasons);
}

main().catch(console.error);
