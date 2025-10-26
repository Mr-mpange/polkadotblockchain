const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllParachains,
  getParachainById,
  getParachainMetrics,
  getParachainTVL,
  getParachainActivity,
  updateParachain
} = require('../controllers/parachains');

/**
 * @swagger
 * components:
 *   schemas:
 *     Parachain:
 *       type: object
 *       properties:
 *         parachainId:
 *           type: number
 *           description: The parachain ID
 *         name:
 *           type: string
 *           description: The parachain name
 *         symbol:
 *           type: string
 *           description: The parachain symbol
 *         description:
 *           type: string
 *           description: Description of the parachain
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Coming Soon, Retired]
 *         category:
 *           type: string
 *           enum: [DeFi, NFT, Gaming, Infrastructure, Privacy, Identity, Other]
 *       example:
 *         parachainId: 0
 *         name: "Polkadot"
 *         symbol: "DOT"
 *         description: "The main Polkadot relay chain"
 *         status: "Active"
 *         category: "Infrastructure"
 */

/**
 * @swagger
 * /api/parachains:
 *   get:
 *     summary: Get all parachains
 *     tags: [Parachains]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Coming Soon, Retired]
 *         description: Filter by parachain status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [DeFi, NFT, Gaming, Infrastructure, Privacy, Identity, Other]
 *         description: Filter by parachain category
 *       - in: query
 *         name: relayChain
 *         schema:
 *           type: string
 *           enum: [Polkadot, Kusama]
 *         description: Filter by relay chain
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Limit the number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of parachains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Parachain'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
router.get('/', asyncHandler(getAllParachains));

/**
 * @swagger
 * /api/parachains/{id}:
 *   get:
 *     summary: Get parachain by ID
 *     tags: [Parachains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parachain ID
 *     responses:
 *       200:
 *         description: Parachain details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Parachain'
 *       404:
 *         description: Parachain not found
 *       500:
 *         description: Server error
 */
router.get('/:id', asyncHandler(getParachainById));

/**
 * @swagger
 * /api/parachains/{id}/metrics:
 *   get:
 *     summary: Get comprehensive metrics for a parachain
 *     tags: [Parachains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parachain ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *           default: 24h
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: Parachain metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     parachain:
 *                       $ref: '#/components/schemas/Parachain'
 *                     tvl:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                         change24h:
 *                           type: number
 *                         history:
 *                           type: array
 *                           items:
 *                             type: object
 *                     activity:
 *                       type: object
 *                       properties:
 *                         transactions24h:
 *                           type: number
 *                         activeAccounts24h:
 *                           type: number
 *                         blocksProduced24h:
 *                           type: number
 *                         history:
 *                           type: array
 *                           items:
 *                             type: object
 *                     health:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         uptime:
 *                           type: number
 *                         lastBlock:
 *                           type: number
 *       404:
 *         description: Parachain not found
 *       500:
 *         description: Server error
 */
router.get('/:id/metrics', asyncHandler(getParachainMetrics));

/**
 * @swagger
 * /api/parachains/{id}/tvl:
 *   get:
 *     summary: Get TVL data for a parachain
 *     tags: [Parachains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parachain ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for TVL history
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for TVL history
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: hour
 *         description: Group TVL data by time period
 *     responses:
 *       200:
 *         description: TVL data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: number
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           value:
 *                             type: number
 *                           change:
 *                             type: number
 *       404:
 *         description: Parachain not found
 *       500:
 *         description: Server error
 */
router.get('/:id/tvl', asyncHandler(getParachainTVL));

/**
 * @swagger
 * /api/parachains/{id}/activity:
 *   get:
 *     summary: Get activity data for a parachain
 *     tags: [Parachains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parachain ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for activity history
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for activity history
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: hour
 *         description: Group activity data by time period
 *     responses:
 *       200:
 *         description: Activity data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           count:
 *                             type: number
 *                           volume:
 *                             type: number
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           active:
 *                             type: number
 *                           new:
 *                             type: number
 *                     blocks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           produced:
 *                             type: number
 *                           time:
 *                             type: number
 *       404:
 *         description: Parachain not found
 *       500:
 *         description: Server error
 */
router.get('/:id/activity', asyncHandler(getParachainActivity));

/**
 * @swagger
 * /api/parachains/{id}:
 *   put:
 *     summary: Update parachain information (Admin only)
 *     tags: [Parachains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parachain ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               symbol:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [DeFi, NFT, Gaming, Infrastructure, Privacy, Identity, Other]
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Coming Soon, Retired]
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   twitter:
 *                     type: string
 *                   telegram:
 *                     type: string
 *                   discord:
 *                     type: string
 *                   github:
 *                     type: string
 *                   medium:
 *                     type: string
 *     responses:
 *       200:
 *         description: Parachain updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Parachain not found
 *       500:
 *         description: Server error
 */
router.put('/:id', asyncHandler(updateParachain));

module.exports = router;
