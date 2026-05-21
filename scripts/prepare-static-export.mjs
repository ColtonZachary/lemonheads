#!/usr/bin/env node
import { copyFileSync, existsSync, renameSync } from "node:fs";

function moveDir(from, to, label) {
  if (existsSync(from)) {
    if (existsSync(to)) {
      console.error(
        `[prepare-static-export] ${to} already exists. Run: node scripts/restore-static-export.mjs`,
      );
      process.exit(1);
    }
    renameSync(from, to);
    console.log(`[prepare-static-export] moved ${from} → ${to}`);
  } else if (!existsSync(to)) {
    console.log(`[prepare-static-export] no ${from}, skipping.`);
  }
}

moveDir("app/actions", "app/_actions_server");
moveDir("app/auth", "app/_auth_server");
moveDir("app/hub", "app/_hub_server");
moveDir("app/login", "app/_login_server");

if (existsSync("middleware.ts")) {
  if (existsSync("middleware.static-export.ts")) {
    console.error(
      "[prepare-static-export] middleware.static-export.ts already exists. Run restore.",
    );
    process.exit(1);
  }
  renameSync("middleware.ts", "middleware.static-export.ts");
  console.log("[prepare-static-export] moved middleware.ts aside");
}

copyFileSync("lib/submit-booking.static.ts", "lib/submit-booking.ts");
copyFileSync("lib/submit-contact.static.ts", "lib/submit-contact.ts");
copyFileSync(
  "lib/submit-website-feedback.static.ts",
  "lib/submit-website-feedback.ts",
);
copyFileSync("lib/stripe-setup.static.ts", "lib/stripe-setup.ts");
copyFileSync("lib/booking-availability.static.ts", "lib/booking-availability.ts");

console.log("[prepare-static-export] static lib shims in place");
