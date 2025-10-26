import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import {
  aiImageProcessing,
  generateRandomLetterString,
  generateSlug,
  showNonFatalReasons,
} from "gen-shared";

const imageConfig: ImageConfig = {
  aspectRatio: "16:9",
};

// save as png
const saveAsOriginal = false;

// save as webp
const saveAsWebp = true;
const webpLossless = false;
const webpQuality = 100;

// set the random value to each prompt for more randomized images
// reason: break the cache
const randomPrompt = true;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  project: process.env.GEMINI_PROJECT_ID,
});

// v2.5.0
function prompt(godName: string, godDescription: string) {
  return `
${godName} — divine portrait illustration in the world of Dungeon Crawl.

A digital painting, roguelike epic fantasy style, high detail, painterly texture, chiaroscuro lighting. 

Depict the god ${godName} according to this description:

"${godDescription}"

Scene should reflect their divine domain, powers, and temperament.

The composition must show the god’s presence as both symbol and myth — not just humanoid but embodying the essence of their magic (for example: Ashenzari bound in celestial chains, Dithmenos half-seen in shifting shadows, Fedhas surrounded by fungal growths).

Background should show the atmosphere of the Dungeon: vast cavernous darkness, fragments of ancient altars, runes, relics, and worshippers in trance. 

Use dramatic light to separate divine figure from darkness.

Color palette should match the nature of the god (holy → gold and white; chaos → prismatic distortion; decay → green and black; time → bronze and dusk tones, etc.).

Ultra-realistic rendering, mythic energy, visual storytelling.

There should be no inscriptions or signatures on the image.

Organic composition, hyper-detailed, concept art, artstation, fantasy illustration.

Aspect ratio: ${imageConfig.aspectRatio}

${randomPrompt ? `${generateRandomLetterString()}` : ""}
`;
}

const ORIGINAL_FILE = path.join(
  __dirname,
  "..",
  "..",
  "crawl-ref",
  "source",
  "dat",
  "descript",
  "gods.txt",
);
const DRAW_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
  "god",
);

async function main() {
  const godsText = fs.readFileSync(ORIGINAL_FILE, "utf8");
  const sections = godsText.split("%%%%");
  const gods: { name: string; description: string }[] = [];

  for (let i = 0; i < sections.length; ++i) {
    const section = sections[i].trim();
    if (!section) {
      continue;
    }

    const lines = section.split("\n");
    const name = lines[0].trim();
    if (
      name.startsWith("#") ||
      name.includes(" powers") ||
      name.includes(" wrath") ||
      name.includes(" extra")
    ) {
      continue;
    }

    const description = lines.slice(1).join("\n").trim();
    gods.push({ name, description });

    console.log(`${gods.length}: ${name}: ${description.slice(0, 60)}...`);
  }

  console.log(`Found ${gods.length} gods.\n`);

  if (!fs.existsSync(DRAW_DIR)) {
    fs.mkdirSync(DRAW_DIR, { recursive: true });
  }

  const nonFatalReasons: string[] = [];
  for (const god of gods) {
    const slugName = generateSlug(god.name, "");
    const fileName = `${slugName}.webp`;
    const file = path.join(DRAW_DIR, fileName);

    const r = await aiImageProcessing({
      name: god.name,
      originalDir: DRAW_DIR,
      drawDir: DRAW_DIR,
      file,
      generateImageOptions: {
        ai,
        imageConfig,
        name: god.name,
        description: god.description,
        originalImagePath: undefined,
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
