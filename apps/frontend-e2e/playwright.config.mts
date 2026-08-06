import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly. Playwright's configLoader auto-discovers
 * `playwright.config.mts` via its extension list
 * (.ts/.js/.mts/.mjs/.cts/.cjs).
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  /* Each spec here is scoped to one behavior and starts from its own fresh
   * signup, so a failure names the feature that broke instead of surfacing
   * as an opaque mid-journey `locator.click` timeout — which is exactly
   * what the previous single 375-line journey produced. quest-loop.spec.ts
   * stays deliberately sequential (create → start → complete ×3 → reload),
   * because the property *it* proves is that state survives every step in
   * order; the rest were extracted around it.
   *
   * Still generous: every test does a real signup, character creation, and
   * WebGL scene mount before its actual assertions, and on a shared CI
   * runner with workers contending that setup alone can eat Playwright's
   * 30s default. */
  timeout: 120_000,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests.
   *
   * The trailing `--verbose=false` is load-bearing, not cosmetic:
   * @nx/playwright's plugin pattern-matches an *exact* `nx run
   * project:target` command (anchored end-of-string) and auto-creates an Nx
   * task dependency on frontend:serve in *addition to* Playwright's own
   * reuseExistingServer readiness check — two independent things racing to
   * start/detect the same server, which trips Nx's own recursive-invocation
   * guard intermittently (a pre-existing, Nx-flagged "flaky task"; not
   * something introduced here). This workspace has no angular.json, so `ng
   * serve` directly isn't an option — the trailing flag is the minimal
   * change that dodges the regex while keeping the real, working `nx run`
   * invocation as the sole owner of the server's lifecycle. */
  webServer: {
    command: 'pnpm exec nx run frontend:serve --verbose=false',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Headless Firefox on a GPU-less CI runner blocks hardware WebGL
        // and, unlike Chromium (bundled SwiftShader) and WebKit, doesn't
        // fall back to software rendering on its own — isWebglAvailable()
        // then correctly reports false and character-select.spec.ts's
        // canvas.stage__canvas assertion fails, even though the app itself
        // is working correctly. This forces Firefox's WebGL context
        // creation past the hardware-acceleration blocklist so it uses its
        // software rasterizer instead, matching the other two engines.
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
          },
        },
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
