const path = require("path");

/** Tailwind content globs for @lemonheads/mobile-ui (avoids scanning node_modules). */
function mobileUiContentPaths(appDir) {
  const root = path.resolve(appDir, "../../packages/mobile-ui");
  return [
    path.join(root, "index.ts"),
    path.join(root, "nativewind-setup.ts"),
    path.join(root, "components/**/*.{ts,tsx}"),
    path.join(root, "lib/**/*.{ts,tsx}"),
  ];
}

module.exports = { mobileUiContentPaths };
