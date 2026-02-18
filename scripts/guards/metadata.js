#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const layoutPath = path.join(root, "src", "app", "layout.tsx");

if (!fs.existsSync(layoutPath)) {
  console.error("[guard:metadata] Missing src/app/layout.tsx");
  process.exit(1);
}

const content = fs.readFileSync(layoutPath, "utf8");
const failures = [];

const hasAppNameImport =
  /import\s*\{[^}]*\bAPP_NAME\b[^}]*\}\s*from\s*["'][^"']*appConfig["']/.test(content);
if (!hasAppNameImport) failures.push("Missing APP_NAME import from appConfig in layout.tsx");

if (!/title\s*:\s*\{[\s\S]*default\s*:\s*APP_NAME/.test(content)) {
  failures.push("metadata.title.default must use APP_NAME");
}

if (!/title\s*:\s*\{[\s\S]*template\s*:\s*`[^`]*\$\{APP_NAME\}[^`]*`/.test(content)) {
  failures.push("metadata.title.template must include APP_NAME");
}

if (!/applicationName\s*:\s*APP_NAME/.test(content)) {
  failures.push("metadata.applicationName must use APP_NAME");
}

if (failures.length > 0) {
  console.error("[guard:metadata] Failed checks:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[guard:metadata] OK");
