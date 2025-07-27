#!/bin/bash

# Claude Code Review 自动化配置脚本
# 用于快速在 GitHub 仓库中设置 Claude 代码审查 workflow

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查是否在 git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是 Git 仓库！请在 Git 仓库根目录运行此脚本。"
        exit 1
    fi
    
    # 检查是否安装了 Claude CLI
    if ! command -v claude &> /dev/null; then
        log_warning "Claude CLI 未安装。正在安装..."
        npm install -g @anthropic/claude-cli || {
            log_error "Claude CLI 安装失败！请手动安装：npm install -g @anthropic/claude-cli"
            exit 1
        }
    fi
    
    # 检查是否安装了 GitHub CLI
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI 未安装。正在安装..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install gh || {
                log_error "GitHub CLI 安装失败！请手动安装：brew install gh"
                exit 1
            }
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update && sudo apt install gh || {
                log_error "GitHub CLI 安装失败！请手动安装。"
                exit 1
            }
        else
            log_error "不支持的操作系统。请手动安装 GitHub CLI。"
            exit 1
        fi
    fi
    
    log_success "前置条件检查完成！"
}

# 生成 Claude OAuth Token
generate_oauth_token() {
    log_info "准备生成 Claude OAuth Token..."
    
    echo -e "${YELLOW}注意事项：${NC}"
    echo "1. 确保你拥有 Claude Pro 或 Max 订阅"
    echo "2. 即将打开浏览器进行身份验证"
    echo "3. 验证完成后，token 将显示在终端中"
    echo "4. 请安全地保存 token，稍后需要添加到 GitHub Secrets"
    echo ""
    
    read -p "按 Enter 继续生成 OAuth Token..."
    
    log_info "正在生成 Claude OAuth Token..."
    if claude setup-token; then
        log_success "OAuth Token 生成成功！"
        echo ""
        log_warning "请复制上面显示的 token，下一步需要用到。"
        echo ""
        read -p "已复制 token？按 Enter 继续..."
    else
        log_error "OAuth Token 生成失败！请检查网络连接和 Claude 账户状态。"
        exit 1
    fi
}

# 创建 workflow 目录和文件
create_workflow_file() {
    log_info "创建 GitHub Actions workflow 文件..."
    
    # 创建目录
    mkdir -p .github/workflows
    
    # 创建 workflow 文件
    cat > .github/workflows/claude-code-review.yml << 'EOF'
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
          github_token: ${{ secrets.GITHUB_TOKEN }}
          
          # Claude Pro用户OAuth Token认证
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          
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
EOF
    
    log_success "Workflow 文件创建完成：.github/workflows/claude-code-review.yml"
}

# 配置 GitHub Secret
configure_github_secret() {
    log_info "配置 GitHub Repository Secret..."
    
    # 检查是否已登录 GitHub CLI
    if ! gh auth status &> /dev/null; then
        log_info "正在登录 GitHub CLI..."
        gh auth login
    fi
    
    # 获取仓库信息
    REPO_INFO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
    if [ -z "$REPO_INFO" ]; then
        log_error "无法获取仓库信息！请确保在正确的 Git 仓库中运行脚本。"
        exit 1
    fi
    
    log_info "当前仓库：$REPO_INFO"
    
    echo ""
    echo -e "${YELLOW}现在需要添加 OAuth Token 到 GitHub Secrets${NC}"
    echo "Secret 名称：CLAUDE_CODE_OAUTH_TOKEN"
    echo ""
    
    # 提示用户输入 token
    echo -e "${BLUE}请粘贴之前生成的 Claude OAuth Token：${NC}"
    read -s OAUTH_TOKEN  # -s 参数隐藏输入
    echo ""
    
    if [ -z "$OAUTH_TOKEN" ]; then
        log_error "Token 不能为空！"
        exit 1
    fi
    
    # 添加 secret
    log_info "正在添加 Secret 到 GitHub..."
    if echo "$OAUTH_TOKEN" | gh secret set CLAUDE_CODE_OAUTH_TOKEN; then
        log_success "GitHub Secret 配置成功！"
    else
        log_error "GitHub Secret 配置失败！"
        exit 1
    fi
}

# 提交变更
commit_changes() {
    log_info "提交 workflow 文件到仓库..."
    
    # 检查是否有变更
    if ! git diff --cached --quiet || ! git diff --quiet .github/; then
        git add .github/workflows/claude-code-review.yml
        
        read -p "是否要提交 workflow 文件？(y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git commit -m "Add Claude Code Review workflow

🤖 自动配置的 Claude 代码审查 workflow
- 支持中文审查报告
- 专注于安全漏洞检测
- 使用 Claude Pro OAuth Token 认证

Generated with setup script"
            
            read -p "是否要推送到远程仓库？(y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push
                log_success "Workflow 文件已推送到远程仓库！"
            else
                log_warning "Workflow 文件已提交到本地，但未推送到远程。"
            fi
        else
            log_warning "Workflow 文件已创建但未提交。"
        fi
    else
        log_warning "没有检测到变更，workflow 文件可能已存在。"
    fi
}

# 测试配置
test_setup() {
    log_info "测试配置..."
    
    echo ""
    echo -e "${GREEN}🎉 Claude Code Review 配置完成！${NC}"
    echo ""
    echo "下一步："
    echo "1. 创建一个测试 PR 或推送代码变更"
    echo "2. 观察 GitHub Actions 中的 workflow 运行"
    echo "3. 查看 PR 评论中 Claude 的审查结果"
    echo ""
    echo "监控命令："
    echo "  gh run list --limit 5"
    echo "  gh run view <run-id>"
    echo ""
    echo "仓库 Actions 页面："
    REPO_URL=$(gh repo view --json url --jq .url)
    echo "  ${REPO_URL}/actions"
    echo ""
    
    read -p "是否打开 Actions 页面查看？(y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh repo view --web
    fi
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                Claude Code Review 自动配置脚本                ║"
    echo "║                                                              ║"
    echo "║  此脚本将帮助你在 GitHub 仓库中配置 Claude 自动代码审查功能    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # 执行配置步骤
    check_prerequisites
    echo ""
    
    generate_oauth_token
    echo ""
    
    create_workflow_file
    echo ""
    
    configure_github_secret
    echo ""
    
    commit_changes
    echo ""
    
    test_setup
}

# 错误处理
trap 'log_error "脚本执行过程中出现错误！"; exit 1' ERR

# 运行主函数
main "$@"