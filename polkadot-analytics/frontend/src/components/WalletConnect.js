'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogIn, FiExternalLink, FiCopy, FiCheck, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const WalletConnect = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Check if Polkadot.js extension is available
      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];

        if (polkadotExtension) {
          // Check if already connected
          const accounts = await polkadotExtension.enable('Polkadot Analytics');

          if (accounts && accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0]);
            await fetchBalance(accounts[0].address);
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const fetchBalance = async (address) => {
    try {
      // Fetch balance from backend API (which uses Subscan)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/subscan/balance/${address}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data?.data) {
        const balanceData = data.data.data;
        // Convert from planck to DOT (1 DOT = 10^10 planck)
        const dotBalance = (parseInt(balanceData.balance || 0) / 10000000000).toFixed(4);
        setBalance(`${dotBalance} DOT`);
      } else {
        setBalance('0.0000 DOT');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('Unable to fetch');
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);

    try {
      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];

        if (!polkadotExtension) {
          // Redirect to install extension
          window.open('https://polkadot.js.org/extension/', '_blank');
          return;
        }

        // Enable the extension
        const accounts = await polkadotExtension.enable('Polkadot Analytics');

        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
          await fetchBalance(accounts[0].address);

          // Store connection in localStorage for persistence
          localStorage.setItem('polkadot-account', JSON.stringify(accounts[0]));
        }
      } else {
        // No extension available
        alert('Please install the Polkadot.js extension to connect your wallet.');
        window.open('https://polkadot.js.org/extension/', '_blank');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('polkadot-account');

      setIsConnected(false);
      setAccount(null);
      setBalance(null);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const copyAddress = async () => {
    if (account?.address) {
      try {
        await navigator.clipboard.writeText(account.address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getAccountDisplayName = () => {
    if (account?.meta?.name) {
      return account.meta.name;
    }
    return formatAddress(account?.address);
  };

  if (!isConnected) {
    return (
      <div className={className}>
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center space-x-2 bg-gradient-polkadot hover:opacity-90"
        >
          <FiLogIn className="h-4 w-4" />
          <span>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="hidden sm:inline">{getAccountDisplayName()}</span>
        <span className="sm:hidden">{formatAddress(account?.address)}</span>
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              {/* Account Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-polkadot rounded-full flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {account?.meta?.name || 'Polkadot Account'}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {formatAddress(account?.address)}
                  </div>
                </div>
              </div>

              {/* Balance */}
              {balance && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Balance</div>
                  <div className="font-mono font-medium">{balance}</div>
                </div>
              )}

              {/* Network Badge */}
              <div className="mb-4">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Polkadot Network</span>
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="w-full justify-start"
                >
                  {copiedAddress ? (
                    <>
                      <FiCheck className="h-4 w-4 mr-2 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="h-4 w-4 mr-2" />
                      <span>Copy Address</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open(`https://polkadot.subscan.io/account/${account?.address}`, '_blank');
                  }}
                  className="w-full justify-start"
                >
                  <FiExternalLink className="h-4 w-4 mr-2" />
                  <span>View on Subscan</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open('https://polkadot.js.org/apps/', '_blank');
                  }}
                  className="w-full justify-start"
                >
                  <FiSettings className="h-4 w-4 mr-2" />
                  <span>Polkadot Apps</span>
                </Button>

                <div className="border-t pt-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectWallet}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FiLogOut className="h-4 w-4 mr-2" />
                    <span>Disconnect</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default WalletConnect;
