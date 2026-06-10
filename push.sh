#!/usr/bin/env bash
# push.sh — 一键推送 kyokagong.github.io
# 由 Day 3 升级:用 askpass 模式自动从 /opt/data/.env 读 GITHUB_TOKEN
# 用法:
#   ./push.sh                 # 推送 main
#   ./push.sh "commit msg"    # 自定义提交信息(默认: "chore: daily update <ISO date>")
#   GITHUB_USER=... ./push.sh # 自定义 GitHub 用户名(默认 kyokagong)
set -euo pipefail
cd "$(dirname "$0")"

# 1) 加载环境变量(token 等)
if [[ -f /opt/data/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  . /opt/data/.env
  set +a
fi

# 2) 配置 askpass(token 不会出现在命令行)
ASKPASS="$HOME/.hermes/bin/git-askpass.sh"
if [[ ! -x "$ASKPASS" ]]; then
  echo "❌ askpass 不可用: $ASKPASS" >&2
  exit 1
fi
export GIT_ASKPASS="$ASKPASS"
GIT_TERMINAL_PROMPT=0
export GIT_TERMINAL_PROMPT

# 3) token 健壮性检查
: "${GITHUB_TOKEN:?GITHUB_TOKEN 未设置,无法推送}"
: "${GITHUB_USER:=kyokagong}"
export GITHUB_USER

# 4) 推送
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_MSG="${1:-chore: daily update $(date -u +%Y-%m-%dT%H:%M:%SZ)}"

# 有变更就 commit,没变更就跳过
if ! git diff --quiet HEAD -- || ! git diff --cached --quiet HEAD; then
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "📝 Committed: $COMMIT_MSG"
else
  echo "ℹ️  无新变更,跳过 commit"
fi

echo "📤 Pushing branch '$BRANCH' to origin..."
git push -u origin "$BRANCH"
echo "✅ Push complete. Visit: https://github.com/kyokagong/kyokagong.github.io"
