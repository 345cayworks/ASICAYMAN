import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config — defaults are fine for now. When we move incremental
// cache off the Worker (e.g. to R2 or KV), customise here.
export default defineCloudflareConfig({});
