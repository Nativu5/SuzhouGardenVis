/**
 * 可视化主题配置
 * 定义统一的配色方案和视觉编码规则
 */

/**
 * 区县配色方案
 */
export const DISTRICT_COLORS: Record<string, string> = {
  '姑苏区': '#5470C6',
  '相城区': '#91CC75',
  '吴中区': '#FAC858',
  '虎丘区': '#EE6666',
  '吴江区': '#73C0DE',
  '苏州工业园区': '#3BA272',
  '常熟市': '#9A60B4',
  '昆山市': '#EA7CCC',
  '太仓市': '#FC8452',
  '张家港市': '#5470C6'
}

/**
 * 文保单位级别配色方案
 * 按重要性从高到低：全国 > 省级 > 市级 > 县级 > 未定级
 * 基于实际数据：全国(26)、省级(15)、市级(19)、县级(2)、未定级(45)
 */
export const HERITAGE_LEVEL_COLORS: Record<string, string> = {
  '全国': '#EE6666',  // 红色 - 最高级别
  '省级': '#FAC858',  // 黄色
  '市级': '#91CC75',  // 绿色
  '县级': '#73C0DE',  // 蓝色
  '未定级': '#C0C0C0' // 灰色
}

/**
 * 开放情况配色方案
 * 基于实际数据：开放(79)、不开放(27)、预约开放(2)
 */
export const OPEN_STATUS_COLORS: Record<string, string> = {
  '开放': '#91CC75',      // 绿色 - 完全开放
  '预约开放': '#FAC858',  // 黄色 - 需要预约
  '不开放': '#EE6666',    // 红色 - 不开放
  '未知': '#C0C0C0'       // 灰色
}

/**
 * 权属性质配色方案
 * 基于实际数据：国有(83)、私有(17，归一化后)、企业(4)、宗教产(4)
 */
export const OWNERSHIP_TYPE_COLORS: Record<string, string> = {
  '国有': '#5470C6',    // 蓝色
  '私有': '#91CC75',    // 绿色
  '企业': '#FAC858',    // 黄色
  '宗教产': '#FC8452',  // 橙色
  '未知': '#C0C0C0'     // 灰色
}

/**
 * 建造年代配色方案（时间从早到晚）
 */
export const ERA_CATEGORY_COLORS: Record<string, string> = {
  '宋代及以前': '#5470C6', // 深蓝色 - 最早
  '元代': '#73C0DE',       // 浅蓝色
  '明代': '#91CC75',       // 绿色
  '清代': '#FAC858',       // 黄色
  '民国': '#FC8452',       // 橙色
  '现代': '#EE6666',       // 红色 - 最近
  '未知': '#C0C0C0'        // 灰色
}

/**
 * 世界遗产配色方案
 */
export const WORLD_HERITAGE_COLORS = {
  true: '#EE6666',
  false: '#91CC75'
}

/**
 * 保护状况配色方案
 */
export const PROTECTION_STATUS_COLORS: Record<string, string> = {
  '好': '#91CC75',    // 绿色 - 状况良好
  '中': '#FAC858',    // 黄色 - 中等状况
  '差': '#EE6666',    // 红色 - 状况较差
  '未知': '#C0C0C0'   // 灰色
}

/**
 * 面积区间配色方案（从小到大，颜色从浅到深）
 */
export const AREA_RANGE_COLORS: Record<string, string> = {
  '< 1000': '#E0F0E3',
  '1000-5000': '#91CC75',
  '5000-10000': '#5AA65F',
  '10000-50000': '#3D8B40',
  '> 50000': '#2A6B2D'
}

/**
 * 获取区县颜色
 */
export function getDistrictColor(district: string): string {
  return DISTRICT_COLORS[district] || '#C0C0C0'
}

/**
 * 获取文保级别颜色
 */
export function getHeritageLevelColor(level: string): string {
  return HERITAGE_LEVEL_COLORS[level] || '#C0C0C0'
}

/**
 * 获取开放情况颜色
 */
export function getOpenStatusColor(status: string): string {
  return OPEN_STATUS_COLORS[status] || '#C0C0C0'
}

/**
 * 获取权属性质颜色
 */
export function getOwnershipTypeColor(type: string): string {
  return OWNERSHIP_TYPE_COLORS[type] || '#C0C0C0'
}

/**
 * 获取年代分类颜色
 */
export function getEraCategoryColor(era: string): string {
  return ERA_CATEGORY_COLORS[era] || '#C0C0C0'
}

/**
 * 获取世界遗产颜色
 */
export function getWorldHeritageColor(isWorldHeritage: boolean): string {
  return WORLD_HERITAGE_COLORS[isWorldHeritage ? 'true' : 'false']
}

/**
 * 获取面积区间颜色
 */
export function getAreaRangeColor(range: string): string {
  return AREA_RANGE_COLORS[range] || '#C0C0C0'
}

/**
 * 获取保护状况颜色
 */
export function getProtectionStatusColor(status: string): string {
  return PROTECTION_STATUS_COLORS[status] || '#C0C0C0'
}

/**
 * ECharts 通用主题配置
 */
export const ECHARTS_THEME = {
  color: [
    '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE',
    '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#5470C6'
  ],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 12,
    color: '#374151'
  },
  title: {
    textStyle: {
      fontSize: 14,
      fontWeight: 600,
      color: '#111827'
    },
    subtextStyle: {
      fontSize: 12,
      color: '#6B7280'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 60,
    containLabel: true
  },
  legend: {
    textStyle: {
      fontSize: 12,
      color: '#374151'
    },
    icon: 'roundRect',
    itemWidth: 14,
    itemHeight: 14
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    textStyle: {
      color: '#374151',
      fontSize: 12
    },
    padding: [8, 12],
    extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#E5E7EB'
      }
    },
    axisLabel: {
      color: '#6B7280',
      fontSize: 11
    },
    axisTick: {
      lineStyle: {
        color: '#E5E7EB'
      }
    },
    splitLine: {
      show: false
    }
  },
  valueAxis: {
    axisLine: {
      show: false
    },
    axisLabel: {
      color: '#6B7280',
      fontSize: 11
    },
    axisTick: {
      show: false
    },
    splitLine: {
      lineStyle: {
        color: '#F3F4F6',
        type: 'solid'
      }
    }
  }
}
