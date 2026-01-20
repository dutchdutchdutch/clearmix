---
description: Run unit tests for ClearMix calculations and validation
---

# Run Tests Workflow

This workflow ensures that the test suite is executed automatically during verification builds and whenever specifications change.

## Steps
1. **Activate virtual environment**
   ```bash
   source .venv/bin/activate
   ```
2. **Run pytest**
   ```bash
   pytest tests/ -q
   ```
3. **Fail the build if any test fails** – the exit code from `pytest` will cause the CI step to abort.

## Maintenance
- When input ranges or calculation logic are updated, modify the corresponding tests in `tests/test_calculations.py`.
- Re‑run the workflow to verify that the updated specs are covered.

**Note**: This workflow can be invoked manually via `./run_workflow.sh run_tests` or integrated into any CI system you prefer.
