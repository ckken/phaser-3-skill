# Changelog

## 2026-02-15

### Added
- `phaser-developer/SKILL.md` 第一版核心文档（触发场景、快速开始、核心概念、模式示例）
- `references/core-architecture.md`
- `references/game-objects.md`
- `references/physics.md`
- `references/input.md`
- `references/animation.md`
- `references/camera-audio.md`
- `references/patterns.md`
- `references/scene-api.md`（Scene API 高覆盖与参数说明）

### Changed
- 更新 `SKILL.md` 文档索引，接入新 references

### Removed
- 删除模板示例文件：
  - `assets/example_asset.txt`
  - `scripts/example_script.cjs`
  - `references/example_reference.md`

### Changed (Structure)
- 目录重构：从 `packages/phaser-skill/phaser-developer/` 迁移到项目根目录 `skills/phaser-developer/`
- `STATUS.md` 与 `CHANGELOG.md` 提升到项目根目录，便于直接查看
- `phaser-docs.md` 迁移到 `skills/phaser-docs.md`

### Notes
- 当前策略：主文档做高密度索引，细节下沉 references，降低 token 消耗并提升可检索性。


## 2026-02-15 (update)

### Added
- `skills/phaser-developer/references/api-signature-index.md`（方法签名索引）

### Changed
- `STATUS.md` 勾选“方法级签名索引”完成项


## 2026-02-15 (parameter update)

### Added
- `skills/phaser-developer/references/parameter-reference.md`（参数类型与默认值参考）

### Changed
- `STATUS.md` 勾选“参数类型表（可选值/默认值）”完成项
