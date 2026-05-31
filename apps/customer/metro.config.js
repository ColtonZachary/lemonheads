const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const { configureMobileUiMonorepo } = require("../../packages/mobile-ui/metro.shared");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const { workspaceRoot } = configureMobileUiMonorepo(config, projectRoot);

module.exports = withNativeWind(config, {
  input: path.resolve(workspaceRoot, "packages/mobile-ui/global.css"),
});
