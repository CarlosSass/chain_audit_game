import React, { useState, useEffect } from 'react';
import BlockchainAuditGame from './BlockchainAuditGame';
import { 
  createGenLayerClient, 
  ChainAuditContract, 
  CONTRACT_ADDRESS,
  NETWORK,
  generateWallet,
  shortenAddress 
} from './genlayer';

/**
 * Main Application Component
 * Handles GenLayer blockchain connection and mode switching
 */
export default function App() {
  const [mode, setMode] = useState('demo'); // 'demo' or 'blockchain'
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(true);

  // Connect to GenLayer
  const connectToGenLayer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create GenLayer client
      const client = await createGenLayerClient();
      
      if (!client) {
        throw new Error('Failed to connect to GenLayer network');
      }

      // Generate or load wallet
      let userWallet = localStorage.getItem('chainAuditWallet');
      if (userWallet) {
        userWallet = JSON.parse(userWallet);
      } else {
        userWallet = generateWallet();
        localStorage.setItem('chainAuditWallet', JSON.stringify(userWallet));
      }
      
      setWallet(userWallet);
      
      // Initialize contract instance
      if (CONTRACT_ADDRESS) {
        const contractInstance = new ChainAuditContract(client, CONTRACT_ADDRESS);
        setContract(contractInstance);
      }
      
      setConnected(true);
      setMode('blockchain');
      setShowModeSelector(false);
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect to GenLayer');
    } finally {
      setLoading(false);
    }
  };

  // Start demo mode
  const startDemoMode = () => {
    setMode('demo');
    setShowModeSelector(false);
  };

  // Mode selector UI
  if (showModeSelector) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>⛓️🔍</div>
          <h1 style={styles.title}>Chain Audit Game</h1>
          <p style={styles.subtitle}>Blockchain Security Multiplayer Game</p>
          
          <div style={styles.modeOptions}>
            <button 
              style={styles.modeButton}
              onClick={startDemoMode}
            >
              <span style={styles.modeIcon}>🎮</span>
              <span style={styles.modeTitle}>Demo Mode</span>
              <span style={styles.modeDesc}>Play offline with AI players</span>
            </button>
            
            <button 
              style={{...styles.modeButton, ...styles.blockchainButton}}
              onClick={connectToGenLayer}
              disabled={loading}
            >
              <span style={styles.modeIcon}>🔗</span>
              <span style={styles.modeTitle}>
                {loading ? 'Connecting...' : 'Blockchain Mode'}
              </span>
              <span style={styles.modeDesc}>
                Connect to GenLayer ({NETWORK})
              </span>
            </button>
          </div>
          
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
              <button 
                style={styles.retryButton}
                onClick={connectToGenLayer}
              >
                Retry
              </button>
            </div>
          )}
          
          <div style={styles.info}>
            <h3>🎯 How to Play</h3>
            <ul>
              <li>Analyze blockchain transaction logs</li>
              <li>Identify hidden vulnerabilities</li>
              <li>Vote to catch the Saboteur</li>
              <li>Earn GEN tokens for winning</li>
            </ul>
          </div>
          
          {!CONTRACT_ADDRESS && (
            <div style={styles.warning}>
              ⚠️ Contract address not configured. Set VITE_CONTRACT_ADDRESS in .env
            </div>
          )}
        </div>
        
        <div style={styles.footer}>
          <p>Powered by GenLayer Intelligent Contracts</p>
          <p style={styles.version}>v1.0.0 | Network: {NETWORK}</p>
        </div>
      </div>
    );
  }

  // Show connection status bar in blockchain mode
  const ConnectionBar = () => {
    if (mode !== 'blockchain' || !wallet) return null;
    
    return (
      <div style={styles.connectionBar}>
        <span style={styles.connectionStatus}>
          <span style={styles.statusDot}></span>
          Connected to GenLayer ({NETWORK})
        </span>
        <span style={styles.walletInfo}>
          🔑 {shortenAddress(wallet.address)}
        </span>
        <button 
          style={styles.switchModeBtn}
          onClick={() => setShowModeSelector(true)}
        >
          Switch Mode
        </button>
      </div>
    );
  };

  return (
    <div>
      <ConnectionBar />
      <BlockchainAuditGame 
        mode={mode}
        contract={contract}
        wallet={wallet}
      />
    </div>
  );
}

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
  },
  card: {
    background: 'rgba(20, 20, 30, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    border: '1px solid rgba(0, 255, 136, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  logo: {
    fontSize: '64px',
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center',
    color: '#888',
    marginBottom: '32px',
  },
  modeOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  modeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#fff',
  },
  blockchainButton: {
    border: '2px solid rgba(0, 255, 136, 0.3)',
    background: 'rgba(0, 255, 136, 0.1)',
  },
  modeIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  modeTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  modeDesc: {
    fontSize: '14px',
    color: '#888',
  },
  error: {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    color: '#ff4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retryButton: {
    background: 'rgba(255, 68, 68, 0.2)',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#ff4444',
    cursor: 'pointer',
  },
  warning: {
    background: 'rgba(255, 170, 0, 0.1)',
    border: '1px solid rgba(255, 170, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    color: '#ffaa00',
    fontSize: '14px',
    marginTop: '16px',
  },
  info: {
    background: 'rgba(68, 136, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  version: {
    fontSize: '12px',
    color: '#444',
    marginTop: '4px',
  },
  connectionBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(0, 255, 136, 0.1)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.3)',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#00ff88',
    fontSize: '14px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00ff88',
    boxShadow: '0 0 10px #00ff88',
  },
  walletInfo: {
    color: '#fff',
    fontSize: '14px',
  },
  switchModeBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '6px 12px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
  },
};
