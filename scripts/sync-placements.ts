/**
 * Push this platform's placement manifest to the Cayworks Ad Engine (Option B).
 *
 *   npm run ads:sync            # non-destructive: create/update only
 *   npm run ads:sync -- --prune # also deactivate engine placements not in the
 *                               # manifest (use deliberately)
 *
 * Requires AD_ENGINE_KEY (and optionally AD_ENGINE_BASE_URL / AD_ENGINE_PLATFORM)
 * in the environment — loaded here from .env.local via @next/env, the same way
 * Next does at runtime. Safe to re-run: the engine reconciles idempotently.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const prune = process.argv.includes("--prune");
  // Imported after env is loaded so the module reads a populated process.env.
  const { syncPlacements } = await import("../src/lib/ad-engine");
  const { PLACEMENT_MANIFEST } = await import("../src/components/ads/placements");

  const result = await syncPlacements(PLACEMENT_MANIFEST, { prune });

  if (!result.ok) {
    console.error(`✗ Placement sync failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`✓ Synced ${PLACEMENT_MANIFEST.length} placements to ${result.platform ?? "engine"}`);
  if (result.created.length) console.log(`  created: ${result.created.join(", ")}`);
  if (result.updated.length) console.log(`  updated: ${result.updated.join(", ")}`);
  if (result.stale.length) {
    console.log(
      `  stale  : ${result.stale.join(", ")}${result.pruned ? " (deactivated)" : " (run with --prune to deactivate)"}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
