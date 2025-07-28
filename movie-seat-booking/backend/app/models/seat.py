from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
import enum

class SeatType(str, enum.Enum):
    STANDARD = "standard"
    VIP = "vip" 
    COUPLE = "couple"
    DISABLED = "disabled"

class SeatStatus(str, enum.Enum):
    AVAILABLE = "available"
    SELECTED = "selected"
    RESERVED = "reserved"
    OCCUPIED = "occupied"

class Seat(Base):
    __tablename__ = "seats"
    
    id = Column(Integer, primary_key=True, index=True)
    theater_id = Column(Integer, ForeignKey("theaters.id"), nullable=False)
    row_number = Column(Integer, nullable=False)
    seat_number = Column(Integer, nullable=False)
    seat_type = Column(Enum(SeatType), default=SeatType.STANDARD)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    theater = relationship("Theater", back_populates="seats")
    reservations = relationship("SeatReservation", back_populates="seat")

class SeatReservation(Base):
    __tablename__ = "seat_reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    showtime_id = Column(Integer, ForeignKey("showtimes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    status = Column(Enum(SeatStatus), default=SeatStatus.AVAILABLE)
    reserved_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    seat = relationship("Seat", back_populates="reservations")
    showtime = relationship("Showtime", back_populates="seat_reservations")
    user = relationship("User", back_populates="seat_reservations")
    booking = relationship("Booking", back_populates="seat_reservations")