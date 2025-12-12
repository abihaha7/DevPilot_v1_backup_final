import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Node built‑ins that should NEVER be bundled in browser code
const nodeBuiltins = [
  "fs",
  "path",
  "child_process",
  "node:events",
  "node:path",
  "node:buffer",
  "node:fs",
  "os",
  "crypto"
];

// Paths
const extEntry = path.resolve("src/extension.ts");
const extOut = path.resolve("out/extension.js");

const dashEntry = path.resolve("src/components/figma-ui/dashboard/FigmaDashboard.tsx");
const dashOutJS = path.resolve("out/components/figma-ui/dashboard/FigmaDashboard.js");

// CSS files
const indexCssInput = path.resolve("src/components/figma-ui/index.css");
const globalsCssInput = path.resolve("src/components/figma-ui/styles/globals.css");

const outCssDir = path.resolve("out/components/figma-ui");
const globalsCssOutDir = path.join(outCssDir, "styles");

// Cleanup old CSS
function cleanOldCSS() {
  const oldCssFiles = [
    path.resolve("out/FigmaDashboard.css"),
    path.join(outCssDir, "FigmaDashboard.css"),
  ];

  oldCssFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log("[cleanup] Removed:", file);
    }
  });
}

// Logger plugin
const logPlugin = {
  name: "logger",
  setup(build) {
    build.onStart(() =>
      console.log(`[esbuild] Building ${build.initialOptions.outfile || "bundle"}...`)
    );
    build.onEnd(() => console.log("[esbuild] Done."));
  },
};

// CSS builder
async function buildCSS() {
  const cssFiles = [
    { input: indexCssInput, output: path.join(outCssDir, "index.css") },
    { input: globalsCssInput, output: path.join(globalsCssOutDir, "globals.css") },
  ];

  for (const file of cssFiles) {
    const css = fs.readFileSync(file.input, "utf8");
    const result = await postcss([tailwindcss(), autoprefixer()]).process(css, {
      from: file.input,
      to: file.output,
      map: !production ? { inline: false } : false,
    });

    fs.mkdirSync(path.dirname(file.output), { recursive: true });
    fs.writeFileSync(file.output, result.css, "utf8");
    console.log("[postcss] Built:", file.output);
  }
}

// Builds extension (node)
async function buildExtension() {
  await esbuild.build({
    entryPoints: [extEntry],
    outfile: extOut,
    bundle: true,
    platform: "node",
    target: "node18",
    sourcemap: !production,
    minify: production,
    external: ["vscode", ...nodeBuiltins],
    plugins: [logPlugin],
  });
}

// Builds dashboard (browser)
async function buildDashboard() {
  cleanOldCSS();
  await buildCSS();

  await esbuild.build({
    entryPoints: [dashEntry],
    outfile: dashOutJS,
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "DevPilotApp",
    target: "es2020",
    jsx: "automatic",
    jsxImportSource: "react",
    sourcemap: !production,
    minify: production,
    loader: {
      ".ts": "ts",
      ".tsx": "tsx",
      ".js": "js",
      ".css": "text",
    },
    external: [...nodeBuiltins],  // <-- FIXED: browser bundle must ignore node deps
    plugins: [logPlugin],
  });

  console.log("[esbuild] Dashboard built:", dashOutJS);
}

// Combined build
async function buildAll() {
  await buildExtension();
  await buildDashboard();
}

// -------------------------------
// WATCH MODE (FIXED PROPERLY)
// -------------------------------
async function watchAll() {
  console.log("[esbuild] Watch mode enabled");

  const extCtx = await esbuild.context({
    entryPoints: [extEntry],
    outfile: extOut,
    bundle: true,
    platform: "node",
    target: "node18",
    sourcemap: true,
    external: ["vscode", ...nodeBuiltins],
    plugins: [logPlugin],
  });

  const dashCtx = await esbuild.context({
    entryPoints: [dashEntry],
    outfile: dashOutJS,
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "DevPilotApp",
    target: "es2020",
    jsx: "automatic",
    jsxImportSource: "react",
    sourcemap: true,
    loader: { ".css": "text" },
    external: [...nodeBuiltins], // <-- FIXED HERE ALSO
    plugins: [logPlugin],
  });

  await extCtx.watch();
  await dashCtx.watch();
}

if (watch) {
  watchAll();
} else {
  buildAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

