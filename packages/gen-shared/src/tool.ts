import slug from "slug";

// ! Copied from `core-share` package (webgogol).
// Thanks https://github.com/Trott/slug
export function generateSlug(title: string, suffix?: string): string {
  slug.extend({
    " ": "_",
    "-": "_",
  } as const);

  let r = slug(title).substring(0, 120);
  if (suffix === undefined) {
    r += `_${generateRandomLetterString()}`;
  } else if (suffix.length > 0) {
    r += `_${slug(suffix).substring(0, 120)}`;
  } else if (r.length === 0) {
    r = generateRandomLetterString();
  }

  r = r.replaceAll("--", "_");

  if (r.endsWith("_")) {
    r = r.substring(0, r.length - 1);
  }

  slug.reset();

  return r;
}

// ! Copied from `core-share` package (webgogol).
export function generateRandomLetterString(length: number = 6): string {
  let r = "";
  for (; r.length < length; ) {
    r += Math.random().toString(36).slice(2).replace(/[0-9]/g, "");
  }

  return r.substring(0, length).toLowerCase();
}
