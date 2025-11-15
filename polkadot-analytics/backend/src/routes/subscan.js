const express = require('express');
const router = express.Router();
const subscanService = require('../services/subscan');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/subscan/account/:address
 * @desc    Get account information from Subscan
 * @access  Public
 */
router.get('/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    logger.info(`Fetching account info for ${address}`);
    
    const data = await subscanService.getAccount(address);
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /account/:address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/balance/:address
 * @desc    Get account balance from Subscan
 * @access  Public
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    logger.info(`Fetching balance for ${address}`);
    
    const data = await subscanService.getAccountBalance(address);
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /balance/:address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account balance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/transactions/:address
 * @desc    Get account transactions from Subscan
 * @access  Public
 */
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 0, row = 20 } = req.query;
    
    logger.info(`Fetching transactions for ${address}`);
    
    const data = await subscanService.getAccountTransactions(address, parseInt(page), parseInt(row));
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /transactions/:address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/block/:blockNumber
 * @desc    Get block information from Subscan
 * @access  Public
 */
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const { blockNumber } = req.params;
    logger.info(`Fetching block ${blockNumber}`);
    
    const data = await subscanService.getBlock(parseInt(blockNumber));
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /block/:blockNumber:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch block information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/extrinsic/:hash
 * @desc    Get extrinsic information from Subscan
 * @access  Public
 */
router.get('/extrinsic/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    logger.info(`Fetching extrinsic ${hash}`);
    
    const data = await subscanService.getExtrinsic(hash);
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /extrinsic/:hash:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch extrinsic information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/metadata
 * @desc    Get runtime metadata from Subscan
 * @access  Public
 */
router.get('/metadata', async (req, res) => {
  try {
    logger.info('Fetching metadata');
    
    const data = await subscanService.getMetadata();
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /metadata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/daily-stats
 * @desc    Get daily statistics from Subscan
 * @access  Public
 */
router.get('/daily-stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    logger.info(`Fetching daily stats from ${start} to ${end}`);
    
    const data = await subscanService.getDailyStats(start, end);
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /daily-stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch daily statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/parachain/:id
 * @desc    Get parachain information from Subscan
 * @access  Public
 */
router.get('/parachain/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching parachain ${id}`);
    
    const data = await subscanService.getParachainInfo(parseInt(id));
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /parachain/:id:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch parachain information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/validators
 * @desc    Get validator information from Subscan
 * @access  Public
 */
router.get('/validators', async (req, res) => {
  try {
    logger.info('Fetching validators');
    
    const data = await subscanService.getValidators();
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /validators:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch validators',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/subscan/staking/:address
 * @desc    Get staking information for an account from Subscan
 * @access  Public
 */
router.get('/staking/:address', async (req, res) => {
  try {
    const { address } = req.params;
    logger.info(`Fetching staking info for ${address}`);
    
    const data = await subscanService.getStakingInfo(address);
    
    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    logger.error('Error in /staking/:address:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch staking information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
