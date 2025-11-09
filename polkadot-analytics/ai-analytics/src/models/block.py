from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel, Base

class Block(BaseModel, Base):
    __tablename__ = 'blocks'
    
    block_number = Column(Integer, index=True, unique=True)
    block_hash = Column(String(66), unique=True)
    parent_hash = Column(String(66))
    state_root = Column(String(66))
    extrinsics_root = Column(String(66))
    timestamp = Column(Integer, index=True)
    validator = Column(String(64))
    spec_version = Column(Integer)
    block_author = Column(String(64))
    block_author_name = Column(String(128), nullable=True)
    count_extrinsics = Column(Integer, default=0)
    count_events = Column(Integer, default=0)
    count_logs = Column(Integer, default=0)
    
    # Relationships
    extrinsics = relationship("Transaction", back_populates="block")
    
    def __repr__(self):
        return f"<Block {self.block_number}>"
        
    @classmethod
    def get_latest_block_number(cls, session):
        """Get the latest block number from the database."""
        from sqlalchemy import func
        latest = session.query(func.max(cls.block_number)).scalar()
        return latest or 0
