/**
 * GenLayer Client Configuration
 * Connects frontend to GenLayer intelligent contracts
 */

// GenLayer Network Configuration
export const GENLAYER_CONFIG = {
  // GenLayer Studio (Local Development)
  studio: {
    rpcUrl: 'http://localhost:4000/api',
    chainId: 1,
  },
  // GenLayer Testnet
  testnet: {
    rpcUrl: 'https://testnet.genlayer.com/api',
    chainId: 10,
  },
};

// Contract Address - Update after deployment
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Current environment
export const NETWORK = import.meta.env.VITE_NETWORK || 'studio';

/**
 * Create GenLayer client instance
 */
export const createGenLayerClient = async () => {
  try {
    // Dynamic import for GenLayer JS SDK
    const { createClient } = await import('genlayer-js');
    
    const config = GENLAYER_CONFIG[NETWORK];
    
    const client = createClient({
      endpoint: config.rpcUrl,
    });
    
    return client;
  } catch (error) {
    console.error('Failed to create GenLayer client:', error);
    return null;
  }
};

/**
 * Contract interaction helpers
 */
export class ChainAuditContract {
  constructor(client, contractAddress) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  // Read contract state
  async getContractState() {
    try {
      const result = await this.client.getContractState(this.contractAddress);
      return result;
    } catch (error) {
      console.error('Error getting contract state:', error);
      return null;
    }
  }

  // Call contract method (read-only)
  async call(method, args = []) {
    try {
      const result = await this.client.call({
        contractAddress: this.contractAddress,
        method,
        args,
      });
      return result;
    } catch (error) {
      console.error(`Error calling ${method}:`, error);
      return null;
    }
  }

  // Send transaction (write)
  async send(method, args = [], privateKey) {
    try {
      const tx = await this.client.sendTransaction({
        contractAddress: this.contractAddress,
        method,
        args,
        privateKey,
      });
      return tx;
    } catch (error) {
      console.error(`Error sending ${method}:`, error);
      return null;
    }
  }

  // Player management
  async registerPlayer(name, privateKey) {
    return this.send('register_player', [name], privateKey);
  }

  async getPlayer(address) {
    return this.call('get_player', [address]);
  }

  async getPlayerBalance(address) {
    return this.call('get_player_balance', [address]);
  }

  // Game management
  async createGame(privateKey) {
    return this.send('create_game', [], privateKey);
  }

  async joinGame(gameId, privateKey) {
    return this.send('join_game', [gameId], privateKey);
  }

  async startGame(gameId, privateKey) {
    return this.send('start_game', [gameId], privateKey);
  }

  async submitVote(gameId, votedAddress, privateKey) {
    return this.send('submit_vote', [gameId, votedAddress], privateKey);
  }

  async startVoting(gameId, privateKey) {
    return this.send('start_voting', [gameId], privateKey);
  }

  async finalizeGame(gameId, privateKey) {
    return this.send('finalize_game', [gameId], privateKey);
  }

  // View functions
  async getActiveGames() {
    return this.call('get_active_games');
  }

  async getGameInfo(gameId) {
    return this.call('get_game_info', [gameId]);
  }

  async getGameHistory(gameId) {
    return this.call('get_game_history', [gameId]);
  }

  async getLeaderboard() {
    return this.call('get_leaderboard');
  }

  async getPlayerHistory(address) {
    return this.call('get_player_history', [address]);
  }

  async getContractStats() {
    return this.call('get_contract_stats');
  }
}

/**
 * Wallet utilities
 */
export const generateWallet = () => {
  // Generate a random private key (for demo purposes)
  // In production, use proper wallet connection (MetaMask, WalletConnect, etc.)
  const privateKey = '0x' + Array(64).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  const address = '0x' + Array(40).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return { privateKey, address };
};

export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
