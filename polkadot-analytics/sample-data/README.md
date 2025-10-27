# Sample Data

This directory contains sample data files for development and testing of the Polkadot Analytics Platform.

## Files

### `parachains.json`
Contains basic information about sample parachains including:
- Parachain ID and name
- Token symbols and supply information
- Status and descriptions

### `tvl_data.json`
Sample TVL (Total Value Locked) data for multiple parachains over 5 days:
- Daily TVL values in USD
- Transaction counts
- User activity metrics
- Trading volume and fees

### `transactions_data.json`
Detailed transaction and user activity data:
- Daily transaction counts
- Unique active users
- New vs returning user breakdown
- Activity trends

### `blocks_data.json`
Blockchain production metrics:
- Blocks produced and finalized
- Average block time
- Validator counts
- Network performance indicators

## Usage

### For Backend Testing
Import this data into MongoDB for testing API endpoints:

```bash
# Using mongoimport (if you have MongoDB installed locally)
mongoimport --db polkadot_analytics --collection parachains --file sample-data/parachains.json --jsonArray
mongoimport --db polkadot_analytics --collection tvl_data --file sample-data/tvl_data.json --jsonArray
mongoimport --db polkadot_analytics --collection transactions_data --file sample-data/transactions_data.json --jsonArray
mongoimport --db polkadot_analytics --collection blocks_data --file sample-data/blocks_data.json --jsonArray
```

### For Frontend Development
The frontend components can use this data for:
- Dashboard metrics display
- Chart visualizations
- Historical trend analysis
- Alert system testing

### For AI Analytics
The AI analytics modules can use this data for:
- Time series forecasting model training
- Anomaly detection testing
- Insights generation
- Pattern recognition

## Data Structure

All data files follow consistent JSON structures:

### Parachain Data
```json
{
  "parachain_id": "0",
  "name": "Polkadot",
  "symbol": "DOT",
  "description": "...",
  "total_supply": "1200000000",
  "status": "active"
}
```

### Time Series Data
```json
{
  "parachain_id": "0",
  "timestamp": "2024-01-01T00:00:00Z",
  "tvl": 12500000000,
  "transactions": 45000,
  "users": 8500,
  "blocks": 14400,
  "volume": 15000000,
  "fees": 2500
}
```

## Generating More Data

To generate additional sample data for testing:

1. **Extend Time Range**: Copy existing data patterns and extend dates
2. **Add More Parachains**: Create entries for additional parachain IDs (203, 204, etc.)
3. **Vary Patterns**: Introduce different growth rates, seasonal patterns, and volatility levels
4. **Add Anomalies**: Include unusual data points for anomaly detection testing

## Notes

- This is synthetic data for development purposes only
- In production, use real Polkadot API data from Subscan or Polkadot.js
- Data spans 5 days with hourly/daily granularity
- All monetary values are in USD
- Block times are in seconds
- User counts represent unique active addresses
