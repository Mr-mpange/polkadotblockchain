from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from .base import BaseModel, Base

class Metric(BaseModel, Base):
    __tablename__ = 'metrics'
    
    # Composite primary key: (timestamp, parachain_id, metric_name)
    timestamp = Column(DateTime, primary_key=True, index=True)
    parachain_id = Column(Integer, ForeignKey('parachains.para_id'), primary_key=True, index=True)
    metric_name = Column(String(64), primary_key=True)
    
    # Metric values
    value_int = Column(BigInteger, nullable=True)
    value_float = Column(Float, nullable=True)
    value_str = Column(String(512), nullable=True)
    
    # Additional metadata
    metric_metadata = Column('metadata', String(512), nullable=True)
    
    # Relationships
    parachain = relationship("Parachain", back_populates="metrics")
    
    def __repr__(self):
        return f"<Metric {self.parachain_id}.{self.metric_name} @ {self.timestamp}>"
    
    @property
    def value(self):
        """Get the appropriate value based on type."""
        if self.value_int is not None:
            return self.value_int
        elif self.value_float is not None:
            return self.value_float
        return self.value_str
    
    @classmethod
    def get_metric_history(cls, session, parachain_id, metric_name, start_time=None, end_time=None, limit=1000):
        """Get historical data for a specific metric."""
        query = session.query(cls).filter(
            cls.parachain_id == parachain_id,
            cls.metric_name == metric_name
        )
        
        if start_time:
            query = query.filter(cls.timestamp >= start_time)
        if end_time:
            query = query.filter(cls.timestamp <= end_time)
            
        return query.order_by(cls.timestamp.desc()).limit(limit).all()
    
    @classmethod
    def get_latest_metric(cls, session, parachain_id, metric_name):
        """Get the latest value for a specific metric."""
        return session.query(cls).filter(
            cls.parachain_id == parachain_id,
            cls.metric_name == metric_name
        ).order_by(cls.timestamp.desc()).first()
