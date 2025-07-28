from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Cinema(Base):
    __tablename__ = "cinemas"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    address = Column(String(200), nullable=False)
    phone = Column(String(20))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    theaters = relationship("Theater", back_populates="cinema")

class Theater(Base):
    __tablename__ = "theaters"
    
    id = Column(Integer, primary_key=True, index=True)
    cinema_id = Column(Integer, ForeignKey("cinemas.id"), nullable=False)
    name = Column(String(50), nullable=False)
    rows = Column(Integer, nullable=False)
    seats_per_row = Column(Integer, nullable=False)
    theater_type = Column(String(20), default="standard")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    cinema = relationship("Cinema", back_populates="theaters")
    seats = relationship("Seat", back_populates="theater")
    showtimes = relationship("Showtime", back_populates="theater")