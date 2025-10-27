"""
AI Insights Generation for Parachain Analytics
Uses OpenAI or similar LLM to generate natural language insights
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json

# Optional OpenAI import - fallback if not available
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

import pandas as pd
import numpy as np


class InsightsGenerator:
    """Generates AI-powered insights for parachain data."""

    def __init__(self, openai_api_key: Optional[str] = None):
        """Initialize the insights generator."""
        self.openai_api_key = openai_api_key
        self._ready = False

        if self.openai_api_key and OPENAI_AVAILABLE:
            openai.api_key = self.openai_api_key
            self._ready = True
        elif self.openai_api_key and not OPENAI_AVAILABLE:
            logging.warning("OpenAI API key provided but openai package not available")
        else:
            logging.info("Running without OpenAI - using rule-based insights")

    def is_ready(self) -> bool:
        """Check if insights generator is ready."""
        return self._ready

    async def generate(
        self,
        parachain_id: Optional[str] = None,
        time_range_days: int = 30,
        include_predictions: bool = True
    ) -> Dict[str, Any]:
        """
        Generate insights for parachains.

        Args:
            parachain_id: Specific parachain ID (None for all)
            time_range_days: Time range for analysis
            include_predictions: Whether to include predictions in insights

        Returns:
            Generated insights
        """
        try:
            # Generate rule-based insights (works without OpenAI)
            insights = await self._generate_rule_based_insights(
                parachain_id, time_range_days
            )

            # Try to enhance with OpenAI if available
            if self._ready and OPENAI_AVAILABLE:
                insights = await self._enhance_with_openai(insights, parachain_id, time_range_days)

            return {
                "insights": insights,
                "summary": self._generate_summary(insights),
                "confidence": 0.85,
                "timestamp": datetime.now().isoformat(),
                "data_points": len(insights),
                "parachain_id": parachain_id,
                "time_range_days": time_range_days,
                "ai_enhanced": self._ready and OPENAI_AVAILABLE
            }

        except Exception as e:
            logging.error(f"Error generating insights: {e}")
            return {
                "insights": [],
                "summary": "Unable to generate insights at this time",
                "confidence": 0.0,
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

    async def _generate_rule_based_insights(
        self,
        parachain_id: Optional[str],
        time_range_days: int
    ) -> List[str]:
        """Generate insights using rule-based logic."""
        insights = []

        try:
            # Generate sample data for insights
            sample_data = await self._get_sample_data(parachain_id, time_range_days)

            if sample_data.empty:
                return ["No data available for analysis"]

            # Analyze trends
            trends = self._analyze_trends(sample_data)
            insights.extend(trends)

            # Analyze volatility
            volatility = self._analyze_volatility(sample_data)
            insights.extend(volatility)

            # Analyze patterns
            patterns = self._analyze_patterns(sample_data)
            insights.extend(patterns)

            # Generate parachain-specific insights
            if parachain_id:
                parachain_insights = self._analyze_parachain_health(sample_data, parachain_id)
                insights.extend(parachain_insights)

            return insights[:10]  # Limit to top 10 insights

        except Exception as e:
            logging.error(f"Error in rule-based insights: {e}")
            return [f"Error analyzing data: {str(e)}"]

    async def _get_sample_data(self, parachain_id: Optional[str], days: int) -> pd.DataFrame:
        """Get sample data for analysis."""
        try:
            # Generate synthetic data for demonstration
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            timestamps = pd.date_range(start=start_date, end=end_date, freq='D')

            # Create synthetic metrics
            np.random.seed(42)
            base_tvl = 1000000
            base_txns = 10000
            base_users = 1000

            data = []
            for i, timestamp in enumerate(timestamps):
                # Add trends and seasonality
                tvl_trend = base_tvl * (1 + 0.02 * i / 30)  # 2% growth
                tvl_seasonal = tvl_trend * (0.9 + 0.2 * np.sin(2 * np.pi * timestamp.dayofyear / 365))
                tvl_noise = np.random.normal(0, tvl_trend * 0.1)
                tvl = tvl_seasonal + tvl_noise

                txn_trend = base_txns * (1 + 0.015 * i / 30)
                txn_seasonal = txn_trend * (0.8 + 0.3 * np.sin(2 * np.pi * timestamp.dayofyear / 7))
                txn_noise = np.random.normal(0, txn_trend * 0.15)
                transactions = max(0, txn_seasonal + txn_noise)

                user_trend = base_users * (1 + 0.01 * i / 30)
                user_seasonal = user_trend * (0.9 + 0.15 * np.sin(2 * np.pi * timestamp.dayofyear / 30))
                user_noise = np.random.normal(0, user_trend * 0.1)
                users = max(0, user_seasonal + user_noise)

                data.append({
                    'timestamp': timestamp,
                    'tvl': tvl,
                    'transactions': transactions,
                    'users': users
                })

            df = pd.DataFrame(data)
            df = df.set_index('timestamp')

            return df

        except Exception as e:
            logging.error(f"Error getting sample data: {e}")
            return pd.DataFrame()

    def _analyze_trends(self, df: pd.DataFrame) -> List[str]:
        """Analyze trends in the data."""
        insights = []

        for metric in ['tvl', 'transactions', 'users']:
            if metric not in df.columns:
                continue

            values = df[metric].dropna()
            if len(values) < 7:
                continue

            # Calculate trend
            first_half = values.iloc[:len(values)//2].mean()
            second_half = values.iloc[len(values)//2:].mean()
            change_pct = ((second_half - first_half) / first_half) * 100

            if abs(change_pct) > 5:  # Significant change
                direction = "increased" if change_pct > 0 else "decreased"
                insights.append(
                    f"{metric.upper()} has {direction} by {abs(change_pct):.".1f" over the past "
                    f"{len(df)} days, indicating {'growth' if change_pct > 0 else 'decline'} momentum."
                )

        return insights

    def _analyze_volatility(self, df: pd.DataFrame) -> List[str]:
        """Analyze volatility in the data."""
        insights = []

        for metric in ['tvl', 'transactions', 'users']:
            if metric not in df.columns:
                continue

            values = df[metric].dropna()
            if len(values) < 7:
                continue

            # Calculate volatility (coefficient of variation)
            mean_val = values.mean()
            std_val = values.std()

            if mean_val > 0:
                cv = (std_val / mean_val) * 100

                if cv > 30:
                    insights.append(
                        f"{metric.upper()} shows high volatility ({cv:.".1f" coefficient of variation), "
                        "suggesting unstable market conditions."
                    )
                elif cv < 10:
                    insights.append(
                        f"{metric.upper()} is relatively stable ({cv:.".1f" coefficient of variation), "
                        "indicating consistent performance."
                    )

        return insights

    def _analyze_patterns(self, df: pd.DataFrame) -> List[str]:
        """Analyze patterns in the data."""
        insights = []

        for metric in ['tvl', 'transactions', 'users']:
            if metric not in df.columns:
                continue

            values = df[metric].dropna()
            if len(values) < 14:  # Need at least 2 weeks
                continue

            # Check for weekly patterns
            weekly_pattern = self._detect_weekly_pattern(values)
            if weekly_pattern['significant']:
                day = weekly_pattern['peak_day']
                insights.append(
                    f"{metric.upper()} shows a weekly pattern with peak activity typically on {day}s."
                )

        return insights

    def _detect_weekly_pattern(self, values: pd.Series) -> Dict[str, Any]:
        """Detect weekly patterns in time series data."""
        try:
            # This is a simplified pattern detection
            # In production, you'd use more sophisticated methods
            return {
                'significant': np.random.random() > 0.7,  # Simulate pattern detection
                'peak_day': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][np.random.randint(0, 7)]
            }
        except:
            return {'significant': False, 'peak_day': 'unknown'}

    def _analyze_parachain_health(self, df: pd.DataFrame, parachain_id: str) -> List[str]:
        """Analyze overall parachain health."""
        insights = []

        try:
            # Calculate overall health score
            health_score = 0
            factors = 0

            # TVL growth
            if 'tvl' in df.columns:
                tvl_values = df['tvl'].dropna()
                if len(tvl_values) > 1:
                    tvl_growth = (tvl_values.iloc[-1] - tvl_values.iloc[0]) / tvl_values.iloc[0]
                    if tvl_growth > 0.1:
                        health_score += 1
                    factors += 1

            # Transaction stability
            if 'transactions' in df.columns:
                txn_values = df['transactions'].dropna()
                if len(txn_values) > 1:
                    txn_cv = txn_values.std() / txn_values.mean() if txn_values.mean() > 0 else 1
                    if txn_cv < 0.5:  # Low volatility
                        health_score += 1
                    factors += 1

            # User engagement
            if 'users' in df.columns:
                user_values = df['users'].dropna()
                if len(user_values) > 1:
                    user_growth = (user_values.iloc[-1] - user_values.iloc[0]) / user_values.iloc[0]
                    if user_growth > 0.05:
                        health_score += 1
                    factors += 1

            if factors > 0:
                health_pct = (health_score / factors) * 100
                if health_pct >= 70:
                    insights.append(
                        f"Parachain {parachain_id} shows strong overall health with {health_pct:.".0f" "
                        "of indicators trending positively."
                    )
                elif health_pct <= 30:
                    insights.append(
                        f"Parachain {parachain_id} requires attention with only {health_pct:.".0f" "
                        "of health indicators showing positive trends."
                    )

        except Exception as e:
            logging.error(f"Error analyzing parachain health: {e}")

        return insights

    def _generate_summary(self, insights: List[str]) -> str:
        """Generate a summary of all insights."""
        if not insights:
            return "No significant insights available at this time."

        if len(insights) == 1:
            return insights[0]

        # Create a summary based on the number of insights
        summary = f"Analysis revealed {len(insights)} key insights: "
        summary += ", ".join(insights[:3])  # Include top 3 insights

        if len(insights) > 3:
            summary += f", and {len(insights) - 3} additional observations."

        return summary

    async def _enhance_with_openai(self, insights: List[str], parachain_id: Optional[str], time_range_days: int) -> List[str]:
        """Enhance insights using OpenAI (if available)."""
        if not OPENAI_AVAILABLE or not self.openai_api_key:
            return insights

        try:
            prompt = f"""
            You are an expert blockchain analyst. Based on the following raw insights about {'a Polkadot parachain' if parachain_id else 'Polkadot parachains'}, provide enhanced, professional insights:

            Raw insights:
            {chr(10).join(f"- {insight}" for insight in insights)}

            Please provide 3-5 enhanced insights that are:
            1. More detailed and actionable
            2. Include specific recommendations
            3. Use professional financial/blockchain terminology
            4. Focus on investment and operational implications

            Format each insight as a clear, concise statement.
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7
            )

            enhanced_content = response.choices[0].message.content.strip()

            # Split enhanced insights
            enhanced_insights = [line.strip('- ').strip()
                               for line in enhanced_content.split('\n')
                               if line.strip() and not line.startswith('Enhanced')]

            return enhanced_insights if enhanced_insights else insights

        except Exception as e:
            logging.error(f"Error enhancing insights with OpenAI: {e}")
            return insights
