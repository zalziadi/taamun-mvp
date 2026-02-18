#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const allowedFile = "src/app/og.png/route.tsx";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    out.push(fullPath);
  }
  return out;
}

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

const edgeRuntimePattern = /export\s+const\s+runtime\s*=\s*["']edge["']/g;
const offenders = [];

for (const file of walk(root)) {
  const rel = relative(file);
  const content = fs.readFileSync(file, "utf8");
  if (!edgeRuntimePattern.test(content)) continue;
  if (rel !== allowedFile) offenders.push(rel);
}

if (offenders.length > 0) {
  console.error('[guard:runtime] "edge" runtime found outside allowed route:');
  for (const file of offenders) console.error(`- ${file}`);
  process.exit(1);
}

console.log("[guard:runtime] OK");
