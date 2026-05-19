#!/usr/bin/env node
import { copyFileSync, existsSync, renameSync } from "node:fs";

const actionsFrom = "app/actions";
const actionsTo = "app/_actions_server";

if (existsSync(actionsFrom)) {
  if (existsSync(actionsTo)) {
    console.error(
      "[prepare-static-export] app/_actions_server already exists. Run: node scripts/restore-static-export.mjs",
    );
    process.exit(1);
  }
  renameSync(actionsFrom, actionsTo);
  console.log("[prepare-static-export] moved app/actions → app/_actions_server");
} else if (!existsSync(actionsTo)) {
  console.log("[prepare-static-export] no app/actions folder, skipping move.");
}

copyFileSync("lib/submit-booking.static.ts", "lib/submit-booking.ts");
copyFileSync("lib/submit-contact.static.ts", "lib/submit-contact.ts");
copyFileSync("lib/stripe-setup.static.ts", "lib/stripe-setup.ts");

console.log("[prepare-static-export] static lib shims in place");
