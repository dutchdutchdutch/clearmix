# Archive

Snapshots of files removed from the live tree. Kept for reference only — not built, not deployed, not imported by anything in `site/` or `build/`.

## Contents

- **`execution-build-2026-01-30/`** — an early Frozen-Flask output written before [`site/freeze.py`](../site/freeze.py) was retargeted to the repo-root `build/` directory (commit `20bd338 packaged up for deployment`). Contains a stale `index.html` with no build-date footer, plus the matching `static/` assets and `health` file. The folder name preserves the original location (the source folder was named `execution/` at the time and has since been renamed to `site/`).
