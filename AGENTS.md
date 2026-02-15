# AGENTS.md

## Repository Conventions (Must Follow)

1. **Skill path is fixed at project root**
   - Canonical skill entry: `skills/phaser-developer/SKILL.MD`
   - Skill references: `skills/phaser-developer/references/*`
   - Do **not** migrate skill files into `packages/`.

2. **`packages/` is reserved for runtime/workspace code**
   - Use `packages/` for project/demo/public libraries only.
   - Current expected use:
     - `packages/phaser-demo` for runnable demo(s)
     - other shared libs/workspace packages as needed

3. **When restructuring, preserve this split**
   - `skills/` = documentation/agent skill assets
   - `packages/` = executable code and reusable libraries

4. **Before commit/push, verify layout**
   - Ensure `skills/phaser-developer/SKILL.MD` exists
   - Ensure skill content is not under `packages/`

This file is added to prevent future path regressions.
