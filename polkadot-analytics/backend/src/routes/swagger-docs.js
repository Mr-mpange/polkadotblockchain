/**
 * @swagger
 * /api/parachains:
 *   get:
 *     summary: Get all parachains
 *     tags: [Parachains]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (DeFi, Smart Contracts, etc.)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [tvl, transactions, users]
 *         description: Sort results by field
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Parachain'
 *                 count:
 *                   type: integer
 *                   example: 25
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
 *           type: number
 *         description: Parachain ID
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

/**
 * @swagger
 * /api/tvl:
 *   get:
 *     summary: Get TVL data
 *     tags: [TVL]
 *     parameters:
 *       - in: query
 *         name: parachain
 *         schema:
 *           type: number
 *         description: Filter by parachain ID (optional, returns all if not specified)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d, 1y]
 *           default: 24h
 *         description: Time period for data
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 1500000000
 *                     change:
 *                       type: number
 *                       example: 5.2
 *                     activeParachains:
 *                       type: number
 *                       example: 45
 *                 chartData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TVLData'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/activity:
 *   get:
 *     summary: Get user activity data
 *     tags: [Activity]
 *     parameters:
 *       - in: query
 *         name: parachain
 *         schema:
 *           type: number
 *         description: Filter by parachain ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 24h
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get active alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, acknowledged, resolved]
 *         description: Filter by alert status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *     responses:
 *       200:
 *         description: List of alerts
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
 *                     $ref: '#/components/schemas/Alert'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/alerts/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert acknowledged
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/history/tvl:
 *   get:
 *     summary: Get historical TVL data
 *     tags: [History]
 *     parameters:
 *       - in: query
 *         name: parachain
 *         schema:
 *           type: number
 *         description: Parachain ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Historical TVL data
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
 *                     $ref: '#/components/schemas/TVLData'
 *       400:
 *         description: Invalid date range
 *       500:
 *         description: Server error
 */

module.exports = {}; // Export empty object for routing
