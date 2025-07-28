from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Movie(Base):
    __tablename__ = "movies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    duration = Column(Integer, nullable=False)
    genre = Column(String(100))
    rating = Column(String(10))
    director = Column(String(100))
    cast = Column(Text)
    poster_url = Column(String(500))
    trailer_url = Column(String(500))
    release_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    showtimes = relationship("Showtime", back_populates="movie")

class Showtime(Base):
    __tablename__ = "showtimes"
    
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    theater_id = Column(Integer, ForeignKey("theaters.id"), nullable=False)
    show_date = Column(DateTime(timezone=True), nullable=False, index=True)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    movie = relationship("Movie", back_populates="showtimes")
    theater = relationship("Theater", back_populates="showtimes")
    seat_reservations = relationship("SeatReservation", back_populates="showtime")
    bookings = relationship("Booking", back_populates="showtime")