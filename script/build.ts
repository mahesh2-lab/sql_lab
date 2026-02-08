import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, cp, mkdir } from "fs/promises";
import { existsSync } from "fs";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "compression",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "helmet",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  console.log("Cleaning dist folder...");
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist", { recursive: true });

  console.log("Building client with Vite...");
  await viteBuild();

  // Copy client build to dist/public for serving static files
  console.log("Copying client build to dist/public...");
  if (existsSync("dist/public")) {
    // Vite already outputs to dist/public based on vite.config
  } else if (existsSync("client/dist")) {
    await cp("client/dist", "dist/public", { recursive: true });
  }

  console.log("Building server with esbuild...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("\n✅ Build complete!");
  console.log("   - Server: dist/index.cjs");
  console.log("   - Client: dist/public/");
  console.log("\nTo start production server:");
  console.log("   npm run start");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
