# ⚔️ RPG LIFE

ブラウザで遊べるリアルタイムオンライン RPG。採取・釣り・ダンジョン・市場・ギャンブルなど多彩なコンテンツを Firebase で同期しながら複数プレイヤーで楽しめます。

---

## 🎮 ゲーム概要

| 機能 | 説明 |
|---|---|
| 採取 | 木・岩・鉱石などを採取してアイテムを集める |
| 釣り | FFGG・GGR など複数モードの釣りミニゲーム |
| ダンジョン | 段階的に解放されるダンジョンでモンスターと戦闘 |
| 市場 | アイテムを売買。オークション出品も可能 |
| ギャンブル | コインフリップ・スロット・ポーカー・PvP対戦 |
| オンライン | 掲示板・オークション・ランキング・活動ログ |
| クラフト | 素材を組み合わせてアイテムを製作 |

---

## 🚀 起動方法

```bash
# 依存関係インストール
npm install

# 開発サーバー起動（http://localhost:5173）
npm run dev

# プロダクションビルド
npm run build
```

---

## 🔥 Firebase 設定

### 1. Firebase プロジェクト作成

[Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成し、以下を有効化してください：

- **Authentication** — Google ログイン
- **Firestore Database**
- **Hosting**（任意）

### 2. 環境変数

プロジェクトルートに `.env` ファイルを作成：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore セキュリティルール

```bash
firebase deploy --only firestore:rules
```

`firestore.rules` に本番用ルールが記述されています。主な制約：

- プレイヤーは自分のデータのみ読み書き可能
- 1回の更新で gold が 5 万 G 以上増加する更新は拒否
- オークション・ギャンブル対戦は認証済みユーザーのみ

### 4. Firestore インデックス

ギャンブル対戦一覧のクエリに **複合インデックス不要**（`where status == waiting` のみ使用、クライアント側でソート）。

---

## 📦 デプロイ方法

```bash
# Firebase Hosting へデプロイ
npm run build
firebase deploy --only hosting

# Cloud Functions もデプロイ（オークション購入をサーバー側で処理する場合）
cd functions
npm install
firebase deploy --only functions
```

---

## 📁 フォルダ構成

```
src/
├── App.tsx                  # ルートコンポーネント・タブナビ・ステータスバー
├── components/
│   ├── icons.tsx            # 全アイコン SVG コンポーネント（116種）
│   └── screens/
│       ├── AdminScreen.tsx  # 管理者パネル（ADMIN ロールのみ）
│       ├── DungeonScreen.tsx
│       ├── FishingScreen.tsx
│       ├── GambleScreen.tsx
│       ├── GatheringScreen.tsx
│       ├── MarketScreen.tsx
│       ├── OnlineScreen.tsx
│       └── StatusScreen.tsx
├── data/
│   └── masters.ts           # 全マスターデータ（アイテム・モンスター・ダンジョン等）
├── hooks/
│   ├── useAuth.ts           # Firebase Auth + プレイヤーデータ読み込み
│   └── useAutoSave.ts       # 自動セーブ（30秒・ページ離脱・localStorage バックアップ）
├── services/
│   ├── database.ts          # Firestore CRUD
│   ├── firebase.ts          # Firebase 初期化
│   └── multiplayer.ts       # オンライン機能（オークション・掲示板・対戦）
├── stores/
│   ├── gameStore.ts         # Zustand ストア（スライスパターン）
│   └── slices/
│       ├── playerSlice.ts   # HP・gold・アイテム・EXP
│       ├── dungeonSlice.ts  # クリア記録・解放判定
│       ├── fishingSlice.ts  # 釣りスコア・バフ・装備
│       └── reliefSlice.ts   # 緊急救済措置
├── systems/
│   └── minigames.ts         # ミニゲームロジック（純粋関数）
├── types/
│   └── game.ts              # 型定義
└── utils/
    └── random.ts            # セキュアな乱数ユーティリティ（crypto.getRandomValues）

functions/
└── src/
    └── index.ts             # Cloud Functions（オークション・ギャンブル・チート検知）

firestore.rules              # Firestore セキュリティルール
```

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| 状態管理 | Zustand（スライスパターン） |
| バックエンド | Firebase（Auth / Firestore / Hosting） |
| サーバー処理 | Cloud Functions for Firebase（オプション） |
| スタイル | インラインスタイル（CSS-in-JS ライブラリ不使用） |
| アイコン | フルカスタム SVG（絵文字不使用） |
| 乱数 | `crypto.getRandomValues()` ベースのセキュア乱数 |

---

## 🔒 セキュリティ

- **Firestore Rules**: プレイヤーは自分のドキュメントのみ書き込み可能。gold の急増を検知してルールレベルで拒否
- **セキュア乱数**: `Math.random()` をすべて `crypto.getRandomValues()` ベースの関数に置換済み
- **チート検知 (Cloud Functions)**: `functions/src/index.ts` に不審な gold 増加を検知する Firestore トリガーを用意
- **オークション**: Cloud Functions のトランザクションで gold の二重消費を防止（現在はクライアント処理、移行推奨）

---

## 💾 セーブシステム

- **自動セーブ**: 30 秒ごとに Firestore へ自動保存
- **ページ離脱時**: `beforeunload` で localStorage にバックアップ保存
- **失敗時復元**: Firestore 保存失敗時はローカルバックアップを維持し、次回ログイン時に通知
- **手動セーブ**: ヘッダーの 💾 ボタンで任意のタイミングで保存

---

## 👤 管理者設定

Firebase Console → Authentication → ユーザー → カスタムクレームで `{ "admin": true }` を設定すると管理者パネルにアクセスできます。

```javascript
// Firebase Admin SDK で設定
admin.auth().setCustomUserClaims(uid, { admin: true });
```
