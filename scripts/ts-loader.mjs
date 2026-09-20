import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = join(process.cwd(), "src", specifier.slice(2));
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
