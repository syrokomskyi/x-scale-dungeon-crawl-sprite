import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import { config } from "dotenv";
import { generateSlug } from "gen-shared";
import { generateImage } from "gen-shared/src/gen";
import { generateRandomLetterString } from "gen-shared/src/tool";
import sharp from "sharp";

config({ path: ".env.local" });

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
    const fileName = `${slugName}.png`;

    const relativePath = path.relative(DRAW_DIR, fileName);
    const outputPath = path.join(DRAW_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const webpPath = outputPath.replace(/\.[^/.]+$/, ".webp");
    if (fs.existsSync(outputPath) || fs.existsSync(webpPath)) {
      console.log(`Skipping ${relativePath}, already exists.`);
      continue;
    }

    console.log(`Generating '${god.name}'...`);
    try {
      const buffer = await generateImage({
        ai,
        imageConfig,
        name: god.name,
        description: god.description,
        promptBuilder: prompt,
      });
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
      console.error(`Error generating ${god.name}:`, error);
    }

    // test
    //break;
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
