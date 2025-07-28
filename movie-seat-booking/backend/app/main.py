from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import Dict, List
from datetime import datetime
import redis.asyncio as redis
from contextlib import asynccontextmanager
import logging

from app.api import movies, theaters, bookings, seats, auth
from app.database.base import engine, Base
from app.config import settings

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

redis_client = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.showtime_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, showtime_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if showtime_id:
            if showtime_id not in self.showtime_connections:
                self.showtime_connections[showtime_id] = []
            self.showtime_connections[showtime_id].append(websocket)

    def disconnect(self, websocket: WebSocket, showtime_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if showtime_id and showtime_id in self.showtime_connections:
            if websocket in self.showtime_connections[showtime_id]:
                self.showtime_connections[showtime_id].remove(websocket)
            if not self.showtime_connections[showtime_id]:
                del self.showtime_connections[showtime_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            pass

    async def broadcast_to_showtime(self, message: str, showtime_id: str):
        if showtime_id in self.showtime_connections:
            for connection in self.showtime_connections[showtime_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    logger.info("启动应用...")
    
    # 创建数据库表
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建完成")
    
    # 连接Redis
    try:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        await redis_client.ping()
        logger.info(f"Redis连接成功: {settings.redis_url}")
    except Exception as e:
        logger.error(f"Redis连接失败: {e}")
        redis_client = None
    
    yield
    
    # 清理资源
    if redis_client:
        await redis_client.close()
        logger.info("应用关闭，资源清理完成")

app = FastAPI(
    title=settings.app_name + " API",
    description="现代化的电影院选座系统后端服务",
    version=settings.version,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["认证"])
app.include_router(movies.router, prefix="/movies", tags=["电影"])
app.include_router(theaters.router, prefix="/theaters", tags=["影院"])
app.include_router(seats.router, prefix="/seats", tags=["座位"])
app.include_router(bookings.router, prefix="/bookings", tags=["订单"])

@app.get("/")
async def read_root():
    return {
        "message": "电影选座系统API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    redis_status = "disconnected"
    if redis_client:
        try:
            await redis_client.ping()
            redis_status = "connected"
        except:
            redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "redis": redis_status,
        "database": "connected",
        "version": settings.version
    }

@app.websocket("/ws/showtime/{showtime_id}")
async def websocket_endpoint(websocket: WebSocket, showtime_id: str):
    await manager.connect(websocket, showtime_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "seat_select":
                await manager.broadcast_to_showtime(
                    json.dumps({
                        "type": "seat_update",
                        "seat_id": message_data["seat_id"],
                        "status": "selected",
                        "user_id": message_data.get("user_id"),
                        "timestamp": datetime.now().isoformat()
                    }),
                    showtime_id
                )
                
                if redis_client:
                    await redis_client.setex(
                        f"seat_selection:{showtime_id}:{message_data['seat_id']}", 
                        900,
                        json.dumps({
                            "user_id": message_data.get("user_id"),
                            "timestamp": datetime.now().isoformat()
                        })
                    )
                    
            elif message_data["type"] == "seat_release":
                await manager.broadcast_to_showtime(
                    json.dumps({
                        "type": "seat_update", 
                        "seat_id": message_data["seat_id"],
                        "status": "available",
                        "timestamp": datetime.now().isoformat()
                    }),
                    showtime_id
                )
                
                if redis_client:
                    await redis_client.delete(f"seat_selection:{showtime_id}:{message_data['seat_id']}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, showtime_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)