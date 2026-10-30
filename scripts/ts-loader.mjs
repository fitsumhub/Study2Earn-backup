import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  let target = null;
  if (specifier.startsWith("@/")) {
    target = join(process.cwd(), "src", specifier.slice(2));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL && !specifier.endsWith(".ts") && !specifier.endsWith(".tsx") && !specifier.endsWith(".js") && !specifier.endsWith(".mjs")) {
    try {
      const parentPath = fileURLToPath(context.parentURL);
      const parentDir = dirname(parentPath);
      target = join(parentDir, specifier);
    } catch {}
  }

  if (target) {
    const extensions = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx", "/index.js"];
    for (const ext of extensions) {
      const fullPath = target + ext;
      if (existsSync(fullPath)) {
        return {
          url: pathToFileURL(fullPath).href,
          shortCircuit: true,
        };
      }
    }
  }
  return nextResolve(specifier, context);
}

