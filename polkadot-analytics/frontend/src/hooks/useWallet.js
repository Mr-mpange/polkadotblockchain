import { useState, useEffect, useCallback } from 'react';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];

        if (polkadotExtension) {
          // Check if already connected
          const accounts = await polkadotExtension.enable('Polkadot Analytics');

          if (accounts && accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0]);
            await fetchBalance(accounts[0].address);

            // Store connection in localStorage for persistence
            localStorage.setItem('polkadot-account', JSON.stringify(accounts[0]));
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setError(error.message);
    }
  }, []);

  const fetchBalance = async (address) => {
    try {
      // This would typically call your backend API to get balance
      // For now, we'll simulate it or use Polkadot API directly
      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];
        if (polkadotExtension) {
          const api = await polkadotExtension.getAPI();
          const balanceInfo = await api.query.system.account(address);
          const freeBalance = balanceInfo.data.free.toString();
          const reservedBalance = balanceInfo.data.reserved.toString();

          // Convert from planck to DOT (1 DOT = 10^10 planck)
          const totalBalance = (parseInt(freeBalance) + parseInt(reservedBalance)) / 10000000000;

          setBalance(`${totalBalance.toFixed(4)} DOT`);
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('Unable to fetch');
    }
  };

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];

        if (!polkadotExtension) {
          // Redirect to install extension
          window.open('https://polkadot.js.org/extension/', '_blank');
          setError('Please install the Polkadot.js extension');
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
        } else {
          setError('No accounts found. Please create an account in Polkadot.js extension.');
        }
      } else {
        // No extension available
        setError('Polkadot.js extension not found');
        window.open('https://polkadot.js.org/extension/', '_blank');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      // Clear local storage
      localStorage.removeItem('polkadot-account');

      setIsConnected(false);
      setAccount(null);
      setBalance(null);
      setError(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    }
  }, []);

  const signMessage = useCallback(async (message) => {
    try {
      if (!isConnected || !account) {
        throw new Error('Wallet not connected');
      }

      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];
        if (polkadotExtension) {
          const signer = polkadotExtension.signer;
          const signature = await signer.signRaw({
            address: account.address,
            data: message,
            type: 'bytes'
          });

          return signature;
        }
      }

      throw new Error('Unable to sign message');
    } catch (error) {
      console.error('Error signing message:', error);
      setError(error.message);
      throw error;
    }
  }, [isConnected, account]);

  const sendTransaction = useCallback(async (to, amount) => {
    try {
      if (!isConnected || !account) {
        throw new Error('Wallet not connected');
      }

      if (typeof window !== 'undefined' && window.injectedWeb3) {
        const polkadotExtension = window.injectedWeb3['polkadot-js'];
        if (polkadotExtension) {
          const api = await polkadotExtension.getAPI();
          const signer = polkadotExtension.signer;

          // Convert amount to planck (1 DOT = 10^10 planck)
          const amountInPlanck = (parseFloat(amount) * 10000000000).toString();

          const tx = api.tx.balances.transfer(to, amountInPlanck);

          const hash = await tx.signAndSend(account.address, { signer });

          return hash;
        }
      }

      throw new Error('Unable to send transaction');
    } catch (error) {
      console.error('Error sending transaction:', error);
      setError(error.message);
      throw error;
    }
  }, [isConnected, account]);

  return {
    isConnected,
    account,
    balance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    signMessage,
    sendTransaction,
    checkConnection,
    clearError: () => setError(null),
  };
};
