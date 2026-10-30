#!/usr/bin/env node
"use strict";

// Kildekodekontrollpunkt. Ingen bygging, installering eller lesing av appens brukerprofil.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const REPOSITORY = "https://github.com/SteinOA/DSSA-Tale-Mac.git";
const SOURCE_DIRS = new Set([
  ".github",
  "src",
  "scripts",
  "tools",
  "resources",
  "native",
  "test",
  "tests",
  "docs",
  "nix",
  "examples",
  "assets",
]);
const OMIT_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "dist-nb",
  "out",
  "build",
  "coverage",
  "work",
  "tmp",
  "temp",
  "logs",
  "recordings",
  "transcriptions",
  "models",
  "nb-models",
  "userData",
  "user-data",
  "profiles",
  "secure-keys",
]);
const TEXT_EXT = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".html",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".toml",
  ".lock",
  ".mm",
  ".m",
  ".h",
  ".c",
  ".cc",
  ".cpp",
  ".swift",
  ".py",
  ".rb",
  ".sh",
  ".zsh",
  ".command",
  ".xml",
  ".plist",
  ".entitlements",
  ".nix",
  ".svg",
]);
const ASSET_EXT = new Set([
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".icns",
  ".woff",
  ".woff2",
  ".ttf",
]);
const ROOT_FILES = new Set([
  "LICENSE",
  "NOTICE",
  ".gitignore",
  ".npmrc",
  ".nvmrc",
  ".prettierignore",
  ".prettierrc",
  ".env.example",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function candidate(name) {
  const parts = name.split("/");
  if (parts.some((part) => OMIT_DIRS.has(part))) return false;
  if (parts.length > 1 && !SOURCE_DIRS.has(parts[0])) return false;
  const base = parts.at(-1);
  if (base === "DSSA-source-checkpoint.json") return false;
  if (
    /^(?:\.env(?:\..*)?|credentials(?:\..*)?|secrets(?:\..*)?)$/i.test(base) &&
    base !== ".env.example"
  )
    return false;
  return (
    ROOT_FILES.has(base) ||
    TEXT_EXT.has(path.extname(base).toLowerCase()) ||
    ASSET_EXT.has(path.extname(base).toLowerCase())
  );
}

function hasSecret(text) {
  return (
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/.test(text) ||
    /\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|sk-ant-[A-Za-z0-9_-]{25,}|sk-proj-[A-Za-z0-9_-]{25,}|AKIA[A-Z0-9]{16})\b/.test(
      text
    ) ||
    /\b(?:_authToken|api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*["']?\s*[:=]\s*["']?([A-Za-z0-9_+/=-]{24,})/gi.test(
      text
    )
  );
}

function collect(project) {
  const files = [];
  let omitted = 0;
  function walk(relative = "") {
    const dir = path.join(project, relative);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        if (candidate(name) || SOURCE_DIRS.has(name))
          throw new Error(`Symbolsk lenke må kontrolleres først: ${name}`);
        omitted++;
      } else if (entry.isDirectory()) {
        if (OMIT_DIRS.has(entry.name) || (!relative && !SOURCE_DIRS.has(entry.name))) {
          omitted++;
          continue;
        }
        walk(name);
      } else if (entry.isFile() && candidate(name)) {
        const full = path.join(project, name);
        const stat = fs.statSync(full);
        if (stat.size > MAX_FILE_BYTES)
          throw new Error(`Kildekodefilen er over 25 MB og må kontrolleres: ${name}`);
        const bytes = fs.readFileSync(full);
        const textFile =
          TEXT_EXT.has(path.extname(name).toLowerCase()) || ROOT_FILES.has(entry.name);
        if (textFile && hasSecret(bytes.toString("utf8")))
          throw new Error(
            `Mulig hemmelighet i ${name}. Ingenting er lastet opp. Fjern den fra kildekoden og prøv igjen.`
          );
        files.push({
          name,
          bytes,
          mode: stat.mode & 0o111 ? 0o755 : 0o644,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        });
      } else omitted++;
    }
  }
  walk();
  files.sort((a, b) => a.name.localeCompare(b.name));
  return { files, omitted };
}

function inspect(project) {
  const root = fs.realpathSync(project);
  for (const name of [
    "package.json",
    "main.js",
    "electron-builder.nb.json",
    "src/helpers/clipboard.js",
  ]) {
    const full = path.join(root, name);
    if (!fs.existsSync(full) || fs.lstatSync(full).isSymbolicLink())
      throw new Error(
        "Velg kildekodemappen for DSSA Tale Mac, ikke appen i Programmer eller en mappe med brukerdata."
      );
  }
  function json(name) {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
    } catch {
      throw new Error(
        `Kunne ikke lese ${name}. Kontroller prosjektmappen; ingenting er lastet opp.`
      );
    }
  }
  const config = json("electron-builder.nb.json");
  if (config.productName !== "DSSA Tale")
    throw new Error("Prosjektet er ikke gjenkjent som DSSA Tale Mac.");
  const pkg = json("package.json");
  if (
    typeof pkg.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(pkg.version)
  )
    throw new Error("Prosjektet mangler et gyldig versjonsnummer.");
  const numbers = pkg.version.split(/[.-]/).slice(0, 3).map(Number);
  if (
    numbers[0] < 1 ||
    (numbers[0] === 1 && (numbers[1] < 9 || (numbers[1] === 9 && numbers[2] < 23)))
  ) {
    throw new Error(
      `Valgt mappe er versjon ${pkg.version}. Velg den lokale 1.9.23-koden eller en nyere versjon. Ikke endre versjonsnummeret bare for å komme forbi kontrollen.`
    );
  }
  const result = collect(root);
  return { root, version: pkg.version, ...result };
}

function git(cwd, args, options = {}) {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_INDEX_FILE",
    "GIT_COMMON_DIR",
    "GIT_OBJECT_DIRECTORY",
    "GIT_ALTERNATE_OBJECT_DIRECTORIES",
    "GIT_NAMESPACE",
  ])
    delete env[key];
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 8 * 1024 * 1024,
    timeout: 120000,
    env,
    ...options,
  }).trim();
}

function checkpoint(
  project,
  { push = false, remote = REPOSITORY, now = new Date(), beforeRecheck } = {}
) {
  const state = inspect(project);
  if (!push)
    return {
      version: state.version,
      files: state.files.length,
      omitted: state.omitted,
      pushed: false,
    };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "DSSA-Tale-kilde-"));
  fs.chmodSync(temp, 0o700);
  try {
    git(temp, ["init", "--quiet"]);
    git(temp, ["config", "user.name", "DSSA Tale versjonssikring"]);
    git(temp, ["config", "user.email", "dssa-tale-backup@users.noreply.github.com"]);
    git(temp, ["config", "core.autocrlf", "false"]);
    git(temp, ["config", "core.attributesFile", "/dev/null"]);
    // Only the public repository's history is inherited. Private local commits are never pushed.
    try {
      git(temp, ["fetch", "--quiet", "--depth=1", remote, "main"]);
    } catch {
      throw new Error(
        "Kunne ikke hente GitHub-prosjektet. Ingen lokale filer er endret, og ingenting er lastet opp."
      );
    }
    const parent = git(temp, ["rev-parse", "FETCH_HEAD"]);
    for (const item of state.files) {
      const dest = path.join(temp, item.name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, item.bytes, { mode: item.mode });
    }
    const stamp = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    const suffix = crypto.randomBytes(4).toString("hex");
    const name = `mac-source-v${state.version}-${stamp}-${suffix}`;
    const branch = `backup/${name}`;
    // Honour the project's ignore rules, including ignored files with ordinary code extensions.
    git(temp, ["add", "--all"]);
    const staged = new Set(git(temp, ["ls-files", "--cached", "-z"]).split("\0").filter(Boolean));
    for (const required of [
      "package.json",
      "main.js",
      "electron-builder.nb.json",
      "src/helpers/clipboard.js",
    ]) {
      if (!staged.has(required))
        throw new Error(`Påkrevd kildefil er utelatt av prosjektets Git-regler: ${required}`);
    }
    const included = state.files.filter(({ name }) => staged.has(name));
    fs.writeFileSync(
      path.join(temp, "DSSA-source-checkpoint.json"),
      JSON.stringify(
        {
          version: state.version,
          createdAt: now.toISOString(),
          kind: "source-only",
          installerUploaded: false,
          testsRun: false,
          files: included.map(({ name, sha256 }) => ({ name, sha256 })),
          omittedEntries: state.omitted + state.files.length - included.length,
        },
        null,
        2
      ) + "\n"
    );
    // No worktree, index, branch, tag or configuration in the Mac project is changed.
    git(temp, ["add", "--force", "--", "DSSA-source-checkpoint.json"]);
    const tree = git(temp, ["write-tree"]);
    const commit = git(temp, ["commit-tree", tree, "-p", parent], {
      input: `Sikre lokal DSSA Tale Mac ${state.version}\n\nKildekodekontrollpunkt. Ikke et testbevis eller en publisert installasjonspakke.\n`,
    });
    const tagger = git(temp, ["var", "GIT_COMMITTER_IDENT"]);
    const tag = git(temp, ["mktag"], {
      input: `object ${commit}\ntype commit\ntag ${name}\ntagger ${tagger}\n\nKildekodekontrollpunkt ${state.version}; installasjonspakke og tester er ikke inkludert.\n`,
    });
    beforeRecheck?.();
    const current = inspect(project);
    if (
      current.version !== state.version ||
      current.files.length !== state.files.length ||
      current.files.some(
        (f, i) => f.name !== state.files[i].name || f.sha256 !== state.files[i].sha256
      )
    ) {
      throw new Error(
        "Kildekoden ble endret under sikringen. Ingenting er lastet opp. Stans redigeringen et øyeblikk og prøv igjen."
      );
    }
    const gh =
      remote === REPOSITORY &&
      (() => {
        try {
          execFileSync("gh", ["auth", "status", "--hostname", "github.com"], {
            stdio: "ignore",
            timeout: 15000,
          });
          return true;
        } catch {
          return false;
        }
      })();
    const auth =
      gh && remote === REPOSITORY
        ? ["-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential"]
        : [];
    try {
      git(temp, [
        ...auth,
        "push",
        "--atomic",
        remote,
        `${commit}:refs/heads/${branch}`,
        `${tag}:refs/tags/${name}`,
      ]);
    } catch {
      throw new Error(
        "GitHub-opplastingen kunne ikke bekreftes. Lokale filer er urørt. Kontroller innlogging og skrivetilgang til SteinOA/DSSA-Tale-Mac, og prøv igjen. Ved forbindelsesbrudd: sjekk også om kontrollpunktet allerede vises på GitHub."
      );
    }
    return {
      version: state.version,
      files: included.length,
      omitted: state.omitted + state.files.length - included.length,
      pushed: true,
      commit,
      branch,
      tag: name,
      url: `https://github.com/SteinOA/DSSA-Tale-Mac/tree/${branch}`,
    };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (Number(process.versions.node.split(".")[0]) < 18)
      throw new Error("Bruk Node.js 18 eller nyere fra utviklingsmiljøet som bygget appen.");
    const args = process.argv.slice(2);
    const pos = args.indexOf("--project");
    if (pos < 0 || !args[pos + 1])
      throw new Error(
        "Oppgi prosjektmappen med --project. Bruk Mac-filen hvis du vil velge mappen i Finder."
      );
    const result = checkpoint(args[pos + 1], { push: args.includes("--push") });
    console.log(
      `${result.pushed ? "SIKRET" : "KONTROLLERT"}: DSSA Tale Mac ${result.version}, ${result.files} kildekodefiler.`
    );
    if (result.pushed)
      console.log(
        `GitHub: ${result.url}\nVersjonsmerke: ${result.tag}\nKildecommit: ${result.commit}\nInstallert app, innstillinger og prosjektfiler er urørt. Installasjonspakken er ikke lastet opp.`
      );
    else console.log("Ingenting er lastet opp. Legg til --push for å sikre kildekoden.");
  } catch (error) {
    console.error(`STOPPET: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { candidate, hasSecret, collect, inspect, checkpoint };
