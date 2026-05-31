const path = require("path");

/** Shared Metro tweaks when consuming @lemonheads/mobile-ui from an Expo app. */
function configureMobileUiMonorepo(config, projectRoot) {
  const workspaceRoot = path.resolve(projectRoot, "../..");
  const mobileUiRoot = path.resolve(workspaceRoot, "packages/mobile-ui");
  const mobileUiNodeModules = path.join(mobileUiRoot, "node_modules");

  config.watchFolders = [...(config.watchFolders ?? []), mobileUiRoot];

  const escaped = mobileUiNodeModules.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockMobileUiNodeModules = new RegExp(`${escaped}[/\\\\].*`);

  config.resolver = {
    ...config.resolver,
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      ...(config.resolver?.nodeModulesPaths ?? []),
    ],
    blockList: [...(config.resolver?.blockList ?? []), blockMobileUiNodeModules],
  };

  return { workspaceRoot, mobileUiRoot };
}

module.exports = { configureMobileUiMonorepo };
