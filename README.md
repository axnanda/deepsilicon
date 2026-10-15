# deepsilicon.com

Static recreation of the deepsilicon landing page as it was on
[2024-09-19](https://web.archive.org/web/20240919040711/https://deepsilicon.com/).

The production site was a Vite + React app backed by Supabase (model catalog,
fine-tuning, hosting console). The Supabase project no longer exists, so this
rebuild keeps only the public landing page:

- `docs/index.html` reproduces the original React markup as plain HTML.
- `docs/assets/index.css` is the original production stylesheet, byte-for-byte,
  except the footer LinkedIn icon path (that PNG was never archived; it is
  redrawn as `linkedin-logo.svg`).
- "Models", "Console", "Build Now" and the footer "LinkedIn" link are inert:
  they keep their hover effects and pointer but go nowhere, since the console
  they led to is gone.
- `docs/404.html` sends old app routes (`/models`, `/login`, ...) to the landing page.
- Phone fixes the original lacked: no sideways scroll, step cards fit screens under
  390px, the footer fits under 375px, and the mobile menu closes when the window
  widens past 600px. At 390px and up, the page renders identically to the original.

Served by GitHub Pages from `docs/` on `main`.

## Checking fidelity

`tools/serve.py` serves a directory with SPA fallback, `tools/shoot.mjs` takes
full-page screenshots at 1440/1280/834/390px, and `tools/diff.py` pixel-diffs two
screenshot sets. Against the archived original bundle, the rebuild differs by
< 0.02% of pixels, all of it the restored LinkedIn icon.
