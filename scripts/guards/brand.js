#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appConfigPath = path.join(root, "src", "lib", "appConfig.ts");

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".webm",
  ".mov",
  ".lock",
]);

const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".html",
]);

const BRAND_TOKENS = [
  "تعاون",
  "تمعن",
  "تمَعُّن",
  "تمعّن",
  "تمَعُّن",
];

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walk(fullPath, out);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) continue;
    if (!INCLUDE_EXTENSIONS.has(ext)) continue;
    out.push(fullPath);
  }
  return out;
}

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function findMatches(text, tokens) {
  const matches = [];
  for (const token of tokens) {
    if (text.includes(token)) matches.push(token);
  }
  return matches;
}

if (!fs.existsSync(appConfigPath)) {
  console.error("[guard:brand] Missing src/lib/appConfig.ts");
  process.exit(1);
}

const files = walk(root);
const offenders = [];
const strictAppName = process.env.STRICT_APP_NAME === "1";

for (const file of files) {
  const relPath = relative(file);
  if (relPath.startsWith("scripts/guards/")) continue;
  if (path.resolve(file) === path.resolve(appConfigPath)) continue;
  let content = "";
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const tokensFound = findMatches(content, BRAND_TOKENS).filter((t) => t !== "تمَعُّن");
  const strictHit = strictAppName && content.includes("تمَعُّن");
  if (tokensFound.length > 0 || strictHit) {
    offenders.push({
      file: relative(file),
      tokens: [...new Set([...tokensFound, ...(strictHit ? ["تمَعُّن(strict)"] : [])])],
    });
  }
}

if (offenders.length > 0) {
  console.error("[guard:brand] Found hardcoded brand tokens outside src/lib/appConfig.ts");
  for (const item of offenders) {
    console.error(`- ${item.file}: ${item.tokens.join(", ")}`);
  }
  process.exit(1);
}

console.log("[guard:brand] OK");
