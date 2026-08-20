import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
// Explicitly tell OpenNext to run "npm run build:next" so "npm run build" can safely run OpenNext without recursion
config.buildCommand = "npm run build:next";

export default config;
