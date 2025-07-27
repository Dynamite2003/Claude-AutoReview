// 测试文件 - 包含安全问题和潜在bug
const express = require('express');
const app = express();

// 安全问题1: 没有输入验证的SQL查询
function getUserData(userId) {
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    // 这里存在SQL注入漏洞
    return database.query(query);
}

// 安全问题2: 直接使用用户输入执行命令
function executeCommand(userInput) {
    const exec = require('child_process').exec;
    exec(userInput, (error, stdout, stderr) => {
        console.log(stdout);
    });
}

// Bug问题1: 未处理的promise rejection
async function fetchData(url) {
    const response = await fetch(url);
    return response.json(); // 如果response不是200状态会出错
}

// Bug问题2: 内存泄漏风险
let cache = {};
function addToCache(key, value) {
    cache[key] = value; // 缓存永远不会清理，可能导致内存泄漏
}

// 安全问题3: 硬编码的敏感信息
const API_KEY = "sk-1234567890abcdef";
const DATABASE_PASSWORD = "admin123";

// Bug问题3: 除零错误
function calculate(a, b) {
    return a / b; // 当b为0时会返回Infinity
}

module.exports = {
    getUserData,
    executeCommand,
    fetchData,
    addToCache,
    calculate
};