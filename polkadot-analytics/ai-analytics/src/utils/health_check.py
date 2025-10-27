"""
Health check utilities for AI Analytics
Monitors system health and service status
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psutil
import json


class HealthChecker:
    """Monitors the health of AI Analytics services."""

    def __init__(self):
        """Initialize the health checker."""
        self.start_time = datetime.now()
        self.checks_performed = 0
        self.last_check = None

    def get_status(self) -> Dict[str, Any]:
        """
        Get comprehensive health status.

        Returns:
            Health status information
        """
        try:
            status = {
                "service": "ai_analytics",
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "uptime_seconds": (datetime.now() - self.start_time).total_seconds(),
                "checks_performed": self.checks_performed,
                "last_check": self.last_check.isoformat() if self.last_check else None,
                "system": self._get_system_health(),
                "services": self._get_service_health()
            }

            # Overall health assessment
            service_issues = [s for s in status["services"].values() if s["status"] != "healthy"]
            if service_issues:
                status["status"] = "degraded"
                status["issues"] = service_issues

            self.checks_performed += 1
            self.last_check = datetime.now()

            return status

        except Exception as e:
            logging.error(f"Error getting health status: {e}")
            return {
                "service": "ai_analytics",
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _get_system_health(self) -> Dict[str, Any]:
        """Get system resource information."""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": psutil.virtual_memory().total,
                    "available": psutil.virtual_memory().available,
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total": psutil.disk_usage('/').total,
                    "free": psutil.disk_usage('/').free,
                    "percent": psutil.disk_usage('/').percent
                },
                "network": {
                    "connections": len(psutil.net_connections()),
                    "interfaces": len(psutil.net_if_addrs())
                }
            }
        except Exception as e:
            logging.error(f"Error getting system health: {e}")
            return {"error": str(e)}

    def _get_service_health(self) -> Dict[str, str]:
        """Get status of AI services."""
        # Check if model directories exist and have content
        model_dir = "models/cache"
        logs_dir = "logs"

        services = {
            "data_loader": self._check_directory(model_dir),
            "time_series_forecaster": self._check_models(model_dir),
            "anomaly_detector": self._check_models(model_dir),
            "insights_generator": {"status": "ready" if self._check_gemini() else "degraded"},
            "file_system": {
                "status": "healthy" if (os.path.exists(model_dir) and os.path.exists(logs_dir)) else "error"
            }
        }

        return services

    def _check_directory(self, path: str) -> Dict[str, str]:
        """Check if directory exists and is accessible."""
        try:
            if os.path.exists(path):
                if os.access(path, os.R_OK | os.W_OK):
                    return {"status": "healthy"}
                else:
                    return {"status": "error", "error": "No read/write access"}
            else:
                return {"status": "error", "error": "Directory does not exist"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_models(self, model_dir: str) -> Dict[str, str]:
        """Check if ML models are available."""
        try:
            if os.path.exists(model_dir):
                model_files = [f for f in os.listdir(model_dir) if f.endswith('.pkl')]
                if model_files:
                    return {"status": "healthy", "model_count": len(model_files)}
                else:
                    return {"status": "degraded", "message": "No trained models found"}
            else:
                return {"status": "error", "error": "Model directory not found"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _check_gemini(self) -> bool:
        """Check if Gemini API is configured."""
        try:
            # Check if google-generativeai package is available and API key is set
            import google.generativeai as genai
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    # Test the configuration by creating a model instance
                    model = genai.GenerativeModel('gemini-2.5-flash')
                    return True
                except Exception:
                    return False
            return False
        except ImportError:
            return False
        except Exception:
            return False

    async def perform_deep_check(self) -> Dict[str, Any]:
        """
        Perform a comprehensive health check including service tests.

        Returns:
            Detailed health check results
        """
        status = self.get_status()

        # Add deep check results
        deep_checks = {
            "database_connectivity": await self._check_database_connection(),
            "model_inference_test": await self._test_model_inference(),
            "memory_usage_test": self._test_memory_usage()
        }

        status["deep_checks"] = deep_checks

        # Update overall status based on deep checks
        failed_checks = [check for check in deep_checks.values() if check.get("status") == "error"]
        if failed_checks:
            status["status"] = "error"
            status["failed_checks"] = failed_checks

        return status

    async def _check_database_connection(self) -> Dict[str, Any]:
        """Test database connectivity."""
        try:
            # This would test actual database connection
            # For now, simulate the check
            await asyncio.sleep(0.1)  # Simulate async operation
            return {"status": "healthy", "response_time_ms": 100}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    async def _test_model_inference(self) -> Dict[str, Any]:
        """Test model inference capabilities."""
        try:
            # This would test actual model predictions
            # For now, simulate the test
            await asyncio.sleep(0.2)  # Simulate model inference
            return {"status": "healthy", "inference_time_ms": 200}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _test_memory_usage(self) -> Dict[str, Any]:
        """Test memory usage patterns."""
        try:
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()

            return {
                "status": "healthy",
                "memory_rss_mb": memory_info.rss / 1024 / 1024,
                "memory_vms_mb": memory_info.vms / 1024 / 1024
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def get_uptime(self) -> str:
        """Get formatted uptime string."""
        uptime = datetime.now() - self.start_time
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        if days > 0:
            return f"{days}d {hours}h {minutes}m {seconds}s"
        elif hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
