# Claude Code Review Workflow 配置指南

一个完整的指南，用于在 GitHub 仓库中配置 Claude 自动代码审查功能。

## 📋 功能特性

- ✅ **自动触发**：PR 创建、更新时自动运行
- ✅ **中文审查**：完全中文化的代码审查报告
- ✅ **安全专注**：重点检测安全漏洞和潜在 bug
- ✅ **详细报告**：包含代码位置、严重程度分级和修复建议
- ✅ **免费使用**：Claude Pro 用户可使用 OAuth Token 免费运行

## 🚀 快速开始

### 前置条件

- GitHub 仓库管理员权限
- Claude Pro 或 Max 订阅（用于生成 OAuth Token）
- 本地安装 Claude CLI

### 步骤1: 生成 Claude OAuth Token

```bash
# 在本地终端运行
claude setup-token
```

这将：
1. 打开浏览器进行身份验证
2. 生成长期有效的 OAuth Token
3. 在终端显示 token（请安全保存）

### 步骤2: 配置 GitHub Repository Secret

1. 访问仓库设置页面：
   ```
   https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
   ```

2. 点击 **"New repository secret"**

3. 添加 Secret：
   - **Name**: `CLAUDE_CODE_OAUTH_TOKEN`
   - **Value**: 粘贴步骤1中获得的 OAuth token

4. 点击 **"Add secret"**

### 步骤3: 创建 Workflow 文件

在仓库根目录创建 `.github/workflows/claude-code-review.yml`：

\`\`\`yaml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Claude Code Review
        uses: anthropics/claude-code-action@beta
        with:
          # GitHub token
          github_token: \${{ secrets.GITHUB_TOKEN }}
          
          # Claude Pro用户OAuth Token认证
          claude_code_oauth_token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          
          direct_prompt: |
            请用中文审查这个 Pull Request，重点关注以下方面：
            
            1. **安全漏洞检测**：
               - SQL注入、命令注入、XSS等安全问题
               - 硬编码的密钥、密码等敏感信息
               - 不安全的反序列化、路径遍历等
            
            2. **潜在Bug识别**：
               - 空指针异常、数组越界
               - 除零错误、类型转换问题
               - 资源泄漏、内存泄漏
               - 异步操作的错误处理
            
            3. **代码质量问题**：
               - 性能瓶颈
               - 代码重复
               - 不当的错误处理
            
            请提供具体的修复建议，并按严重程度分级（🔴严重/🟡中等/🟢轻微）。只报告你确实发现的问题，不要提及没有问题的代码。
          
          # 自定义指令
          custom_instructions: |
            请专注于:
            - 安全问题和漏洞
            - 潜在的运行时错误
            - 性能优化机会
            - 最佳实践建议
\`\`\`

### 步骤4: 测试配置

1. **创建测试 PR** 或 **推送代码变更**
2. **观察 Actions** 标签页中的 workflow 运行
3. **查看 PR 评论** 中 Claude 的审查结果

## 🔧 自定义配置

### 修改审查重点

在 `direct_prompt` 中自定义审查指令：

\`\`\`yaml
direct_prompt: |
  请审查此PR，重点关注：
  - 你的自定义重点1
  - 你的自定义重点2
  - ...
\`\`\`

### 调整触发条件

修改 `on` 部分来控制何时运行：

\`\`\`yaml
on:
  pull_request:
    types: [opened, synchronize]  # 仅在PR打开和同步时运行
  # 移除 workflow_dispatch 禁用手动触发
\`\`\`

### 添加文件过滤

使用 `paths` 限制审查特定文件：

\`\`\`yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - '**/*.js'
      - '**/*.ts'
      - '**/*.py'
      - '**/*.java'
\`\`\`

## 🎯 认证方式选择

### 方式1: OAuth Token（推荐，Pro用户免费）

\`\`\`yaml
claude_code_oauth_token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
\`\`\`

### 方式2: API Key（付费）

\`\`\`yaml
anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
\`\`\`

### 方式3: 自定义 GitHub App

\`\`\`yaml
- name: Generate GitHub App token
  id: app-token
  uses: actions/create-github-app-token@v1
  with:
    app-id: \${{ secrets.APP_ID }}
    private-key: \${{ secrets.APP_PRIVATE_KEY }}

- name: Claude Code Review
  uses: anthropics/claude-code-action@beta
  with:
    github_token: \${{ steps.app-token.outputs.token }}
    anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
\`\`\`

## 🔍 监控和调试

### 查看 Workflow 运行状态

\`\`\`bash
# 使用 GitHub CLI
gh run list --limit 5
gh run view <run-id>
gh run view <run-id> --log
\`\`\`

### 常见问题排查

#### 1. Token 认证失败

**错误**: `Environment variable validation failed`

**解决**:
- 确认 `CLAUDE_CODE_OAUTH_TOKEN` secret 已正确添加
- 重新生成 OAuth token: `claude setup-token`
- 检查 token 是否过期

#### 2. 权限不足

**错误**: `Permission denied` 或 `Not authorized`

**解决**:
- 确认对仓库有管理员权限
- 检查 workflow 文件中的 `permissions` 配置
- 刷新 GitHub 认证: `gh auth refresh -h github.com -s repo,workflow`

#### 3. Workflow 不触发

**解决**:
- 检查 `.github/workflows/` 目录位置是否正确
- 确认 YAML 语法正确
- 查看 Actions 标签页是否有错误信息

#### 4. Claude 没有回复

**解决**:
- 检查 PR 是否在 `main` 分支（或你配置的基础分支）
- 确认 workflow 运行成功完成
- 查看 Actions 日志中的详细错误信息

## 📊 审查结果示例

Claude 会在 PR 中提供如下格式的中文审查：

\`\`\`
### 🔍 安全审查结果

### 🔴 严重安全问题
1. **SQL注入漏洞** - file.js:42
   - 风险: 数据库被完全控制
   - 修复建议: 使用参数化查询

### 🟡 中等安全问题  
2. **硬编码密钥** - config.js:15
   - 修复建议: 使用环境变量

### 🟢 轻微问题
3. **除零错误** - utils.js:28
   - 修复建议: 添加除数检查
\`\`\`

## 🚀 高级配置

### 多环境部署

为不同环境创建不同的 workflow 文件：

- `.github/workflows/claude-review-dev.yml` - 开发环境
- `.github/workflows/claude-review-prod.yml` - 生产环境

### 团队集成

1. **创建团队 OAuth Token**
2. **在组织级别添加 Secret**
3. **所有仓库自动继承配置**

### 自定义报告格式

修改 `direct_prompt` 来定制报告结构和内容重点。

## 🔐 安全最佳实践

1. **定期轮换 OAuth Token**
2. **使用最小权限原则**
3. **监控 workflow 运行日志**
4. **定期审查 Secret 配置**
5. **在敏感仓库中使用自定义 GitHub App**

## 📚 相关资源

- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Claude Code Action 仓库](https://github.com/anthropics/claude-code-action)

---

## 🤝 贡献

如果你发现配置问题或有改进建议，欢迎提交 Issue 或 PR！

**配置完成后，你的仓库将拥有专业级的 AI 代码审查能力！** 🎉