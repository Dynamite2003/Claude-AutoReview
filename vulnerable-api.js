// 新的安全测试文件 - 更多严重漏洞
const express = require('express');
const app = express();

// 🔴 严重安全问题1: NoSQL注入
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    // 直接使用用户输入构造查询
    const query = { $where: `this.id == ${userId}` };
    db.users.find(query).then(user => res.json(user));
});

// 🔴 严重安全问题2: 目录遍历攻击
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    // 允许访问任意文件
    const filePath = `./uploads/${filename}`;
    res.download(filePath);
});

// 🔴 严重安全问题3: 反序列化漏洞
app.post('/data', (req, res) => {
    const serializedData = req.body.data;
    // 不安全的反序列化
    const data = eval(serializedData);
    res.json({ result: data });
});

// 🟡 中等问题: 信息泄露
app.use((err, req, res, next) => {
    // 直接返回错误堆栈信息
    res.status(500).json({
        error: err.message,
        stack: err.stack,
        file: __filename
    });
});

// 🔴 严重问题: JWT密钥硬编码
const jwt = require('jsonwebtoken');
const SECRET_KEY = "my-super-secret-key-123";

function generateToken(user) {
    return jwt.sign(user, SECRET_KEY);
}

// 🟡 中等问题: 缺少速率限制
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // 没有登录尝试限制，容易被暴力破解
    if (authenticate(username, password)) {
        res.json({ token: generateToken({ username }) });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

module.exports = app;