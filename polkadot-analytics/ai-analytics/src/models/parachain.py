from sqlalchemy import Column, String, Integer, Float, JSON, Boolean
from .base import BaseModel, Base

class Parachain(BaseModel, Base):
    __tablename__ = 'parachains'
    
    para_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128))
    token_symbol = Column(String(16))
    token_decimals = Column(Integer, default=12)
    website = Column(String(256), nullable=True)
    description = Column(Text, nullable=True)
    logo_uri = Column(String(256), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # On-chain data
    lease_period_start = Column(Integer, nullable=True)
    lease_period_end = Column(Integer, nullable=True)
    current_lease_period = Column(Integer, nullable=True)
    
    # Metrics (cached)
    total_stake = Column(BigInteger, default=0)
    total_issuance = Column(BigInteger, default=0)
    active_accounts = Column(Integer, default=0)
    
    # Additional metadata
    metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Parachain {self.para_id}: {self.name}>"
    
    @classmethod
    def get_active_parachains(cls, session):
        """Get all active parachains."""
        return session.query(cls).filter(
            cls.is_active == True
        ).order_by(cls.para_id).all()
    
    @classmethod
    def get_parachain_by_id(cls, session, para_id):
        """Get a specific parachain by its ID."""
        return session.query(cls).filter(
            cls.para_id == para_id
        ).first()
