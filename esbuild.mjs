// esbuild.mjs
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import tailwindPostcss from "@tailwindcss/postcss";
import { glob } from "glob";   // ⬅ ADD THIS

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const nodeBuiltins = [
  "fs", "path", "child_process", "node:events",
  "node:path", "node:buffer", "node:fs", "os", "crypto",
];

// ------------------------------
// PATHS
// ------------------------------
const extEntry = path.resolve("src/extension.ts");
const extOut = path.resolve("out/extension.js");

const dashEntry = path.resolve("src/components/figma-ui/dashboard/FigmaDashboard.tsx");
const dashOutJS = path.resolve("out/components/figma-ui/dashboard/FigmaDashboard.js");

const rightDashboardEntry = path.resolve("src/components/figma-ui/dashboard/RightDashboard.tsx");
const rightDashboardOutJS = path.resolve("out/components/figma-ui/dashboard/RightDashboard.js");

const editorOverlayEntry = path.resolve("src/components/figma-ui/dashboard/EditorOverlay.tsx");
const editorOverlayOutJS = path.resolve("out/components/figma-ui/dashboard/EditorOverlay.js");

const indexCssInput = path.resolve("src/components/figma-ui/index.css");
const globalsCssInput = path.resolve("src/components/figma-ui/styles/globals.css");

const outCssDir = path.resolve("out/components/figma-ui");
const globalsCssOutDir = path.join(outCssDir, "styles");

// ------------------------------
// CLEAN OLD CSS
// ------------------------------
function cleanOldCSS() {
  const oldCssFiles = [
    path.join(outCssDir, "FigmaDashboard.css"),
    path.join(outCssDir, "index.css"),
    path.join(globalsCssOutDir, "globals.css"),
  ];

  oldCssFiles.forEach((file) => {
    if (fs.existsSync(file)) {fs.unlinkSync(file);}
  });
}

// ------------------------------
// LOGGER PLUGIN
// ------------------------------
const logPlugin = {
  name: "logger",
  setup(build) {
    build.onStart(() => console.log(`[esbuild] Building ${build.initialOptions.outfile}...`));
    build.onEnd(() => console.log("[esbuild] Done."));
  },
};

// ------------------------------
// POSTCSS BUILD
// ------------------------------
async function buildCSS() {
  const files = [
    { input: indexCssInput, output: path.join(outCssDir, "index.css") },
    { input: globalsCssInput, output: path.join(globalsCssOutDir, "globals.css") },
  ];

  for (const f of files) {
    if (!fs.existsSync(f.input)) {continue;}

    const css = fs.readFileSync(f.input, "utf8");
    const result = await postcss([tailwindPostcss, autoprefixer]).process(css, {
      from: f.input,
      to: f.output,
      map: !production ? { inline: false } : false,
    });

    fs.mkdirSync(path.dirname(f.output), { recursive: true });
    fs.writeFileSync(f.output, result.css, "utf8");
    console.log(`[postcss] Built: ${f.output}`);
  }
}

// ------------------------------
// EXTENSION BUNDLE
// ------------------------------
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
    format: "cjs",
    plugins: [logPlugin],
  });
}

// ------------------------------
// DASHBOARD BUNDLES
// ------------------------------
async function buildDashboard() {
  cleanOldCSS();
  await buildCSS();

  const bundles = [
    { entry: dashEntry, out: dashOutJS, name: "DevPilotApp" },
    { entry: rightDashboardEntry, out: rightDashboardOutJS, name: "DevPilotRightDashboard" },
    { entry: editorOverlayEntry, out: editorOverlayOutJS, name: "DevPilotEditorOverlay" },
  ];

  for (const b of bundles) {
    if (!fs.existsSync(b.entry)) {continue;}
    fs.mkdirSync(path.dirname(b.out), { recursive: true });
    const buildResult = await esbuild.build({
      entryPoints: [b.entry],
      outfile: b.out,
      bundle: true,
      platform: "browser",
      // For webviews, produce a single IIFE bundle so the webview can load a self-contained script
      format: "iife",
      globalName: b.name,
      target: ["es2020"],
      jsx: "automatic",
      // Use automatic runtime and let esbuild inline react/jsx-runtime
      jsxImportSource: "react",
      metafile: true,
      sourcemap: !production,
      minify: production,
      loader: {
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "js",
        ".jsx": "jsx",
        ".css": "text",
      },
      external: [...nodeBuiltins],
      plugins: [logPlugin],
    });
    console.log(`[build] Built ${b.name} ->`, b.out);
    // Write metafile summary to help debugging bundling and external dependencies
    if (!production && buildResult.metafile) {
      try {
        const mf = await esbuild.analyzeMetafile(buildResult.metafile, { verbose: true });
        console.log(`[esbuild] Metafile analysis for ${b.name}:\n`, mf);
      } catch (e) {}
    }
  }
}

// ------------------------------
// FULL BUILD
// ------------------------------
async function buildAll() {
  await buildExtension();
  await buildDashboard();
}

// ------------------------------
// FIXED WATCH MODE
// ------------------------------
if (watch) {
  console.log("[esbuild] Watch mode enabled.");
  buildAll().then(() => {
    esbuild.context({
      entryPoints: [],
    });
  });

  // Minimal watcher: rerun full build on every change
  fs.watch("src", { recursive: true }, (event, file) => {
    console.log(`[esbuild] Change detected: ${file}`);
    buildAll().catch((e) => console.error(e));
  });

} else {
  buildAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
