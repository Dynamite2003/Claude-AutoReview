from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.base import get_db
from app.models import Cinema, Theater
from pydantic import BaseModel

router = APIRouter()

class CinemaResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    name: str
    address: str
    phone: str
    description: str

class TheaterResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    cinema_id: int
    name: str
    rows: int
    seats_per_row: int
    theater_type: str

@router.get("/cinemas", response_model=List[CinemaResponse])
def get_cinemas(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    cinemas = db.query(Cinema).filter(Cinema.is_active == True).offset(skip).limit(limit).all()
    return cinemas

@router.get("/cinemas/{cinema_id}", response_model=CinemaResponse)
def get_cinema(cinema_id: int, db: Session = Depends(get_db)):
    cinema = db.query(Cinema).filter(Cinema.id == cinema_id, Cinema.is_active == True).first()
    if not cinema:
        raise HTTPException(status_code=404, detail="影院不存在")
    return cinema

@router.get("/cinemas/{cinema_id}/theaters", response_model=List[TheaterResponse])
def get_cinema_theaters(cinema_id: int, db: Session = Depends(get_db)):
    theaters = db.query(Theater).filter(
        Theater.cinema_id == cinema_id,
        Theater.is_active == True
    ).all()
    return theaters

@router.get("/{theater_id}", response_model=TheaterResponse)
def get_theater(theater_id: int, db: Session = Depends(get_db)):
    theater = db.query(Theater).filter(Theater.id == theater_id, Theater.is_active == True).first()
    if not theater:
        raise HTTPException(status_code=404, detail="影厅不存在")
    return theater