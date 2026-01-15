import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============= GAME SCENARIOS LIBRARY =============
const GAME_SCENARIOS = [
  {
    id: 1,
    title: "Flash Loan Arbitrage Exploit",
    category: "DeFi",
    difficulty: "Advanced",
    logs: `Block Height: #15428763
[1] User A borrows 10,000 ETH from dYdX (Flash Loan)
[2] Swaps 10,000 ETH for DAI on Uniswap V2 (Rate: 1 ETH = 3,800 DAI)
[3] Swaps DAI for ETH on SushiSwap (Rate: 1 ETH = 3,820 DAI)
[4] Repays flash loan of 10,000 ETH
[5] Profit: 52.36 ETH transferred to User A's address`,
    vulnerabilityType: "Price Manipulation Attack",
    hiddenAnomaly: "The swap in step [3] used a pre-manipulated liquidity pool",
    auditClue: "Check if the liquidity change timestamps on both exchanges are suspiciously close",
    correctAnswer: "price_manipulation"
  },
  {
    id: 2,
    title: "NFT Minting Permission Bypass",
    category: "NFT",
    difficulty: "Intermediate",
    logs: `Contract: MoonbirdsClone (0x7E9a...)
[1] User B calls mintPublic(quantity: 5) - Success
[2] User B calls mintPublic(quantity: 5) - Success
[3] User B calls mintPublic(quantity: 5) - Success
[4] User B transfers 15 NFTs to new address
[5] Total minted: 15/10,000`,
    vulnerabilityType: "Missing Re-mint Protection",
    hiddenAnomaly: "Contract doesn't record minted addresses, allowing unlimited mints from same address",
    auditClue: "Check if mintPublic function calls _checkMintLimit modifier",
    correctAnswer: "missing_limit_check"
  },
  {
    id: 3,
    title: "Governance Proposal Hijack",
    category: "DAO",
    difficulty: "Advanced",
    logs: `DAO: UniWhales Governance
Proposal #47: "Allocate 20% of treasury ETH to core contributors"
[1] Proposal created by: User C (holds 0.01% tokens)
[2] Snapshot time: Block #15428700
[3] Current votes: 
   - For: 42% (mainly from 3 new addresses)
   - Against: 15%
   - Abstain: 43%
[4] Voting deadline: 2 hours remaining`,
    vulnerabilityType: "Vote Borrowing Attack",
    hiddenAnomaly: "Voting power of 3 new addresses comes from the same flash loan pool",
    auditClue: "Check token holding duration of voting addresses, verify if temporarily borrowed",
    correctAnswer: "vote_borrowing"
  },
  {
    id: 4,
    title: "Staking Reward Calculation Error",
    category: "DeFi",
    difficulty: "Intermediate",
    logs: `Staking Contract: StellarFarm v2
[1] User D stakes 100,000 USDC
[2] After 7 days, User D withdraws:
   - Principal: 100,000 USDC
   - Rewards: 15,732 USDC (APY: 820%)
[3] Total staked in contract: 1,200,000 USDC
[4] Reward pool balance: 35,000 USDC`,
    vulnerabilityType: "Integer Overflow / Reward Over-issuance",
    hiddenAnomaly: "Reward calculation uses incorrect multiplier (1000x error)",
    auditClue: "Check reward calculation formula: reward = principal * rate * time / precision",
    correctAnswer: "integer_overflow"
  },
  {
    id: 5,
    title: "Multisig Timelock Bypass",
    category: "Multisig",
    difficulty: "Advanced",
    logs: `Multisig Wallet: 3/5 Gnosis Safe
Pending Transaction #89:
[1] Transfer funds: 500 ETH → External address
[2] Signed by: Address A, Address B, Address C
[3] Submission time: 2024-03-15 14:30:00 UTC
[4] Execution time: 2024-03-15 14:31:00 UTC
[5] Timelock setting: Minimum 24 hours`,
    vulnerabilityType: "Timelock Configuration Error",
    hiddenAnomaly: "Timelock contract not properly connected to multisig wallet",
    auditClue: "Check if timelock contract owner is the multisig wallet address",
    correctAnswer: "timelock_bypass"
  },
  {
    id: 6,
    title: "Oracle Data Manipulation",
    category: "DeFi",
    difficulty: "Advanced",
    logs: `Lending Protocol: Atlantis Lend
[1] User E deposits collateral: 100 BTC (value $4,200,000)
[2] User E borrows: 2,800,000 USDT (collateral ratio: 66%)
[3] Price update: BTC/USD from $42,000 → $38,000
[4] Liquidation triggered: User E's position liquidated
[5] Liquidation price: $38,000 (from Chainlink)
[6] Other exchange average: $41,500`,
    vulnerabilityType: "Oracle Flash Unbinding Attack",
    hiddenAnomaly: "Chainlink oracle used abnormally low minimum responder count during update",
    auditClue: "Check oracle aggregator's minimum responder parameter",
    correctAnswer: "oracle_manipulation"
  },
  {
    id: 7,
    title: "Token Transfer Tax Vulnerability",
    category: "Token",
    difficulty: "Intermediate",
    logs: `Token: TaxToken (TAX)
[1] User F buys: 100,000 TAX (worth 10 ETH)
[2] User F transfers to User G: 100,000 TAX
[3] User G receives: 99,000 TAX (1% transfer tax)
[4] User G transfers back to User F: 99,000 TAX
[5] User F receives: 100,980 TAX
[6] Tax contract balance: Should hold 1,980 TAX, actually holds 0`,
    vulnerabilityType: "Tax Distribution Logic Error",
    hiddenAnomaly: "Tax tokens incorrectly sent to burn address without updating total supply",
    auditClue: "Check tax distribution logic in _transfer function",
    correctAnswer: "tax_logic_error"
  },
  {
    id: 8,
    title: "Cross-chain Bridge Signature Vulnerability",
    category: "Bridge",
    difficulty: "Advanced",
    logs: `Cross-chain Bridge: Orion Bridge (ETH → BSC)
[1] User H locks on ETH chain: 50 ETH
[2] Proof generated: Included in block #15428745
[3] User H redeems on BSC chain: 50 ETH
[4] 5 minutes later, same User H redeems again on BSC: 50 ETH
[5] Bridge contract BSC balance: Decreased by 100 ETH in short time`,
    vulnerabilityType: "Signature Replay Attack",
    hiddenAnomaly: "Cross-chain message lacks unique nonce, allowing duplicate redemptions",
    auditClue: "Check if verification function validates proof uniqueness",
    correctAnswer: "replay_attack"
  },
  {
    id: 9,
    title: "Liquidity Pool Infinite Mint",
    category: "DEX",
    difficulty: "Advanced",
    logs: `DEX: Cronos Swap
Liquidity Pool: CRO/USDC
[1] User I adds liquidity: 10,000 CRO + 3,800 USDC
[2] Receives LP tokens: 380.45 CROUSDC-LP
[3] User I immediately removes liquidity:
   - Receives: 20,000 CRO + 7,600 USDC
   - LP tokens burned: 380.45
[4] Pool balance change:
   - Before: 100,000 CRO + 38,000 USDC
   - After: 90,000 CRO + 33,400 USDC`,
    vulnerabilityType: "Mint Function Missing Input Balance Check",
    hiddenAnomaly: "Adding liquidity doesn't verify if CRO/USDC ratio is correct",
    auditClue: "Check balance validation in addLiquidity function",
    correctAnswer: "mint_validation_error"
  },
  {
    id: 10,
    title: "Airdrop Claim Permission Leak",
    category: "Airdrop",
    difficulty: "Intermediate",
    logs: `Airdrop Contract: Arbitrum Odyssey Airdrop
[1] User J calls claim(proof, amount: 500 ARB) - Success
[2] User K calls claim(proof, amount: 500 ARB) - Success
[3] User L calls claim(using User J's proof, amount: 500 ARB) - Success
[4] Total claimed: 1,500 ARB
[5] Should have claimed: 1,000 ARB`,
    vulnerabilityType: "Merkle Proof Not Marked as Used",
    hiddenAnomaly: "Contract doesn't store used proof hashes",
    auditClue: "Check if claim function sets proofUsed mapping",
    correctAnswer: "proof_reuse"
  }
];

// ============= AI PLAYER NAMES =============
const AI_NAMES = [
  "SatoshiBot", "VitalikAI", "CryptoHunter", "ChainGuard", 
  "BlockSleuth", "HashMaster", "NodeRunner", "SmartAuditor",
  "GasOptimizer", "MevBot", "FlashLoanFinder", "RugPullDetector"
];

// ============= ROLE DEFINITIONS =============
const ROLES = {
  AUDITOR: { name: "Auditor", color: "#00ff88", icon: "🔍", description: "Find vulnerabilities in transaction logs" },
  SABOTEUR: { name: "Saboteur", color: "#ff4444", icon: "💀", description: "Hide vulnerabilities and mislead other players" },
  SUPERVISOR: { name: "Supervisor", color: "#4488ff", icon: "👁", description: "Identify the saboteur and protect audit results" }
};

// ============= GAME RULES =============
const GAME_RULES = {
  overview: "ChainAudit is a multiplayer social deduction game focused on blockchain security. Players analyze transaction logs to find vulnerabilities while identifying hidden saboteurs.",
  roles: [
    { role: "Auditor", desc: "Your goal is to correctly identify vulnerabilities in the transaction logs and vote out the Saboteur." },
    { role: "Saboteur", desc: "Blend in with auditors, spread misinformation, and avoid being detected. Win if you're not voted out." },
    { role: "Supervisor", desc: "You have special insight. Help guide the team to identify the Saboteur while appearing as a regular Auditor." }
  ],
  phases: [
    { phase: "Matching", desc: "Wait for players to join (30s). AI fills remaining slots if needed.", time: "30s" },
    { phase: "Discussion", desc: "Analyze logs, discuss findings, and share theories with other players.", time: "3 min" },
    { phase: "Voting", desc: "Vote for who you think is the Saboteur. Majority wins.", time: "1 min" },
    { phase: "Results", desc: "Roles revealed, rewards distributed based on outcome.", time: "-" }
  ],
  rewards: [
    { condition: "Saboteur caught", auditor: "+25 GEN", saboteur: "+5 GEN", supervisor: "+40 GEN" },
    { condition: "Saboteur escapes", auditor: "+10 GEN", saboteur: "+50 GEN", supervisor: "+15 GEN" },
    { condition: "Participation", all: "+10 GEN base reward" }
  ],
  cost: "Entry fee: 5 GEN per game"
};

// ============= UTILITY FUNCTIONS =============
const generateUserId = () => `0x${Math.random().toString(16).slice(2, 10)}`;
const generateWalletAddress = () => `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

// ============= MAIN APP COMPONENT =============
export default function BlockchainAuditGame() {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Game state
  const [gamePhase, setGamePhase] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [matchingTimer, setMatchingTimer] = useState(30);
  const [gameTimer, setGameTimer] = useState(180);
  const [votingTimer, setVotingTimer] = useState(60);
  const [currentRound, setCurrentRound] = useState(1);
  
  // Voting state
  const [votes, setVotes] = useState({});
  const [playerVote, setPlayerVote] = useState(null);
  const [voteResults, setVoteResults] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // UI state
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedHistoryGame, setSelectedHistoryGame] = useState(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize user
  useEffect(() => {
    const savedUser = localStorage.getItem('chainAuditUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    
    // Load game history
    const savedHistory = localStorage.getItem('chainAuditHistory');
    if (savedHistory) {
      setGameHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Build leaderboard from real game history
  useEffect(() => {
    const savedHistory = localStorage.getItem('chainAuditHistory');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const playerStats = {};
      
      // Aggregate stats from all games
      history.forEach(game => {
        if (game.allPlayers) {
          game.allPlayers.forEach(player => {
            if (!playerStats[player.id]) {
              playerStats[player.id] = {
                id: player.id,
                name: player.name,
                wallet: player.wallet,
                totalRewards: 0,
                gamesPlayed: 0,
                wins: 0,
                isAI: player.isAI
              };
            }
            playerStats[player.id].totalRewards += player.reward || 0;
            playerStats[player.id].gamesPlayed += 1;
            if (player.isWinner) {
              playerStats[player.id].wins += 1;
            }
          });
        }
      });
      
      const leaderboardData = Object.values(playerStats)
        .sort((a, b) => b.totalRewards - a.totalRewards);
      
      setLeaderboard(leaderboardData);
    }
  }, [gameHistory]);

  // Matching timer
  useEffect(() => {
    if (gamePhase === 'matching' && matchingTimer > 0) {
      const timer = setInterval(() => {
        setMatchingTimer(prev => {
          if (prev <= 1) {
            fillWithAIPlayers();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, matchingTimer]);

  // Game timer
  useEffect(() => {
    if (gamePhase === 'playing' && gameTimer > 0) {
      const timer = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) {
            startVoting();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, gameTimer]);

  // Voting timer
  useEffect(() => {
    if (gamePhase === 'voting' && votingTimer > 0) {
      const timer = setInterval(() => {
        setVotingTimer(prev => {
          if (prev <= 1) {
            calculateResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, votingTimer]);

  // AI auto-vote
  useEffect(() => {
    if (gamePhase === 'voting') {
      const aiPlayers = players.filter(p => p.isAI && !votes[p.id]);
      aiPlayers.forEach((aiPlayer, index) => {
        setTimeout(() => {
          const otherPlayers = players.filter(p => p.id !== aiPlayer.id);
          const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          setVotes(prev => ({
            ...prev,
            [aiPlayer.id]: randomTarget.id
          }));
        }, (index + 1) * 2000 + Math.random() * 3000);
      });
    }
  }, [gamePhase, players]);

  // Create user
  const createUser = (nickname) => {
    const newUser = {
      id: generateUserId(),
      name: nickname,
      wallet: generateWalletAddress(),
      genBalance: 100, // Starting balance
      gamesPlayed: 0,
      isAI: false
    };
    setCurrentUser(newUser);
    localStorage.setItem('chainAuditUser', JSON.stringify(newUser));
    setIsLoggedIn(true);
  };

  // Check if user can afford to play
  const canAffordGame = () => {
    return currentUser && currentUser.genBalance >= 5;
  };

  // Deduct entry fee
  const deductEntryFee = () => {
    const updatedUser = {
      ...currentUser,
      genBalance: currentUser.genBalance - 5
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('chainAuditUser', JSON.stringify(updatedUser));
  };

  // Start matching
  const startMatching = () => {
    if (!canAffordGame()) {
      alert('Insufficient GEN balance! You need 5 GEN to start a game.');
      return;
    }
    
    deductEntryFee();
    setGamePhase('matching');
    setMatchingTimer(30);
    setPlayers([{ ...currentUser, role: null }]);
    simulatePlayerJoins();
  };

  // Simulate player joins
  const simulatePlayerJoins = () => {
    const joinTimes = [5, 12, 18, 25].map(t => t * 1000);
    joinTimes.forEach((time, index) => {
      if (Math.random() > 0.6) {
        setTimeout(() => {
          if (gamePhase === 'matching') {
            const newPlayer = {
              id: generateUserId(),
              name: `Player_${Math.random().toString(36).slice(2, 6)}`,
              wallet: generateWalletAddress(),
              genBalance: Math.floor(Math.random() * 200) + 50,
              isAI: false,
              role: null
            };
            setPlayers(prev => {
              if (prev.length < 5) return [...prev, newPlayer];
              return prev;
            });
          }
        }, time);
      }
    });
  };

  // Fill with AI players
  const fillWithAIPlayers = useCallback(() => {
    setPlayers(prev => {
      const needed = 5 - prev.length;
      const aiPlayers = [];
      const usedNames = prev.map(p => p.name);
      
      for (let i = 0; i < needed; i++) {
        const availableNames = AI_NAMES.filter(n => !usedNames.includes(n));
        const name = availableNames[Math.floor(Math.random() * availableNames.length)] || `AI_${i}`;
        usedNames.push(name);
        
        aiPlayers.push({
          id: generateUserId(),
          name,
          wallet: generateWalletAddress(),
          genBalance: Math.floor(Math.random() * 300) + 100,
          isAI: true,
          role: null
        });
      }
      
      return [...prev, ...aiPlayers];
    });
    
    setTimeout(() => startGame(), 1000);
  }, []);

  // Start with AI immediately
  const startWithAI = () => {
    fillWithAIPlayers();
  };

  // Start game
  const startGame = () => {
    const scenario = GAME_SCENARIOS[Math.floor(Math.random() * GAME_SCENARIOS.length)];
    setCurrentScenario(scenario);
    
    setPlayers(prev => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5);
      return shuffled.map((player, index) => ({
        ...player,
        role: index === 0 ? 'SABOTEUR' : index === 1 ? 'SUPERVISOR' : 'AUDITOR'
      }));
    });
    
    setGamePhase('playing');
    setGameTimer(180);
    setMessages([
      { 
        type: 'system', 
        content: `🎮 Game started! Scenario: ${scenario.title}`,
        time: new Date().toLocaleTimeString()
      },
      {
        type: 'system',
        content: '📋 Analyze the transaction logs and find potential vulnerabilities. Voting begins in 3 minutes.',
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Send message
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = {
      type: 'player',
      sender: currentUser.name,
      senderId: currentUser.id,
      content: inputMessage,
      time: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // AI response
    setTimeout(() => {
      const aiPlayers = players.filter(p => p.isAI);
      if (aiPlayers.length > 0 && Math.random() > 0.5) {
        const aiResponses = [
          "I think step [3] is suspicious, the timestamps are too close",
          "This looks like a classic flash loan attack pattern",
          "Let me check the contract address...",
          "Agreed, there seems to be an overflow risk in the calculations",
          "Did anyone notice the abnormally low transaction fees?",
          "The vulnerability might be in the permission check",
          "I'm not sure about this one, needs more analysis",
          "This could be a reentrancy issue"
        ];
        const ai = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        setMessages(prev => [...prev, {
          type: 'player',
          sender: ai.name,
          senderId: ai.id,
          content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          time: new Date().toLocaleTimeString()
        }]);
      }
    }, 2000 + Math.random() * 3000);
  };

  // Start voting
  const startVoting = () => {
    setGamePhase('voting');
    setVotingTimer(60);
    setVotes({});
    setPlayerVote(null);
    setMessages(prev => [...prev, {
      type: 'system',
      content: '🗳️ Voting phase started! Vote for who you think is the Saboteur.',
      time: new Date().toLocaleTimeString()
    }]);
  };

  // Cast vote
  const castVote = (targetId) => {
    if (playerVote) return;
    setPlayerVote(targetId);
    setVotes(prev => ({
      ...prev,
      [currentUser.id]: targetId
    }));
  };

  // Calculate results
  const calculateResults = () => {
    const voteCount = {};
    Object.values(votes).forEach(targetId => {
      voteCount[targetId] = (voteCount[targetId] || 0) + 1;
    });
    
    let maxVotes = 0;
    let votedOut = null;
    Object.entries(voteCount).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        votedOut = id;
      }
    });
    
    const votedPlayer = players.find(p => p.id === votedOut);
    const saboteur = players.find(p => p.role === 'SABOTEUR');
    const isSaboteurCaught = votedOut === saboteur?.id;
    
    // Calculate rewards
    const rewards = {};
    const playersWithResults = players.map(player => {
      let reward = 10;
      let isWinner = false;
      
      if (player.role === 'SABOTEUR') {
        reward = isSaboteurCaught ? 5 : 50;
        isWinner = !isSaboteurCaught;
      } else if (player.role === 'SUPERVISOR') {
        reward = isSaboteurCaught ? 40 : 15;
        isWinner = isSaboteurCaught;
      } else {
        reward = isSaboteurCaught ? 25 : 10;
        isWinner = isSaboteurCaught;
      }
      
      rewards[player.id] = reward;
      
      return {
        ...player,
        reward,
        isWinner,
        votesReceived: voteCount[player.id] || 0
      };
    });
    
    const results = {
      votedOut,
      votedPlayer,
      isSaboteurCaught,
      saboteur,
      voteCount,
      rewards,
      scenario: currentScenario,
      allPlayers: playersWithResults
    };
    
    setVoteResults(results);
    setGamePhase('results');
    
    // Update user rewards
    if (currentUser && rewards[currentUser.id]) {
      const updatedUser = {
        ...currentUser,
        genBalance: currentUser.genBalance + rewards[currentUser.id],
        gamesPlayed: currentUser.gamesPlayed + 1
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('chainAuditUser', JSON.stringify(updatedUser));
    }
    
    // Save detailed game history
    const historyEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      scenario: currentScenario.title,
      scenarioCategory: currentScenario.category,
      myRole: players.find(p => p.id === currentUser?.id)?.role,
      result: isSaboteurCaught ? 'Audit Success' : 'Saboteur Victory',
      myReward: rewards[currentUser?.id] || 0,
      round: currentRound,
      allPlayers: playersWithResults,
      vulnerabilityType: currentScenario.vulnerabilityType,
      hiddenAnomaly: currentScenario.hiddenAnomaly
    };
    
    const newHistory = [historyEntry, ...gameHistory].slice(0, 100);
    setGameHistory(newHistory);
    localStorage.setItem('chainAuditHistory', JSON.stringify(newHistory));
  };

  // Next round
  const nextRound = () => {
    if (!canAffordGame()) {
      alert('Insufficient GEN balance! You need 5 GEN to start a game.');
      return;
    }
    
    deductEntryFee();
    setCurrentRound(prev => prev + 1);
    setGamePhase('matching');
    setMatchingTimer(30);
    setVoteResults(null);
    setMessages([]);
    setPlayers([{ ...currentUser, role: null }]);
    simulatePlayerJoins();
  };

  // Back to lobby
  const backToLobby = () => {
    setGamePhase('lobby');
    setCurrentRound(1);
    setVoteResults(null);
    setMessages([]);
    setPlayers([]);
    setCurrentScenario(null);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============= RENDER COMPONENTS =============
  
  // Login screen
  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.loginOverlay}>
          <div style={styles.loginBox}>
            <div style={styles.loginLogo}>
              <span style={styles.logoIcon}>⛓️</span>
              <h1 style={styles.logoText}>ChainAudit</h1>
              <p style={styles.logoSubtext}>Blockchain Security Audit Game</p>
            </div>
            <div style={styles.loginForm}>
              <input
                type="text"
                placeholder="Enter your nickname"
                style={styles.loginInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    createUser(e.target.value.trim());
                  }
                }}
              />
              <button 
                style={styles.loginButton}
                onClick={(e) => {
                  const input = e.target.previousSibling;
                  if (input.value.trim()) createUser(input.value.trim());
                }}
              >
                Connect Wallet &amp; Start
              </button>
            </div>
            <div style={styles.loginFeatures}>
              <div style={styles.feature}>🔍 Analyze Logs</div>
              <div style={styles.feature}>🎭 Role-playing</div>
              <div style={styles.feature}>💰 Earn GEN</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>⛓️ ChainAudit</span>
          <span style={styles.roundBadge}>Round {currentRound}</span>
        </div>
        <div style={styles.headerCenter}>
          {gamePhase === 'playing' && (
            <div style={styles.timerBox}>
              <span style={styles.timerLabel}>Discussion</span>
              <span style={styles.timerValue}>{formatTime(gameTimer)}</span>
            </div>
          )}
          {gamePhase === 'voting' && (
            <div style={styles.timerBox}>
              <span style={styles.timerLabel}>Voting</span>
              <span style={styles.timerValue}>{formatTime(votingTimer)}</span>
            </div>
          )}
          {gamePhase === 'matching' && (
            <div style={styles.timerBox}>
              <span style={styles.timerLabel}>Matching</span>
              <span style={styles.timerValue}>{formatTime(matchingTimer)}</span>
            </div>
          )}
        </div>
        <div style={styles.headerRight}>
          <button style={styles.navButton} onClick={() => setShowRules(true)}>
            📖 Rules
          </button>
          <button style={styles.navButton} onClick={() => setShowLeaderboard(true)}>
            🏆 Leaderboard
          </button>
          <button style={styles.navButton} onClick={() => setShowHistory(true)}>
            📜 History
          </button>
        </div>
      </header>

      {/* User Info Bar */}
      <div style={styles.userBar}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {currentUser?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{currentUser?.name}</div>
            <div style={styles.userWallet}>
              <span style={styles.walletIcon}>💳</span>
              {shortenAddress(currentUser?.wallet)}
            </div>
          </div>
        </div>
        <div style={styles.userStats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{currentUser?.genBalance || 0}</span>
            <span style={styles.statLabel}>$GEN</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{currentUser?.gamesPlayed || 0}</span>
            <span style={styles.statLabel}>Games</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Lobby */}
        {gamePhase === 'lobby' && (
          <div style={styles.lobbyContainer}>
            <div style={styles.lobbyCard}>
              <h2 style={styles.lobbyTitle}>⚡ Quick Match</h2>
              <p style={styles.lobbyDesc}>
                5 Players · Random Scenario · Role Assignment
              </p>
              <div style={styles.entryFee}>
                <span style={styles.feeLabel}>Entry Fee:</span>
                <span style={styles.feeAmount}>5 GEN</span>
              </div>
              <div style={styles.rolePreview}>
                {Object.values(ROLES).map((role, i) => (
                  <div key={i} style={{...styles.roleItem, borderColor: role.color}}>
                    <span style={styles.roleIcon}>{role.icon}</span>
                    <span style={{...styles.roleName, color: role.color}}>{role.name}</span>
                  </div>
                ))}
              </div>
              <button 
                style={{
                  ...styles.startButton,
                  ...(canAffordGame() ? {} : styles.startButtonDisabled)
                }} 
                onClick={startMatching}
                disabled={!canAffordGame()}
              >
                {canAffordGame() ? 'Start Matching' : 'Insufficient GEN'}
              </button>
              {!canAffordGame() && (
                <p style={styles.insufficientWarning}>
                  You need at least 5 GEN to play
                </p>
              )}
            </div>
            
            <div style={styles.scenarioPreview}>
              <h3 style={styles.previewTitle}>📋 Available Scenarios</h3>
              <div style={styles.scenarioGrid}>
                {GAME_SCENARIOS.slice(0, 4).map(s => (
                  <div key={s.id} style={styles.scenarioCard}>
                    <span style={styles.scenarioCategory}>{s.category}</span>
                    <span style={styles.scenarioName}>{s.title}</span>
                    <span style={styles.scenarioDiff}>{s.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Matching */}
        {gamePhase === 'matching' && (
          <div style={styles.matchingContainer}>
            <div style={styles.matchingCard}>
              <div style={styles.matchingHeader}>
                <span style={styles.matchingIcon}>🔄</span>
                <h2 style={styles.matchingTitle}>Finding Players...</h2>
              </div>
              
              <div style={styles.matchingTimer}>
                <div style={styles.timerCircle}>
                  <span style={styles.timerNumber}>{matchingTimer}</span>
                  <span style={styles.timerUnit}>sec</span>
                </div>
              </div>
              
              <div style={styles.playerSlots}>
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    style={{
                      ...styles.playerSlot,
                      ...(players[i] ? styles.playerSlotFilled : {})
                    }}
                  >
                    {players[i] ? (
                      <>
                        <div style={styles.slotAvatar}>
                          {players[i].isAI ? '🤖' : players[i].name.charAt(0)}
                        </div>
                        <span style={styles.slotName}>{players[i].name}</span>
                        {players[i].isAI && <span style={styles.aiTag}>AI</span>}
                      </>
                    ) : (
                      <span style={styles.slotEmpty}>Waiting...</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={styles.matchingActions}>
                <button style={styles.aiButton} onClick={startWithAI}>
                  🤖 Fill with AI &amp; Start
                </button>
                <button style={styles.cancelButton} onClick={backToLobby}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Playing / Voting */}
        {(gamePhase === 'playing' || gamePhase === 'voting') && currentScenario && (
          <div style={styles.gameContainer}>
            <div style={styles.scenarioPanel}>
              <div style={styles.scenarioHeader}>
                <span style={styles.scenarioTag}>{currentScenario.category}</span>
                <h2 style={styles.scenarioTitle}>{currentScenario.title}</h2>
                <span style={styles.difficultyBadge}>{currentScenario.difficulty}</span>
              </div>
              
              <div style={styles.logsContainer}>
                <h3 style={styles.logsTitle}>📜 Transaction Logs</h3>
                <pre style={styles.logsContent}>{currentScenario.logs}</pre>
              </div>
              
              <div style={styles.clueBox}>
                <h4 style={styles.clueTitle}>💡 Audit Clue</h4>
                <p style={styles.clueText}>{currentScenario.auditClue}</p>
              </div>
              
              {players.find(p => p.id === currentUser?.id)?.role && (
                <div style={{
                  ...styles.roleDisplay,
                  borderColor: ROLES[players.find(p => p.id === currentUser?.id)?.role]?.color
                }}>
                  <span style={styles.roleDisplayIcon}>
                    {ROLES[players.find(p => p.id === currentUser?.id)?.role]?.icon}
                  </span>
                  <div>
                    <div style={{
                      ...styles.roleDisplayName,
                      color: ROLES[players.find(p => p.id === currentUser?.id)?.role]?.color
                    }}>
                      Your Role: {ROLES[players.find(p => p.id === currentUser?.id)?.role]?.name}
                    </div>
                    <div style={styles.roleDisplayDesc}>
                      {ROLES[players.find(p => p.id === currentUser?.id)?.role]?.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div style={styles.interactionPanel}>
              <div style={styles.playersPanel}>
                <h3 style={styles.panelTitle}>👥 Players ({players.length}/5)</h3>
                <div style={styles.playersList}>
                  {players.map(player => (
                    <div 
                      key={player.id} 
                      style={{
                        ...styles.playerCard,
                        ...(player.id === currentUser?.id ? styles.playerCardSelf : {}),
                        ...(gamePhase === 'voting' && playerVote === player.id ? styles.playerCardVoted : {}),
                        ...(gamePhase === 'voting' && player.id !== currentUser?.id ? styles.playerCardClickable : {})
                      }}
                      onClick={() => gamePhase === 'voting' && player.id !== currentUser?.id && castVote(player.id)}
                    >
                      <div style={styles.playerAvatar}>
                        {player.isAI ? '🤖' : player.name.charAt(0)}
                      </div>
                      <div style={styles.playerInfo}>
                        <span style={styles.playerName}>
                          {player.name}
                          {player.id === currentUser?.id && ' (You)'}
                        </span>
                        <span style={styles.playerWallet}>
                          {shortenAddress(player.wallet)}
                        </span>
                      </div>
                      {gamePhase === 'voting' && (
                        <div style={styles.voteIndicator}>
                          {votes[player.id] && '✓'}
                          {playerVote === player.id && '🎯'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={styles.chatPanel}>
                <h3 style={styles.panelTitle}>
                  {gamePhase === 'voting' ? '🗳️ Voting Phase' : '💬 Discussion'}
                </h3>
                
                {gamePhase === 'voting' && (
                  <div style={styles.voteInstruction}>
                    Click on a player to vote for who you think is the Saboteur!
                    {playerVote && <span style={styles.votedText}>✓ Voted</span>}
                  </div>
                )}
                
                <div style={styles.messagesContainer}>
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      style={{
                        ...styles.message,
                        ...(msg.type === 'system' ? styles.systemMessage : {}),
                        ...(msg.senderId === currentUser?.id ? styles.selfMessage : {})
                      }}
                    >
                      {msg.type === 'player' && (
                        <span style={styles.messageSender}>{msg.sender}</span>
                      )}
                      <span style={styles.messageContent}>{msg.content}</span>
                      <span style={styles.messageTime}>{msg.time}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {gamePhase === 'playing' && (
                  <div style={styles.chatInput}>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Share your analysis..."
                      style={styles.input}
                    />
                    <button style={styles.sendButton} onClick={sendMessage}>
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {gamePhase === 'results' && voteResults && (
          <div style={styles.resultsContainer}>
            <div style={styles.resultsCard}>
              <div style={styles.resultsHeader}>
                <span style={styles.resultsIcon}>
                  {voteResults.isSaboteurCaught ? '🎉' : '💀'}
                </span>
                <h2 style={styles.resultsTitle}>
                  {voteResults.isSaboteurCaught ? 'Audit Success!' : 'Saboteur Wins!'}
                </h2>
                <p style={styles.resultsSubtitle}>
                  {voteResults.isSaboteurCaught 
                    ? 'The team successfully identified the Saboteur!' 
                    : 'The Saboteur successfully hid their identity!'}
                </p>
              </div>
              
              <div style={styles.voteResultsSection}>
                <h3 style={styles.sectionTitle}>📊 Voting Results &amp; Rewards</h3>
                <div style={styles.voteSummary}>
                  {voteResults.allPlayers.map(player => (
                    <div 
                      key={player.id} 
                      style={{
                        ...styles.voteResult,
                        ...(player.id === currentUser?.id ? styles.voteResultSelf : {})
                      }}
                    >
                      <div style={styles.votePlayerInfo}>
                        <span style={styles.votePlayerName}>
                          {player.name}
                          {player.id === currentUser?.id && ' (You)'}
                          {player.isAI && <span style={styles.aiTagSmall}>AI</span>}
                        </span>
                        <span style={{
                          ...styles.votePlayerRole,
                          color: ROLES[player.role]?.color
                        }}>
                          {ROLES[player.role]?.icon} {ROLES[player.role]?.name}
                        </span>
                      </div>
                      <div style={styles.voteBarContainer}>
                        <div style={styles.voteBar}>
                          <div 
                            style={{
                              ...styles.voteBarFill,
                              width: `${(player.votesReceived / players.length) * 100}%`
                            }}
                          />
                        </div>
                        <span style={styles.voteCount}>{player.votesReceived} votes</span>
                      </div>
                      <div style={styles.rewardBadge}>
                        +{player.reward} GEN
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={styles.vulnerabilityReveal}>
                <h3 style={styles.sectionTitle}>🔓 Vulnerability Revealed</h3>
                <div style={styles.vulnerabilityCard}>
                  <div style={styles.vulnType}>
                    <span style={styles.vulnLabel}>Vulnerability Type:</span>
                    <span style={styles.vulnValue}>{voteResults.scenario.vulnerabilityType}</span>
                  </div>
                  <div style={styles.vulnAnomaly}>
                    <span style={styles.vulnLabel}>Hidden Anomaly:</span>
                    <span style={styles.vulnValue}>{voteResults.scenario.hiddenAnomaly}</span>
                  </div>
                </div>
              </div>
              
              <div style={styles.resultsActions}>
                <button 
                  style={{
                    ...styles.nextRoundButton,
                    ...(canAffordGame() ? {} : styles.nextRoundButtonDisabled)
                  }}
                  onClick={nextRound}
                  disabled={!canAffordGame()}
                >
                  🔄 Next Round (5 GEN)
                </button>
                <button style={styles.exitButton} onClick={backToLobby}>
                  🏠 Back to Lobby
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div style={styles.modalOverlay} onClick={() => setShowRules(false)}>
          <div style={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📖 Game Rules</h2>
              <button style={styles.closeButton} onClick={() => setShowRules(false)}>×</button>
            </div>
            <div style={styles.rulesContent}>
              <div style={styles.rulesSection}>
                <h3 style={styles.rulesSectionTitle}>Overview</h3>
                <p style={styles.rulesText}>{GAME_RULES.overview}</p>
              </div>
              
              <div style={styles.rulesSection}>
                <h3 style={styles.rulesSectionTitle}>Roles</h3>
                {GAME_RULES.roles.map((r, i) => (
                  <div key={i} style={styles.ruleItem}>
                    <span style={{
                      ...styles.ruleRoleName,
                      color: ROLES[r.role.toUpperCase()]?.color
                    }}>
                      {ROLES[r.role.toUpperCase()]?.icon} {r.role}
                    </span>
                    <p style={styles.ruleDesc}>{r.desc}</p>
                  </div>
                ))}
              </div>
              
              <div style={styles.rulesSection}>
                <h3 style={styles.rulesSectionTitle}>Game Phases</h3>
                {GAME_RULES.phases.map((p, i) => (
                  <div key={i} style={styles.phaseItem}>
                    <div style={styles.phaseHeader}>
                      <span style={styles.phaseName}>{p.phase}</span>
                      <span style={styles.phaseTime}>{p.time}</span>
                    </div>
                    <p style={styles.phaseDesc}>{p.desc}</p>
                  </div>
                ))}
              </div>
              
              <div style={styles.rulesSection}>
                <h3 style={styles.rulesSectionTitle}>Rewards</h3>
                <div style={styles.rewardsTable}>
                  <div style={styles.rewardsHeader}>
                    <span>Condition</span>
                    <span>Auditor</span>
                    <span>Saboteur</span>
                    <span>Supervisor</span>
                  </div>
                  {GAME_RULES.rewards.slice(0, 2).map((r, i) => (
                    <div key={i} style={styles.rewardsRow}>
                      <span>{r.condition}</span>
                      <span style={styles.rewardGreen}>{r.auditor}</span>
                      <span style={styles.rewardRed}>{r.saboteur}</span>
                      <span style={styles.rewardBlue}>{r.supervisor}</span>
                    </div>
                  ))}
                </div>
                <p style={styles.costNote}>{GAME_RULES.cost}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div style={styles.modalOverlay} onClick={() => setShowLeaderboard(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🏆 Leaderboard</h2>
              <button style={styles.closeButton} onClick={() => setShowLeaderboard(false)}>×</button>
            </div>
            <div style={styles.leaderboardList}>
              {leaderboard.length === 0 ? (
                <div style={styles.emptyState}>No games played yet. Be the first!</div>
              ) : (
                leaderboard.slice(0, 20).map((player, index) => (
                  <div 
                    key={player.id} 
                    style={{
                      ...styles.leaderboardItem,
                      ...(player.id === currentUser?.id ? styles.leaderboardItemSelf : {})
                    }}
                  >
                    <span style={styles.leaderboardRank}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                    </span>
                    <div style={styles.leaderboardPlayer}>
                      <span style={styles.leaderboardName}>
                        {player.name}
                        {player.isAI && <span style={styles.aiTagSmall}>AI</span>}
                      </span>
                      <span style={styles.leaderboardWallet}>
                        {shortenAddress(player.wallet)}
                      </span>
                    </div>
                    <div style={styles.leaderboardStats}>
                      <span style={styles.leaderboardReward}>{player.totalRewards} GEN</span>
                      <span style={styles.leaderboardGames}>{player.gamesPlayed} games</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={styles.modalOverlay} onClick={() => { setShowHistory(false); setSelectedHistoryGame(null); }}>
          <div style={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {selectedHistoryGame ? '📜 Game Details' : '📜 Game History'}
              </h2>
              <button 
                style={styles.closeButton} 
                onClick={() => {
                  if (selectedHistoryGame) {
                    setSelectedHistoryGame(null);
                  } else {
                    setShowHistory(false);
                  }
                }}
              >
                {selectedHistoryGame ? '←' : '×'}
              </button>
            </div>
            
            {selectedHistoryGame ? (
              <div style={styles.historyDetail}>
                <div style={styles.historyDetailHeader}>
                  <h3 style={styles.historyDetailTitle}>{selectedHistoryGame.scenario}</h3>
                  <span style={styles.historyDetailDate}>{selectedHistoryGame.date}</span>
                </div>
                
                <div style={styles.historyDetailResult}>
                  <span style={{
                    ...styles.resultBadge,
                    background: selectedHistoryGame.result === 'Audit Success' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                    color: selectedHistoryGame.result === 'Audit Success' ? '#00ff88' : '#ff4444'
                  }}>
                    {selectedHistoryGame.result}
                  </span>
                </div>
                
                <div style={styles.detailSection}>
                  <h4 style={styles.detailSectionTitle}>All Players</h4>
                  {selectedHistoryGame.allPlayers?.map((player, i) => (
                    <div 
                      key={i} 
                      style={{
                        ...styles.detailPlayerRow,
                        ...(player.name === currentUser?.name ? styles.detailPlayerRowSelf : {})
                      }}
                    >
                      <div style={styles.detailPlayerInfo}>
                        <span style={styles.detailPlayerName}>
                          {player.name}
                          {player.name === currentUser?.name && ' (You)'}
                          {player.isAI && <span style={styles.aiTagSmall}>AI</span>}
                        </span>
                        <span style={{
                          ...styles.detailPlayerRole,
                          color: ROLES[player.role]?.color
                        }}>
                          {ROLES[player.role]?.icon} {ROLES[player.role]?.name}
                        </span>
                      </div>
                      <div style={styles.detailPlayerStats}>
                        <span style={styles.detailVotes}>{player.votesReceived} votes</span>
                        <span style={styles.detailReward}>+{player.reward} GEN</span>
                        {player.isWinner && <span style={styles.winnerBadge}>Winner</span>}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={styles.detailSection}>
                  <h4 style={styles.detailSectionTitle}>Vulnerability</h4>
                  <div style={styles.vulnerabilityDetail}>
                    <p><strong>Type:</strong> {selectedHistoryGame.vulnerabilityType}</p>
                    <p><strong>Hidden Anomaly:</strong> {selectedHistoryGame.hiddenAnomaly}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.historyList}>
                {gameHistory.length === 0 ? (
                  <div style={styles.emptyState}>No game history yet</div>
                ) : (
                  gameHistory.map(game => (
                    <div 
                      key={game.id} 
                      style={styles.historyItem}
                      onClick={() => setSelectedHistoryGame(game)}
                    >
                      <div style={styles.historyMain}>
                        <div style={styles.historyInfo}>
                          <span style={styles.historyScenario}>{game.scenario}</span>
                          <span style={styles.historyCategory}>{game.scenarioCategory}</span>
                        </div>
                        <span style={{
                          ...styles.historyRole,
                          color: ROLES[game.myRole]?.color
                        }}>
                          {ROLES[game.myRole]?.icon} {ROLES[game.myRole]?.name}
                        </span>
                      </div>
                      <div style={styles.historyMeta}>
                        <span style={{
                          ...styles.historyResult,
                          color: game.result === 'Audit Success' ? '#00ff88' : '#ff4444'
                        }}>
                          {game.result}
                        </span>
                        <span style={styles.historyReward}>+{game.myReward} GEN</span>
                        <span style={styles.historyDate}>{game.date}</span>
                      </div>
                      <div style={styles.viewDetails}>View Details →</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============= STYLES =============
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
    color: '#e0e0e0',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  // Login
  loginOverlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%)',
  },
  loginBox: {
    background: 'rgba(20, 20, 30, 0.95)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '20px',
    padding: '50px',
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(0, 255, 136, 0.2)',
    maxWidth: '450px',
    width: '90%',
  },
  loginLogo: { marginBottom: '40px' },
  logoIcon: { fontSize: '64px', display: 'block', marginBottom: '15px' },
  logoText: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#00ff88',
    margin: '0 0 10px 0',
    textShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
  },
  logoSubtext: { fontSize: '14px', color: '#888', margin: 0 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' },
  loginInput: {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '10px',
    padding: '15px 20px',
    fontSize: '16px',
    color: '#fff',
    outline: 'none',
  },
  loginButton: {
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: '10px',
    padding: '15px 30px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000',
    cursor: 'pointer',
  },
  loginFeatures: { display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' },
  feature: {
    fontSize: '13px',
    color: '#888',
    padding: '8px 15px',
    background: 'rgba(0, 255, 136, 0.1)',
    borderRadius: '20px',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 30px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerLogo: { fontSize: '20px', fontWeight: '700', color: '#00ff88' },
  roundBadge: {
    background: 'rgba(0, 255, 136, 0.2)',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    color: '#00ff88',
  },
  headerCenter: { flex: 1, display: 'flex', justifyContent: 'center' },
  timerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255, 100, 100, 0.1)',
    padding: '8px 25px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 100, 100, 0.3)',
  },
  timerLabel: { fontSize: '11px', color: '#ff6666', textTransform: 'uppercase' },
  timerValue: { fontSize: '24px', fontWeight: '700', color: '#ff6666' },
  headerRight: { display: 'flex', gap: '10px' },
  navButton: {
    background: 'rgba(0, 255, 136, 0.1)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '8px',
    padding: '8px 15px',
    fontSize: '13px',
    color: '#00ff88',
    cursor: 'pointer',
  },

  // User Bar
  userBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 30px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00ff88 0%, #00aa55 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#000',
  },
  userDetails: { display: 'flex', flexDirection: 'column', gap: '3px' },
  userName: { fontSize: '16px', fontWeight: '600', color: '#fff' },
  userWallet: { fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' },
  walletIcon: { fontSize: '10px' },
  userStats: { display: 'flex', gap: '30px' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statValue: { fontSize: '20px', fontWeight: '700', color: '#00ff88' },
  statLabel: { fontSize: '11px', color: '#888', textTransform: 'uppercase' },

  // Main
  main: { padding: '30px', minHeight: 'calc(100vh - 140px)' },

  // Lobby
  lobbyContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  lobbyCard: {
    background: 'rgba(20, 20, 30, 0.8)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
  },
  lobbyTitle: { fontSize: '28px', fontWeight: '700', color: '#00ff88', margin: '0 0 15px 0' },
  lobbyDesc: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  entryFee: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '25px',
    padding: '12px 20px',
    background: 'rgba(255, 200, 0, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 200, 0, 0.3)',
  },
  feeLabel: { fontSize: '14px', color: '#ffc800' },
  feeAmount: { fontSize: '18px', fontWeight: '700', color: '#ffc800' },
  rolePreview: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' },
  roleItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid',
    gap: '8px',
  },
  roleIcon: { fontSize: '24px' },
  roleName: { fontSize: '12px', fontWeight: '600' },
  startButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '18px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    cursor: 'pointer',
  },
  startButtonDisabled: {
    background: 'rgba(100, 100, 100, 0.5)',
    cursor: 'not-allowed',
  },
  insufficientWarning: {
    marginTop: '15px',
    fontSize: '13px',
    color: '#ff6666',
  },
  scenarioPreview: {
    background: 'rgba(20, 20, 30, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '30px',
  },
  previewTitle: { fontSize: '18px', color: '#fff', marginBottom: '20px' },
  scenarioGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  scenarioCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scenarioCategory: { fontSize: '11px', color: '#00ff88', textTransform: 'uppercase' },
  scenarioName: { fontSize: '14px', color: '#fff', fontWeight: '500' },
  scenarioDiff: { fontSize: '11px', color: '#ff8844' },

  // Matching
  matchingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  matchingCard: {
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '25px',
    padding: '50px',
    textAlign: 'center',
    maxWidth: '600px',
    width: '100%',
  },
  matchingHeader: { marginBottom: '30px' },
  matchingIcon: { fontSize: '48px', display: 'block', marginBottom: '15px' },
  matchingTitle: { fontSize: '24px', color: '#fff', margin: 0 },
  matchingTimer: { marginBottom: '40px' },
  timerCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '4px solid #00ff88',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
  },
  timerNumber: { fontSize: '48px', fontWeight: '700', color: '#00ff88', lineHeight: 1 },
  timerUnit: { fontSize: '14px', color: '#888' },
  playerSlots: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px', flexWrap: 'wrap' },
  playerSlot: {
    width: '100px',
    height: '100px',
    borderRadius: '15px',
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  playerSlotFilled: { border: '2px solid #00ff88', background: 'rgba(0, 255, 136, 0.1)' },
  slotAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(0, 255, 136, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
  },
  slotName: { fontSize: '11px', color: '#fff', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  slotEmpty: { fontSize: '12px', color: '#666' },
  aiTag: { fontSize: '10px', background: '#4488ff', color: '#fff', padding: '2px 6px', borderRadius: '4px' },
  matchingActions: { display: 'flex', gap: '15px', justifyContent: 'center' },
  aiButton: {
    background: 'linear-gradient(135deg, #4488ff 0%, #2266dd 100%)',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 25px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
  },
  cancelButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    padding: '12px 25px',
    fontSize: '14px',
    color: '#888',
    cursor: 'pointer',
  },

  // Game
  gameContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '25px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  scenarioPanel: {
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    borderRadius: '20px',
    padding: '25px',
  },
  scenarioHeader: { marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  scenarioTag: {
    background: 'rgba(0, 255, 136, 0.2)',
    color: '#00ff88',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  scenarioTitle: { fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0, flex: 1 },
  difficultyBadge: {
    background: 'rgba(255, 136, 68, 0.2)',
    color: '#ff8844',
    padding: '5px 12px',
    borderRadius: '15px',
    fontSize: '12px',
  },
  logsContainer: { background: 'rgba(0, 0, 0, 0.5)', borderRadius: '15px', padding: '20px', marginBottom: '20px' },
  logsTitle: { fontSize: '14px', color: '#00ff88', marginBottom: '15px' },
  logsContent: {
    fontSize: '13px',
    color: '#ccc',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    margin: 0,
    fontFamily: '"JetBrains Mono", monospace',
  },
  clueBox: {
    background: 'rgba(255, 200, 0, 0.1)',
    border: '1px solid rgba(255, 200, 0, 0.3)',
    borderRadius: '12px',
    padding: '15px 20px',
    marginBottom: '20px',
  },
  clueTitle: { fontSize: '13px', color: '#ffc800', marginBottom: '8px' },
  clueText: { fontSize: '13px', color: '#ddd', margin: 0 },
  roleDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '2px solid',
  },
  roleDisplayIcon: { fontSize: '32px' },
  roleDisplayName: { fontSize: '16px', fontWeight: '700' },
  roleDisplayDesc: { fontSize: '12px', color: '#888', marginTop: '3px' },

  // Interaction Panel
  interactionPanel: { display: 'flex', flexDirection: 'column', gap: '20px' },
  playersPanel: {
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '20px',
  },
  panelTitle: { fontSize: '14px', color: '#888', marginBottom: '15px', textTransform: 'uppercase' },
  playersList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  playerCardSelf: { border: '1px solid rgba(0, 255, 136, 0.5)', background: 'rgba(0, 255, 136, 0.1)' },
  playerCardVoted: { border: '1px solid #ff4444', background: 'rgba(255, 68, 68, 0.1)' },
  playerCardClickable: { cursor: 'pointer' },
  playerAvatar: {
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    background: 'rgba(0, 255, 136, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  playerInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  playerName: { fontSize: '14px', color: '#fff' },
  playerWallet: { fontSize: '11px', color: '#666' },
  voteIndicator: { fontSize: '16px' },

  // Chat
  chatPanel: {
    flex: 1,
    background: 'rgba(20, 20, 30, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '300px',
  },
  voteInstruction: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '15px',
    fontSize: '13px',
    color: '#ff8888',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  votedText: { color: '#00ff88', fontWeight: '600' },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
    maxHeight: '250px',
  },
  message: { padding: '10px 15px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.3)' },
  systemMessage: { background: 'rgba(0, 255, 136, 0.1)', borderLeft: '3px solid #00ff88' },
  selfMessage: { background: 'rgba(68, 136, 255, 0.2)', marginLeft: '20px' },
  messageSender: { display: 'block', fontSize: '12px', color: '#00ff88', marginBottom: '4px' },
  messageContent: { fontSize: '13px', color: '#ddd' },
  messageTime: { display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' },
  chatInput: { display: 'flex', gap: '10px' },
  input: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '12px 15px',
    fontSize: '13px',
    color: '#fff',
    outline: 'none',
  },
  sendButton: {
    background: '#00ff88',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#000',
    cursor: 'pointer',
  },

  // Results
  resultsContainer: { display: 'flex', justifyContent: 'center', padding: '20px' },
  resultsCard: {
    background: 'rgba(20, 20, 30, 0.95)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '25px',
    padding: '40px',
    maxWidth: '800px',
    width: '100%',
  },
  resultsHeader: { textAlign: 'center', marginBottom: '35px' },
  resultsIcon: { fontSize: '64px', display: 'block', marginBottom: '15px' },
  resultsTitle: { fontSize: '32px', fontWeight: '700', color: '#00ff88', margin: '0 0 10px 0' },
  resultsSubtitle: { fontSize: '16px', color: '#888', margin: 0 },
  sectionTitle: { fontSize: '16px', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
  voteResultsSection: { marginBottom: '30px' },
  voteSummary: { display: 'flex', flexDirection: 'column', gap: '12px' },
  voteResult: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
  },
  voteResultSelf: { background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)' },
  votePlayerInfo: { width: '160px', display: 'flex', flexDirection: 'column', gap: '3px' },
  votePlayerName: { fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' },
  votePlayerRole: { fontSize: '12px' },
  voteBarContainer: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px' },
  voteBar: { flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' },
  voteBarFill: { height: '100%', background: 'linear-gradient(90deg, #ff4444 0%, #ff6666 100%)', borderRadius: '4px', transition: 'width 0.5s' },
  voteCount: { fontSize: '12px', color: '#888', width: '60px' },
  rewardBadge: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#00ff88',
    background: 'rgba(0, 255, 136, 0.2)',
    padding: '5px 12px',
    borderRadius: '15px',
    minWidth: '80px',
    textAlign: 'center',
  },
  vulnerabilityReveal: { marginBottom: '30px' },
  vulnerabilityCard: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '20px',
  },
  vulnType: { marginBottom: '15px' },
  vulnAnomaly: {},
  vulnLabel: { display: 'block', fontSize: '12px', color: '#ff8888', marginBottom: '5px', textTransform: 'uppercase' },
  vulnValue: { fontSize: '14px', color: '#fff' },
  resultsActions: { display: 'flex', gap: '15px', justifyContent: 'center' },
  nextRoundButton: {
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '15px 35px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#000',
    cursor: 'pointer',
  },
  nextRoundButtonDisabled: { background: 'rgba(100, 100, 100, 0.5)', cursor: 'not-allowed' },
  exitButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    padding: '15px 35px',
    fontSize: '16px',
    color: '#888',
    cursor: 'pointer',
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'rgba(20, 20, 30, 0.98)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalContentLarge: {
    background: 'rgba(20, 20, 30, 0.98)',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '22px', fontWeight: '700', color: '#00ff88', margin: 0 },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    color: '#888',
    cursor: 'pointer',
    padding: '0 5px',
  },

  // Rules
  rulesContent: { overflowY: 'auto', flex: 1 },
  rulesSection: { marginBottom: '25px' },
  rulesSectionTitle: { fontSize: '16px', color: '#00ff88', marginBottom: '12px', borderBottom: '1px solid rgba(0, 255, 136, 0.2)', paddingBottom: '8px' },
  rulesText: { fontSize: '14px', color: '#ccc', lineHeight: 1.6 },
  ruleItem: { marginBottom: '15px', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' },
  ruleRoleName: { fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' },
  ruleDesc: { fontSize: '13px', color: '#aaa', margin: 0 },
  phaseItem: { marginBottom: '12px', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px' },
  phaseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  phaseName: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  phaseTime: { fontSize: '12px', color: '#00ff88' },
  phaseDesc: { fontSize: '13px', color: '#aaa', margin: 0 },
  rewardsTable: { background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', overflow: 'hidden' },
  rewardsHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '10px',
    padding: '12px',
    background: 'rgba(0, 255, 136, 0.1)',
    fontSize: '12px',
    fontWeight: '600',
    color: '#888',
  },
  rewardsRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '10px',
    padding: '12px',
    fontSize: '13px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  rewardGreen: { color: '#00ff88' },
  rewardRed: { color: '#ff4444' },
  rewardBlue: { color: '#4488ff' },
  costNote: { fontSize: '14px', color: '#ffc800', marginTop: '15px', textAlign: 'center' },

  // Leaderboard
  leaderboardList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  emptyState: { textAlign: 'center', padding: '40px', color: '#666' },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
  },
  leaderboardItemSelf: { background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.3)' },
  leaderboardRank: { fontSize: '18px', width: '40px', textAlign: 'center' },
  leaderboardPlayer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' },
  leaderboardName: { fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' },
  aiTagSmall: { fontSize: '10px', background: '#4488ff', color: '#fff', padding: '2px 5px', borderRadius: '3px' },
  leaderboardWallet: { fontSize: '11px', color: '#666' },
  leaderboardStats: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' },
  leaderboardReward: { fontSize: '14px', fontWeight: '600', color: '#00ff88' },
  leaderboardGames: { fontSize: '11px', color: '#888' },

  // History
  historyList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 },
  historyItem: {
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  historyMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  historyInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  historyScenario: { fontSize: '15px', fontWeight: '600', color: '#fff' },
  historyCategory: { fontSize: '11px', color: '#00ff88', textTransform: 'uppercase' },
  historyRole: { fontSize: '13px' },
  historyMeta: { display: 'flex', gap: '20px', fontSize: '12px', color: '#888', marginBottom: '8px' },
  historyResult: {},
  historyReward: { color: '#ffc800' },
  historyDate: {},
  viewDetails: { fontSize: '12px', color: '#4488ff', textAlign: 'right' },

  // History Detail
  historyDetail: { overflowY: 'auto', flex: 1 },
  historyDetailHeader: { marginBottom: '20px' },
  historyDetailTitle: { fontSize: '20px', color: '#fff', margin: '0 0 5px 0' },
  historyDetailDate: { fontSize: '13px', color: '#888' },
  historyDetailResult: { marginBottom: '20px' },
  resultBadge: { padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' },
  detailSection: { marginBottom: '25px' },
  detailSectionTitle: { fontSize: '14px', color: '#888', marginBottom: '12px', textTransform: 'uppercase' },
  detailPlayerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  detailPlayerRowSelf: { background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)' },
  detailPlayerInfo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  detailPlayerName: { fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' },
  detailPlayerRole: { fontSize: '12px' },
  detailPlayerStats: { display: 'flex', alignItems: 'center', gap: '15px' },
  detailVotes: { fontSize: '12px', color: '#888' },
  detailReward: { fontSize: '14px', fontWeight: '600', color: '#00ff88' },
  winnerBadge: {
    fontSize: '10px',
    background: 'rgba(255, 200, 0, 0.2)',
    color: '#ffc800',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  vulnerabilityDetail: { padding: '15px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', fontSize: '13px', color: '#ccc', lineHeight: 1.6 },
};
