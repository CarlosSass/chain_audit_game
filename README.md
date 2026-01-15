# Chain Audit Game 🔗🔍

Blockchain Security Audit Multiplayer Game - A social deduction game where players analyze blockchain transaction logs, find vulnerabilities, and identify hidden saboteurs.

## 🎮 Game Features

- **10 Unique Scenarios**: DeFi exploits, NFT vulnerabilities, DAO attacks, and more
- **3 Roles**: Auditor, Saboteur, Supervisor
- **Multiplayer**: 3-5 players per game (AI fills remaining slots)
- **GEN Token Economy**: Entry fees and rewards
- **On-chain State**: All game data stored on GenLayer blockchain

## 📁 Project Structure

```
blockchain-audit-deploy/
├── contracts/
│   └── chain_audit_game.py      # GenLayer Intelligent Contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app with GenLayer integration
│   │   ├── BlockchainAuditGame.jsx  # Game component
│   │   ├── genlayer.js          # GenLayer client utilities
│   │   └── main.jsx             # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── .env.example
└── README.md
```

---

## 🚀 Deployment Guide

### Part 1: Deploy Smart Contract to GenLayer Studio

#### Step 1: Install GenLayer CLI

```bash
npm install -g genlayer
```

#### Step 2: Initialize GenLayer Studio

```bash
genlayer init
```

Follow the prompts to:
- Select LLM provider (Llama3/OpenAI/Heurist)
- Configure API keys if needed
- Start Docker containers

#### Step 3: Access GenLayer Studio

Open browser: http://localhost:8080

#### Step 4: Deploy Contract

1. Click **"+ New Contract"** in GenLayer Studio
2. Copy contents of `contracts/chain_audit_game.py`
3. Paste into the editor
4. Click **"Deploy"**
5. **Copy the contract address** - you'll need this for the frontend

#### Step 5: Test Contract

In GenLayer Studio, test the contract methods:

```python
# Register a player
register_player("TestPlayer")

# Check balance
get_player_balance("0x...")

# Create a game
create_game()

# Get contract stats
get_contract_stats()
```

---

### Part 2: Deploy Frontend to Vercel

#### Step 1: Configure Environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_NETWORK=testnet
VITE_CONTRACT_ADDRESS=0x... # Your deployed contract address
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Test Locally

```bash
npm run dev
```

Open http://localhost:3000

#### Step 4: Deploy to Vercel

**Option A: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
```

**Option B: GitHub Integration**

1. Push code to GitHub repository
2. Go to https://vercel.com/new
3. Import your repository
4. Configure environment variables:
   - `VITE_NETWORK`: `testnet`
   - `VITE_CONTRACT_ADDRESS`: Your contract address
5. Click Deploy

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_NETWORK` | Network mode | `studio` or `testnet` |
| `VITE_CONTRACT_ADDRESS` | Deployed contract address | `0x1234...` |

### Network Configurations

**GenLayer Studio (Local)**
- RPC URL: `http://localhost:4000/api`
- Chain ID: 1

**GenLayer Testnet**
- RPC URL: `https://testnet.genlayer.com/api`
- Chain ID: 10

---

## 📋 Contract API Reference

### Write Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `register_player(name)` | `name: str` | Register new player with 100 GEN |
| `create_game()` | - | Create game (5 GEN fee) |
| `join_game(game_id)` | `game_id: int` | Join existing game |
| `start_game(game_id)` | `game_id: int` | Start game, assign roles |
| `submit_vote(game_id, voted_address)` | `game_id: int, voted_address: Address` | Vote for saboteur |
| `start_voting(game_id)` | `game_id: int` | Transition to voting phase |
| `finalize_game(game_id)` | `game_id: int` | Calculate results, distribute rewards |

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `get_player(address)` | `Player` | Get player info |
| `get_player_balance(address)` | `int` | Get GEN balance |
| `get_active_games()` | `List[int]` | List active game IDs |
| `get_game_info(game_id)` | `ActiveGame` | Get active game state |
| `get_game_history(game_id)` | `GameRecord` | Get completed game record |
| `get_leaderboard()` | `List[Player]` | Top 20 players by rewards |
| `get_contract_stats()` | `dict` | Overall statistics |

---

## 🎯 Game Rules

### Roles

| Role | Count | Goal |
|------|-------|------|
| 🔍 Auditor | 2-3 | Find vulnerabilities, catch Saboteur |
| 💀 Saboteur | 1 | Spread misinformation, avoid detection |
| 👁 Supervisor | 1 | Guide team, identify Saboteur |

### Phases

1. **Matching (30s)**: Players join, AI fills remaining slots
2. **Discussion (3 min)**: Analyze logs, discuss findings
3. **Voting (1 min)**: Vote for suspected Saboteur
4. **Results**: Reveal roles, distribute rewards

### Rewards

| Outcome | Auditor | Saboteur | Supervisor |
|---------|---------|----------|------------|
| Saboteur Caught | +25 GEN | +5 GEN | +40 GEN |
| Saboteur Escapes | +10 GEN | +50 GEN | +15 GEN |

---

## 🛠 Development

### Local Development

```bash
# Start GenLayer Studio
genlayer init

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

### Build for Production

```bash
cd frontend
npm run build
```

---

## 🔒 Security Notes

- Never commit `.env.local` with real keys
- Contract uses GenLayer's consensus for randomness
- All game state is verifiable on-chain
- Entry fees prevent spam/abuse

---

## 📚 Resources

- [GenLayer Documentation](https://docs.genlayer.com)
- [GenLayer Studio](https://studio.genlayer.com)
- [Vercel Documentation](https://vercel.com/docs)

---

Built with ❤️ using GenLayer Intelligent Contracts
