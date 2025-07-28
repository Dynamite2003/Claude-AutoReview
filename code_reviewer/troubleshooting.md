# Claude Code Review 故障排除指南

本指南帮助解决 Claude Code Review workflow 配置和运行中的常见问题。

## 🔧 快速诊断

### 检查工具

运行以下命令快速诊断配置状态：

```bash
# 检查 GitHub CLI 状态
gh auth status

# 检查 Claude CLI 状态  
claude --version

# 查看最近的 workflow 运行
gh run list --limit 5

# 检查仓库 secrets
gh secret list
```

---

## ❌ 常见错误及解决方案

### 1. 认证相关错误

#### 错误：`Environment variable validation failed: Either ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN is required`

**原因**：缺少必要的认证信息

**解决方案**：
```bash
# 重新生成 OAuth Token
claude setup-token

# 添加到 GitHub Secrets
gh secret set CLAUDE_CODE_OAUTH_TOKEN
```

**验证**：
```bash
# 检查 secret 是否存在
gh secret list | grep CLAUDE_CODE_OAUTH_TOKEN
```

#### 错误：`Could not fetch an OIDC token`

**原因**：缺少 `id-token: write` 权限

**解决方案**：
在 workflow 文件中确认包含完整权限：
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
  id-token: write  # 必需！
```

#### 错误：`gh: Not Found (HTTP 404)`

**原因**：GitHub CLI 认证权限不足

**解决方案**：
```bash
# 刷新认证并添加必要权限
gh auth refresh -h github.com -s repo,workflow

# 重新登录（如果上述不行）
gh auth logout
gh auth login
```

### 2. Workflow 运行问题

#### 错误：Workflow 不触发

**可能原因和解决方案**：

1. **文件位置错误**
   ```bash
   # 确认文件在正确位置
   ls -la .github/workflows/claude-code-review.yml
   ```

2. **YAML 语法错误**
   ```bash
   # 验证 YAML 语法
   yamllint .github/workflows/claude-code-review.yml
   # 或使用在线验证：https://codebeautify.org/yaml-validator
   ```

3. **分支保护规则**
   ```bash
   # 检查分支保护设置
   gh api repos/:owner/:repo/branches/main/protection
   ```

4. **Actions 权限被禁用**
   - 访问 `Settings > Actions > General`
   - 确认 "Allow all actions and reusable workflows" 已启用

#### 错误：Workflow 运行但没有评论

**诊断步骤**：

1. **检查 workflow 日志**
   ```bash
   gh run view --log <run-id>
   ```

2. **验证权限设置**
   ```yaml
   permissions:
     pull-requests: write  # 必需写入 PR 评论权限
   ```

3. **检查 PR 状态**
   - 确认 PR 处于 open 状态
   - 确认 PR 目标分支正确

### 3. Claude CLI 问题

#### 错误：`claude: command not found`

**解决方案**：
```bash
# 安装 Claude CLI
npm install -g @anthropic/claude-cli

# 验证安装
claude --version
```

#### 错误：`claude setup-token` 失败

**可能原因和解决方案**：

1. **网络连接问题**
   ```bash
   # 检查网络连接
   curl -I https://claude.ai
   ```

2. **Claude 账户问题**
   - 确认拥有 Claude Pro 或 Max 订阅
   - 访问 https://claude.ai 确认账户状态

3. **浏览器问题**
   ```bash
   # 手动指定浏览器
   BROWSER=chrome claude setup-token
   ```

### 4. 权限问题

#### 错误：`Permission denied`

**解决方案**：

1. **确认仓库权限**
   ```bash
   # 检查当前用户权限
   gh api repos/:owner/:repo --jq .permissions
   ```

2. **对于组织仓库**
   - 确认有管理员权限
   - 检查组织的 Actions 权限设置

3. **Secret 添加权限**
   - 需要仓库管理员权限才能添加 secrets

### 5. 性能问题

#### 问题：Workflow 运行时间过长

**优化建议**：

1. **减少检出深度**
   ```yaml
   - uses: actions/checkout@v4
     with:
       fetch-depth: 1  # 仅获取最新提交
   ```

2. **限制文件类型**
   ```yaml
   on:
     pull_request:
       paths:
         - '**/*.js'
         - '**/*.ts'
         - '**/*.py'
   ```

3. **优化提示内容**
   - 简化 `direct_prompt` 内容
   - 移除不必要的检查项

---

## 🔍 调试技巧

### 1. 详细日志分析

```bash
# 获取完整的 workflow 日志
gh run view <run-id> --log > workflow.log

# 搜索特定错误
grep -i "error\|failed\|denied" workflow.log

# 查看 Claude 步骤的详细输出
grep -A 20 -B 5 "Claude Code Review" workflow.log
```

### 2. 本地测试

```bash
# 验证 Claude CLI 连接
claude auth status

# 测试 OAuth Token
claude --help

# 验证 GitHub 连接
gh api user
```

### 3. 增量调试

从最简单的配置开始，逐步添加功能：

1. **基础配置**：只包含必要的认证和简单提示
2. **添加权限**：逐步添加所需权限
3. **自定义提示**：最后添加复杂的审查指令

---

## 📊 监控和维护

### 1. 定期检查

**每周检查**：
```bash
# 检查最近的运行状态
gh run list --limit 20

# 查看失败的运行
gh run list --status failure --limit 10
```

**每月检查**：
```bash
# 检查 token 状态
claude auth status

# 更新 CLI 工具
npm update -g @anthropic/claude-cli
gh extension upgrade --all
```

### 2. 性能监控

**创建监控脚本**：
```bash
#!/bin/bash
# monitor-claude-workflow.sh

echo "Claude Workflow 状态报告 - $(date)"
echo "================================"

echo "最近 10 次运行："
gh run list --limit 10 --json status,conclusion,createdAt,name

echo -e "\n失败运行统计："
gh run list --status failure --limit 20 --json conclusion | jq length

echo -e "\n平均运行时间（最近 20 次）："
gh run list --limit 20 --json durationMs | jq '[.[] | .durationMs] | add / length / 1000'
```

### 3. 自动化维护

**设置定期更新提醒**：
```yaml
# .github/workflows/maintenance.yml
name: Claude Review Maintenance

on:
  schedule:
    - cron: '0 0 1 * *'  # 每月第一天

jobs:
  check-health:
    runs-on: ubuntu-latest
    steps:
      - name: Check Token Status
        run: |
          echo "检查 Claude token 状态..."
          # 添加健康检查逻辑
```

---

## 🆘 获取帮助

### 1. 社区资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Claude Code GitHub 仓库](https://github.com/anthropics/claude-code-action)

### 2. 提交问题

**收集信息**：
```bash
# 生成问题报告
echo "系统信息：" > issue-report.txt
echo "OS: $(uname -a)" >> issue-report.txt
echo "GitHub CLI: $(gh --version)" >> issue-report.txt
echo "Claude CLI: $(claude --version)" >> issue-report.txt
echo "Node.js: $(node --version)" >> issue-report.txt
echo "最近的错误日志：" >> issue-report.txt
gh run list --status failure --limit 3 --json url >> issue-report.txt
```

**提交到**：
- [Claude Code Action Issues](https://github.com/anthropics/claude-code-action/issues)
- [GitHub CLI Issues](https://github.com/cli/cli/issues)

### 3. 紧急恢复

**如果完全无法工作**：
```bash
# 1. 完全重置
rm -rf .github/workflows/claude-code-review.yml
gh secret delete CLAUDE_CODE_OAUTH_TOKEN

# 2. 重新运行自动化脚本
./setup-claude-review.sh

# 3. 或手动重新配置
# 参考 claude-code-review-setup.md
```

---

## ✅ 配置验证清单

在报告问题之前，请确认：

- [ ] Claude Pro/Max 订阅有效
- [ ] `claude setup-token` 成功运行
- [ ] `CLAUDE_CODE_OAUTH_TOKEN` secret 已添加
- [ ] Workflow 文件语法正确
- [ ] 权限配置完整 (`id-token: write`)
- [ ] GitHub CLI 认证成功
- [ ] 仓库有管理员权限
- [ ] Actions 功能已启用

**如果所有检查都通过但仍有问题，请收集详细的错误日志并提交 issue。**