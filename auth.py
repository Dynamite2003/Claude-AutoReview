# Python测试文件 - 包含安全和逻辑问题
import os
import subprocess
import pickle

class AuthManager:
    def __init__(self):
        # 安全问题: 硬编码密钥
        self.secret_key = "hardcoded-secret-123"
        self.users = {}
    
    def authenticate(self, username, password):
        # 安全问题: 明文密码比较
        if username in self.users and self.users[username] == password:
            return True
        return False
    
    def execute_user_command(self, command):
        # 严重安全问题: 命令注入
        result = subprocess.run(command, shell=True, capture_output=True)
        return result.stdout
    
    def deserialize_data(self, data):
        # 安全问题: 不安全的反序列化
        return pickle.loads(data)
    
    def get_user_file(self, filename):
        # 安全问题: 路径遍历漏洞
        file_path = f"/var/app/users/{filename}"
        with open(file_path, 'r') as f:
            return f.read()
    
    def divide_numbers(self, a, b):
        # Bug: 除零错误未处理
        return a / b
    
    def process_list(self, items):
        # Bug: 未检查列表是否为空
        return items[0]  # 如果items为空会抛出IndexError

# 全局变量问题
current_user = None

def login(username, password):
    global current_user
    auth = AuthManager()
    if auth.authenticate(username, password):
        current_user = username
        return True
    return False