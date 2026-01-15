# { "Depends": "py-genlayer:test" }

from genlayer import *
from dataclasses import dataclass
from typing import List, Dict, Optional
import json
import random

# ============= DATA STRUCTURES =============
@dataclass
class Player:
    address: Address
    name: str
    gen_balance: int
    games_played: int
    total_rewards: int
    wins: int

@dataclass 
class GamePlayer:
    address: Address
    name: str
    role: str  # AUDITOR, SABOTEUR, SUPERVISOR
    votes_received: int
    reward: int
    is_winner: bool

@dataclass
class GameRecord:
    game_id: int
    scenario_id: int
    scenario_title: str
    result: str  # "Audit Success" or "Saboteur Victory"
    timestamp: int
    players: List[GamePlayer]
    vulnerability_type: str
    hidden_anomaly: str

@dataclass
class ActiveGame:
    game_id: int
    scenario_id: int
    phase: str  # matching, playing, voting, results
    players: List[GamePlayer]
    votes: Dict[str, str]  # voter_address -> voted_address
    start_time: int
    end_time: int

# ============= GAME SCENARIOS =============
SCENARIOS = [
    {
        "id": 1,
        "title": "Flash Loan Arbitrage Exploit",
        "category": "DeFi",
        "difficulty": "Advanced",
        "vulnerability_type": "Price Manipulation Attack",
        "hidden_anomaly": "The swap used a pre-manipulated liquidity pool",
        "correct_answer": "price_manipulation"
    },
    {
        "id": 2,
        "title": "NFT Minting Permission Bypass",
        "category": "NFT", 
        "difficulty": "Intermediate",
        "vulnerability_type": "Missing Re-mint Protection",
        "hidden_anomaly": "Contract doesn't record minted addresses",
        "correct_answer": "missing_limit_check"
    },
    {
        "id": 3,
        "title": "Governance Proposal Hijack",
        "category": "DAO",
        "difficulty": "Advanced",
        "vulnerability_type": "Vote Borrowing Attack",
        "hidden_anomaly": "Voting power comes from flash loan pool",
        "correct_answer": "vote_borrowing"
    },
    {
        "id": 4,
        "title": "Staking Reward Calculation Error",
        "category": "DeFi",
        "difficulty": "Intermediate",
        "vulnerability_type": "Integer Overflow / Reward Over-issuance",
        "hidden_anomaly": "Reward calculation uses incorrect multiplier",
        "correct_answer": "integer_overflow"
    },
    {
        "id": 5,
        "title": "Multisig Timelock Bypass",
        "category": "Multisig",
        "difficulty": "Advanced",
        "vulnerability_type": "Timelock Configuration Error",
        "hidden_anomaly": "Timelock contract not properly connected",
        "correct_answer": "timelock_bypass"
    }
]

# ============= MAIN CONTRACT =============
class ChainAuditGame(gl.Contract):
    # State variables
    players: TreeMap[Address, Player]
    games: TreeMap[int, GameRecord]
    active_games: TreeMap[int, ActiveGame]
    leaderboard: List[Address]
    
    game_counter: int
    entry_fee: int
    min_players: int
    max_players: int
    
    owner: Address
    total_games_played: int
    total_rewards_distributed: int

    def __init__(self):
        """Initialize the Chain Audit Game contract"""
        self.players = TreeMap[Address, Player]()
        self.games = TreeMap[int, GameRecord]()
        self.active_games = TreeMap[int, ActiveGame]()
        self.leaderboard = []
        
        self.game_counter = 0
        self.entry_fee = 5  # 5 GEN tokens
        self.min_players = 3
        self.max_players = 5
        
        self.owner = gl.message.sender_account
        self.total_games_played = 0
        self.total_rewards_distributed = 0

    # ============= PLAYER MANAGEMENT =============
    @gl.public.write
    def register_player(self, name: str) -> bool:
        """Register a new player with initial GEN balance"""
        sender = gl.message.sender_account
        
        if sender in self.players:
            return False  # Already registered
        
        new_player = Player(
            address=sender,
            name=name,
            gen_balance=100,  # Starting balance
            games_played=0,
            total_rewards=0,
            wins=0
        )
        self.players[sender] = new_player
        return True

    @gl.public.view
    def get_player(self, address: Address) -> Optional[Player]:
        """Get player information"""
        if address in self.players:
            return self.players[address]
        return None

    @gl.public.view  
    def get_player_balance(self, address: Address) -> int:
        """Get player's GEN balance"""
        if address in self.players:
            return self.players[address].gen_balance
        return 0

    @gl.public.write
    def add_gen_tokens(self, address: Address, amount: int) -> bool:
        """Add GEN tokens to a player (owner only or for rewards)"""
        if address not in self.players:
            return False
        
        player = self.players[address]
        player.gen_balance += amount
        self.players[address] = player
        return True

    # ============= GAME MANAGEMENT =============
    @gl.public.write
    def create_game(self) -> int:
        """Create a new game and deduct entry fee"""
        sender = gl.message.sender_account
        
        # Check player exists and has enough balance
        if sender not in self.players:
            raise Exception("Player not registered")
        
        player = self.players[sender]
        if player.gen_balance < self.entry_fee:
            raise Exception("Insufficient GEN balance")
        
        # Deduct entry fee
        player.gen_balance -= self.entry_fee
        self.players[sender] = player
        
        # Create new game
        self.game_counter += 1
        game_id = self.game_counter
        
        # Select random scenario using non-deterministic block
        def select_scenario():
            import random
            return random.randint(0, len(SCENARIOS) - 1)
        
        scenario_idx = gl.eq_principle_strict_eq(select_scenario)
        scenario = SCENARIOS[scenario_idx]
        
        # Initialize game player
        game_player = GamePlayer(
            address=sender,
            name=player.name,
            role="",  # Assigned when game starts
            votes_received=0,
            reward=0,
            is_winner=False
        )
        
        active_game = ActiveGame(
            game_id=game_id,
            scenario_id=scenario["id"],
            phase="matching",
            players=[game_player],
            votes={},
            start_time=0,
            end_time=0
        )
        
        self.active_games[game_id] = active_game
        return game_id

    @gl.public.write
    def join_game(self, game_id: int) -> bool:
        """Join an existing game"""
        sender = gl.message.sender_account
        
        if game_id not in self.active_games:
            raise Exception("Game not found")
        
        if sender not in self.players:
            raise Exception("Player not registered")
        
        player = self.players[sender]
        if player.gen_balance < self.entry_fee:
            raise Exception("Insufficient GEN balance")
        
        game = self.active_games[game_id]
        
        if game.phase != "matching":
            raise Exception("Game already started")
        
        if len(game.players) >= self.max_players:
            raise Exception("Game is full")
        
        # Check if already in game
        for gp in game.players:
            if gp.address == sender:
                raise Exception("Already in game")
        
        # Deduct entry fee
        player.gen_balance -= self.entry_fee
        self.players[sender] = player
        
        # Add to game
        game_player = GamePlayer(
            address=sender,
            name=player.name,
            role="",
            votes_received=0,
            reward=0,
            is_winner=False
        )
        game.players.append(game_player)
        self.active_games[game_id] = game
        
        return True

    @gl.public.write
    def start_game(self, game_id: int) -> bool:
        """Start the game and assign roles"""
        if game_id not in self.active_games:
            raise Exception("Game not found")
        
        game = self.active_games[game_id]
        
        if game.phase != "matching":
            raise Exception("Game already started")
        
        if len(game.players) < self.min_players:
            raise Exception("Not enough players")
        
        # Assign roles randomly using non-deterministic block
        def assign_roles():
            import random
            roles = ["SABOTEUR", "SUPERVISOR"] + ["AUDITOR"] * (len(game.players) - 2)
            random.shuffle(roles)
            return roles
        
        roles = gl.eq_principle_strict_eq(assign_roles)
        
        for i, role in enumerate(roles):
            game.players[i].role = role
        
        game.phase = "playing"
        self.active_games[game_id] = game
        
        return True

    @gl.public.write
    def submit_vote(self, game_id: int, voted_address: Address) -> bool:
        """Submit a vote for who the saboteur is"""
        sender = gl.message.sender_account
        
        if game_id not in self.active_games:
            raise Exception("Game not found")
        
        game = self.active_games[game_id]
        
        if game.phase != "voting":
            raise Exception("Not in voting phase")
        
        # Check sender is in game
        sender_in_game = False
        for gp in game.players:
            if gp.address == sender:
                sender_in_game = True
                break
        
        if not sender_in_game:
            raise Exception("Not in this game")
        
        # Record vote
        game.votes[str(sender)] = str(voted_address)
        self.active_games[game_id] = game
        
        return True

    @gl.public.write
    def start_voting(self, game_id: int) -> bool:
        """Transition game to voting phase"""
        if game_id not in self.active_games:
            raise Exception("Game not found")
        
        game = self.active_games[game_id]
        
        if game.phase != "playing":
            raise Exception("Game not in playing phase")
        
        game.phase = "voting"
        self.active_games[game_id] = game
        
        return True

    @gl.public.write
    def finalize_game(self, game_id: int) -> str:
        """Calculate results and distribute rewards"""
        if game_id not in self.active_games:
            raise Exception("Game not found")
        
        game = self.active_games[game_id]
        
        if game.phase != "voting":
            raise Exception("Game not in voting phase")
        
        # Count votes
        vote_counts = {}
        for voted in game.votes.values():
            vote_counts[voted] = vote_counts.get(voted, 0) + 1
        
        # Find most voted player
        most_voted = None
        max_votes = 0
        for addr, count in vote_counts.items():
            if count > max_votes:
                max_votes = count
                most_voted = addr
        
        # Find saboteur
        saboteur_addr = None
        supervisor_addr = None
        for gp in game.players:
            if gp.role == "SABOTEUR":
                saboteur_addr = str(gp.address)
            elif gp.role == "SUPERVISOR":
                supervisor_addr = str(gp.address)
        
        # Determine result
        saboteur_caught = (most_voted == saboteur_addr)
        result = "Audit Success" if saboteur_caught else "Saboteur Victory"
        
        # Calculate rewards
        total_pool = len(game.players) * self.entry_fee
        
        for i, gp in enumerate(game.players):
            gp.votes_received = vote_counts.get(str(gp.address), 0)
            
            if saboteur_caught:
                # Auditors and Supervisor win
                if gp.role == "AUDITOR":
                    gp.reward = total_pool // 3  # Split among auditors
                    gp.is_winner = True
                elif gp.role == "SUPERVISOR":
                    gp.reward = total_pool // 4
                    gp.is_winner = True
                else:  # Saboteur loses
                    gp.reward = 0
                    gp.is_winner = False
            else:
                # Saboteur wins
                if gp.role == "SABOTEUR":
                    gp.reward = total_pool // 2
                    gp.is_winner = True
                else:
                    gp.reward = 0
                    gp.is_winner = False
            
            game.players[i] = gp
            
            # Update player stats
            if gp.address in self.players:
                player = self.players[gp.address]
                player.gen_balance += gp.reward
                player.games_played += 1
                player.total_rewards += gp.reward
                if gp.is_winner:
                    player.wins += 1
                self.players[gp.address] = player
        
        # Get scenario info
        scenario = SCENARIOS[0]
        for s in SCENARIOS:
            if s["id"] == game.scenario_id:
                scenario = s
                break
        
        # Create game record
        game_record = GameRecord(
            game_id=game_id,
            scenario_id=game.scenario_id,
            scenario_title=scenario["title"],
            result=result,
            timestamp=0,  # Would be block timestamp
            players=game.players,
            vulnerability_type=scenario["vulnerability_type"],
            hidden_anomaly=scenario["hidden_anomaly"]
        )
        
        self.games[game_id] = game_record
        self.total_games_played += 1
        self.total_rewards_distributed += total_pool
        
        # Remove from active games
        del self.active_games[game_id]
        
        # Update leaderboard
        self._update_leaderboard()
        
        return result

    def _update_leaderboard(self):
        """Update the leaderboard based on total rewards"""
        player_list = []
        for addr in self.players:
            player_list.append((addr, self.players[addr].total_rewards))
        
        # Sort by rewards descending
        player_list.sort(key=lambda x: x[1], reverse=True)
        
        # Keep top 20
        self.leaderboard = [p[0] for p in player_list[:20]]

    # ============= VIEW FUNCTIONS =============
    @gl.public.view
    def get_active_games(self) -> List[int]:
        """Get list of active game IDs"""
        return list(self.active_games.keys())

    @gl.public.view
    def get_game_info(self, game_id: int) -> Optional[ActiveGame]:
        """Get active game information"""
        if game_id in self.active_games:
            return self.active_games[game_id]
        return None

    @gl.public.view
    def get_game_history(self, game_id: int) -> Optional[GameRecord]:
        """Get completed game record"""
        if game_id in self.games:
            return self.games[game_id]
        return None

    @gl.public.view
    def get_leaderboard(self) -> List[Player]:
        """Get top players by rewards"""
        result = []
        for addr in self.leaderboard:
            if addr in self.players:
                result.append(self.players[addr])
        return result

    @gl.public.view
    def get_player_history(self, address: Address) -> List[GameRecord]:
        """Get all games a player participated in"""
        result = []
        for game_id in self.games:
            game = self.games[game_id]
            for gp in game.players:
                if gp.address == address:
                    result.append(game)
                    break
        return result

    @gl.public.view
    def get_scenario(self, scenario_id: int) -> Optional[dict]:
        """Get scenario information"""
        for s in SCENARIOS:
            if s["id"] == scenario_id:
                return s
        return None

    @gl.public.view
    def get_contract_stats(self) -> dict:
        """Get overall contract statistics"""
        return {
            "total_players": len(self.players),
            "total_games": self.total_games_played,
            "total_rewards": self.total_rewards_distributed,
            "active_games": len(self.active_games),
            "entry_fee": self.entry_fee
        }
