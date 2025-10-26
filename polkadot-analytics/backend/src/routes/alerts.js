const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlertStats
} = require('../controllers/alerts');

/**
 * @swagger
 * components:
 *   schemas:
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The alert ID
 *         type:
 *           type: string
 *           enum: [tvl_drop, tvl_spike, activity_drop, activity_spike, xcm_anomaly, new_parachain, parachain_issue]
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         title:
 *           type: string
 *           description: Alert title
 *         message:
 *           type: string
 *           description: Alert description
 *         parachainId:
 *           type: number
 *           description: Associated parachain ID
 *         isActive:
 *           type: boolean
 *           description: Whether alert is still active
 *         firstSeen:
 *           type: string
 *           format: date-time
 *         lastSeen:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get all alerts
 *     tags: [Alerts]
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
 *         description: Filter by alert severity
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [tvl_drop, tvl_spike, activity_drop, activity_spike, xcm_anomaly, new_parachain, parachain_issue]
 *         description: Filter by alert type
 *       - in: query
 *         name: parachainId
 *         schema:
 *           type: integer
 *         description: Filter by parachain ID
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
router.get('/', asyncHandler(getAllAlerts));

/**
 * @swagger
 * /api/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Alert statistics
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
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     acknowledged:
 *                       type: integer
 *                     resolved:
 *                       type: integer
 *                     bySeverity:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                         high:
 *                           type: integer
 *                         medium:
 *                           type: integer
 *                         low:
 *                           type: integer
 *                     byType:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     recent:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Alert'
 *       500:
 *         description: Server error
 */
router.get('/stats', asyncHandler(getAlertStats));

/**
 * @swagger
 * /api/alerts/{id}:
 *   get:
 *     summary: Get alert by ID
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The alert ID
 *     responses:
 *       200:
 *         description: Alert details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Alert'
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.get('/:id', asyncHandler(getAlertById));

/**
 * @swagger
 * /api/alerts/{id}/acknowledge:
 *   put:
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
 *         description: The alert ID
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.put('/:id/acknowledge', asyncHandler(acknowledgeAlert));

/**
 * @swagger
 * /api/alerts/{id}/resolve:
 *   put:
 *     summary: Resolve an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The alert ID
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Server error
 */
router.put('/:id/resolve', asyncHandler(resolveAlert));

module.exports = router;
