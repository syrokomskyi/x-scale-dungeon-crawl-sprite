import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/x-scale-dungeon-crawl-sprite/" : "",
  integrations: [tailwind()],
}));
