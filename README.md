# phaser-3-skill

Phaser skill docs + Bun workspace demo.

## Workspace

- `skills/` -> skill docs (canonical path)
- `packages/phaser-demo/` -> runnable Phaser demo

## Run demo locally

```bash
bun install
bun run demo:dev
```

## Build demo

```bash
bun run demo:build
```

## GitHub Pages

Workflow file:
- `.github/workflows/deploy-pages.yml`

After enabling **Pages -> Source: GitHub Actions**, each push to `main` will deploy:
- `https://ckken.github.io/phaser-3-skill/`
