# Cloudflare Pages 部署指南

本项目使用 Cloudflare Pages 进行静态站点部署。

## 部署前准备

### 1. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 2. 配置环境变量

在 Cloudflare Pages 项目设置中添加环境变量：

- `VITE_AMAP_KEY`: 高德地图 API Key
- `VITE_AMAP_SECURITY_CODE`: 高德地图安全密钥

## 部署方式

### 方式一：使用 Wrangler CLI（推荐）

```bash
# 安装 Wrangler（如未安装）
npm install -g wrangler

# 登录 Cloudflare 账号
wrangler login

# 部署
npx wrangler deploy
```

### 方式二：使用 Git 自动部署

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 控制台连接你的仓库
3. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **Node.js 版本**: 18 或更高

## 配置说明

### wrangler.jsonc

项目根目录的 `wrangler.jsonc` 包含 Cloudflare Pages 部署配置：

```jsonc
{
  "name": "suzhou-garden-vis",           // 项目名称
  "compatibility_date": "2026-01-04",    // API 兼容日期
  "assets": {
    "directory": "./dist"                // 静态资源目录
  }
}
```

### .cfignore

`.cfignore` 文件指定部署时需要忽略的文件和目录，包括：

- Python 开发环境（`.venv/`、`pyproject.toml` 等）
- 开发工具配置（`.vscode/`、`.idea/` 等）
- 文档和归档文件（`docs/`、`archived/` 等）
- 数据处理脚本（`*.py`、`scripts/` 等）

**注意**：Python 环境仅用于本地开发，部署时会被忽略。

## 验证部署

部署完成后，访问 Cloudflare Pages 提供的 URL，检查：

1. 页面正常加载
2. 地图功能正常（需要配置环境变量）
3. 图表和数据展示正常
4. 路由和交互功能正常

## 常见问题

### Q: 部署后地图无法加载

A: 检查环境变量是否正确配置：
- 在 Cloudflare Pages 控制台 → Settings → Environment variables
- 添加 `VITE_AMAP_KEY` 和 `VITE_AMAP_SECURITY_CODE`
- 重新部署

### Q: 构建失败

A: 确保 Node.js 版本 ≥ 18，在 Cloudflare Pages 控制台设置环境变量：
```
NODE_VERSION=18
```

### Q: 静态资源 404

A: 检查 `vite.config.ts` 中的 `base` 配置，确保与部署路径匹配。

## 性能优化

项目已启用以下优化：

- ECharts 按需导入（减少 40% 体积）
- 代码分割（vendor chunks 独立缓存）
- CSS 代码分割
- 图片懒加载
- 地图点位聚合

构建后的资源总大小约 786 KB（gzip: 260 KB），首屏加载时间优化。

## 回滚部署

在 Cloudflare Pages 控制台可以查看部署历史并回滚到之前的版本。

## 自定义域名

在 Cloudflare Pages 控制台 → Custom domains 添加自定义域名，Cloudflare 会自动配置 SSL 证书。
