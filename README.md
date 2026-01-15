# Chain Audit Game 🔗🔍

## 部署到 Vercel

### 方法1: 直接上传 (推荐)

1. 解压此zip文件
2. 访问 https://vercel.com/new
3. 选择 "Upload" 或拖拽整个文件夹上传
4. Vercel会自动检测Vite项目并构建

### 方法2: Git部署

```bash
# 1. 初始化git仓库
git init
git add .
git commit -m "Initial commit"

# 2. 推送到GitHub
git remote add origin https://github.com/你的用户名/chain-audit-game.git
git push -u origin main

# 3. 在Vercel中导入GitHub仓库
```

### 方法3: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 本地测试

```bash
npm install
npm run dev
```

打开 http://localhost:5173

## GenLayer合约部署

合约文件在 `contracts/chain_audit_game.py`

1. 访问 https://studio.genlayer.com
2. 创建新合约
3. 粘贴 chain_audit_game.py 内容
4. 点击 Deploy

## 文件结构

```
├── index.html          # 入口HTML
├── package.json        # 依赖配置
├── vite.config.js      # Vite构建配置
├── vercel.json         # Vercel部署配置
├── src/
│   ├── main.jsx        # React入口
│   ├── App.jsx         # 主组件
│   └── BlockchainAuditGame.jsx  # 游戏组件
└── contracts/
    └── chain_audit_game.py     # GenLayer智能合约
```
