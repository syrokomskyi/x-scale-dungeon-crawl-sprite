import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://syrokomskyi.github.io",
  base: import.meta.env.PROD ? "/x-scale-dungeon-crawl-sprite" : "/",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
