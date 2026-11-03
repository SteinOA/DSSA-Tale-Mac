const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const {
  candidate,
  hasSecret,
  inspect,
  checkpoint,
} = require("../scripts/DSSA-sikre-mac-versjon.cjs");

function git(dir, ...args) {
  return execFileSync("git", args, {
    cwd: dir,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "DSSA-versjon-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const project = path.join(root, "project");
  const remote = path.join(root, "remote.git");
  fs.mkdirSync(project);
  const write = (name, text) => {
    const dest = path.join(project, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
  };
  write("package.json", JSON.stringify({ name: "open-whispr", version: "1.9.23" }));
  write("electron-builder.nb.json", JSON.stringify({ productName: "DSSA Tale" }));
  write("main.js", "// Lokal og ennå ikke pushet kode\n");
  write("src/helpers/clipboard.js", "// Faktisk lokal innliming\r\n");
  write(".gitignore", "src/ignored-local-config.json\n");
  git(project, "init", "--quiet");
  git(project, "config", "user.email", "fixture@example.invalid");
  git(project, "config", "user.name", "Local fixture");
  git(root, "init", "--quiet", "--bare", "--initial-branch=main", remote);
  git(project, "add", ".");
  git(project, "commit", "--quiet", "-m", "Public fixture baseline");
  git(project, "push", "--quiet", remote, "HEAD:refs/heads/main");
  return { root, project, remote, write };
}

test("runtime files, weights, recordings, installers and credentials are not source candidates", () => {
  for (const name of [
    ".env",
    "src/.env.local",
    "secrets.json",
    "credentials.json",
    "resources/nb-models/model.gguf",
    "recordings/text.txt",
    "src/user-data/settings.json",
    "node_modules/pkg/index.js",
    "dist/main.js",
    "out/app.dmg",
    "resources/bin/native.node",
    "test/recording.wav",
  ]) {
    assert.equal(candidate(name), false, name);
  }
  for (const name of [
    "main.js",
    "package.json",
    "src/helpers/clipboard.js",
    "src/assets/icon.png",
    "resources/macos-native-paste.mm",
    "scripts/build.js",
    "LICENSE",
    ".env.example",
  ])
    assert.equal(candidate(name), true, name);
});

test("secret scan blocks realistic credentials without printing them", () => {
  for (const value of [
    "ghp_" + "a".repeat(35),
    "github_pat_" + "B".repeat(55),
    "sk-ant-" + "x".repeat(40),
    ["-----BEGIN", "PRIVATE KEY-----"].join(" "),
    'API_KEY="' + "z".repeat(35) + '"',
  ])
    assert.equal(hasSecret(value), true);
  assert.equal(hasSecret("const API_KEY = process.env.API_KEY; // configuration only"), false);
});

test("old code and wrong app cannot be labelled 1.9.23", (t) => {
  const f = fixture(t);
  f.write("package.json", '{"version":"1.9.20"}');
  assert.throws(() => inspect(f.project), /1\.9\.20/);
  f.write("package.json", '{"version":"1.9.23"}');
  f.write("electron-builder.nb.json", '{"productName":"Another app"}');
  assert.throws(() => inspect(f.project), /ikke gjenkjent/);
});

test("preview creates no commit, changes or remote references", (t) => {
  const f = fixture(t);
  f.write("main.js", "// latest local source\n");
  const before = git(f.project, "status", "--porcelain");
  const refs = git(f.remote, "show-ref");
  assert.equal(checkpoint(f.project).pushed, false);
  assert.equal(git(f.project, "status", "--porcelain"), before);
  assert.equal(git(f.remote, "show-ref"), refs);
});

test("push captures actual dirty source with hashes, preserves Mac index/HEAD and omits private history", (t) => {
  const f = fixture(t);
  const publicParent = git(f.remote, "rev-parse", "main");
  f.write("private-local-history.txt", "LOCAL PRIVATE HISTORY MUST NOT BE TRANSFERRED");
  git(f.project, "add", "private-local-history.txt");
  git(f.project, "commit", "--quiet", "-m", "Private local commit");
  fs.unlinkSync(path.join(f.project, "private-local-history.txt"));
  f.write("main.js", "// version 1.9.23 changes not committed yet\n");
  f.write("src/new-feature.js", "// new source must be preserved\n");
  f.write(".env", "DO_NOT_UPLOAD=private\n");
  f.write("recordings/transcript.txt", "Private recording transcript");
  f.write("models/model.gguf", "not source");
  f.write("src/ignored-local-config.json", '{"local":"not for GitHub"}');
  git(f.project, "add", "main.js");
  const head = git(f.project, "rev-parse", "HEAD");
  const status = git(f.project, "status", "--porcelain");
  const index = fs.readFileSync(path.join(f.project, ".git/index"));
  const result = checkpoint(f.project, { push: true, remote: f.remote });
  assert.equal(result.version, "1.9.23");
  assert.equal(result.pushed, true);
  assert.equal(
    git(f.remote, "show", `${result.commit}:main.js`),
    "// version 1.9.23 changes not committed yet"
  );
  assert.equal(
    git(f.remote, "show", `${result.commit}:src/new-feature.js`),
    "// new source must be preserved"
  );
  assert.equal(git(f.remote, "rev-parse", `${result.commit}^`), publicParent);
  assert.equal(git(f.project, "rev-parse", "HEAD"), head);
  assert.equal(git(f.project, "status", "--porcelain"), status);
  assert.deepEqual(fs.readFileSync(path.join(f.project, ".git/index")), index);
  const names = git(f.remote, "ls-tree", "-r", "--name-only", result.commit).split("\n");
  for (const name of [
    "private-local-history.txt",
    ".env",
    "recordings/transcript.txt",
    "models/model.gguf",
    "src/ignored-local-config.json",
  ])
    assert.equal(names.includes(name), false, name);
  const manifest = JSON.parse(
    git(f.remote, "show", `${result.commit}:DSSA-source-checkpoint.json`)
  );
  assert.equal(manifest.testsRun, false);
  assert.equal(manifest.installerUploaded, false);
  assert.equal(manifest.files.length, result.files);
  for (const file of manifest.files) {
    const blob = execFileSync("git", ["show", `${result.commit}:${file.name}`], { cwd: f.remote });
    assert.equal(crypto.createHash("sha256").update(blob).digest("hex"), file.sha256, file.name);
  }
  assert.equal(git(f.remote, "cat-file", "-t", `refs/tags/${result.tag}`), "tag");
  assert.equal(git(f.remote, "rev-parse", `refs/tags/${result.tag}^{}`), result.commit);
});

test("source changing while snapshot is prepared never gets pushed", (t) => {
  const f = fixture(t);
  const refs = git(f.remote, "show-ref");
  assert.throws(
    () =>
      checkpoint(f.project, {
        push: true,
        remote: f.remote,
        beforeRecheck: () => f.write("main.js", "// changed again\n"),
      }),
    /endret under/
  );
  assert.equal(git(f.remote, "show-ref"), refs);
});

test("secret or symlink blocks upload before any remote reference changes", (t) => {
  const f = fixture(t);
  const refs = git(f.remote, "show-ref");
  f.write("src/config.js", 'const key = "ghp_' + "Z".repeat(35) + '";');
  assert.throws(() => checkpoint(f.project, { push: true, remote: f.remote }), /Mulig hemmelighet/);
  fs.unlinkSync(path.join(f.project, "src/config.js"));
  fs.symlinkSync("/outside-private-folder", path.join(f.project, "src/symlink.js"));
  assert.throws(() => checkpoint(f.project, { push: true, remote: f.remote }), /Symbolsk lenke/);
  assert.equal(git(f.remote, "show-ref"), refs);
});

test("successive backups keep previous branch and version tags immutable", (t) => {
  const f = fixture(t);
  const first = checkpoint(f.project, { push: true, remote: f.remote });
  f.write("main.js", "// next change\n");
  const next = checkpoint(f.project, { push: true, remote: f.remote });
  assert.notEqual(first.branch, next.branch);
  assert.notEqual(first.tag, next.tag);
  assert.equal(git(f.remote, "rev-parse", `refs/heads/${first.branch}`), first.commit);
  assert.equal(git(f.remote, "rev-parse", `refs/tags/${first.tag}^{}`), first.commit);
  assert.equal(git(f.remote, "rev-parse", "main"), git(f.project, "rev-parse", "HEAD"));
});

test("source folders without their own Git history can be secured", (t) => {
  const f = fixture(t);
  fs.rmSync(path.join(f.project, ".git"), { recursive: true, force: true });
  const result = checkpoint(f.project, { push: true, remote: f.remote });
  assert.equal(result.pushed, true);
  assert.equal(fs.existsSync(path.join(f.project, ".git")), false);
});

test("Git environment overrides cannot redirect snapshot writes into the Mac project", (t) => {
  const f = fixture(t);
  const index = fs.readFileSync(path.join(f.project, ".git/index"));
  const keys = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"];
  const old = keys.map((key) => process.env[key]);
  let result;
  try {
    process.env.GIT_DIR = path.join(f.project, ".git");
    process.env.GIT_WORK_TREE = f.project;
    process.env.GIT_INDEX_FILE = path.join(f.project, ".git/index");
    result = checkpoint(f.project, { push: true, remote: f.remote });
  } finally {
    keys.forEach((key, i) => {
      if (old[i] === undefined) delete process.env[key];
      else process.env[key] = old[i];
    });
  }
  assert.equal(result.pushed, true);
  assert.deepEqual(fs.readFileSync(path.join(f.project, ".git/index")), index);
  assert.equal(git(f.project, "status", "--porcelain"), "");
});

test("server rejection of the tag leaves neither a new branch nor a partial tag", (t) => {
  const f = fixture(t);
  const before = git(f.remote, "show-ref");
  fs.writeFileSync(
    path.join(f.remote, "hooks/update"),
    '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\nexit 0\n',
    { mode: 0o755 }
  );
  assert.throws(
    () => checkpoint(f.project, { push: true, remote: f.remote }),
    /kunne ikke bekreftes/
  );
  assert.equal(git(f.remote, "show-ref"), before);
});

test("a previous generated manifest cannot create a false checksum for the new manifest", (t) => {
  const f = fixture(t);
  f.write("DSSA-source-checkpoint.json", '{"version":"older"}');
  const result = checkpoint(f.project, { push: true, remote: f.remote });
  const manifest = JSON.parse(
    git(f.remote, "show", `${result.commit}:DSSA-source-checkpoint.json`)
  );
  assert.equal(manifest.version, "1.9.23");
  assert.equal(
    manifest.files.some((f) => f.name === "DSSA-source-checkpoint.json"),
    false
  );
});
