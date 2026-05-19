#!/usr/bin/env node
import { copyFileSync, existsSync, renameSync } from "node:fs";

const actionsFrom = "app/_actions_server";
const actionsTo = "app/actions";

if (existsSync(actionsFrom) && !existsSync(actionsTo)) {
  renameSync(actionsFrom, actionsTo);
  console.log("[restore-static-export] restored app/actions");
}

const libRestores = [
  ["lib/submit-booking.server.ts", "lib/submit-booking.ts"],
  ["lib/submit-contact.server.ts", "lib/submit-contact.ts"],
  ["lib/stripe-setup.server.ts", "lib/stripe-setup.ts"],
];

for (const [from, to] of libRestores) {
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log(`[restore-static-export] restored ${to}`);
  }
}
