// 额外的测试文件 - 更多安全问题
const crypto = require('crypto');

// 严重安全问题1: 弱密码哈希
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex');
}

// 严重安全问题2: 不安全的随机数生成
function generateToken() {
    return Math.random().toString(36).substring(2);
}

// 严重安全问题3: CSRF漏洞
app.post('/transfer-money', (req, res) => {
    const { amount, toAccount } = req.body;
    // 没有CSRF保护直接执行转账
    transferMoney(req.user.id, toAccount, amount);
    res.json({ success: true });
});

// 中等安全问题: XSS漏洞
function renderUserProfile(userData) {
    return `<div>Welcome ${userData.name}!</div>`; // 直接输出用户数据
}

// 严重Bug: 资源未释放
function processFile(filename) {
    const fs = require('fs');
    const file = fs.openSync(filename, 'r');
    // 文件句柄永远不会关闭
    const data = fs.readFileSync(file);
    return data;
}

module.exports = {
    hashPassword,
    generateToken,
    renderUserProfile,
    processFile
};