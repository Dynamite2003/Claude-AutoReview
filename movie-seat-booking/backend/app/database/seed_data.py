from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.base import engine, Base
from app.models import *
from passlib.context import CryptContext

SessionLocal = sessionmaker(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def clear_existing_data(db):
    """清理现有数据"""
    try:
        # 按依赖关系顺序删除
        db.query(SeatReservation).delete()
        db.query(Booking).delete()
        db.query(Showtime).delete()
        db.query(Seat).delete()
        db.query(Theater).delete()
        db.query(Cinema).delete()
        db.query(Movie).delete()
        db.query(User).delete()
        db.commit()
        print("✓ 现有数据清理完成")
    except Exception as e:
        print(f"✗ 数据清理失败: {e}")
        db.rollback()
        raise

def seed_database():
    db = SessionLocal()
    
    try:
        print("开始数据库初始化...")
        
        # 清理现有数据
        clear_existing_data(db)
        # 创建影院
        cinemas = [
            Cinema(
                name="万达影城(中山路店)",
                address="中山路123号万达广场3楼",
                phone="0592-1234567",
                description="豪华影院，设备先进，服务优质"
            ),
            Cinema(
                name="CGV影城(思明店)",
                address="思明区厦禾路456号",
                phone="0592-7654321",
                description="韩式风格影城，观影体验极佳"
            )
        ]
        
        for cinema in cinemas:
            db.add(cinema)
        db.flush()
        print(f"✓ 创建了 {len(cinemas)} 个影院")
        
        # 创建影厅
        theaters = []
        for cinema in cinemas:
            for i in range(1, 6):  # 每个影院5个影厅
                theater = Theater(
                    cinema_id=cinema.id,
                    name=f"{i}号厅",
                    rows=12,
                    seats_per_row=16,
                    theater_type="standard" if i <= 3 else "vip"
                )
                theaters.append(theater)
                db.add(theater)
        db.flush()
        print(f"✓ 创建了 {len(theaters)} 个影厅")
        
        # 为每个影厅创建座位
        for theater in theaters:
            for row in range(1, theater.rows + 1):
                for seat_num in range(1, theater.seats_per_row + 1):
                    # 前两排和最后一排设为不可选
                    if row <= 2 or row >= theater.rows:
                        seat_type = SeatType.DISABLED
                    elif theater.theater_type == "vip" and 4 <= row <= 8:
                        seat_type = SeatType.VIP
                    elif seat_num in [7, 8, 9, 10] and row in [6, 7, 8]:
                        seat_type = SeatType.COUPLE
                    else:
                        seat_type = SeatType.STANDARD
                    
                    seat = Seat(
                        theater_id=theater.id,
                        row_number=row,
                        seat_number=seat_num,
                        seat_type=seat_type,
                        is_active=seat_type != SeatType.DISABLED
                    )
                    db.add(seat)
        print(f"✓ 为所有影厅创建了座位")
        
        # 创建电影
        movies = [
            Movie(
                title="复仇者联盟：终局之战",
                description="超级英雄集结，拯救世界的最终战役。漫威电影宇宙的巅峰之作，情节跌宕起伏，特效震撼人心。",
                duration=181,
                genre="动作/科幻",
                rating="PG-13",
                director="安东尼·罗素, 乔·罗素",
                cast="小罗伯特·唐尼, 克里斯·埃文斯, 马克·鲁法洛",
                poster_url="https://example.com/avengers.jpg",
                trailer_url="https://example.com/avengers-trailer.mp4",
                release_date=datetime.now() - timedelta(days=30)
            ),
            Movie(
                title="哪吒之魔童降世",
                description="国产动画电影的里程碑之作，重新演绎经典神话故事，画面精美，剧情感人。",
                duration=110,
                genre="动画/奇幻",
                rating="PG",
                director="饺子",
                cast="吕艳婷, 囧森瑟夫, 瀚墨",
                poster_url="https://example.com/nezha.jpg",
                trailer_url="https://example.com/nezha-trailer.mp4",
                release_date=datetime.now() - timedelta(days=15)
            ),
            Movie(
                title="流浪地球",
                description="中国科幻电影的突破之作，讲述人类拯救地球的壮举，特效逼真，剧情紧凑。",
                duration=125,
                genre="科幻/冒险",
                rating="PG-13",
                director="郭帆",
                cast="吴京, 易烊千玺, 屈楚萧",
                poster_url="https://example.com/wandering-earth.jpg",
                trailer_url="https://example.com/wandering-earth-trailer.mp4",
                release_date=datetime.now() - timedelta(days=7)
            ),
            Movie(
                title="你好,李焕英",
                description="温馨感人的穿越喜剧，母女情深让人泪目，贾玲导演处女作。",
                duration=128,
                genre="喜剧/剧情",
                rating="PG",
                director="贾玲",
                cast="贾玲, 张小斐, 沈腾",
                poster_url="https://example.com/hello-mom.jpg",
                trailer_url="https://example.com/hello-mom-trailer.mp4",
                release_date=datetime.now() - timedelta(days=3)
            )
        ]
        
        for movie in movies:
            db.add(movie)
        db.flush()
        print(f"✓ 创建了 {len(movies)} 部电影")
        
        # 创建场次
        for movie in movies:
            for theater in theaters[:8]:  # 每部电影在前8个影厅放映
                for day in range(0, 7):  # 未来7天
                    for hour in [10, 14, 16, 19, 21]:  # 每天5个场次
                        show_date = datetime.now().replace(
                            hour=hour, minute=random.choice([0, 30]), second=0, microsecond=0
                        ) + timedelta(days=day)
                        
                        # 根据影厅类型和时间段设置价格
                        base_price = 45 if theater.theater_type == "standard" else 65
                        if hour >= 19:  # 晚场加价
                            base_price += 10
                        if day == 0 or day == 6:  # 周末加价
                            base_price += 5
                        
                        showtime = Showtime(
                            movie_id=movie.id,
                            theater_id=theater.id,
                            show_date=show_date,
                            price=float(base_price)
                        )
                        db.add(showtime)
        print(f"✓ 创建了场次安排")
        
        # 创建测试用户
        
        test_users = [
            User(
                username="testuser",
                email="test@example.com",
                hashed_password=pwd_context.hash("123456"),
                full_name="测试用户",
                phone="13800138000"
            ),
            User(
                username="admin",
                email="admin@example.com",
                hashed_password=pwd_context.hash("admin123"),
                full_name="管理员",
                phone="13900139000",
                is_admin=True
            )
        ]
        
        for user in test_users:
            db.add(user)
        
        db.commit()
        print(f"✓ 创建了 {len(test_users)} 个测试用户")
        print("\n🎉 数据库初始化完成！")
        print("\n📋 测试账号信息：")
        print("👤 普通用户: testuser, 密码: 123456")
        print("👨‍💼 管理员: admin, 密码: admin123")
        print("\n🌐 访问地址：")
        print("• 前端: http://localhost:3000")
        print("• 后端API: http://localhost:8000")
        print("• API文档: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        print("🚀 开始数据库设置...")
        
        # 先创建所有表
        print("📋 创建数据库表结构...")
        Base.metadata.create_all(bind=engine)
        print("✓ 数据库表结构创建完成")
        
        # 然后填充数据
        seed_database()
        
    except Exception as e:
        print(f"❌ 程序执行失败: {e}")
        sys.exit(1)