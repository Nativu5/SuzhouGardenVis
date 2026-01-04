/**
 * ECharts 按需导入配置
 * 只导入项目实际使用的图表类型和组件，减小打包体积
 */

import * as echarts from 'echarts/core'

// 导入图表类型
import { BarChart, SankeyChart, RadarChart, ScatterChart, HeatmapChart } from 'echarts/charts'

// 导入组件
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent
} from 'echarts/components'

// 导入渲染器
import { CanvasRenderer } from 'echarts/renderers'

// 注册必需的组件
echarts.use([
  // 图表类型
  BarChart,
  SankeyChart,
  RadarChart,
  ScatterChart,
  HeatmapChart,

  // 组件
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,

  // 渲染器
  CanvasRenderer
])

// 导出配置好的 echarts 实例
export default echarts

// 导出类型（从原始 echarts 导出）
export type { EChartsOption, ECharts } from 'echarts'
