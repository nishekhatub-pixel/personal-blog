import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const standaloneNext = path.join(standaloneRoot, ".next");
const sourcePublic = path.join(projectRoot, "public");
const sourceStatic = path.join(projectRoot, ".next", "static");

await mkdir(standaloneNext, { recursive: true });
await cp(sourceStatic, path.join(standaloneNext, "static"), {
  force: true,
  recursive: true,
});
await cp(sourcePublic, path.join(standaloneRoot, "public"), {
  filter(source) {
    if (source === sourcePublic) return true;
    const relative = path.relative(sourcePublic, source);
    return relative.split(path.sep)[0] !== "uploads";
  },
  force: true,
  recursive: true,
});

console.log("Standalone public and static assets prepared.");
