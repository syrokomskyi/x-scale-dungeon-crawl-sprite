import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import { config } from "dotenv";
import {
  aiImageProcessing,
  findImage,
  generateRandomLetterString,
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

// set the random value to each prompt for more randomized images
// reason: break the cache
const randomPrompt = true;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  project: process.env.GEMINI_PROJECT_ID,
});

// v5.5.1
function prompt(name: string, description: string) {
  return `
Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and description (see below). Keep the **same composition, silhouette, pose, and colours**, as well as the **relative layout of background elements**. This is a **dramatic, cinematic reinterpretation**, not a copy, not a pixel-art.

'${name}'
'${description}'

Render the creature (item, object, building, etc.), its armor, and surroundings with:
- **Realistic materials** (metal, bone, leather, fabric, stone, mist, etc.) in the colours of the provided image.
- **High-detail textures** and **volumetric lighting**.
- **Cinematic shadows** and **strong light direction** (like from a torch, spell, or moon).
- **Atmospheric depth**, with subtle fog, floating dust, and background blur.
- **Dynamic tension** and **epic scale feeling**, as if from a movie still.

Like a still frame from a dark fantasy film, captured with cinematic lighting and lens blur.

Depict the creature as a mythic abomination, awe-inspiring and terrifying, blending beauty and horror.

The atmosphere should feel **moody, ancient, and mythic**, combining realism with fantasy.
Do not try to make the creature biologically plausible — interpret it artistically, as a **dark mythic entity**.

**Style references:** 
Dark Souls / Elden Ring / Diablo IV / Magic: The Gathering / Greg Rutkowski / Magali Villeneuve / Wētā Workshop concept art.

Use the attached image as reference for **composition and silhouette**, but reinterpret every surface, light, and texture in **a fully rendered, realistic way**.

There should be no inscriptions or signatures on the image.

Use the name and description to understand the creature's appearance and behavior.

Aspect ratio: ${imageConfig.aspectRatio}.

${randomPrompt ? `${generateRandomLetterString()}` : ""}
`;
}

const MONSTERS_FILE = path.join(
  __dirname,
  "..",
  "..",
  "crawl-ref",
  "source",
  "dat",
  "descript",
  "monsters.txt",
);
const ORIGINAL_DIR = path.join(
  __dirname,
  "..",
  "..",
  "crawl-ref",
  "source",
  "rltiles",
  "mon",
);
const REDRAW_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
  "mon",
);

async function main() {
  const monstersText = fs.readFileSync(MONSTERS_FILE, "utf8");
  const sections = monstersText.split("%%%%");
  const monsters: { name: string; description: string }[] = [];

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
      name.includes(" extra") ||
      name.startsWith("__")
    ) {
      continue;
    }

    const description = lines.slice(1).join("\n").trim();
    if (description.startsWith("<") && description.endsWith(">")) {
      //console.log(`Skipping ${name}. This is same as ${description}.`);
      continue;
    }

    monsters.push({
      name: name.trim(),
      description: description,
    });

    const n = monsters.length;
    console.log(
      `${n} ${monsters[n - 1].name}\n\t${monsters[n - 1].description}\n`,
    );
  }

  console.log(`Found ${monsters.length} monsters.\n`);

  if (!fs.existsSync(REDRAW_DIR)) {
    fs.mkdirSync(REDRAW_DIR, { recursive: true });
  }

  const nonFatalReasons: string[] = [];
  for (const monster of monsters) {
    const file = findImage(ORIGINAL_DIR, monster.name);
    if (!file) {
      console.log(`No image found for ${monster.name}, skipping.`);
      continue;
    }

    const r = await aiImageProcessing({
      name: monster.name,
      originalDir: ORIGINAL_DIR,
      redrawDir: REDRAW_DIR,
      file,
      generateImageOptions: {
        ai,
        imageConfig,
        name: monster.name,
        description: monster.description,
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
    if (["skipped"].includes(r)) {
      continue;
    }

    if (["throwed"].includes(r)) {
      break;
    }

    // next monster

    // test
    break;
  }

  showNonFatalReasons(nonFatalReasons);
}

main().catch(console.error);
