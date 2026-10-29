#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
if (process.platform !== "darwin") process.exit(0);
const root = path.resolve(__dirname, "..");
const arch = process.env.TARGET_ARCH || process.arch;
if (arch !== "arm64") throw new Error("DSSA Tale native paste is verified only for Apple Silicon.");
const output = path.join(root, "resources/bin/macos-native-paste.node");
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync("xcrun", ["clang++", "-std=c++17", "-O2", "-bundle", "-undefined", "dynamic_lookup",
  "-arch", "arm64", "-mmacosx-version-min=26.0", "-DNODE_GYP_MODULE_NAME=nb_native_paste",
  "-I", path.join(root, "resources/vendor/node-api"),
  path.join(root, "resources/macos-native-paste.mm"), "-framework", "AppKit", "-framework", "ApplicationServices", "-o", output], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
// Inspect the compiled addon itself, not just its source or a mock. A hardcoded
// napi property count previously hid new functions despite successful linking.
const check = spawnSync(process.execPath, ["-e", `
  const addon = require(process.argv[1]);
  const required = ["status", "paste", "verify", "openTestDocument"];
  const missing = required.filter(name => typeof addon[name] !== "function");
  if (missing.length) console.error("Native paste exports missing: " + missing.join(", "));
  process.exit(missing.length ? 1 : 0);
`, output], {stdio:"inherit", timeout:15000});
if (check.status !== 0) process.exit(check.status || 1);
console.log("Built Apple Silicon in-process paste addon.");
