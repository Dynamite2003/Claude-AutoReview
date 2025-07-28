# Claude Code Review 配置套件

这是一个完整的工具套件，用于在 GitHub 仓库中快速配置 Claude 自动代码审查功能。

## 📁 文件结构

```
├── claude-code-review-setup.md     # 📖 详细配置说明文档
├── setup-claude-review.sh          # 🚀 自动化配置脚本
├── troubleshooting.md               # 🔧 故障排除指南
├── templates/                       # 📋 Workflow 模板
│   ├── claude-code-review-basic.yml        # 基础模板
│   ├── claude-code-review-security-focused.yml  # 安全专注模板
│   └── claude-code-review-performance.yml  # 性能优化模板
└── README-claude-setup.md          # 本文件
```

## 🚀 快速开始

### 方法1: 自动化脚本（推荐）

```bash
# 1. 下载并运行自动化脚本
curl -o setup-claude-review.sh https://raw.githubusercontent.com/YOUR_REPO/setup-claude-review.sh
chmod +x setup-claude-review.sh
./setup-claude-review.sh
```

### 方法2: 手动配置

1. 阅读 `claude-code-review-setup.md` 详细说明
2. 从 `templates/` 选择合适的模板
3. 按文档步骤逐步配置

## 📋 模板选择指南

### 🔰 基础模板 (`basic.yml`)
**适用于**：
- 一般项目代码审查
- 第一次使用 Claude Review
- 需要平衡的安全和质量检查

**特点**：
- 中文审查报告
- 覆盖安全、bug、质量三个方面
- 配置简单，易于理解

### 🔒 安全专注模板 (`security-focused.yml`)
**适用于**：
- 金融、医疗等高安全要求行业
- 处理敏感数据的项目
- 对安全零容忍的项目

**特点**：
- 深度安全漏洞检测
- 遵循 OWASP Top 10 标准
- 详细的攻击向量分析
- 具体的修复代码示例

### ⚡ 性能优化模板 (`performance.yml`)
**适用于**：
- 高性能要求的应用
- 大数据处理项目
- 实时系统和游戏

**特点**：
- 算法复杂度分析
- 内存和资源使用优化
- 并发和异步优化建议
- 性能瓶颈识别

## 🛠️ 自定义配置

### 修改审查重点

在任何模板的 `direct_prompt` 中添加你的特定需求：

```yaml
direct_prompt: |
  请审查此PR，重点关注：
  - 你的行业特定要求
  - 团队编码规范
  - 特定的技术栈问题
```

### 调整触发条件

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'src/**'          # 只审查 src 目录
      - '**/*.js'         # 只审查 JS 文件
      - '!**/*.test.js'   # 排除测试文件
```

### 添加多个 review 任务

```yaml
jobs:
  security-review:
    # 安全审查任务
    
  performance-review:
    # 性能审查任务
    needs: security-review  # 序列执行
```

## 🔍 监控和维护

### 日常监控

```bash
# 查看运行状态
gh run list --limit 10

# 查看特定运行的详细信息
gh run view <run-id>

# 查看失败的运行
gh run list --status failure
```

### 定期维护

```bash
# 每月更新 CLI 工具
npm update -g @anthropic/claude-cli
gh extension upgrade --all

# 检查 token 状态
claude auth status

# 更新 workflow 到最新版本
# （查看 anthropics/claude-code-action 的最新 release）
```

## 🆘 遇到问题？

1. **首先查看** `troubleshooting.md` 故障排除指南
2. **运行诊断**：
   ```bash
   gh auth status
   claude --version
   gh secret list
   ```
3. **收集日志**：
   ```bash
   gh run view <run-id> --log > error.log
   ```

## 🌟 最佳实践

### 1. 团队协作

- **统一配置**：在组织级别标准化 workflow 配置
- **权限管理**：使用团队 OAuth token 或组织级别 secrets
- **培训文档**：为团队成员提供使用指南

### 2. 安全考虑

- **定期轮换** OAuth tokens
- **权限最小化**：只给必要的仓库权限
- **审计日志**：定期检查 workflow 运行记录

### 3. 性能优化

- **选择性触发**：使用 `paths` 过滤器减少不必要运行
- **并行执行**：合理安排多个 review 任务的依赖关系
- **资源限制**：设置合理的 `timeout` 避免长时间运行

## 📚 学习资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub Actions 工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [YAML 语法参考](https://yaml.org/spec/1.2/spec.html)

## 🤝 贡献

欢迎提交改进建议和 bug 报告！

### 贡献流程

1. Fork 本仓库
2. 创建功能分支
3. 提交你的改进
4. 发起 Pull Request

### 贡献内容

- 新的 workflow 模板
- 故障排除解决方案
- 文档改进
- 自动化脚本优化

---

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

**🎉 祝你使用愉快！如果这个套件帮助到了你，别忘了给个 ⭐！**