from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import uuid

from app.database.base import get_db
from app.models import Booking, BookingStatus, SeatReservation, SeatStatus, Showtime
from pydantic import BaseModel

router = APIRouter()

class BookingCreate(BaseModel):
    showtime_id: int
    seat_ids: List[int]
    user_id: int = None

class BookingResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    booking_number: str
    user_id: int
    showtime_id: int
    total_amount: float
    status: str
    booking_time: datetime
    expires_at: datetime

@router.post("/", response_model=BookingResponse)
def create_booking(booking_data: BookingCreate, db: Session = Depends(get_db)):
    showtime = db.query(Showtime).filter(Showtime.id == booking_data.showtime_id).first()
    if not showtime:
        raise HTTPException(status_code=404, detail="场次不存在")
    
    total_amount = 0
    seat_reservations = []
    
    for seat_id in booking_data.seat_ids:
        reservation = db.query(SeatReservation).filter(
            SeatReservation.seat_id == seat_id,
            SeatReservation.showtime_id == booking_data.showtime_id
        ).first()
        
        if not reservation or reservation.user_id != booking_data.user_id:
            raise HTTPException(status_code=400, detail=f"座位 {seat_id} 未被您预订")
        
        if reservation.status != SeatStatus.RESERVED:
            raise HTTPException(status_code=400, detail=f"座位 {seat_id} 状态异常")
        
        seat_reservations.append(reservation)
        total_amount += showtime.price
    
    booking_number = f"BK{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:8].upper()}"
    
    booking = Booking(
        booking_number=booking_number,
        user_id=booking_data.user_id,
        showtime_id=booking_data.showtime_id,
        total_amount=total_amount,
        status=BookingStatus.PENDING,
        expires_at=datetime.now() + timedelta(minutes=15)
    )
    
    db.add(booking)
    db.flush()
    
    for reservation in seat_reservations:
        reservation.booking_id = booking.id
        reservation.status = SeatStatus.RESERVED
        reservation.reserved_until = booking.expires_at
    
    db.commit()
    db.refresh(booking)
    
    return booking

@router.get("/", response_model=List[BookingResponse])
def get_bookings(user_id: int = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(Booking)
    if user_id:
        query = query.filter(Booking.user_id == user_id)
    
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return bookings

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="订单不存在")
    return booking

@router.post("/{booking_id}/confirm")
def confirm_booking(booking_id: int, payment_method: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="订单状态不允许确认")
    
    if booking.expires_at < datetime.now():
        booking.status = BookingStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="订单已过期")
    
    booking.status = BookingStatus.PAID
    booking.payment_method = payment_method
    booking.payment_transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
    booking.confirmed_at = datetime.now()
    
    reservations = db.query(SeatReservation).filter(
        SeatReservation.booking_id == booking_id
    ).all()
    
    for reservation in reservations:
        reservation.status = SeatStatus.OCCUPIED
        reservation.reserved_until = None
    
    db.commit()
    return {"message": "订单确认成功", "transaction_id": booking.payment_transaction_id}

@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if booking.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="订单状态不允许取消")
    
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now()
    
    reservations = db.query(SeatReservation).filter(
        SeatReservation.booking_id == booking_id
    ).all()
    
    for reservation in reservations:
        db.delete(reservation)
    
    db.commit()
    return {"message": "订单取消成功"}