/**
 * Backend API Tests
 * Unit tests for the Polkadot Analytics backend API
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import the main app
const app = require('../src/app');

// Test suite
describe('Polkadot Analytics API', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polkadot_analytics_test');
    }
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.close();
  });

  describe('GET /parachains', () => {
    it('should return list of parachains', async () => {
      const response = await request(app)
        .get('/parachains')
        .expect(200);

      expect(response.body).toHaveProperty('parachains');
      expect(Array.isArray(response.body.parachains)).toBe(true);
    });

    it('should return parachains with required fields', async () => {
      const response = await request(app)
        .get('/parachains')
        .expect(200);

      if (response.body.parachains.length > 0) {
        const parachain = response.body.parachains[0];
        expect(parachain).toHaveProperty('parachain_id');
        expect(parachain).toHaveProperty('name');
        expect(parachain).toHaveProperty('symbol');
      }
    });
  });

  describe('GET /tvl', () => {
    it('should return TVL data', async () => {
      const response = await request(app)
        .get('/tvl')
        .expect(200);

      expect(response.body).toHaveProperty('total_tvl');
      expect(response.body).toHaveProperty('parachains');
      expect(typeof response.body.total_tvl).toBe('number');
      expect(Array.isArray(response.body.parachains)).toBe(true);
    });

    it('should return TVL data with date filter', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-05';

      const response = await request(app)
        .get(`/tvl?start_date=${startDate}&end_date=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_tvl');
      expect(response.body).toHaveProperty('parachains');
    });
  });

  describe('GET /activity', () => {
    it('should return activity metrics', async () => {
      const response = await request(app)
        .get('/activity')
        .expect(200);

      expect(response.body).toHaveProperty('total_transactions');
      expect(response.body).toHaveProperty('total_users');
      expect(response.body).toHaveProperty('total_blocks');
      expect(typeof response.body.total_transactions).toBe('number');
      expect(typeof response.body.total_users).toBe('number');
      expect(typeof response.body.total_blocks).toBe('number');
    });

    it('should return activity data for specific parachain', async () => {
      const response = await request(app)
        .get('/activity?parachain_id=0')
        .expect(200);

      expect(response.body).toHaveProperty('parachain_id');
      expect(response.body.parachain_id).toBe('0');
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('users');
    });
  });

  describe('GET /history', () => {
    it('should return historical data', async () => {
      const response = await request(app)
        .get('/history?metric=tvl&days=7')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return historical data for specific parachain', async () => {
      const response = await request(app)
        .get('/history?parachain_id=0&metric=transactions&days=7')
        .expect(200);

      expect(response.body).toHaveProperty('parachain_id');
      expect(response.body.parachain_id).toBe('0');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/non-existent-route')
        .expect(404);
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/history?metric=invalid_metric&days=abc')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
