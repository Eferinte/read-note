import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync, cpSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.join(rootDir, "dist");
const branch = process.env.GH_PAGES_BRANCH ?? "gh-pages";
const remote = process.env.GH_PAGES_REMOTE ?? "origin";

function run(command, args, cwd = rootDir, options = {}) {
  return execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    ...options,
  });
}

function read(command, args, cwd = rootDir) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
  }).trim();
}

function readOptional(command, args, cwd = rootDir) {
  try {
    return read(command, args, cwd);
  } catch {
    return "";
  }
}

if (!existsSync(distDir)) {
  throw new Error("dist directory not found. Run `npm run build` before deploying.");
}

const remoteUrl = readOptional("git", ["config", "--get", `remote.${remote}.url`]);

if (!remoteUrl) {
  throw new Error(`Git remote '${remote}' is not configured.`);
}

const configuredUserName = readOptional("git", ["config", "--get", "user.name"]);
const configuredUserEmail = readOptional("git", ["config", "--get", "user.email"]);
const tempDir = mkdtempSync(path.join(os.tmpdir(), "read-note-gh-pages-"));

try {
  for (const entry of readdirSync(distDir)) {
    cpSync(path.join(distDir, entry), path.join(tempDir, entry), { recursive: true });
  }

  writeFileSync(path.join(tempDir, ".nojekyll"), "");

  run("git", ["init"], tempDir);
  run("git", ["checkout", "-b", branch], tempDir);

  if (configuredUserName) {
    run("git", ["config", "user.name", configuredUserName], tempDir);
  }

  if (configuredUserEmail) {
    run("git", ["config", "user.email", configuredUserEmail], tempDir);
  }

  run("git", ["add", "."], tempDir);
  run("git", ["commit", "-m", "Deploy GitHub Pages static files"], tempDir);
  run("git", ["remote", "add", remote, remoteUrl], tempDir);
  run("git", ["push", "--force", remote, `${branch}:${branch}`], tempDir);

  process.stdout.write(`Published dist to ${remote}/${branch}.\n`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
