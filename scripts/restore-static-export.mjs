#!/usr/bin/env node
import { existsSync, renameSync } from "node:fs";

const actionsFrom = "app/_actions_server";
const actionsTo = "app/actions";

if (existsSync(actionsFrom) && !existsSync(actionsTo)) {
  renameSync(actionsFrom, actionsTo);
  console.log("[restore-static-export] restored app/actions");
}
