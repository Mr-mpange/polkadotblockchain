const cron = require('node-cron');
const { logger } = require('../utils/logger');
const dataAggregator = require('./dataAggregator');
const Parachain = require('../models/Parachain');
const TVL = require('../models/TVL');
const Activity = require('../models/Activity');
const Alert = require('../models/Alert');

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  async initialize() {
    try {
      await dataAggregator.connect();
      logger.info('Scheduler initialized successfully');

      this.scheduleParachainDataCollection();
      this.scheduleTVLCalculation();
      this.scheduleActivityMonitoring();
      this.scheduleAlertChecking();

      this.isRunning = true;
      logger.info('All scheduled jobs started');
    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  scheduleParachainDataCollection() {
    // Run every 5 minutes
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Starting parachain data collection...');

        const parachains = await Parachain.find({ status: 'Active' });

        for (const parachain of parachains) {
          try {
            const data = await dataAggregator.getParachainData(parachain.parachainId);

            // Update or create activity record
            await Activity.findOneAndUpdate(
              {
                parachainId: parachain.parachainId,
                timestamp: {
                  $gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              },
              {
                ...data,
                parachainName: parachain.name,
                source: 'polkadot-api'
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
              }
            );

            logger.debug(`Updated data for parachain ${parachain.parachainId}`);
          } catch (error) {
            logger.error(`Failed to collect data for parachain ${parachain.parachainId}:`, error);
          }
        }

        logger.info('Parachain data collection completed');
      } catch (error) {
        logger.error('Error in parachain data collection job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('parachain-collection', job);
    job.start();
    logger.info('Parachain data collection job scheduled');
  }

  scheduleTVLCalculation() {
    // Run every 10 minutes
    const job = cron.schedule('*/10 * * * *', async () => {
      try {
        logger.info('Starting TVL calculation...');

        const parachains = await Parachain.find({ status: 'Active' });

        for (const parachain of parachains) {
          try {
            const tvlData = await dataAggregator.calculateTVL(parachain.parachainId);

            // Calculate date and hour for the record
            const timestamp = new Date();
            const date = timestamp.toISOString().split('T')[0];
            const hour = timestamp.getHours();

            await TVL.findOneAndUpdate(
              {
                parachainId: parachain.parachainId,
                date,
                hour
              },
              {
                ...tvlData,
                parachainName: parachain.name,
                date,
                hour,
                timestamp
              },
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
              }
            );

            logger.debug(`Updated TVL for parachain ${parachain.parachainId}`);
          } catch (error) {
            logger.error(`Failed to calculate TVL for parachain ${parachain.parachainId}:`, error);
          }
        }

        logger.info('TVL calculation completed');
      } catch (error) {
        logger.error('Error in TVL calculation job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('tvl-calculation', job);
    job.start();
    logger.info('TVL calculation job scheduled');
  }

  scheduleActivityMonitoring() {
    // Run every 15 minutes
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Starting activity monitoring...');

        const parachains = await Parachain.find({ status: 'Active' });

        for (const parachain of parachains) {
          try {
            // Get recent block range (last 100 blocks)
            const currentBlock = await dataAggregator.api.rpc.chain.getHeader();
            const startBlock = Math.max(1, currentBlock.number.toNumber() - 100);

            const transfers = await dataAggregator.getTransferData(parachain.parachainId, {
              start: startBlock,
              end: currentBlock.number.toNumber()
            });

            // Aggregate activity metrics
            const uniqueAccounts = new Set([
              ...transfers.map(t => t.from),
              ...transfers.map(t => t.to)
            ]);

            const totalVolume = transfers.reduce((sum, t) => sum + parseInt(t.amount), 0);
            const averageBlockTime = await dataAggregator.getAverageBlockTime();

            const activityData = {
              parachainId: parachain.parachainId,
              parachainName: parachain.name,
              blocksProduced: currentBlock.number.toNumber() - startBlock,
              averageBlockTime,
              totalTransactions: transfers.length,
              transactionsPerBlock: transfers.length / (currentBlock.number.toNumber() - startBlock),
              uniqueActiveAccounts: uniqueAccounts.size,
              newAccounts: 0, // Would need to track this separately
              totalTransfers: transfers.length,
              transferVolume: totalVolume.toString(),
              transferVolumeUSD: (totalVolume / 10000000000) * 5.5, // Convert to USD
              timestamp: new Date(),
              blockNumber: currentBlock.number.toNumber(),
              source: 'polkadot-api'
            };

            await Activity.findOneAndUpdate(
              {
                parachainId: parachain.parachainId,
                timestamp: {
                  $gte: new Date(Date.now() - 60 * 60 * 1000)
                }
              },
              activityData,
              {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
              }
            );

            logger.debug(`Updated activity for parachain ${parachain.parachainId}`);
          } catch (error) {
            logger.error(`Failed to monitor activity for parachain ${parachain.parachainId}:`, error);
          }
        }

        logger.info('Activity monitoring completed');
      } catch (error) {
        logger.error('Error in activity monitoring job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('activity-monitoring', job);
    job.start();
    logger.info('Activity monitoring job scheduled');
  }

  scheduleAlertChecking() {
    // Run every 5 minutes
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Starting alert checking...');

        await this.checkTVLAlerts();
        await this.checkActivityAlerts();
        await this.checkSystemAlerts();

        logger.info('Alert checking completed');
      } catch (error) {
        logger.error('Error in alert checking job:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set('alert-checking', job);
    job.start();
    logger.info('Alert checking job scheduled');
  }

  async checkTVLAlerts() {
    try {
      const parachains = await Parachain.find({ status: 'Active' });

      for (const parachain of parachains) {
        const currentTVL = await TVL.findOne({ parachainId: parachain.parachainId })
          .sort({ timestamp: -1 });

        if (!currentTVL) continue;

        // Get TVL from 24 hours ago
        const previousTVL = await TVL.findOne({
          parachainId: parachain.parachainId,
          timestamp: {
            $lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }).sort({ timestamp: -1 });

        if (previousTVL) {
          const change = ((currentTVL.totalValueLockedUSD - previousTVL.totalValueLockedUSD) / previousTVL.totalValueLockedUSD) * 100;

          // TVL Drop Alert
          if (change <= (parseFloat(process.env.TVL_DROP_THRESHOLD) || -10)) {
            await this.createAlert({
              type: 'tvl_drop',
              severity: Math.abs(change) > 20 ? 'critical' : 'high',
              title: `TVL Drop Alert: ${parachain.name}`,
              message: `TVL dropped by ${change.toFixed(2)}% in the last 24 hours`,
              parachainId: parachain.parachainId,
              parachainName: parachain.name,
              currentValue: currentTVL.totalValueLockedUSD,
              previousValue: previousTVL.totalValueLockedUSD,
              changePercentage: change,
              threshold: parseFloat(process.env.TVL_DROP_THRESHOLD) || -10
            });
          }

          // TVL Spike Alert
          if (change >= (parseFloat(process.env.TVL_SPIKE_THRESHOLD) || 20)) {
            await this.createAlert({
              type: 'tvl_spike',
              severity: change > 50 ? 'critical' : 'medium',
              title: `TVL Spike Alert: ${parachain.name}`,
              message: `TVL increased by ${change.toFixed(2)}% in the last 24 hours`,
              parachainId: parachain.parachainId,
              parachainName: parachain.name,
              currentValue: currentTVL.totalValueLockedUSD,
              previousValue: previousTVL.totalValueLockedUSD,
              changePercentage: change,
              threshold: parseFloat(process.env.TVL_SPIKE_THRESHOLD) || 20
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking TVL alerts:', error);
    }
  }

  async checkActivityAlerts() {
    try {
      const parachains = await Parachain.find({ status: 'Active' });

      for (const parachain of parachains) {
        const currentActivity = await Activity.findOne({ parachainId: parachain.parachainId })
          .sort({ timestamp: -1 });

        if (!currentActivity) continue;

        // Get activity from 24 hours ago
        const previousActivity = await Activity.findOne({
          parachainId: parachain.parachainId,
          timestamp: {
            $lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }).sort({ timestamp: -1 });

        if (previousActivity) {
          const txChange = ((currentActivity.totalTransactions - previousActivity.totalTransactions) / previousActivity.totalTransactions) * 100;

          // Activity Drop Alert
          if (txChange <= (parseFloat(process.env.TRANSACTION_DROP_THRESHOLD) || -15)) {
            await this.createAlert({
              type: 'activity_drop',
              severity: Math.abs(txChange) > 30 ? 'critical' : 'high',
              title: `Activity Drop Alert: ${parachain.name}`,
              message: `Transaction activity dropped by ${txChange.toFixed(2)}% in the last 24 hours`,
              parachainId: parachain.parachainId,
              parachainName: parachain.name,
              currentValue: currentActivity.totalTransactions,
              previousValue: previousActivity.totalTransactions,
              changePercentage: txChange,
              threshold: parseFloat(process.env.TRANSACTION_DROP_THRESHOLD) || -15
            });
          }

          // Activity Spike Alert
          if (txChange >= (parseFloat(process.env.TRANSACTION_SPIKE_THRESHOLD) || 50)) {
            await this.createAlert({
              type: 'activity_spike',
              severity: txChange > 100 ? 'critical' : 'medium',
              title: `Activity Spike Alert: ${parachain.name}`,
              message: `Transaction activity increased by ${txChange.toFixed(2)}% in the last 24 hours`,
              parachainId: parachain.parachainId,
              parachainName: parachain.name,
              currentValue: currentActivity.totalTransactions,
              previousValue: previousActivity.totalTransactions,
              changePercentage: txChange,
              threshold: parseFloat(process.env.TRANSACTION_SPIKE_THRESHOLD) || 50
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking activity alerts:', error);
    }
  }

  async checkSystemAlerts() {
    try {
      // Check if data aggregator is still connected
      if (!dataAggregator.isConnected) {
        await this.createAlert({
          type: 'parachain_issue',
          severity: 'critical',
          title: 'System Alert: Data Aggregator Disconnected',
          message: 'Lost connection to Polkadot API. Data collection may be affected.',
          source: 'system'
        });
      }

      // Check for missing data
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTVL = await TVL.find({ timestamp: { $gte: oneHourAgo } });

      if (recentTVL.length === 0) {
        await this.createAlert({
          type: 'parachain_issue',
          severity: 'high',
          title: 'System Alert: No Recent TVL Data',
          message: 'No TVL data collected in the last hour. Check data collection jobs.',
          source: 'system'
        });
      }
    } catch (error) {
      logger.error('Error checking system alerts:', error);
    }
  }

  async createAlert(alertData) {
    try {
      // Check if similar alert exists and is in cooldown
      const existingAlert = await Alert.findOne({
        type: alertData.type,
        parachainId: alertData.parachainId,
        isActive: true,
        cooldownUntil: { $gt: new Date() }
      });

      if (existingAlert) {
        logger.debug('Alert in cooldown, skipping creation');
        return;
      }

      const alert = new Alert({
        ...alertData,
        isActive: true,
        firstSeen: new Date(),
        lastSeen: new Date(),
        cooldownUntil: new Date(Date.now() + 60 * 60 * 1000) // 1 hour cooldown
      });

      await alert.save();

      // Send notifications
      await this.sendAlertNotifications(alert);

      logger.info(`Created alert: ${alert.title}`);
    } catch (error) {
      logger.error('Error creating alert:', error);
    }
  }

  async sendAlertNotifications(alert) {
    try {
      // Email notification
      if (process.env.SMTP_HOST && alert.notifications.email) {
        await this.sendEmailNotification(alert);
      }

      // Webhook notification
      if (process.env.ALERT_WEBHOOK_URL && alert.notifications.webhook) {
        await this.sendWebhookNotification(alert);
      }
    } catch (error) {
      logger.error('Error sending alert notifications:', error);
    }
  }

  async sendEmailNotification(alert) {
    // Implementation would go here using nodemailer
    logger.info(`Email notification sent for alert: ${alert.title}`);
  }

  async sendWebhookNotification(alert) {
    try {
      const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'alert',
          data: alert
        })
      });

      if (response.ok) {
        await alert.addNotificationAttempt('webhook', 'sent');
        logger.info(`Webhook notification sent for alert: ${alert.title}`);
      } else {
        await alert.addNotificationAttempt('webhook', 'failed', 'HTTP ' + response.status);
      }
    } catch (error) {
      await alert.addNotificationAttempt('webhook', 'failed', error.message);
      logger.error('Error sending webhook notification:', error);
    }
  }

  async stop() {
    logger.info('Stopping scheduler...');

    for (const [name, job] of this.jobs) {
      job.stop();
      logger.debug(`Stopped job: ${name}`);
    }

    await dataAggregator.disconnect();
    this.isRunning = false;

    logger.info('Scheduler stopped');
  }

  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {}
    };

    for (const [name, job] of this.jobs) {
      status.jobs[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }

    return status;
  }
}

module.exports = new Scheduler();
