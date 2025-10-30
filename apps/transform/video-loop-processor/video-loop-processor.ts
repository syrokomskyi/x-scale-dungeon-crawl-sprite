import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "sprites",
  "work",
  "redraw-v1",
);
const OUTPUT_DIR = SOURCE_DIR;
const VIDEO_EXTENSION = ".mp4";

/**
 * Recursively finds all MP4 files in the directory
 */
async function findAllVideos(
  dir: string,
  basePath: string = dir,
): Promise<Array<{ fullPath: string; relativePath: string }>> {
  const results: Array<{ fullPath: string; relativePath: string }> = [];

  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      const subResults = await findAllVideos(fullPath, basePath);
      results.push(...subResults);
    } else if (
      file.isFile() &&
      path.extname(file.name).toLowerCase() === VIDEO_EXTENSION
    ) {
      const relativePath = path.relative(basePath, fullPath);
      results.push({ fullPath, relativePath });
    }
  }

  return results;
}

/**
 * Creates a looped video (forward + reverse)
 * Removes audio and subtitles
 */
async function processVideo(
  inputPath: string,
  outputPathMp4: string,
  outputPathWebm: string,
): Promise<void> {
  console.log(`Processing: ${inputPath}`);

  const tempDir = path.join(OUTPUT_DIR, ".temp");
  await mkdir(tempDir, { recursive: true });

  const tempReversed = path.join(tempDir, "reversed.mp4");
  const tempConcatenated = path.join(tempDir, "concatenated.mp4");
  const concatListPath = path.join(tempDir, "concat_list.txt");

  console.error(`Temp dir: ${relative(SOURCE_DIR, tempDir)}`);
  console.error(`Temp reversed: ${relative(SOURCE_DIR, tempReversed)}`);
  console.error(`Temp concat: ${relative(SOURCE_DIR, tempConcatenated)}`);
  console.error(`Concat list: ${relative(SOURCE_DIR, concatListPath)}`);

  try {
    // Step 1: Create reversed version (without audio)
    console.log("  Creating reversed version...");
    const reverseProcess = spawn(
      "ffmpeg",
      [
        "-i",
        inputPath.replace(/\\/g, "/"),
        "-vf",
        "reverse",
        "-an",
        "-sn",
        tempReversed.replace(/\\/g, "/"),
      ],
      { stdio: "ignore" },
    );

    await new Promise<void>((resolve, reject) => {
      reverseProcess.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg reverse exited with code ${code}`));
      });
      reverseProcess.on("error", reject);
    });

    console.error("Reverse done");
    if (!fs.existsSync(tempReversed)) {
      throw new Error(
        `Reversed file not created: ${relative(SOURCE_DIR, tempReversed)}`,
      );
    }

    // Step 2: Create concat list
    const concatList = `file '${path.resolve(inputPath).replace(/\\/g, "/")}'\nfile '${path.resolve(tempReversed).replace(/\\/g, "/")}'`;
    fs.writeFileSync(concatListPath, concatList);

    console.log(`Concat list content:\n`, concatList);

    // Step 3: Concatenate original + reversed
    console.log("  Concatenating...");
    const concatProcess = spawn(
      "ffmpeg",
      [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatListPath.replace(/\\/g, "/"),
        "-c",
        "copy",
        tempConcatenated.replace(/\\/g, "/"),
      ],
      { stdio: "ignore" },
    );

    await new Promise<void>((resolve, reject) => {
      concatProcess.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg concat exited with code ${code}`));
      });
      concatProcess.on("error", reject);
    });

    console.error("Concat done");
    if (!fs.existsSync(tempConcatenated)) {
      throw new Error(
        `Concatenated file not created: ${relative(SOURCE_DIR, tempConcatenated)}`,
      );
    }

    // Step 4: Encode to MP4 with H.264 (high quality)
    // console.log("  Encoding to MP4 (H.264)...");
    // const mp4Process = spawn(
    //   "ffmpeg",
    //   [
    //     "-i",
    //     tempConcatenated.replace(/\\/g, "/"),
    //     "-c:v",
    //     "libx264",
    //     "-preset",
    //     "slow",
    //     "-crf",
    //     "18",
    //     "-pix_fmt",
    //     "yuv420p",
    //     "-movflags",
    //     "+faststart",
    //     "-an",
    //     "-sn",
    //     outputPathMp4.replace(/\\/g, "/"),
    //   ],
    //   { stdio: "ignore" },
    // );

    // await new Promise<void>((resolve, reject) => {
    //   mp4Process.on("close", (code) => {
    //     if (code === 0) resolve();
    //     else reject(new Error(`FFmpeg MP4 exited with code ${code}`));
    //   });
    //   mp4Process.on("error", reject);
    // });

    // console.error("MP4 encoding done");
    // console.error(`Output MP4 path: ${relative(SOURCE_DIR, outputPathMp4)}`);
    // if (!fs.existsSync(outputPathMp4)) {
    //   throw new Error(
    //     `Output MP4 file not created: ${relative(SOURCE_DIR, outputPathMp4)}`,
    //   );
    // }

    // Step 5: Encode to WebM with VP9 (high quality, faster than AV1)
    console.log("  Encoding to WebM (VP9)...");
    const webmProcess = spawn(
      "ffmpeg",
      [
        "-i",
        tempConcatenated.replace(/\\/g, "/"),
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "30",
        "-b:v",
        "0",
        "-quality",
        "good",
        "-speed",
        "2", // 0-4, higher = faster but lower quality
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-sn",
        outputPathWebm.replace(/\\/g, "/"),
      ],
      { stdio: "ignore" },
    );

    await new Promise<void>((resolve, reject) => {
      webmProcess.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg WebM exited with code ${code}`));
      });
      webmProcess.on("error", reject);
    });

    console.error("WebM encoding done");
    console.error(`Output WebM path: ${relative(SOURCE_DIR, outputPathWebm)}`);
    if (!fs.existsSync(outputPathWebm)) {
      throw new Error(
        `Output WebM file not created: ${relative(SOURCE_DIR, outputPathWebm)}`,
      );
    }

    console.log(
      `✓ Completed: ${path.basename(inputPath)} -> ${path.basename(outputPathMp4)}, ${path.basename(outputPathWebm)}`,
    );
  } catch (error) {
    console.error(
      `✗ Error processing ${relative(SOURCE_DIR, inputPath)}:`,
      error,
    );
    throw error;
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempReversed)) fs.unlinkSync(tempReversed);
      if (fs.existsSync(tempConcatenated)) fs.unlinkSync(tempConcatenated);
      if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
    } catch (cleanupError) {
      console.warn("Warning: failed to remove temporary files:", cleanupError);
    }
  }
}

async function main() {
  console.log("Start of video processing...");
  console.log(`Source directory: ${SOURCE_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  const videos = await findAllVideos(SOURCE_DIR);
  console.log(`\nFound video files: ${videos.length}`);

  if (videos.length === 0) {
    console.log("No video files found!");
    return;
  }

  for (let i = 0; i < videos.length; i++) {
    const { fullPath, relativePath } = videos[i];
    console.log(`\n[${i + 1}/${videos.length}]`);

    // Create a folder structure in the output directory
    const relativeDir = path.dirname(relativePath);
    const outputSubDir = path.join(OUTPUT_DIR, relativeDir);
    await mkdir(outputSubDir, { recursive: true });

    // Generating output file names
    const baseName = path.basename(relativePath, VIDEO_EXTENSION);
    if (baseName.endsWith("_loop")) {
      continue;
    }
    const outputPathMp4 = path.join(outputSubDir, `${baseName}_loop.mp4`);
    const outputPathWebm = path.join(outputSubDir, `${baseName}_loop.webm`);

    if (fs.existsSync(outputPathMp4) && fs.existsSync(outputPathWebm)) {
      console.log(
        `Skipping, outputs already exist: ${path.basename(outputPathMp4)}, ${path.basename(outputPathWebm)}`,
      );
      continue;
    }

    console.log(`Output MP4: ${outputPathMp4}`);
    console.log(`Output WebM: ${outputPathWebm}`);

    try {
      await processVideo(fullPath, outputPathMp4, outputPathWebm);
    } catch (error) {
      console.error(
        `Skipping file due to error: ${relative(SOURCE_DIR, fullPath)}`,
        error,
      );
    }
  }

  // Remove temporary directory
  const tempDir = path.join(OUTPUT_DIR, ".temp");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log("\n✓ All videos processed!");
}

main().catch((error) => {
  console.error("Critical error:", error);
  process.exit(1);
});
