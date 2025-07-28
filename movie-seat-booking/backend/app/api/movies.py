from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database.base import get_db
from app.models import Movie, Showtime, Theater, Cinema
from pydantic import BaseModel

router = APIRouter()

class MovieResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    title: str
    description: str
    duration: int
    genre: str
    rating: str
    director: str
    cast: str
    poster_url: str
    trailer_url: str
    release_date: datetime

class ShowtimeResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: int
    movie_id: int
    theater_id: int
    show_date: datetime
    price: float
    theater_name: str
    cinema_name: str

@router.get("/", response_model=List[MovieResponse])
def get_movies(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.is_active == True).offset(skip).limit(limit).all()
    return movies

@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id, Movie.is_active == True).first()
    if not movie:
        raise HTTPException(status_code=404, detail="电影不存在")
    return movie

@router.get("/{movie_id}/showtimes", response_model=List[ShowtimeResponse])
def get_movie_showtimes(
    movie_id: int, 
    date: str = None,
    db: Session = Depends(get_db)
):
    # 直接查询Showtime，然后在Python中获取关联信息
    query = db.query(Showtime).filter(
        Showtime.movie_id == movie_id,
        Showtime.is_active == True
    )
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                Showtime.show_date >= target_date,
                Showtime.show_date < target_date + timedelta(days=1)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD")
    
    showtimes = query.all()
    
    result = []
    for showtime in showtimes:
        # 获取theater和cinema信息
        theater = db.query(Theater).filter(Theater.id == showtime.theater_id).first()
        cinema = db.query(Cinema).filter(Cinema.id == theater.cinema_id).first() if theater else None
        
        showtime_dict = {
            "id": showtime.id,
            "movie_id": showtime.movie_id,
            "theater_id": showtime.theater_id,
            "show_date": showtime.show_date,
            "price": showtime.price,
            "theater_name": theater.name if theater else "未知影厅",
            "cinema_name": cinema.name if cinema else "未知影院"
        }
        result.append(ShowtimeResponse(**showtime_dict))
    
    return result