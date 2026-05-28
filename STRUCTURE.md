# プロジェクト構造

```
rpg-game/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動デプロイ
├── public/
│   └── favicon.ico
├── src/
│   ├── types/
│   │   └── game.ts             # ゲーム全体の型定義（Player, Item, Monster, etc.）
│   ├── data/
│   │   └── masters.ts          # マスターデータ（ITEM_MASTER, MONSTER_MASTER, etc.）
│   ├── services/
│   │   ├── firebase.ts         # Firebase初期化
│   │   └── database.ts         # Firestoreとのデータ通信
│   ├── stores/
│   │   └── gameStore.ts        # Zustandによるグローバルゲーム状態
│   ├── hooks/
│   │   ├── useAuth.ts          # 認証フック
│   │   └── useAutoSave.ts      # 自動セーブフック
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── screens/
│   │       ├── GatheringScreen.tsx   # 採取画面
│   │       ├── MarketScreen.tsx      # 市場/ショップ画面
│   │       ├── DungeonScreen.tsx     # ダンジョン/PvE画面
│   │       └── GambleScreen.tsx     # ギャンブル画面
│   ├── App.tsx                 # メインアプリ（タブ管理）
│   ├── main.tsx
│   └── index.css
├── .env.example                # 環境変数テンプレート
├── firebase.json               # Firebase Hosting設定
├── .firebaserc                 # Firebaseプロジェクト設定
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 設計方針
- **マスターデータ分離**: `data/masters.ts` にすべてのゲームデータを集約
- **疎結合**: 各システムは独立したモジュールとして実装
- **State-first**: Firestoreへの書き込みは手動セーブ時のみ（無料枠対策）
- **型安全**: すべての重要データはTypeScriptの型で保護
