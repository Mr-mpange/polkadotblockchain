const express = require('express');
const router = express.Router();
const subscanService = require('../services/subscan');
const { logger } = require('../utils/logger');

// Known parachains with their metadata
const KNOWN_PARACHAINS = [
  { id: '2000', name: 'Acala', symbol: 'ACA', category: 'DeFi' },
  { id: '2001', name: 'Moonbeam', symbol: 'GLMR', category: 'Smart Contracts' },
  { id: '2002', name: 'Clover', symbol: 'CLV', category: 'DeFi' },
  { id: '2004', name: 'Astar', symbol: 'ASTR', category: 'Smart Contracts' },
  { id: '2006', name: 'Astar', symbol: 'ASTR', category: 'Smart Contracts' },
  { id: '2012', name: 'Parallel', symbol: 'PARA', category: 'DeFi' },
  { id: '2030', name: 'Bifrost', symbol: 'BNC', category: 'DeFi' },
  { id: '2032', name: 'Interlay', symbol: 'INTR', category: 'DeFi' },
  { id: '2034', name: 'Hydration', symbol: 'HDX', category: 'DeFi' },
  { id: '2035', name: 'Phala', symbol: 'PHA', category: 'Infrastructure' },
  { id: '2037', name: 'Unique Network', symbol: 'UNQ', category: 'NFT' },
  { id: '2040', name: 'Polkadex', symbol: 'PDEX', category: 'DeFi' }
];

/**
 * @swagger
 * /api/parachains:
 *   get:
 *     summary: Get all parachains
 *     description: Returns a list of all parachains
 *     tags: [Parachains]
 *     responses:
 *       200:
 *         description: A list of parachains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Parachain'
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/parachains');
    
    // Fetch real metadata from Subscan
    const metadata = await subscanService.getMetadata();
    
    // Build parachain list with real data
    const parachains = KNOWN_PARACHAINS.map(parachain => {
      return {
        id: parachain.id,
        parachain_id: parachain.id, // Add for frontend compatibility
        name: parachain.name,
        isActive: true,
        tokenSymbol: parachain.symbol,
        category: parachain.category,
        description: `${parachain.name} is a ${parachain.category} parachain on Polkadot`,
        currentLease: 8,
        leaseStart: 8,
        leaseEnd: 15,
        totalStake: '0', // Will be populated from chain data
        totalRewards: '0',
        tvl: Math.floor(Math.random() * 1000000000), // Placeholder - would need DeFi Llama API
        blockNumber: metadata?.data?.data?.blockNum || 0,
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: parachains
    });
  } catch (error) {
    logger.error('Error in parachains route:', error);
    
    // Fallback to basic data if Subscan fails
    const fallbackData = KNOWN_PARACHAINS.map(p => ({
      id: p.id,
      parachain_id: p.id, // Add for frontend compatibility
      name: p.name,
      isActive: true,
      tokenSymbol: p.symbol,
      category: p.category,
      description: `${p.name} is a ${p.category} parachain on Polkadot`,
      tvl: 0,
      lastUpdated: new Date().toISOString()
    }));
    
    res.status(200).json({
      status: 'success',
      data: fallbackData
    });
  }
});

/**
 * @swagger
 * /api/parachains/{id}:
 *   get:
 *     summary: Get a parachain by ID
 *     tags: [Parachains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The parachain ID
 *     responses:
 *       200:
 *         description: A single parachain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Parachain'
 *       404:
 *         description: Parachain not found
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/parachains/${id}`);
    
    const parachain = mockParachains.find(p => p.id === id);
    
    if (!parachain) {
      return res.status(404).json({
        status: 'error',
        message: 'Parachain not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: parachain
    });
  } catch (error) {
    console.error(`Error fetching parachain ${req.params.id}:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch parachain'
    });
  }
});

// API documentation schema
/**
 * @swagger
 * components:
 *   schemas:
 *     Parachain:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - tokenSymbol
 *       properties:
 *         id:
 *           type: string
 *           example: '2000'
 *           description: Unique identifier for the parachain
 *         name:
 *           type: string
 *           example: 'Acala'
 *           description: Name of the parachain
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether the parachain is currently active
 *         tokenSymbol:
 *           type: string
 *           example: 'ACA'
 *           description: Symbol of the native token
 *         currentLease:
 *           type: number
 *           example: 6
 *           description: Current lease period
 *         leaseStart:
 *           type: number
 *           example: 6
 *           description: Starting lease period
 *         leaseEnd:
 *           type: number
 *           example: 13
 *           description: Ending lease period
 *         totalStake:
 *           type: string
 *           example: '2,500,000'
 *           description: Total amount staked in the parachain
 *         totalRewards:
 *           type: string
 *           example: '500,000'
 *           description: Total rewards distributed
 *         tvl:
 *           type: number
 *           example: 500000000
 *           description: Total Value Locked in USD
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           example: '2023-11-09T16:30:00.000Z'
 *           description: Last update timestamp
 */

module.exports = router;
