from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from app.database.base import get_db
from app.models import Seat, SeatReservation, Showtime, SeatStatus, Theater
from pydantic import BaseModel

router = APIRouter()

class SeatResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    theater_id: int
    row_number: int
    seat_number: int
    seat_type: str
    status: str = "available"
    reserved_until: Optional[datetime] = None

class SeatMapResponse(BaseModel):
    showtime_id: int
    rows: int
    seats_per_row: int
    seats: List[List[Optional[SeatResponse]]]

@router.get("/showtime/{showtime_id}/seatmap")
def get_seat_map(showtime_id: int, db: Session = Depends(get_db)):
    try:
        showtime = db.query(Showtime).filter(Showtime.id == showtime_id).first()
        if not showtime:
            raise HTTPException(status_code=404, detail="场次不存在")
        
        # 获取影厅信息
        theater = db.query(Theater).filter(Theater.id == showtime.theater_id).first()
        if not theater:
            raise HTTPException(status_code=404, detail="影厅不存在")
        
        # 获取该影厅的所有座位
        seats = db.query(Seat).filter(Seat.theater_id == theater.id).all()
        
        # 获取该场次的所有预订信息
        reservations = db.query(SeatReservation).filter(
            SeatReservation.showtime_id == showtime_id
        ).all()
        
        # 创建预订状态映射
        reservation_map = {}
        for reservation in reservations:
            status = "available"
            if reservation.status == SeatStatus.OCCUPIED:
                status = "occupied"
            elif reservation.status == SeatStatus.RESERVED:
                if reservation.reserved_until and reservation.reserved_until > datetime.now():
                    status = "reserved"
                else:
                    status = "available"  # 过期预订变为可用
            
            reservation_map[reservation.seat_id] = {
                "status": status,
                "reserved_until": reservation.reserved_until.isoformat() if reservation.reserved_until else None
            }
        
        # 组织座位数据为二维数组
        seat_matrix = []
        for row in range(1, theater.rows + 1):
            row_seats = []
            for seat_num in range(1, theater.seats_per_row + 1):
                # 查找对应座位
                seat = next((s for s in seats if s.row_number == row and s.seat_number == seat_num), None)
                
                if seat:
                    reservation_info = reservation_map.get(seat.id, {"status": "available", "reserved_until": None})
                    
                    seat_data = {
                        "id": seat.id,
                        "theater_id": seat.theater_id,
                        "row_number": seat.row_number,
                        "seat_number": seat.seat_number,
                        "seat_type": seat.seat_type,
                        "status": reservation_info["status"] if seat.is_active else "disabled",
                        "reserved_until": reservation_info["reserved_until"]
                    }
                    row_seats.append(seat_data)
                else:
                    row_seats.append(None)  # 不存在的座位
            
            seat_matrix.append(row_seats)
        
        return {
            "showtime_id": showtime_id,
            "rows": theater.rows,
            "seats_per_row": theater.seats_per_row,
            "seats": seat_matrix
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器错误: {str(e)}")

@router.post("/showtime/{showtime_id}/select")
def select_seats(
    showtime_id: int,
    seat_ids: List[int],
    user_id: int = None,
    db: Session = Depends(get_db)
):
    showtime = db.query(Showtime).filter(Showtime.id == showtime_id).first()
    if not showtime:
        raise HTTPException(status_code=404, detail="场次不存在")
    
    for seat_id in seat_ids:
        seat = db.query(Seat).filter(Seat.id == seat_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail=f"座位 {seat_id} 不存在")
        
        existing_reservation = db.query(SeatReservation).filter(
            SeatReservation.seat_id == seat_id,
            SeatReservation.showtime_id == showtime_id
        ).first()
        
        if existing_reservation:
            if existing_reservation.status == SeatStatus.OCCUPIED:
                raise HTTPException(status_code=400, detail=f"座位 {seat.row_number}排{seat.seat_number}号 已被占用")
            elif existing_reservation.status == SeatStatus.RESERVED and \
                 existing_reservation.reserved_until and \
                 existing_reservation.reserved_until > datetime.now():
                raise HTTPException(status_code=400, detail=f"座位 {seat.row_number}排{seat.seat_number}号 已被预订")
            
            existing_reservation.status = SeatStatus.RESERVED
            existing_reservation.user_id = user_id
            existing_reservation.reserved_until = datetime.now() + timedelta(minutes=15)
            existing_reservation.updated_at = datetime.now()
        else:
            new_reservation = SeatReservation(
                seat_id=seat_id,
                showtime_id=showtime_id,
                user_id=user_id,
                status=SeatStatus.RESERVED,
                reserved_until=datetime.now() + timedelta(minutes=15)
            )
            db.add(new_reservation)
    
    db.commit()
    return {"message": "座位选择成功", "reserved_until": datetime.now() + timedelta(minutes=15)}

@router.post("/showtime/{showtime_id}/release")
def release_seats(
    showtime_id: int,
    seat_ids: List[int],
    user_id: int = None,
    db: Session = Depends(get_db)
):
    for seat_id in seat_ids:
        reservation = db.query(SeatReservation).filter(
            SeatReservation.seat_id == seat_id,
            SeatReservation.showtime_id == showtime_id
        ).first()
        
        if reservation and reservation.user_id == user_id:
            if reservation.status == SeatStatus.RESERVED:
                db.delete(reservation)
    
    db.commit()
    return {"message": "座位释放成功"}