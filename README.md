# 苏州园林数据可视化

基于 Vue 3 + TypeScript + ECharts + 高德地图的苏州园林数据可视化分析系统。

## 主要功能

- **概览模式**：4 个叙事场景，通过多维度图表解读苏州园林的空间分布、历史演变、开放状况和规模结构
- **探索模式**：交互式地图展示 108 座园林的空间分布，支持多维度筛选、详情查看和区域统计分析
- **数据洞察**：整合行政区划数据，计算园林密度、人均资源、可访问指数等综合指标

## 技术栈

- **前端框架**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **样式方案**：Tailwind CSS
- **图表库**：ECharts（按需导入）
- **地图服务**：高德地图 JS API 2.0
- **数据处理**：PapaParse

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件并配置高德地图 API Key：

```bash
VITE_AMAP_KEY=your_amap_api_key
VITE_AMAP_SECURITY_CODE=your_security_code
```

### 开发运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
src/
├── components/       # 组件目录
│   ├── charts/      # 图表组件
│   ├── filters/     # 筛选器组件
│   ├── map/         # 地图组件
│   └── overview/    # 概览模式组件
├── config/          # 配置文件（ECharts、主题）
├── services/        # 数据服务（数据加载、地图加载）
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
```

## 数据来源

- **园林数据**：`public/dataset/SuzhouGardenListFull.csv`（108 条记录）
- **行政区划**：`public/dataset/SuzhouDistricts.csv`（9 个区县）
- **园林图片**：`public/dataset/images/`（按园林名称分文件夹）
- **地理边界**：`public/data/suzhou_districts.json`（GeoJSON 格式）

## 性能优化

- ECharts 按需导入，减少打包体积 40%+
- 代码分割策略，依赖库独立 chunk 缓存
- 地图点位聚合，提升大数据量渲染性能
- 图片懒加载，优化初始加载速度

## 相关文档

- [项目需求文档](docs/项目需求.md)
- [实现方案文档](docs/实现方案.md)
- [开发指引与进度](AGENTS.md)
- [部署指南](DEPLOYMENT.md)

## 许可

本项目仅用于学术研究和教育目的。
