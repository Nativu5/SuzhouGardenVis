# map_visualization_csv.html 代码索引文档

## 文件概述

**文件路径**: `VIS/map_visualization_csv.html`
**文件类型**: 单文件 HTML 应用（包含 CSS、JavaScript）
**总行数**: 1881 行
**主要功能**: 苏州园林地理分布交互式可视化系统

---

## 总体架构问题分析

### 当前存在的主要问题

1. **高耦合度**
   - 所有代码（HTML、CSS、JavaScript）混在一个文件中
   - 业务逻辑、UI 渲染、事件处理、数据处理紧密耦合
   - 全局变量过多（10+ 个全局变量），作用域管理混乱

2. **代码组织混乱**
   - 缺少模块化设计，所有函数平铺在全局作用域
   - 功能模块边界不清晰，职责划分不明确
   - 初始化流程分散，依赖关系不明显

3. **可维护性差**
   - 1800+ 行代码难以导航和维护
   - 功能修改可能影响多个不相关模块
   - 没有统一的状态管理机制

4. **可测试性低**
   - 无法对独立功能进行单元测试
   - 地图 API 依赖硬编码，难以 mock
   - 事件处理逻辑分散，难以测试交互流程

### 建议的重构方向

1. **文件拆分**: HTML、CSS、JavaScript 分离
2. **模块化**: 按功能划分独立模块（ES6 Modules）
3. **状态管理**: 使用统一的状态管理器（如简单的 EventBus 或状态机）
4. **依赖注入**: 地图 API、配置等通过依赖注入方式管理
5. **组件化**: UI 组件独立封装（考虑使用轻量框架如 Vue/React）

---

## 代码结构索引

### 1. HTML 结构部分 (行 1-346)

#### 1.1 文档头部 (1-7)
- DOCTYPE 声明
- 语言设置：`zh-CN`
- 字符编码、视口配置
- 页面标题

#### 1.2 样式定义 (8-345)
**位置**: `<head>` 内的 `<style>` 标签

| 样式模块 | 行号 | 说明 |
|---------|------|------|
| 全局重置 | 9-13 | 清除默认边距、设置 box-sizing |
| body 样式 | 15-18 | 字体、背景色 |
| 地图容器 | 20-26 | 固定定位，占据右侧空间 |
| 加载提示 | 28-40 | 居中显示的加载动画样式 |
| 详情弹窗 | 42-66 | marker 点击后显示的信息窗口 |
| 统计边栏 | 69-258 | 左侧筛选区和统计信息区 |
| 图表容器 | 149-167 | ECharts 图表外层容器 |
| 拖动手柄 | 269-301 | 调整侧边栏宽度的拖动条 |
| 响应式布局 | 303-343 | 三个断点的媒体查询 |

**设计问题**:
- 内联样式导致无法复用
- 响应式设计通过 `!important` 强制覆盖，不够优雅
- 样式与结构耦合，难以主题化

---

#### 1.3 页面结构 (348-431)
**位置**: `<body>` 标签

```
<body>
├── .map-container (350-352)
│   └── #container (351) - 地图渲染容器
│
├── .loading (354) - 加载提示
│
├── .stats-sidebar (357-428) - 左侧边栏
│   ├── <h2> (358) - 标题
│   ├── .selected-district (361-373) - 当前选中区域统计
│   ├── .filter-section × 3 (376-415) - 三个筛选器
│   │   ├── 朝代筛选 (376-387)
│   │   ├── 保护等级筛选 (389-399)
│   │   └── 行政区筛选 (401-415)
│   ├── .chart-container #historyChart (417-421) - 历史图表
│   └── .chart-container #sankeyChart (423-427) - 桑基图
│
└── .resize-handle (431) - 拖动调整手柄
```

---

### 2. 外部依赖加载 (行 433-461)

#### 2.1 静态资源加载 (433-437)

| 行号 | 资源 | 说明 |
|------|------|------|
| 434 | `config.js` | API 密钥配置文件 |
| 437 | ECharts CDN | 图表库（5.4.3 版本） |

---

#### 2.2 动态地图 API 加载 (440-461)
**这是本文件的核心设计之一**

```javascript
// 第一步：读取配置 (442-443)
const AMAP_KEY = window.AMAP_CONFIG.key;
const SECURITY_CODE = window.AMAP_CONFIG.securityCode;

// 第二步：设置安全配置 (446-448) - 必须在加载API前执行
window._AMapSecurityConfig = { securityJsCode: SECURITY_CODE };

// 第三步：动态注入地图脚本 (451-454)
// 加载高德地图 2.0 + 三个插件

// 第四步：动态注入可视化库 (457-460)
// 加载 LOCA 数据可视化扩展
```

**设计思路**:
- ✅ 配置与代码分离，便于密钥管理
- ✅ 动态加载，控制加载顺序
- ⚠️ 没有错误处理和加载超时机制
- ⚠️ 没有加载进度回调

---

### 3. 核心业务逻辑 (行 463-1878)

#### 3.1 全局变量定义 (466, 646-656)

| 变量名 | 行号 | 类型 | 用途 |
|--------|------|------|------|
| `CSV_FILE_PATH` | 466 | String | CSV 文件路径 |
| `globalGardenData` | 647 | Array | 解析后的园林数据 |
| `globalMap` | 648 | AMap.Map | 地图实例 |
| `districtPolygons` | 649 | Array | 区县边界多边形集合 |
| `currentSelectedDistrict` | 650 | Polygon | 当前选中的区县 |
| `districtClicked` | 651 | Boolean | 区县点击标记 |
| `globalMarkers` | 652 | Array | 所有地图标记点 |
| `currentInfoWindow` | 653 | InfoWindow | 当前打开的信息窗口 |
| `closeTimer` | 654 | Timer | 延迟关闭定时器 |
| `isClickedWindow` | 655 | Boolean | 是否为点击弹窗 |
| `historyChartInstance` | 1240 | ECharts | 历史图表实例 |
| `sankeyChartInstance` | 1241 | ECharts | 桑基图实例 |
| `currentDynastyFilters` | 1242 | Array | 朝代筛选器状态 |
| `currentDistrictFilters` | 1243 | Array | 行政区筛选器状态 |
| `currentLevelFilters` | 1244 | Array | 保护等级筛选器状态 |

**问题**: 15 个全局变量，作用域污染严重，应封装到模块或类中

---

#### 3.2 数据处理模块

##### 3.2.1 CSV 解析器 (471-508)
```javascript
function parseCSV(csvText)
```
**功能**: 解析包含引号和逗号的复杂 CSV 格式
**输入**: 原始 CSV 文本
**输出**: 对象数组（每行一个对象）
**特点**:
- 处理 BOM 字符
- 支持引号内的逗号
- 字符级别的状态机解析

**问题**: 应抽取为独立工具模块

---

##### 3.2.2 保护等级判定器 (522-546)
```javascript
function getGardenLevel(protectionLevel, worldHeritage)
```
**功能**: 根据文保级别和世界遗产状态判定园林等级
**返回**: `{ level, color }` 对象
**等级体系**:
- `world` (世界遗产) → `#DC2626` (深红)
- `national` (全国重点) → `#EA580C` (红橙)
- `provincial` (省级) → `#F59E0B` (金橙)
- `city` (市级) → `#EAB308` (金黄)
- `other` (其他) → `#D1D5DB` (浅灰)

**相关函数**:
- `getLevelText(level)` (551-560): 获取等级文字描述
- `getLevelIndex(level)` (562-571): 获取等级排序索引

---

##### 3.2.3 数据加载流程 (1178-1211)
```javascript
async function loadCSVData()
```
**流程**:
1. Fetch CSV 文件
2. 调用 `parseCSV()` 解析
3. 调用 `initMapWithData()` 初始化地图

**问题**: 缺少重试机制、缓存策略

---

#### 3.3 筛选与过滤模块

##### 3.3.1 筛选逻辑 (576-612)
```javascript
function applyFilters()
```
**功能**: 根据当前筛选条件显示/隐藏地图标记
**判断维度**:
- 保护等级 (`currentLevelFilters`)
- 朝代 (`currentDynastyFilters`)
- 行政区 (`currentDistrictFilters`)

**问题**: 直接操作 DOM（marker.show/hide），应通过数据驱动

---

##### 3.3.2 筛选器重置 (617-644)
```javascript
function resetFilters()
```
**功能**: 清空所有筛选条件，恢复初始状态

---

##### 3.3.3 数据过滤函数 (1509-1536)
```javascript
function filterGardenData()
```
**功能**: 根据筛选条件过滤 `globalGardenData`
**返回**: 过滤后的数据数组

**问题**: 与 `applyFilters()` 功能重复，应合并

---

#### 3.4 统计分析模块

##### 3.4.1 区县统计计算 (660-700)
```javascript
function calculateDistrictStats(districtName)
```
**功能**: 计算指定区县的统计指标
**输出指标**:
- 各级别园林数量（world/national/provincial/city/other）
- 总数量
- 平均面积
- 开放率
- 高级别占比

**问题**: 计算结果未缓存，重复计算浪费性能

---

##### 3.4.2 统计显示更新 (705-731)
```javascript
function updateDistrictStatsDisplay()
```
**功能**: 更新顶部区域统计数字显示
**更新元素**: `#districtWorld`, `#districtNational` 等

---

#### 3.5 地图渲染模块

##### 3.5.1 地图初始化主流程 (870-1173)
```javascript
function initMapWithData(gardenData)
```
**这是整个应用的核心函数**

**流程拆解**:

```
1. 数据预处理 (872-903)
   ├── 过滤无效经纬度
   ├── 调用 getGardenLevel() 判定等级
   ├── 构建 LOCA 数据格式
   └── 存储到 globalGardenData

2. 创建地图实例 (907-920)
   ├── new AMap.Map()
   ├── 设置中心点：苏州 [120.62, 31.31]
   ├── 设置视角：3D 模式，俯仰角 40°
   └── 应用地图样式：whitesmoke

3. 添加地图控件 (922-929)
   ├── 比例尺 (Scale)
   └── 工具栏 (ToolBar)

4. 初始化 LOCA 容器 (931-934)
   └── new Loca.Container()

5. 创建交互标记点 (966-1122)
   ├── 遍历 locaData
   ├── 为每个园林创建自定义 HTML Marker
   ├── 绑定事件：
   │   ├── mouseover: 显示简要信息 (1002-1057)
   │   ├── mouseout: 延迟关闭弹窗 (1060-1072)
   │   └── click: 显示详细信息 (1075-1117)
   └── 添加到地图

6. 绑定地图点击事件 (1124-1133)
   └── 点击空白处关闭信息窗口

7. 加载区县边界 (1150-1172)
   └── 调用 loadDistrictBoundaries()
```

**设计问题**:
- 函数过长（303 行），违反单一职责原则
- 应拆分为：数据处理、地图初始化、标记创建、事件绑定等独立函数
- 标记点创建逻辑 (969-1122) 应独立为工厂函数

---

##### 3.5.2 区县边界加载 (736-864)
```javascript
function loadDistrictBoundaries(map)
```
**功能**: 从本地 GeoJSON 加载苏州市区县边界

**流程**:
1. Fetch `./suzhou_districts.json` (741-747)
2. 解析 GeoJSON features (748-750)
3. 遍历创建多边形 (755-855)
   - 转换坐标格式：GeoJSON → 高德地图
   - 创建 `AMap.Polygon` (769-778)
   - 绑定悬停效果 (784-800)
   - 绑定点击事件：区县筛选 (803-848)
4. 添加到地图 (850)

**点击事件逻辑** (803-848):
- 如果有打开的信息窗口，先关闭 (805-810)
- 判断是否已选中该区县 (815-816)
- 选中/取消选中，切换高亮状态 (818-839)
- 调用 `applyFilters()` 和 `updateDistrictStatsDisplay()` (842-844)

---

##### 3.5.3 区县高亮控制

| 函数 | 行号 | 功能 |
|------|------|------|
| `highlightDistricts()` | 1249-1270 | 多选高亮（侧边栏用） |
| `highlightSingleDistrict()` | 1275-1296 | 单选高亮（地图点击用） |
| `selectSingleDistrict()` | 1301-1312 | 单选区县并更新按钮状态 |
| `resetDistrictHighlight()` | 1317-1327 | 重置所有高亮 |

**问题**: 高亮逻辑分散，应统一为状态机管理

---

#### 3.6 图表渲染模块

##### 3.6.1 图表初始化 (1541-1552)
```javascript
function initStatsCharts()
```
**功能**: 初始化两个 ECharts 实例
- `historyChartInstance`: 历史时期与保护地位图表
- `sankeyChartInstance`: 行政区→权属→开放情况桑基图

**触发时机**: 页面加载 1 秒后 (1330-1339)

---

##### 3.6.2 历史时期图表 (1572-1663)
```javascript
function updateHistoryChart(data)
```
**图表类型**: 堆叠柱状图
**X 轴**: 元代及以前、明代、清代、民国、现代
**Y 轴**: 园林数量
**图例**: 世界遗产、全国重点、省级、市级、其他

**数据统计逻辑** (1574-1593):
- 创建 `dynastyMap` 对象统计各朝代各级别数量
- 根据 `garden.year` 字段判断朝代归属

---

##### 3.6.3 桑基图 (1668-1801)
```javascript
function updateSankeyChart(data)
```
**图表类型**: Sankey 桑基图
**三层流向**: 行政区 → 权属性质 → 开放情况

**数据构建流程** (1670-1729):
1. 统计流向数据 `flowData` (1672-1682)
2. 收集所有节点并设置深度 (1685-1700)
3. 构建链接关系 `links` (1706-1727)

---

##### 3.6.4 图表更新触发 (1557-1567)
```javascript
function updateStatsCharts()
```
**功能**: 统一更新两个图表
**调用时机**:
- 筛选器变化时 (1376, 1432, 1472)
- 区县边界加载完成后 (1336)

---

#### 3.7 事件处理模块

##### 3.7.1 朝代筛选器 (1342-1378)
**DOM 事件**: `#dynastyFilters` 的 click 事件
**逻辑**:
- 点击"全部"清空筛选 (1346-1350)
- 点击具体朝代切换选中状态（多选） (1351-1371)
- 调用 `applyFilters()` 和 `updateStatsCharts()` (1374-1376)

---

##### 3.7.2 行政区筛选器 (1381-1435)
**DOM 事件**: `#districtFilters` 的 click 事件
**特殊处理**:
- 更新当前行政区显示 (1395, 1416, 1421-1426)
- 同步地图高亮状态 (1392, 1415, 1419)

---

##### 3.7.3 保护等级筛选器 (1438-1474)
**DOM 事件**: `#levelFilters` 的 click 事件
**逻辑**: 与朝代筛选器类似，支持多选

---

##### 3.7.4 窗口大小变化 (1229-1236)
```javascript
window.addEventListener('resize', ...)
```
**功能**: 响应式调整图表大小

---

#### 3.8 侧边栏拖动调整 (1803-1877)

**全局变量**:
- `sidebarWidth` (1806): 当前宽度
- `MIN_WIDTH` / `MAX_WIDTH` (1807-1808): 宽度限制
- `isDragging` (1827): 拖动状态

**核心函数**:
- `applySidebarWidth(width)` (1811-1821): 应用宽度到 DOM

**事件流程**:
1. `mousedown` (1833-1843): 开始拖动
2. `mousemove` (1845-1864): 实时调整宽度和图表大小
3. `mouseup` (1866-1877): 结束拖动，保存到 localStorage

**问题**: 使用 `setProperty(..., 'important')` 强制覆盖响应式 CSS，不够优雅

---

#### 3.9 应用入口 (1214-1223)
```javascript
window.onload = function() { ... }
```
**功能**: 页面加载完成后检查 API 并启动应用

**启动流程**:
```
window.onload
  └── 检查 AMap 和 Loca 是否加载
      ├── 成功 → loadCSVData()
      │           └── initMapWithData()
      │                 ├── 创建地图
      │                 ├── 添加标记点
      │                 └── loadDistrictBoundaries()
      └── 失败 → 显示错误信息
```

---

## 数据流图

```
┌─────────────────────────────────────────────────────────┐
│                      应用启动流程                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  1. 加载外部依赖                    │
      │     - config.js (API 密钥)          │
      │     - ECharts 库                    │
      │     - 高德地图 API (动态)           │
      │     - LOCA 可视化库 (动态)          │
      └─────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  2. window.onload 事件触发          │
      │     - 检查 API 加载状态             │
      └─────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  3. loadCSVData()                   │
      │     - Fetch CSV 文件                │
      │     - parseCSV() 解析               │
      └─────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  4. initMapWithData()               │
      │     - 数据预处理                    │
      │     - 创建地图实例                  │
      │     - 创建 LOCA 容器                │
      │     - 创建标记点 (Markers)          │
      │     - 绑定事件监听器                │
      └─────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  5. loadDistrictBoundaries()        │
      │     - Fetch GeoJSON                 │
      │     - 创建区县多边形                │
      │     - 绑定点击事件                  │
      └─────────────────────────────────────┘
                           │
                           ▼
      ┌─────────────────────────────────────┐
      │  6. 延迟初始化图表 (1秒后)         │
      │     - initStatsCharts()             │
      │     - updateDistrictStatsDisplay()  │
      └─────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  应用就绪，等待用户交互  │
              └────────────────────────┘
```

---

## 交互流程图

### 用户筛选流程

```
用户点击筛选器按钮
        │
        ▼
┌───────────────────┐
│ 更新筛选状态数组   │
│ - currentDynastyFilters │
│ - currentDistrictFilters │
│ - currentLevelFilters │
└───────────────────┘
        │
        ├─────────────────────────────────┐
        ▼                                 ▼
┌─────────────────┐           ┌──────────────────────┐
│ applyFilters()  │           │ 地图高亮控制          │
│ - 遍历 globalMarkers │      │ - highlightDistricts() │
│ - 显示/隐藏标记点 │         │ - resetDistrictHighlight() │
└─────────────────┘           └──────────────────────┘
        │
        ├────────────────────────────────┐
        ▼                                ▼
┌─────────────────────────┐   ┌──────────────────────┐
│ updateDistrictStatsDisplay() │   │ updateStatsCharts()   │
│ - 统计可见标记点数量       │   │ - updateHistoryChart() │
│ - 更新顶部统计数字         │   │ - updateSankeyChart()  │
└─────────────────────────┘   └──────────────────────┘
```

---

### 标记点交互流程

```
鼠标悬停 Marker
        │
        ▼
┌────────────────────┐
│ mouseover 事件      │
│ - 清除关闭定时器    │
│ - 关闭之前的窗口    │
│ - 创建简要信息窗口  │
│ - 显示窗口          │
└────────────────────┘
        │
        ├────── 鼠标移开 ──────┐
        ▼                      ▼
┌────────────────┐    ┌──────────────────┐
│ mouseout 事件   │    │ 窗口内鼠标事件    │
│ - 设置延迟关闭  │    │ - mouseenter: 取消关闭 │
│   定时器(300ms) │    │ - mouseleave: 延迟关闭 │
└────────────────┘    └──────────────────┘

点击 Marker
        │
        ▼
┌────────────────────┐
│ click 事件          │
│ - 设置 isClickedWindow = true │
│ - 关闭之前的窗口    │
│ - 创建详细信息窗口  │
│ - 显示完整描述      │
└────────────────────┘
        │
        └─── 点击地图空白处 ──→ 关闭窗口
```

---

## 关键技术点

### 1. CSV 解析算法 (471-508)
**特点**: 字符级状态机解析，支持复杂格式

```javascript
// 核心逻辑
for (let char of lines[i]) {
    if (char === '"') {
        insideQuotes = !insideQuotes;  // 切换引号状态
    } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());  // 只在引号外分割
        currentValue = '';
    } else {
        currentValue += char;
    }
}
```

---

### 2. 动态 API 加载顺序控制 (440-461)
**关键**: 安全配置必须在 API 加载前设置

```javascript
// 正确顺序：
1. 设置 window._AMapSecurityConfig
2. 注入地图脚本标签
3. 注入 LOCA 脚本标签
4. window.onload 检查加载状态
```

---

### 3. 信息窗口延迟关闭机制 (1002-1072)
**设计目的**: 允许鼠标从标记点移动到窗口内容

```javascript
// 核心变量
let closeTimer = null;           // 延迟关闭定时器
let isClickedWindow = false;     // 点击窗口不自动关闭

// 延迟关闭逻辑
mouseout → 设置 300ms 定时器 → 关闭窗口
  └─ 如果鼠标进入窗口 → 清除定时器（取消关闭）
```

---

### 4. 多选筛选器逻辑 (1342-1474)
**特点**: 三个筛选器独立但逻辑相似

```javascript
// 统一的多选逻辑
if (选项 === '全部') {
    清空筛选数组
} else {
    if (已选中) {
        取消选中，从数组移除
    } else {
        选中，添加到数组
    }
    if (数组为空) {
        恢复"全部"按钮
    }
}
```

---

### 5. 侧边栏拖动调整 (1803-1877)
**技术点**:
- 使用 `mousedown` → `mousemove` → `mouseup` 事件链
- 通过 `setProperty(..., 'important')` 覆盖响应式 CSS
- 实时调整 ECharts 图表大小
- 使用 localStorage 持久化宽度

---

## 性能考虑点

### 当前性能问题

1. **无节流/防抖**
   - `mousemove` 事件 (1845) 没有节流，拖动时频繁触发
   - 窗口 `resize` 事件 (1229) 没有防抖

2. **重复计算**
   - `filterGardenData()` 和 `applyFilters()` 多次遍历数据
   - `calculateDistrictStats()` 没有缓存，重复统计

3. **DOM 操作频繁**
   - 筛选时直接操作 marker 显示/隐藏
   - 应使用虚拟列表或数据驱动渲染

4. **内存泄漏风险**
   - 事件监听器没有清理机制
   - `closeTimer` 可能未正确清除

---

## 建议的模块化重构方案

### 目标文件结构

```
VIS/
├── index.html                    # 精简的 HTML 结构
├── css/
│   ├── reset.css                # 全局重置
│   ├── layout.css               # 布局样式
│   ├── components.css           # 组件样式
│   └── responsive.css           # 响应式样式
├── js/
│   ├── config.js                # 配置管理（已存在）
│   ├── main.js                  # 应用入口
│   ├── utils/
│   │   ├── csv-parser.js       # CSV 解析工具
│   │   └── level-detector.js   # 保护等级判定
│   ├── services/
│   │   ├── map-loader.js       # 地图 API 加载器
│   │   ├── data-service.js     # 数据加载服务
│   │   └── geo-service.js      # 地理边界服务
│   ├── modules/
│   │   ├── MapRenderer.js      # 地图渲染模块
│   │   ├── FilterManager.js    # 筛选管理器
│   │   ├── ChartManager.js     # 图表管理器
│   │   └── SidebarController.js # 侧边栏控制器
│   └── state/
│       └── AppState.js          # 状态管理器
└── data/
    ├── SuzhouGardenList.csv
    └── suzhou_districts.json
```

---

### 核心模块设计

#### 1. AppState.js - 状态管理器
```javascript
class AppState {
    constructor() {
        this.gardenData = [];
        this.filters = {
            dynasty: [],
            district: [],
            level: []
        };
        this.ui = {
            selectedDistrict: null,
            sidebarWidth: 220
        };
        this.listeners = new Map();
    }

    // 发布-订阅模式
    subscribe(event, callback) { }
    emit(event, data) { }

    // 状态更新方法
    setGardenData(data) { }
    updateFilters(type, values) { }
    getFilteredData() { }
}
```

---

#### 2. MapRenderer.js - 地图渲染模块
```javascript
class MapRenderer {
    constructor(containerId, state) {
        this.container = containerId;
        this.state = state;
        this.map = null;
        this.markers = [];
        this.polygons = [];
    }

    async init() {
        await this.createMap();
        await this.loadDistricts();
    }

    createMap() { }
    addMarkers(data) { }
    updateMarkersVisibility() { }
    highlightDistricts(names) { }
}
```

---

#### 3. FilterManager.js - 筛选管理器
```javascript
class FilterManager {
    constructor(state) {
        this.state = state;
        this.bindEvents();
    }

    bindEvents() {
        // 绑定所有筛选器事件
    }

    handleDynastyFilter(dynasty) {
        this.state.updateFilters('dynasty', dynasty);
    }

    handleDistrictFilter(district) {
        this.state.updateFilters('district', district);
    }

    handleLevelFilter(level) {
        this.state.updateFilters('level', level);
    }
}
```

---

#### 4. ChartManager.js - 图表管理器
```javascript
class ChartManager {
    constructor(state) {
        this.state = state;
        this.charts = {
            history: null,
            sankey: null
        };
    }

    init() {
        this.charts.history = this.createHistoryChart();
        this.charts.sankey = this.createSankeyChart();

        // 订阅数据变化
        this.state.subscribe('filtersChanged', () => {
            this.updateCharts();
        });
    }

    updateCharts() {
        const data = this.state.getFilteredData();
        this.updateHistoryChart(data);
        this.updateSankeyChart(data);
    }
}
```

---

#### 5. main.js - 应用入口
```javascript
import { AppState } from './state/AppState.js';
import { MapRenderer } from './modules/MapRenderer.js';
import { FilterManager } from './modules/FilterManager.js';
import { ChartManager } from './modules/ChartManager.js';
import { loadMapAPI } from './services/map-loader.js';
import { loadCSVData } from './services/data-service.js';

async function initApp() {
    try {
        // 1. 加载地图 API
        await loadMapAPI();

        // 2. 创建状态管理器
        const state = new AppState();

        // 3. 加载数据
        const data = await loadCSVData('./data/SuzhouGardenList.csv');
        state.setGardenData(data);

        // 4. 初始化模块
        const mapRenderer = new MapRenderer('container', state);
        const filterManager = new FilterManager(state);
        const chartManager = new ChartManager(state);

        await mapRenderer.init();
        chartManager.init();

        // 5. 订阅筛选变化
        state.subscribe('filtersChanged', () => {
            mapRenderer.updateMarkersVisibility();
        });

    } catch (error) {
        console.error('应用初始化失败:', error);
    }
}

initApp();
```

---

## 重构优先级建议

### 第一阶段：文件拆分（高优先级）
1. 提取 CSS 到独立文件
2. 提取工具函数（CSV 解析、等级判定）
3. 提取配置常量

### 第二阶段：模块化（中优先级）
1. 封装状态管理器
2. 拆分地图渲染逻辑
3. 独立筛选管理器

### 第三阶段：优化（低优先级）
1. 添加节流/防抖
2. 实现数据缓存
3. 优化性能瓶颈

---

## 依赖关系图

```
┌─────────────────┐
│   config.js     │ (外部配置)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│     map-loader.js               │ (加载地图 API)
│  - loadMapAPI()                 │
│  - 设置安全配置                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│     AppState.js                 │ (状态中心)
│  - gardenData                   │
│  - filters                      │
│  - 发布/订阅                    │
└─┬───────┬───────┬───────────────┘
  │       │       │
  │       │       └────────────────────┐
  │       │                            │
  ▼       ▼                            ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ MapRenderer │  │FilterManager│  │ChartManager │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 附录：快速定位表

### 功能 → 行号映射

| 功能描述 | 关键函数/代码块 | 行号 |
|---------|----------------|------|
| 动态加载地图 API | 脚本注入代码 | 440-461 |
| CSV 数据解析 | `parseCSV()` | 471-508 |
| 保护等级判定 | `getGardenLevel()` | 522-546 |
| 筛选逻辑应用 | `applyFilters()` | 576-612 |
| 区县统计计算 | `calculateDistrictStats()` | 660-700 |
| 统计显示更新 | `updateDistrictStatsDisplay()` | 705-731 |
| 区县边界加载 | `loadDistrictBoundaries()` | 736-864 |
| 地图初始化 | `initMapWithData()` | 870-1173 |
| CSV 数据加载 | `loadCSVData()` | 1178-1211 |
| 应用启动入口 | `window.onload` | 1214-1223 |
| 区县多选高亮 | `highlightDistricts()` | 1249-1270 |
| 区县单选高亮 | `highlightSingleDistrict()` | 1275-1296 |
| 图表初始化 | `initStatsCharts()` | 1541-1552 |
| 历史图表更新 | `updateHistoryChart()` | 1572-1663 |
| 桑基图更新 | `updateSankeyChart()` | 1668-1801 |
| 朝代筛选事件 | 事件监听器 | 1342-1378 |
| 行政区筛选事件 | 事件监听器 | 1381-1435 |
| 等级筛选事件 | 事件监听器 | 1438-1474 |
| 侧边栏拖动 | 拖动逻辑 | 1803-1877 |

---

### 全局变量速查

| 变量名 | 类型 | 定义行号 | 主要使用位置 |
|--------|------|----------|-------------|
| `CSV_FILE_PATH` | String | 466 | 1182 |
| `globalGardenData` | Array | 647 | 903, 1510 |
| `globalMap` | AMap.Map | 648 | 920, 1033 |
| `districtPolygons` | Array | 649 | 851, 1249, 1276, 1318 |
| `globalMarkers` | Array | 652 | 577, 1121 |
| `currentInfoWindow` | InfoWindow | 653 | 1015, 1088, 1127 |
| `historyChartInstance` | ECharts | 1240 | 1544, 1662, 1859 |
| `sankeyChartInstance` | ECharts | 1241 | 1548, 1800, 1862 |
| `currentDynastyFilters` | Array | 1242 | 589, 1348, 1364, 1513 |
| `currentDistrictFilters` | Array | 1243 | 599, 815, 1386, 1522 |
| `currentLevelFilters` | Array | 1244 | 582, 1443, 1460, 1529 |

---

## 总结

### 优点
1. ✅ 功能完整，实现了复杂的可视化需求
2. ✅ 动态 API 加载设计合理，配置分离
3. ✅ 交互体验良好（延迟关闭、悬停效果）
4. ✅ 支持多维度筛选和联动

### 主要问题
1. ❌ 代码耦合度高，1800+ 行混在一起
2. ❌ 缺少模块化，难以维护和测试
3. ❌ 全局变量过多，作用域管理混乱
4. ❌ 性能未优化（无节流、防抖、缓存）
5. ❌ 函数过长（`initMapWithData()` 300+ 行）

### 重构建议
1. 按模块拆分文件（HTML/CSS/JS 分离）
2. 使用 ES6 Modules 实现模块化
3. 引入状态管理器统一管理数据
4. 封装独立的类/模块降低耦合
5. 添加性能优化（节流、缓存）

---

**文档版本**: v1.0
**创建日期**: 2026-01-03
**适用代码版本**: map_visualization_csv.html (1881 行)
