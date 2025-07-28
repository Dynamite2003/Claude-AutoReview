from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base
import enum

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class PaymentMethod(str, enum.Enum):
    ALIPAY = "alipay"
    WECHAT = "wechat"
    CREDIT_CARD = "credit_card"
    CASH = "cash"

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_number = Column(String(20), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    showtime_id = Column(Integer, ForeignKey("showtimes.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    payment_method = Column(Enum(PaymentMethod), nullable=True)
    payment_transaction_id = Column(String(100), nullable=True)
    booking_time = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="bookings")
    showtime = relationship("Showtime", back_populates="bookings")
    seat_reservations = relationship("SeatReservation", back_populates="booking")