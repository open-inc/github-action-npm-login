const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

async function run() {
  try {
    const registry = process.env.NPM_REGISTRY || "registry.npmjs.org";
    const token = process.env.NPM_TOKEN || "";

    const homedir = require("os").homedir();
    const configPath = path.join(homedir, ".npmrc");

    let configKey = registry;

    if (configKey.startsWith("https://")) {
      configKey = configKey.replace("https:", "");
    }

    if (configKey.startsWith("http://")) {
      configKey = configKey.replace("http:", "");
    }

    if (!configKey.startsWith("//")) {
      configKey = "//" + configKey;
    }

    if (!configKey.endsWith("/")) {
      configKey = configKey + "/";
    }

    configKey += ":_authToken";

    let configValue = token;

    if (
      configValue.includes("=") ||
      (configValue.includes("?") &&
        !(configValue.startsWith('"') && configValue.endsWith('"')))
    ) {
      configValue = '"' + configValue + '"';
    }

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf-8");
      const configLines = configContent
        .split("\n")
        .filter((line) => !line.includes(configKey));

      configLines.push(configKey + "=" + configValue);

      fs.writeFileSync(configPath, configLines.join("\n"));
    } else {
      fs.writeFileSync(configPath, configKey + "=" + configValue + "\n");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
