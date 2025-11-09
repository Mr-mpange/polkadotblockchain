from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey, BigInteger, Float, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel, Base

class Transaction(BaseModel, Base):
    __tablename__ = 'transactions'
    
    # Basic transaction info
    extrinsic_hash = Column(String(66), unique=True, index=True)
    block_number = Column(Integer, ForeignKey('blocks.block_number'), index=True)
    extrinsic_index = Column(Integer)
    is_signed = Column(Boolean, default=True)
    signer = Column(String(64), index=True)
    signature = Column(String(256))
    call_module = Column(String(64), index=True)
    call_name = Column(String(64), index=True)
    params = Column(JSON)
    
    # Fee and weight info
    fee = Column(BigInteger)
    tip = Column(BigInteger)
    weight = Column(BigInteger)
    
    # Status
    success = Column(Boolean, default=True)
    error = Column(Text, nullable=True)
    
    # Relationships
    block = relationship("Block", back_populates="extrinsics")
    
    def __repr__(self):
        return f"<Transaction {self.extrinsic_hash[:10]}...>"
    
    @property
    def method(self):
        return f"{self.call_module}.{self.call_name}"
    
    @classmethod
    def get_transactions_by_address(cls, session, address, limit=100, offset=0):
        """Get transactions for a specific address."""
        return session.query(cls).filter(
            (cls.signer == address) | (cls.params['to'].astext == address)
        ).order_by(
            cls.block_number.desc()
        ).limit(limit).offset(offset).all()
