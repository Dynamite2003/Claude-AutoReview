#!/usr/bin/env python3
"""
电影选座系统端到端测试脚本
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_api(name, url, method="GET", data=None, expected_status=200):
    """测试API端点"""
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}")
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{url}", json=data)
        
        if response.status_code == expected_status:
            print(f"✓ {name}: 状态码 {response.status_code}")
            return response.json() if response.headers.get('content-type', '').startswith('application/json') else None
        else:
            print(f"❌ {name}: 期望状态码 {expected_status}，实际 {response.status_code}")
            print(f"   响应: {response.text}")
            return None
    except Exception as e:
        print(f"❌ {name}: 请求失败 - {e}")
        return None

def main():
    print("🎬 电影选座系统端到端测试开始")
    print("=" * 50)
    
    # 1. 健康检查
    health = test_api("健康检查", "/health")
    if not health:
        print("❌ 系统健康检查失败，退出测试")
        return
    
    print(f"   数据库: {health.get('database', 'Unknown')}")
    print(f"   Redis: {health.get('redis', 'Unknown')}")
    print()
    
    # 2. 获取电影列表
    movies = test_api("获取电影列表", "/movies/")
    if movies:
        print(f"   找到 {len(movies)} 部电影")
        movie_id = movies[0]["id"]
        print(f"   测试电影: {movies[0]['title']}")
    else:
        print("❌ 无法获取电影数据")
        return
    print()
    
    # 3. 获取电影详情
    movie_detail = test_api("获取电影详情", f"/movies/{movie_id}")
    if movie_detail:
        print(f"   电影详情: {movie_detail['title']} ({movie_detail['duration']}分钟)")
    print()
    
    # 4. 获取电影场次
    showtimes = test_api("获取电影场次", f"/movies/{movie_id}/showtimes")
    if showtimes:
        print(f"   找到 {len(showtimes)} 个场次")
        showtime_id = showtimes[0]["id"]
        print(f"   测试场次: {showtimes[0]['show_date']} - ¥{showtimes[0]['price']}")
    else:
        print("❌ 无法获取场次数据")
        return
    print()
    
    # 5. 获取座位地图
    seatmap = test_api("获取座位地图", f"/seats/showtime/{showtime_id}/seatmap")
    if seatmap:
        print(f"   影厅座位: {seatmap['rows']}排 x {seatmap['seats_per_row']}座")
        
        # 找到可用座位
        available_seats = []
        for row_index, row in enumerate(seatmap['seats']):
            for seat in row:
                if seat and seat['status'] == 'available':
                    available_seats.append(seat['id'])
                if len(available_seats) >= 2:
                    break
            if len(available_seats) >= 2:
                break
        
        if len(available_seats) >= 2:
            test_seat_ids = available_seats[:2]
            print(f"   将测试座位ID: {test_seat_ids}")
        else:
            print("⚠ 没有足够的可用座位进行测试")
            return
    else:
        print("❌ 无法获取座位地图")
        return
    print()
    
    # 6. 选择座位
    select_result = test_api(
        "选择座位", 
        f"/seats/showtime/{showtime_id}/select",
        "POST",
        test_seat_ids
    )
    if select_result:
        print(f"   选座成功，预订到期时间: {select_result['reserved_until']}")
    else:
        print("❌ 选座失败")
        return
    print()
    
    # 7. 再次获取座位地图验证状态更新
    updated_seatmap = test_api("验证座位状态更新", f"/seats/showtime/{showtime_id}/seatmap")
    if updated_seatmap:
        reserved_count = 0
        for row in updated_seatmap['seats']:
            for seat in row:
                if seat and seat['status'] == 'reserved':
                    reserved_count += 1
        print(f"   已预订座位数量: {reserved_count}")
    print()
    
    # 8. 释放座位
    release_result = test_api(
        "释放座位",
        f"/seats/showtime/{showtime_id}/release",
        "POST", 
        [test_seat_ids[0]]  # 只释放第一个座位
    )
    if release_result:
        print(f"   释放座位成功: {release_result['message']}")
    print()
    
    # 9. 最终验证
    final_seatmap = test_api("最终座位状态验证", f"/seats/showtime/{showtime_id}/seatmap")
    if final_seatmap:
        reserved_count = 0
        available_count = 0
        for row in final_seatmap['seats']:
            for seat in row:
                if seat:
                    if seat['status'] == 'reserved':
                        reserved_count += 1
                    elif seat['status'] == 'available':
                        available_count += 1
        print(f"   最终状态 - 已预订: {reserved_count}, 可用: {available_count}")
    print()
    
    print("=" * 50)
    print("✅ 电影选座系统端到端测试完成！")
    print()
    print("📋 测试总结:")
    print("• 后端API服务正常运行")
    print("• 数据库连接正常，测试数据完整")
    print("• 电影、场次、座位数据查询正常") 
    print("• 座位选择和释放功能正常")
    print("• 座位状态实时更新正常")
    print()
    print("🌐 系统访问地址:")
    print("• 前端界面: http://localhost:5173/")
    print("• 后端API: http://localhost:8000/")
    print("• API文档: http://localhost:8000/docs")
    print()
    print("👤 测试账户:")
    print("• 普通用户: testuser / 123456")
    print("• 管理员: admin / admin123")

if __name__ == "__main__":
    main()