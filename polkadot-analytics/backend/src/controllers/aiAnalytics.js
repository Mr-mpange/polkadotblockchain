const { logger } = require('../utils/logger');

/**
 * AI Analytics Controller
 * Provides AI-powered insights and predictions for parachains
 */

// Simple moving average calculation
function calculateSMA(data, period) {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

// Calculate trend direction and strength
function calculateTrend(data) {
  if (data.length < 2) return { direction: 'neutral', strength: 0 };
  
  const recent = data.slice(-7); // Last 7 data points
  const older = data.slice(-14, -7); // Previous 7 data points
  
  if (recent.length === 0 || older.length === 0) {
    return { direction: 'neutral', strength: 0 };
  }
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  let direction = 'neutral';
  if (change > 2) direction = 'up';
  else if (change < -2) direction = 'down';
  
  return {
    direction,
    strength: Math.abs(change),
    change: change
  };
}

// Generate AI insights based on parachain data
function generateInsights(parachainData, historicalData = []) {
  const insights = [];
  
  // TVL Analysis
  if (parachainData.tvl) {
    const tvlChange = parachainData.tvl_change_24h || 0;
    
    if (tvlChange > 5) {
      insights.push({
        type: 'positive',
        message: `Strong TVL growth of ${tvlChange.toFixed(2)}% in the last 24 hours indicates increasing user confidence and capital inflow.`,
        confidence: 0.85,
        category: 'tvl'
      });
    } else if (tvlChange < -5) {
      insights.push({
        type: 'warning',
        message: `TVL decreased by ${Math.abs(tvlChange).toFixed(2)}% in 24h. Monitor for potential capital outflow or market conditions.`,
        confidence: 0.80,
        category: 'tvl'
      });
    } else if (Math.abs(tvlChange) < 1) {
      insights.push({
        type: 'neutral',
        message: `TVL remains stable with minimal change (${tvlChange.toFixed(2)}%), suggesting steady market conditions.`,
        confidence: 0.90,
        category: 'tvl'
      });
    }
  }
  
  // Activity Analysis
  if (parachainData.transactions_24h) {
    const txCount = parachainData.transactions_24h;
    
    if (txCount > 50000) {
      insights.push({
        type: 'positive',
        message: `High transaction volume (${txCount.toLocaleString()}) indicates strong network activity and user engagement.`,
        confidence: 0.88,
        category: 'activity'
      });
    } else if (txCount < 10000) {
      insights.push({
        type: 'warning',
        message: `Low transaction volume (${txCount.toLocaleString()}) may indicate reduced user activity. Consider investigating user engagement.`,
        confidence: 0.75,
        category: 'activity'
      });
    }
  }
  
  // Category-specific insights
  if (parachainData.category === 'DeFi') {
    insights.push({
      type: 'neutral',
      message: 'As a DeFi parachain, TVL and transaction volume are key metrics. Monitor liquidity pools and yield farming activity.',
      confidence: 0.92,
      category: 'category'
    });
  } else if (parachainData.category === 'Smart Contracts') {
    insights.push({
      type: 'neutral',
      message: 'Smart contract deployments and developer activity are important growth indicators for this parachain.',
      confidence: 0.90,
      category: 'category'
    });
  }
  
  // Historical trend analysis
  if (historicalData.length > 0) {
    const tvlValues = historicalData.map(d => d.tvl || 0);
    const trend = calculateTrend(tvlValues);
    
    if (trend.direction === 'up' && trend.strength > 5) {
      insights.push({
        type: 'positive',
        message: `Strong upward trend detected over the past week with ${trend.change.toFixed(1)}% growth. Momentum is building.`,
        confidence: 0.82,
        category: 'trend'
      });
    } else if (trend.direction === 'down' && trend.strength > 5) {
      insights.push({
        type: 'negative',
        message: `Downward trend observed with ${Math.abs(trend.change).toFixed(1)}% decline. Consider risk management strategies.`,
        confidence: 0.78,
        category: 'trend'
      });
    }
  }
  
  return insights;
}

// Generate AI predictions
function generatePredictions(parachainData, historicalData = []) {
  const predictions = [];
  const currentTVL = parachainData.tvl || 0;
  const tvlChange = parachainData.tvl_change_24h || 0;
  
  // Short-term prediction (24h)
  const shortTermChange = tvlChange * 0.7; // Dampened momentum
  const shortTermTVL = currentTVL * (1 + shortTermChange / 100);
  
  predictions.push({
    timeframe: '24h',
    metric: 'tvl',
    predicted_value: shortTermTVL,
    current_value: currentTVL,
    change_percent: shortTermChange,
    confidence: 0.75,
    factors: [
      'Current momentum',
      'Recent transaction volume',
      'Market conditions'
    ]
  });
  
  // Medium-term prediction (7d)
  let mediumTermChange = tvlChange * 3; // Extended trend
  if (historicalData.length > 0) {
    const tvlValues = historicalData.map(d => d.tvl || 0);
    const trend = calculateTrend(tvlValues);
    mediumTermChange = trend.change * 1.2;
  }
  
  const mediumTermTVL = currentTVL * (1 + mediumTermChange / 100);
  
  predictions.push({
    timeframe: '7d',
    metric: 'tvl',
    predicted_value: mediumTermTVL,
    current_value: currentTVL,
    change_percent: mediumTermChange,
    confidence: 0.65,
    factors: [
      'Historical trend analysis',
      'Ecosystem growth patterns',
      'Seasonal variations'
    ]
  });
  
  // Long-term prediction (30d)
  const longTermChange = mediumTermChange * 1.5;
  const longTermTVL = currentTVL * (1 + longTermChange / 100);
  
  predictions.push({
    timeframe: '30d',
    metric: 'tvl',
    predicted_value: longTermTVL,
    current_value: currentTVL,
    change_percent: longTermChange,
    confidence: 0.50,
    factors: [
      'Long-term growth trajectory',
      'Market cycle analysis',
      'Competitive landscape'
    ]
  });
  
  // Activity prediction
  const currentTx = parachainData.transactions_24h || 0;
  const txGrowth = tvlChange * 0.5; // Transactions correlate with TVL
  
  predictions.push({
    timeframe: '7d',
    metric: 'transactions',
    predicted_value: currentTx * (1 + txGrowth / 100),
    current_value: currentTx,
    change_percent: txGrowth,
    confidence: 0.70,
    factors: [
      'User engagement trends',
      'Network activity patterns',
      'TVL correlation'
    ]
  });
  
  return predictions;
}

/**
 * Get AI insights for a specific parachain
 */
async function getInsights(req, res) {
  try {
    const { parachainId } = req.params;
    
    logger.info(`Fetching AI insights for parachain ${parachainId}`);
    
    // In a real implementation, you would:
    // 1. Fetch parachain data from database
    // 2. Fetch historical data
    // 3. Run ML models for analysis
    
    // For now, we'll use mock data structure
    const parachainData = {
      parachain_id: parachainId,
      tvl: 500000000 + Math.random() * 200000000,
      tvl_change_24h: (Math.random() - 0.5) * 10,
      transactions_24h: 50000 + Math.floor(Math.random() * 100000),
      category: parachainId === '2000' ? 'DeFi' : 'Smart Contracts'
    };
    
    // Generate historical data for trend analysis
    const historicalData = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (14 - i) * 86400000).toISOString(),
      tvl: parachainData.tvl * (0.9 + Math.random() * 0.2),
      transactions: parachainData.transactions_24h * (0.8 + Math.random() * 0.4)
    }));
    
    const insights = generateInsights(parachainData, historicalData);
    
    const summary = insights.length > 0 
      ? `Analysis of ${insights.length} key metrics shows ${insights.filter(i => i.type === 'positive').length} positive signals and ${insights.filter(i => i.type === 'warning').length} areas to monitor.`
      : 'Insufficient data for comprehensive analysis.';
    
    res.json({
      status: 'success',
      data: {
        parachain_id: parachainId,
        insights,
        summary,
        generated_at: new Date().toISOString(),
        model_version: '1.0.0'
      }
    });
    
  } catch (error) {
    logger.error('Error generating AI insights:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate AI insights',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get AI predictions for a specific parachain
 */
async function getPredictions(req, res) {
  try {
    const { parachainId } = req.params;
    
    logger.info(`Fetching AI predictions for parachain ${parachainId}`);
    
    // Mock parachain data
    const parachainData = {
      parachain_id: parachainId,
      tvl: 500000000 + Math.random() * 200000000,
      tvl_change_24h: (Math.random() - 0.5) * 10,
      transactions_24h: 50000 + Math.floor(Math.random() * 100000),
      category: parachainId === '2000' ? 'DeFi' : 'Smart Contracts'
    };
    
    // Generate historical data
    const historicalData = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (14 - i) * 86400000).toISOString(),
      tvl: parachainData.tvl * (0.9 + Math.random() * 0.2)
    }));
    
    const predictions = generatePredictions(parachainData, historicalData);
    
    res.json({
      status: 'success',
      data: {
        parachain_id: parachainId,
        predictions,
        generated_at: new Date().toISOString(),
        model_version: '1.0.0',
        disclaimer: 'Predictions are based on historical data and statistical models. Actual results may vary significantly.'
      }
    });
    
  } catch (error) {
    logger.error('Error generating AI predictions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate AI predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get AI analytics health status
 */
async function getHealth(req, res) {
  try {
    res.json({
      status: 'success',
      data: {
        service: 'ai-analytics',
        status: 'operational',
        models: {
          insights: {
            status: 'active',
            version: '1.0.0',
            last_updated: new Date().toISOString()
          },
          predictions: {
            status: 'active',
            version: '1.0.0',
            last_updated: new Date().toISOString()
          }
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error checking AI health:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check AI health'
    });
  }
}

module.exports = {
  getInsights,
  getPredictions,
  getHealth,
  generateInsights,
  generatePredictions
};
