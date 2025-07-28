# 电影选座系统 - 快速启动指南

## 系统要求

- Python 3.11+
- Node.js 18+
- uv (Python包管理器)
- Docker & Docker Compose (可选)
- Redis (实时功能需要)

## 快速启动

### 方式一：使用 Docker Compose (推荐)

1. **启动所有服务**
```bash
docker-compose up -d
```

2. **初始化数据库**
```bash
# 进入后端容器
docker-compose exec backend bash
# 运行数据库初始化脚本
python app/database/seed_data.py
```

3. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

### 方式二：本地开发

#### 后端设置

1. **安装依赖**
```bash
cd backend
# 确保已安装uv
pip install uv

# 创建虚拟环境并安装依赖
uv venv
source .venv/bin/activate  # Linux/Mac
# 或者 .venv\Scripts\activate  # Windows
uv pip install -e .
```

2. **启动Redis**
```bash
# 使用Docker
docker run -d -p 6379:6379 redis:7-alpine

# 或者使用系统安装的Redis
redis-server
```

3. **初始化数据库**
```bash
python app/database/seed_data.py
```

4. **启动后端服务**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端设置

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```

## 测试账号

系统会自动创建以下测试账号：

- **普通用户**
  - 用户名: `testuser`
  - 密码: `123456`
  - 邮箱: `test@example.com`

- **管理员**
  - 用户名: `admin`
  - 密码: `admin123`
  - 邮箱: `admin@example.com`

## 功能特性

### ✅ 已实现功能

1. **电影管理**
   - 电影列表展示
   - 电影详情查看
   - 场次时间选择

2. **座位选择**
   - 可视化座位图
   - 实时座位状态同步
   - 多种座位类型(标准/VIP/情侣座)
   - 15分钟选座倒计时

3. **订单管理**
   - 在线订票
   - 支付集成(模拟)
   - 订单状态跟踪
   - 自动超时释放

4. **实时通信**
   - WebSocket实时同步
   - 多用户座位选择冲突处理
   - 座位状态实时更新

5. **用户系统**
   - 用户注册登录
   - JWT认证
   - 用户权限管理

### 🔄 WebSocket消息格式

```javascript
// 选择座位
{
  "type": "seat_select",
  "seat_id": 123,
  "user_id": 1
}

// 释放座位
{
  "type": "seat_release", 
  "seat_id": 123,
  "user_id": 1
}

// 座位状态更新（服务器推送）
{
  "type": "seat_update",
  "seat_id": 123,
  "status": "selected|available|occupied",
  "user_id": 1,
  "timestamp": "2024-01-01T12:00:00"
}
```

## API接口

### 主要端点

- `GET /movies` - 获取电影列表
- `GET /movies/{id}/showtimes` - 获取电影场次
- `GET /seats/showtime/{id}/seatmap` - 获取座位图
- `POST /seats/showtime/{id}/select` - 选择座位
- `POST /bookings/` - 创建订单
- `POST /bookings/{id}/confirm` - 确认支付
- `WS /ws/showtime/{id}` - WebSocket连接

详细API文档请访问: http://localhost:8000/docs

## 技术架构

### 后端技术栈
- **框架**: FastAPI + Uvicorn
- **数据库**: SQLAlchemy + SQLite/PostgreSQL
- **缓存**: Redis + aioredis
- **认证**: JWT + passlib
- **实时通信**: WebSocket
- **包管理**: uv

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **HTTP客户端**: Fetch API
- **实时通信**: WebSocket

### 部署架构
- **容器化**: Docker + Docker Compose
- **代理**: Nginx (生产环境)
- **数据持久化**: Docker Volumes
- **负载均衡**: 支持多实例部署

## 开发指南

### 代码规范
- Python遵循PEP 8规范
- TypeScript使用严格模式
- 组件采用函数式编程
- API采用RESTful设计

### 项目结构
```
movie-seat-booking/
├── backend/                 # Python FastAPI后端
│   ├── app/
│   │   ├── models/         # 数据模型
│   │   ├── api/            # API路由
│   │   ├── services/       # 业务逻辑
│   │   └── database/       # 数据库配置
│   └── pyproject.toml
├── frontend/               # React前端
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型
│   └── package.json
└── docker-compose.yml      # 容器编排
```

## 故障排除

### 常见问题

1. **端口被占用**
   - 检查8000和3000端口是否被占用
   - 修改docker-compose.yml中的端口映射

2. **Redis连接失败**
   - 确保Redis服务正在运行
   - 检查REDIS_URL环境变量

3. **WebSocket连接失败**
   - 检查浏览器控制台错误信息
   - 确认WebSocket URL配置正确

4. **数据库初始化失败**
   - 检查数据库文件权限
   - 确认所有依赖包已安装

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件