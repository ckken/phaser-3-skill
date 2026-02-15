# Phaser 3 AI Documentation Outline

This document provides a structured overview of Phaser 3 for AI consumption, focusing on core concepts, API structure, and common patterns.

## 1. Core Architecture
- **Game Instance**: The central controller (`Phaser.Game`).
- **Scenes**: Modular game states (`Phaser.Scene`). Lifecycle: `init()`, `preload()`, `create()`, `update()`.
- **Game Objects**: Everything visible (Sprites, Images, Text, Containers).
- **Systems**: Internal modules (Input, Physics, Sound, Time, Tweens).

## 2. Scenes and Lifecycle
- **Configuration**: Scene keys, active state, data passing.
- **Preload**: Loading assets (images, spritesheets, audio, JSON).
- **Create**: Initializing game objects and logic.
- **Update**: The main game loop (delta time handling).

## 3. Game Objects
- **Sprites & Images**: Positioning, scaling, rotation, origin/anchor.
- **Animations**: Creating and playing frame-based animations.
- **Containers**: Grouping objects for relative transforms.
- **Graphics**: Procedural drawing (lines, shapes).
- **Text**: Web fonts, bitmap fonts, and styling.

## 4. Physics Systems
- **Arcade Physics**: High-performance, AABB-based (velocity, acceleration, drag, collision, overlap).
- **Matter.js**: Full rigid-body physics (constraints, compound bodies).

## 5. Input Handling
- **Keyboard**: Keys, combos, and event listeners.
- **Pointer**: Mouse/touch events on objects and the stage.
- **Input Management**: Drag and drop, interactive areas.

## 6. Tweens and Timelines
- **Tweens**: Property animation over time (ease, duration, yoyo, repeat).
- **Timelines**: Sequencing multiple tweens.

## 7. Camera and UI
- **Cameras**: Follow, zoom, fade, shake, multiple viewports.
- **UI Strategies**: Layering scenes (HUD scene vs. Game scene).

## 8. Asset Management
- **Loaders**: `this.load.image`, `this.load.spritesheet`, `this.load.atlas`.
- **Texture Manager**: Managing textures at runtime.

## 9. Best Practices for AI
- Use `arcade` physics for most 2D gameplay.
- Leverage `Scenes` for UI and Menu separation.
- Use `Container` for complex nested objects.
- Prefer `Texture Atlas` over individual images for performance.
