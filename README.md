# determinant-game

行列式の変形・展開を学習する React + Vite アプリです。

## セットアップ（macOS）

> **重要**: `~/path/to/determinant-game` は説明用のプレースホルダです。実在するフォルダ名に置き換えてください。

1. まずリポジトリを clone します。

```bash
git clone https://github.com/poohphd-kit/determinant-game.git
cd determinant-game
```

2. `package.json` に `"name": "determinant-game"` と `scripts.build` があることを確認します。

```bash
pwd
cat package.json | head -n 20
npm run
```

`npm run` の出力に `build` が出れば正しいディレクトリです。

3. 依存関係を入れてビルドします。

```bash
npm install
npm run build
```

## `Missing script: "build"` が出るとき

ほぼ確実に **別プロジェクトのディレクトリで実行しています**。以下で位置を確認してください。

```bash
pwd
cat package.json
```

`determinant-game` ではない内容（例: `tailwindcss` だけの `package.json`）が出る場合は、正しいリポジトリに移動してください。

```bash
find ~ -maxdepth 4 -type d -name "determinant-game"
cd <見つかったパス>
```

## `zsh: parse error near ')'` が出るとき

`npm run)` のように余計な `)` が入力されています。次を **1行ずつ** 手入力してください。

```bash
npm run
npm run build
```
