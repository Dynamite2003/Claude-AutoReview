FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装uv
RUN pip install uv

# 复制项目配置文件
COPY pyproject.toml ./

# 创建虚拟环境并安装依赖
RUN uv venv
RUN uv pip install -e .

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p data

EXPOSE 8000

# 启动命令
CMD ["sh", "-c", ". .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]