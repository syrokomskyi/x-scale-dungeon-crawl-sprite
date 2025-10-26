export function showNonFatalReasons(nonFatalReasons: string[]) {
  if (nonFatalReasons.length === 0) {
    return;
  }

  console.log(
    `\nSkipped ${nonFatalReasons.length} generations due to non-fatal reasons.`,
  );
  for (const relativePath of nonFatalReasons) {
    console.log(`\t${relativePath}`);
  }
}
