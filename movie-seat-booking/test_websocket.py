#!/usr/bin/env python3
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/showtime/1"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✓ WebSocket连接成功")
            
            # 发送座位选择消息
            select_message = {
                "type": "seat_select",
                "seat_id": 55,
                "user_id": 1
            }
            
            await websocket.send(json.dumps(select_message))
            print(f"✓ 发送座位选择消息: {select_message}")
            
            # 等待并接收响应
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"✓ 收到WebSocket响应: {response}")
            except asyncio.TimeoutError:
                print("⚠ 等待响应超时，但连接正常")
            
            # 发送座位释放消息
            release_message = {
                "type": "seat_release",
                "seat_id": 55,
                "user_id": 1
            }
            
            await websocket.send(json.dumps(release_message))
            print(f"✓ 发送座位释放消息: {release_message}")
            
            # 再次等待响应
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"✓ 收到WebSocket响应: {response}")
            except asyncio.TimeoutError:
                print("⚠ 等待响应超时，但连接正常")
                
    except Exception as e:
        print(f"❌ WebSocket测试失败: {e}")
        return False
    
    print("✅ WebSocket测试完成")
    return True

if __name__ == "__main__":
    asyncio.run(test_websocket())