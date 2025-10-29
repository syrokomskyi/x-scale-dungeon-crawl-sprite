# Tool for Create a Fan Gallery | Demo

A static website showcasing images from the `redraw-v1` folder.

## Setup

1. Install dependencies: `pnpm install`
2. Develop locally: `pnpm dev`
3. Build for production: `pnpm build`
4. Preview build: `pnpm preview`

## Updating Images

1. Add new webp images to `public/redraw-v1/`
2. Update `public/data/images.json` with new entries:

   ```json
   {
     "path": "redraw-v1/new-image.webp",
     "name": "New Image Name",
     "note": "Description or note"
   }
   ```

3. Rebuild the site: `pnpm build`

## Deployment

The `dist/` folder contains the static site ready for deployment to GitHub Pages or any static host.
