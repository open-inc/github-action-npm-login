import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as core from "@actions/core";

const DEFAULT_REGISTRY = "registry.npmjs.org";

/** Characters that are safe to write unquoted into an ini value. */
const PLAIN_TOKEN = /^[A-Za-z0-9._~+/-]+$/;

/**
 * Turns a registry URL into the `//host/path/:_authToken` key npm expects.
 */
export function toAuthTokenKey(registry: string): string {
  let key = registry.trim().replace(/^https?:/, "");

  if (!key.startsWith("//")) {
    key = "//" + key;
  }

  if (!key.endsWith("/")) {
    key += "/";
  }

  return key + ":_authToken";
}

/**
 * npm parses .npmrc as ini, so values containing ini-significant characters
 * have to be quoted. Anything outside the plain token alphabet gets quoted
 * (and escaped) by JSON.
 */
export function toIniValue(value: string): string {
  return PLAIN_TOKEN.test(value) ? value : JSON.stringify(value);
}

/**
 * Replaces every existing line for `key` with a single `key=value` line.
 */
export function upsertIniLine(
  content: string,
  key: string,
  value: string,
): string {
  const isKey = (line: string): boolean =>
    line.trim().split("=")[0]?.trim() === key;

  const lines = content.split(/\r?\n/);

  // Trailing empty lines would otherwise become blank lines in the output.
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }

  return (
    [...lines.filter((line) => !isKey(line)), key + "=" + value].join("\n") +
    "\n"
  );
}

function resolveNpmrcPath(input: string): string {
  if (input) {
    return path.resolve(input);
  }

  if (process.env["NPM_CONFIG_USERCONFIG"]) {
    return path.resolve(process.env["NPM_CONFIG_USERCONFIG"]);
  }

  return path.join(os.homedir(), ".npmrc");
}

async function run(): Promise<void> {
  try {
    // Inputs win, the legacy NPM_* env vars stay supported as a fallback.
    const registry =
      core.getInput("registry") ||
      process.env["NPM_REGISTRY"] ||
      DEFAULT_REGISTRY;
    const token = core.getInput("token") || process.env["NPM_TOKEN"] || "";
    const configPath = resolveNpmrcPath(core.getInput("npmrc-path"));

    if (!token) {
      throw new Error(
        "No npm token given. Set the `token` input or the NPM_TOKEN environment variable.",
      );
    }

    core.setSecret(token);

    const key = toAuthTokenKey(registry);
    const content = fs.existsSync(configPath)
      ? fs.readFileSync(configPath, "utf-8")
      : "";

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      upsertIniLine(content, key, toIniValue(token)),
      { mode: 0o600 },
    );
    // `mode` above only applies when the file is created, so tighten an
    // already existing npmrc explicitly. Not supported on Windows runners.
    if (process.platform !== "win32") {
      fs.chmodSync(configPath, 0o600);
    }

    core.info(
      "Wrote auth token for " +
        key.replace(":_authToken", "") +
        " to " +
        configPath,
    );
    core.setOutput("npmrc-path", configPath);
    core.setOutput("registry", registry);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

await run();
