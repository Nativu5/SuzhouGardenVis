# 部署指南 (Cloudflare)

本项目是一个基于 Vue 3 + Vite 的静态单页应用 (SPA)，推荐使用 **Cloudflare Pages** 进行部署。Cloudflare Pages 运行在 Cloudflare 的边缘网络（Workers）上，专为前端项目设计。

## 准备工作

1. 确保项目可以本地构建成功：
   ```bash
   npm run build
   ```
   构建完成后，应生成 `dist` 目录。

2. 准备好高德地图 API Key：
   - 项目依赖 `VITE_AMAP_KEY` 环境变量。
   - 在部署时需要在 Cloudflare 后台配置此变量。

## 方式一：Git 集成（推荐）

这是最自动化的方式。每当你推送到 Git 仓库时，Cloudflare 会自动构建并部署。

1. **登录 Cloudflare Dashboard**。
2. 进入 **Compute (Workers & Pages)** -> **Pages**。
3. 点击 **Connect to Git**。
4. 选择你的 GitHub/GitLab 仓库 `SuzhouGardenVis`。
5. **配置构建设置**：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. **配置环境变量**：
   - 添加变量名: `VITE_AMAP_KEY`
   - 值: `你的高德地图Web端JS API Key`
7. 点击 **Save and Deploy**。

## 方式二：使用 Wrangler CLI (命令行)

如果你想手动从本地部署，可以使用 Cloudflare 的命令行工具 `wrangler`。

1. **安装 Wrangler** (如果未安装):
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**:
   ```bash
   wrangler login
   ```

3. **构建项目**:
   ```bash
   npm run build
   ```

4. **部署到 Cloudflare Pages**:
   ```bash
   # 将 dist 目录部署名为 suzhou-garden-vis 的项目
   npx wrangler pages deploy dist --project-name=suzhou-garden-vis
   ```
   *首次运行时，它会提示你创建一个新项目。*

5. **设置环境变量** (对于 CLI 部署):
   - CLI 部署通常上传的是静态文件，构建过程在本地完成。
   - 因此，**本地构建时**需要确保 `.env` 文件存在且包含 `VITE_AMAP_KEY`，或者在构建命令前加上环境变量：
     ```bash
     VITE_AMAP_KEY=你的Key npm run build
     npx wrangler pages deploy dist
     ```

## 常见问题

### 路由问题
本项目目前使用内部状态管理 (`viewMode`) 进行页面切换，不依赖 `vue-router` 的 History 模式，因此不需要配置 `_redirects` 文件来处理 404 回退。

### 资源加载失败
确保 `vite.config.ts` 中的 `base` 配置正确。默认情况下 Vite 假设部署在根路径 `/`。如果部署在子路径，请修改 `base`。Cloudflare Pages 通常部署在根路径，所以默认配置即可。
