#!/usr/bin/env node
import { copyFileSync, existsSync, renameSync } from "node:fs";

function restoreDir(from, to) {
  if (existsSync(from) && !existsSync(to)) {
    renameSync(from, to);
    console.log(`[restore-static-export] restored ${to}`);
  }
}

restoreDir("app/_actions_server", "app/actions");
restoreDir("app/_auth_server", "app/auth");
restoreDir("app/_hub_server", "app/hub");
restoreDir("app/_login_server", "app/login");

if (existsSync("middleware.static-export.ts") && !existsSync("middleware.ts")) {
  renameSync("middleware.static-export.ts", "middleware.ts");
  console.log("[restore-static-export] restored middleware.ts");
}

const libRestores = [
  ["lib/submit-booking.server.ts", "lib/submit-booking.ts"],
  ["lib/submit-contact.server.ts", "lib/submit-contact.ts"],
  ["lib/stripe-setup.server.ts", "lib/stripe-setup.ts"],
  ["lib/booking-availability.server.ts", "lib/booking-availability.ts"],
];

for (const [from, to] of libRestores) {
  if (existsSync(from)) {
    copyFileSync(from, to);
    console.log(`[restore-static-export] restored ${to}`);
  }
}
