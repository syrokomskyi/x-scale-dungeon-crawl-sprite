import * as fs from "node:fs";
import * as path from "node:path";
import { GoogleGenAI, type ImageConfig } from "@google/genai";
import { config } from "dotenv";
import slug from "slug";

config({ path: ".env.local" });

const imageConfig: ImageConfig = {
  aspectRatio: "1:1",
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  project: process.env.GEMINI_PROJECT_ID,
});

// v5.5.0
function prompt(name: string, description: string) {
  return `
Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and description (see below). Keep the **same composition, silhouette, pose, and colours**, as well as the **relative layout of background elements**. This is a **dramatic, cinematic reinterpretation**, not a copy, not a pixel-art.

"${name}"
"${description}"

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
const DRAW_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
  "mon",
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

function findMonsterImage(monsterName: string): string | null {
  const slugName = slug(monsterName, { lower: true });
  const imageFiles = getImageFiles(ORIGINAL_DIR);
  for (const file of imageFiles) {
    const baseName = path.basename(file, path.extname(file));
    if (baseName === slugName) {
      return file;
    }
  }
  return null;
}

async function generateImage(
  monsterName: string,
  description: string,
  originalPath: string,
): Promise<Buffer> {
  const fullPrompt = prompt(monsterName, description);

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

  throw new Error("No image generated");
}

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
    monsters.push({
      name: name.trim(),
      description: description.replaceAll("\n", " ").trim(),
    });

    console.log(`${monsters.length}: ${name}: ${description.slice(0, 60)}...`);
  }

  console.log(`Found ${monsters.length} monsters.\n`);

  if (!fs.existsSync(DRAW_DIR)) {
    fs.mkdirSync(DRAW_DIR, { recursive: true });
  }

  for (const monster of monsters) {
    const originalPath = findMonsterImage(monster.name);
    if (!originalPath) {
      console.log(`No image found for ${monster.name}, skipping.`);
      continue;
    }

    const relativePath = path.relative(ORIGINAL_DIR, originalPath);
    const outputPath = path.join(DRAW_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (fs.existsSync(outputPath)) {
      console.log(`Skipping ${relativePath}, already exists.`);
      continue;
    }

    console.log(`Generating ${monster.name}...`);
    try {
      const buffer = await generateImage(
        monster.name,
        monster.description,
        originalPath,
      );
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved ${outputPath}`);
    } catch (error) {
      console.error(`Error generating ${monster.name}:`, error);
    }

    // test
    break;
  }
}

main().catch(console.error);
