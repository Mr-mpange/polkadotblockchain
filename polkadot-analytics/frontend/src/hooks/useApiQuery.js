import { useState, useEffect, useCallback } from 'react';
import { formatApiError } from '../utils/api-utils';

export function useApiQuery(apiCall, options = {}) {
  const {
    enabled = true,
    onSuccess,
    onError,
    onSettled,
    refetchInterval,
    initialData,
    select,
  } = options;

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setStatus('loading');
    setError(null);

    try {
      const response = await apiCall();
      const result = select ? select(response) : response;
      
      setData(result);
      setStatus('success');
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const formattedError = formatApiError(err);
      setError(formattedError);
      setStatus('error');
      
      if (onError) {
        onError(formattedError);
      }
      
      throw formattedError;
    } finally {
      setIsLoading(false);
      
      if (onSettled) {
        onSettled();
      }
    }
  }, [apiCall, enabled, onError, onSettled, onSuccess, select]);

  useEffect(() => {
    if (!enabled) return;

    let intervalId;
    
    const executeFetch = () => {
      fetchData().catch(console.error);
    };

    // Initial fetch
    executeFetch();

    // Set up refetch interval if specified
    if (refetchInterval) {
      intervalId = setInterval(executeFetch, refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, fetchData, refetchInterval]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: status === 'error',
    isSuccess: status === 'success',
    isIdle: status === 'idle',
    refetch,
    status,
  };
}

export function useTVLData(params = {}, options = {}) {
  const apiService = new (require('../services/api').default)();
  
  return useApiQuery(
    () => apiService.getTVL(params),
    {
      ...options,
      select: (response) => ({
        ...response,
        // Transform data for easier consumption
        totalTVL: response.data?.total_tvl || '0',
        chains: response.data?.chains || [],
      }),
    }
  );
}

export function useTVLHistory(params = {}, options = {}) {
  const apiService = new (require('../services/api').default)();
  
  return useApiQuery(
    () => apiService.getTVLHistory(params.chainId, params),
    {
      ...options,
      enabled: !!params.chainId,
      select: (response) => ({
        ...response,
        // Transform data for charts
        chartData: (response.data || []).map(item => ({
          date: new Date(item.timestamp),
          value: parseFloat(item.value) || 0,
          chainId: item.chain_id,
          chainName: item.chain_name,
          tokenSymbol: item.token_symbol,
        })),
      }),
    }
  );
}
