import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://syrokomskyi.github.io",
  base: import.meta.env.PROD ? "/x-scale-dungeon-crawl-sprite" : "/",
  vite: {
    plugins: [tailwindcss()],
  },
});
