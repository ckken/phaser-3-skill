# Slot Demo Flow

## 1) Spin Runtime Flow

```mermaid
flowchart TD
  A[Click SPIN] --> B[Read State: balance bet spinning]
  B --> C{Valid?\nnot spinning & balance>=bet}
  C -- No --> X[Ignore / return]
  C -- Yes --> D[Deduct bet\nbalance -= bet]
  D --> E[Set spinning=true\nDisable button]
  E --> F[Rolling animation\nupdate 3x3 symbols]
  F --> G[Stop reels sequentially\ncol1 -> col2 -> col3]
  G --> H[Build finalGrid]
  H --> I[Evaluate 5 lines\nmid top bottom diag\\ diag/]
  I --> J[Count hits]
  J --> K[Compute win]
  K --> L[balance += win\nUpdate HUD]
  L --> M{win>0?}
  M -- Yes --> N[FX: flash/highlight/pop text]
  M -- No --> O[Normal end]
  N --> P[spinning=false\nEnable button]
  O --> P
```

---

## 2) Architecture Flow

```mermaid
flowchart LR
  A[React App\nHUD + Bet + Spin Button] --> B[SlotGameView\nReact-Phaser bridge]
  B --> C[SlotScene\nGame logic]

  C --> C1[create\nlayout + reels + init]
  C --> C2[spin\ndeduct -> animate -> stop]
  C --> C3[payout\n5-line evaluate]

  C --> D[Callbacks]
  D --> A
```

---

## 3) Core State

- `balance`: current coins
- `bet`: wager per spin
- `spinning`: lock state for spin action
- `finalGrid[3][3]`: resolved symbols for settlement
- `hits`: number of winning lines
- `win`: payout amount of current spin
