/**
 * 图表数据处理工具函数
 * 用于将园林数据转换为图表所需的格式
 */

import type { GardenData } from '@/types';

function compareDistrictName(a: string, b: string): number {
  return a.localeCompare(b, 'zh-CN');
}

/**
 * 计算累积面积分布数据（按开放情况分组）
 * 按面积从小到大排序，逐个累加，用于展示长尾分布特征
 * 返回多个系列：全部、开放、不开放
 * 所有系列的累积面积百分比均相对于全部园林的总面积计算
 * 横轴使用单个园林的面积值
 */
export function calculateCumulativeAreaByOpenStatus(data: GardenData[]): {
  name: string;
  color?: string;
  data: {
    gardenName: string;
    area: number;
    cumulativePercent: number;
  }[];
}[] {
  // 计算全部园林的总面积（作为统一的基准）
  const globalTotalArea = data.reduce((sum, item) => sum + item.area, 0);

  const calculateSeries = (
    items: GardenData[],
    seriesName: string,
    color?: string,
  ): {
    name: string;
    color?: string;
    data: {
      gardenName: string;
      area: number;
      cumulativePercent: number;
    }[];
  } => {
    const sorted = [...items].sort((a, b) => a.area - b.area);
    let cumulativeArea = 0;

    return {
      name: seriesName,
      color,
      data: sorted.map((item) => {
        cumulativeArea += item.area;
        return {
          gardenName: item.name,
          area: item.area,
          // 累积面积占全部园林总面积的百分比
          cumulativePercent: globalTotalArea > 0 ? (cumulativeArea / globalTotalArea) * 100 : 0,
        };
      }),
    };
  };

  const openGardens = data.filter((item) => item.openStatus === '开放');
  const closedGardens = data.filter((item) => item.openStatus === '不开放');

  return [
    calculateSeries(data, '全部', '#5470C6'),
    calculateSeries(openGardens, '开放', '#91CC75'),
    calculateSeries(closedGardens, '不开放', '#EE6666'),
  ];
}

/**
 * 按区县分组统计园林数量
 */
export function groupByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, number>();

  data.forEach((item) => {
    const count = districtMap.get(item.district) || 0;
    districtMap.set(item.district, count + 1);
  });

  return Array.from(districtMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => compareDistrictName(a.name, b.name));
}

/**
 * 按区县统计总面积
 */
export function groupAreaByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, number>();

  data.forEach((item) => {
    const area = districtMap.get(item.district) || 0;
    districtMap.set(item.district, area + item.area);
  });

  return Array.from(districtMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => compareDistrictName(a.name, b.name));
}

/**
 * 按区县和文保级别分层统计
 */
export function groupByDistrictAndHeritageLevel(data: GardenData[]): {
  categories: string[];
  series: { name: string; data: number[] }[];
} {
  const districtSet = new Set<string>();
  const heritageLevelSet = new Set<string>();
  const countMap = new Map<string, number>();

  // 收集所有区县和文保级别
  data.forEach((item) => {
    districtSet.add(item.district);
    heritageLevelSet.add(item.heritageLevel);

    const key = `${item.district}|${item.heritageLevel}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  const districts = Array.from(districtSet).sort(compareDistrictName);
  const order = ['全国', '省级', '市级', '县级', '未定级'];
  const heritageLevels = Array.from(heritageLevelSet).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const series = heritageLevels.map((level) => ({
    name: level,
    data: districts.map((district) => {
      const key = `${district}|${level}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: districts,
    series,
  };
}

/**
 * 按建造年代分组统计
 */
export function groupByEraCategory(data: GardenData[]): { name: string; value: number }[] {
  const eraMap = new Map<string, number>();

  data.forEach((item) => {
    const count = eraMap.get(item.eraCategory) || 0;
    eraMap.set(item.eraCategory, count + 1);
  });

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  return Array.from(eraMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const indexA = eraOrder.indexOf(a.name);
      const indexB = eraOrder.indexOf(b.name);
      // 如果找不到，放到最后
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
}

/**
 * 按建造年代和文保级别分层统计
 */
export function groupByEraCategoryAndHeritageLevel(data: GardenData[]): {
  categories: string[];
  series: { name: string; data: number[] }[];
} {
  const eraSet = new Set<string>();
  const heritageLevelSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    eraSet.add(item.eraCategory);
    heritageLevelSet.add(item.heritageLevel);

    const key = `${item.eraCategory}|${item.heritageLevel}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  const eras = Array.from(eraSet).sort((a, b) => {
    const indexA = eraOrder.indexOf(a);
    const indexB = eraOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  const order = ['全国', '省级', '市级', '县级', '未定级'];
  const heritageLevels = Array.from(heritageLevelSet).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const series = heritageLevels.map((level) => ({
    name: level,
    data: eras.map((era) => {
      const key = `${era}|${level}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: eras,
    series,
  };
}

/**
 * 按公布批次和建造年代分层统计
 */
export function groupByBatchAndEraCategory(data: GardenData[]): {
  categories: string[];
  series: { name: string; data: number[] }[];
} {
  const batchSet = new Set<string>();
  const eraSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    batchSet.add(item.publicationBatch);
    eraSet.add(item.eraCategory);

    const key = `${item.publicationBatch}|${item.eraCategory}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  const batches = Array.from(batchSet).sort();
  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  const eras = Array.from(eraSet).sort((a, b) => {
    const indexA = eraOrder.indexOf(a);
    const indexB = eraOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const series = eras.map((era) => ({
    name: era,
    data: batches.map((batch) => {
      const key = `${batch}|${era}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: batches,
    series,
  };
}

/**
 * 按权属性质和开放情况统计（用于桑基图）
 */
export function groupByOwnershipAndOpenStatus(data: GardenData[]): {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number }[];
} {
  const linkMap = new Map<string, number>();
  const nodeSet = new Set<string>();

  data.forEach((item) => {
    nodeSet.add(item.ownershipType);
    nodeSet.add(item.openStatus);

    const key = `${item.ownershipType}|${item.openStatus}`;
    const count = linkMap.get(key) || 0;
    linkMap.set(key, count + 1);
  });

  const nodes = Array.from(nodeSet).map((name) => ({ name }));
  const links = Array.from(linkMap.entries())
    .map(([key, value]) => {
      const parts = key.split('|');
      return { source: parts[0] || '', target: parts[1] || '', value };
    })
    .filter((link) => link.value > 0 && link.source && link.target);

  return { nodes, links };
}

/**
 * 按当前用途和开放情况分层统计
 */
export function groupByCurrentUseAndOpenStatus(data: GardenData[]): {
  categories: string[];
  series: { name: string; data: number[] }[];
} {
  const useSet = new Set<string>();
  const statusSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    useSet.add(item.currentUse);
    statusSet.add(item.openStatus);

    const key = `${item.currentUse}|${item.openStatus}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  const uses = Array.from(useSet).sort();
  const statuses = Array.from(statusSet).sort();

  const series = statuses.map((status) => ({
    name: status,
    data: uses.map((use) => {
      const key = `${use}|${status}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: uses,
    series,
  };
}

/**
 * 按区县和开放情况分层统计
 */
export function groupByDistrictAndOpenStatus(data: GardenData[]): {
  categories: string[];
  series: { name: string; data: number[] }[];
} {
  const districtSet = new Set<string>();
  const statusSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    districtSet.add(item.district);
    statusSet.add(item.openStatus);

    const key = `${item.district}|${item.openStatus}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  const districts = Array.from(districtSet).sort(compareDistrictName);
  const statuses = Array.from(statusSet).sort();

  const series = statuses.map((status) => ({
    name: status,
    data: districts.map((district) => {
      const key = `${district}|${status}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: districts,
    series,
  };
}

/**
 * 按面积区间和开放情况分层统计
 */
export function groupByAreaRangeAndOpenStatus(data: GardenData[]): {
  intervals: string[];
  series: { name: string; data: number[] }[];
} {
  const rangeSet = new Set<string>();
  const statusSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    rangeSet.add(item.areaRange);
    statusSet.add(item.openStatus);

    const key = `${item.areaRange}|${item.openStatus}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  // 面积区间按大小排序（与 dataLoader.ts 中 AREA_RANGES 定义一致，统一跨度 5000 ㎡）
  const rangeOrder = [
    '0-5000',
    '5000-10000',
    '10000-15000',
    '15000-20000',
    '20000-25000',
    '25000以上',
    '未知',
  ];
  const ranges = Array.from(rangeSet).sort((a, b) => rangeOrder.indexOf(a) - rangeOrder.indexOf(b));
  const statuses = Array.from(statusSet).sort();

  const series = statuses.map((status) => ({
    name: status,
    data: ranges.map((range) => {
      const key = `${range}|${status}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    intervals: ranges,
    series,
  };
}

/**
 * 按面积区间和权属性质分层统计
 */
export function groupByAreaRangeAndOwnership(data: GardenData[]): {
  intervals: string[];
  series: { name: string; data: number[] }[];
} {
  const rangeSet = new Set<string>();
  const ownershipSet = new Set<string>();
  const countMap = new Map<string, number>();

  data.forEach((item) => {
    rangeSet.add(item.areaRange);
    ownershipSet.add(item.ownershipType);

    const key = `${item.areaRange}|${item.ownershipType}`;
    const count = countMap.get(key) || 0;
    countMap.set(key, count + 1);
  });

  // 面积区间按大小排序（与 dataLoader.ts 中 AREA_RANGES 定义一致，统一跨度 5000 ㎡）
  const rangeOrder = [
    '0-5000',
    '5000-10000',
    '10000-15000',
    '15000-20000',
    '20000-25000',
    '25000以上',
    '未知',
  ];
  const ranges = Array.from(rangeSet).sort((a, b) => rangeOrder.indexOf(a) - rangeOrder.indexOf(b));

  // 权属性质排序（基于清洗后的实际分类）
  const ownershipOrder = ['国有', '私有', '企业', '宗教产', '未知'];
  const ownerships = Array.from(ownershipSet).sort((a, b) => {
    const indexA = ownershipOrder.indexOf(a);
    const indexB = ownershipOrder.indexOf(b);
    if (indexA !== indexB) {
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }
    return a.localeCompare(b, 'zh-CN');
  });

  const series = ownerships.map((ownership) => ({
    name: ownership,
    data: ranges.map((range) => {
      const key = `${range}|${ownership}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    intervals: ranges,
    series,
  };
}

/**
 * 按区县统计平均面积
 */
export function groupAverageAreaByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, { total: number; count: number }>();

  data.forEach((item) => {
    const stats = districtMap.get(item.district) || { total: 0, count: 0 };
    stats.total += item.area;
    stats.count += 1;
    districtMap.set(item.district, stats);
  });

  return Array.from(districtMap.entries())
    .map(([name, stats]) => ({
      name,
      value: Math.round(stats.total / stats.count),
    }))
    .sort((a, b) => compareDistrictName(a.name, b.name));
}

/**
 * 按建造年代统计平均面积
 */
export function groupAverageAreaByEraCategory(
  data: GardenData[],
): { name: string; value: number }[] {
  const eraMap = new Map<string, { total: number; count: number }>();

  data.forEach((item) => {
    const stats = eraMap.get(item.eraCategory) || { total: 0, count: 0 };
    stats.total += item.area;
    stats.count += 1;
    eraMap.set(item.eraCategory, stats);
  });

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  return Array.from(eraMap.entries())
    .map(([name, stats]) => ({
      name,
      value: Math.round(stats.total / stats.count),
    }))
    .sort((a, b) => {
      const indexA = eraOrder.indexOf(a.name);
      const indexB = eraOrder.indexOf(b.name);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
}

/**
 * ============================================
 * Tooltip 辅助函数
 * ============================================
 */

/**
 * 计算某个值在数组中的排名（降序）
 * @param value 当前值
 * @param allValues 所有值的数组
 * @returns 排名（1-based）
 */
export function calculateRank(value: number, allValues: number[]): number {
  const sortedValues = [...allValues].sort((a, b) => b - a);
  const rank = sortedValues.indexOf(value) + 1;
  return rank > 0 ? rank : allValues.length;
}

/**
 * 计算占比百分数
 * @param value 当前值
 * @param total 总值
 * @param decimals 保留小数位数，默认1位
 * @returns 百分比字符串，如 "45.6%"
 */
export function calculatePercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * 格式化数值（添加千分位分隔符）
 * @param value 数值
 * @param decimals 保留小数位数，默认0位
 * @returns 格式化后的字符串，如 "1,234.56"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 生成排名后缀文本
 * @param rank 排名
 * @returns 排名文本，如 "第1位"
 */
export function formatRank(rank: number): string {
  return `第${rank}位`;
}

/**
 * 比较值与平均值
 * @param value 当前值
 * @param average 平均值
 * @returns 对比文本，如 "高于平均" / "低于平均" / "等于平均"
 */
export function compareToAverage(value: number, average: number): string {
  const diff = value - average;
  if (Math.abs(diff) < 0.01) return '等于平均';
  return diff > 0 ? '高于平均' : '低于平均';
}

/**
 * ============================================
 * 新增：强化叙事所需的数据处理函数
 * ============================================
 */

/**
 * 生成矩阵热力图数据：区县×文保级别
 */
export function generateDistrictHeritageLevelMatrix(data: GardenData[]): {
  xCategories: string[];
  yCategories: string[];
  matrixData: Array<{ xCategory: string; yCategory: string; value: number; percentage: string }>;
} {
  const districtSet = new Set<string>();
  const heritageLevelSet = new Set<string>();
  const countMap = new Map<string, number>();
  const districtTotalMap = new Map<string, number>();

  // 收集数据
  data.forEach((item) => {
    districtSet.add(item.district);
    heritageLevelSet.add(item.heritageLevel);

    const key = `${item.district}|${item.heritageLevel}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
    districtTotalMap.set(item.district, (districtTotalMap.get(item.district) || 0) + 1);
  });

  const districts = Array.from(districtSet).sort(compareDistrictName);
  const order = ['全国', '省级', '市级', '县级', '未定级'];
  const heritageLevels = Array.from(heritageLevelSet).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const matrixData = districts.flatMap((district) =>
    heritageLevels.map((level) => {
      const key = `${district}|${level}`;
      const value = countMap.get(key) || 0;
      const total = districtTotalMap.get(district) || 1;
      const percentage = calculatePercentage(value, total);
      return {
        xCategory: district,
        yCategory: level,
        value,
        percentage,
      };
    }),
  );

  return {
    xCategories: districts,
    yCategories: heritageLevels,
    matrixData,
  };
}

/**
 * 生成矩阵热力图数据：公布批次×建造年代
 */
export function generateBatchEraCategoryMatrix(data: GardenData[]): {
  xCategories: string[];
  yCategories: string[];
  matrixData: Array<{ xCategory: string; yCategory: string; value: number; percentage: string }>;
} {
  const batchSet = new Set<string>();
  const eraSet = new Set<string>();
  const countMap = new Map<string, number>();
  const batchTotalMap = new Map<string, number>();

  data.forEach((item) => {
    batchSet.add(item.publicationBatch);
    eraSet.add(item.eraCategory);

    const key = `${item.publicationBatch}|${item.eraCategory}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
    batchTotalMap.set(item.publicationBatch, (batchTotalMap.get(item.publicationBatch) || 0) + 1);
  });

  const batches = Array.from(batchSet).sort();
  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  const eras = Array.from(eraSet).sort((a, b) => {
    const indexA = eraOrder.indexOf(a);
    const indexB = eraOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const matrixData = batches.flatMap((batch) =>
    eras.map((era) => {
      const key = `${batch}|${era}`;
      const value = countMap.get(key) || 0;
      const total = batchTotalMap.get(batch) || 1;
      const percentage = calculatePercentage(value, total);
      return {
        xCategory: batch,
        yCategory: era,
        value,
        percentage,
      };
    }),
  );

  return {
    xCategories: batches,
    yCategories: eras,
    matrixData,
  };
}

/**
 * 生成矩阵热力图数据：权属性质×开放情况
 */
export function generateOwnershipOpenStatusMatrix(data: GardenData[]): {
  xCategories: string[];
  yCategories: string[];
  matrixData: Array<{ xCategory: string; yCategory: string; value: number; percentage: string }>;
} {
  const ownershipSet = new Set<string>();
  const statusSet = new Set<string>();
  const countMap = new Map<string, number>();
  const ownershipTotalMap = new Map<string, number>();

  data.forEach((item) => {
    ownershipSet.add(item.ownershipType);
    statusSet.add(item.openStatus);

    const key = `${item.ownershipType}|${item.openStatus}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
    ownershipTotalMap.set(item.ownershipType, (ownershipTotalMap.get(item.ownershipType) || 0) + 1);
  });

  const ownerships = Array.from(ownershipSet).sort();
  const statuses = Array.from(statusSet).sort();

  const matrixData = ownerships.flatMap((ownership) =>
    statuses.map((status) => {
      const key = `${ownership}|${status}`;
      const value = countMap.get(key) || 0;
      const total = ownershipTotalMap.get(ownership) || 1;
      const percentage = calculatePercentage(value, total);
      return {
        xCategory: ownership,
        yCategory: status,
        value,
        percentage,
      };
    }),
  );

  return {
    xCategories: ownerships,
    yCategories: statuses,
    matrixData,
  };
}

/**
 * 生成矩阵热力图数据：保护状况×开放情况
 */
export function generateProtectionOpenStatusMatrix(data: GardenData[]): {
  xCategories: string[];
  yCategories: string[];
  matrixData: Array<{ xCategory: string; yCategory: string; value: number; percentage: string }>;
} {
  const protectionSet = new Set<string>();
  const statusSet = new Set<string>();
  const countMap = new Map<string, number>();
  const protectionTotalMap = new Map<string, number>();

  data.forEach((item) => {
    const protection = item.protectionStatus || '未知';
    protectionSet.add(protection);
    statusSet.add(item.openStatus);

    const key = `${protection}|${item.openStatus}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
    protectionTotalMap.set(protection, (protectionTotalMap.get(protection) || 0) + 1);
  });

  // 自定义排序：横轴保护状况（差、中、好），纵轴开放情况（开放、预约开放、不开放）
  const protectionOrder = ['差', '中', '好', '未知'];
  const openStatusOrder = ['不开放', '预约开放', '开放'];

  const protections = Array.from(protectionSet).sort(
    (a, b) => protectionOrder.indexOf(a) - protectionOrder.indexOf(b),
  );
  const statuses = Array.from(statusSet).sort(
    (a, b) => openStatusOrder.indexOf(a) - openStatusOrder.indexOf(b),
  );

  const matrixData = protections.flatMap((protection) =>
    statuses.map((status) => {
      const key = `${protection}|${status}`;
      const value = countMap.get(key) || 0;
      const total = protectionTotalMap.get(protection) || 1;
      const percentage = calculatePercentage(value, total);
      return {
        xCategory: protection,
        yCategory: status,
        value,
        percentage,
      };
    }),
  );

  return {
    xCategories: protections,
    yCategories: statuses,
    matrixData,
  };
}

/**
 * 计算资源集中度（Top N 面积占比）
 */
export function calculateAreaConcentration(
  data: GardenData[],
  topN: number = 10,
): {
  topGardens: Array<{ name: string; area: number }>;
  topPercentage: string;
  totalArea: number;
} {
  const sortedData = [...data].sort((a, b) => b.area - a.area);
  const totalArea = data.reduce((sum, item) => sum + item.area, 0);
  const topGardens = sortedData.slice(0, topN).map((item) => ({
    name: item.name,
    area: item.area,
  }));
  const topArea = topGardens.reduce((sum, item) => sum + item.area, 0);
  const topPercentage = calculatePercentage(topArea, totalArea);

  return {
    topGardens,
    topPercentage,
    totalArea,
  };
}

/**
 * 按建造年代统计面积箱线图数据
 */
export function generateEraAreaBoxPlotData(
  data: GardenData[],
): Array<{ category: string; values: number[] }> {
  const eraMap = new Map<string, number[]>();

  data.forEach((item) => {
    if (!eraMap.has(item.eraCategory)) {
      eraMap.set(item.eraCategory, []);
    }
    eraMap.get(item.eraCategory)!.push(item.area);
  });

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详'];
  return Array.from(eraMap.entries())
    .map(([category, values]) => ({ category, values }))
    .sort((a, b) => {
      const indexA = eraOrder.indexOf(a.category);
      const indexB = eraOrder.indexOf(b.category);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
}

/**
 * 按开放情况统计面积箱线图数据
 */
export function generateOpenStatusAreaBoxPlotData(
  data: GardenData[],
): Array<{ category: string; values: number[] }> {
  const statusMap = new Map<string, number[]>();

  data.forEach((item) => {
    if (!statusMap.has(item.openStatus)) {
      statusMap.set(item.openStatus, []);
    }
    statusMap.get(item.openStatus)!.push(item.area);
  });

  return Array.from(statusMap.entries())
    .map(([category, values]) => ({ category, values }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * 计算高等级遗产占比（全国+省级）
 */
export function calculateHighLevelHeritageRatio(data: GardenData[]): number {
  const highLevelCount = data.filter(
    (item) => item.heritageLevel === '全国' || item.heritageLevel === '省级',
  ).length;
  return data.length > 0 ? (highLevelCount / data.length) * 100 : 0;
}

/**
 * 按区县×保护状况分层统计（用于堆叠柱状图）
 */
export function groupByDistrictAndProtectionStatus(data: GardenData[]): {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
} {
  const districtSet = new Set<string>();
  const protectionSet = new Set<string>();
  const countMap = new Map<string, number>();

  // 收集所有区县和保护状况
  data.forEach((item) => {
    const protection = item.protectionStatus || '未知';
    districtSet.add(item.district);
    protectionSet.add(protection);

    const key = `${item.district}|${protection}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  const districts = Array.from(districtSet).sort(compareDistrictName);
  const protections = Array.from(protectionSet).sort();

  const series = protections.map((protection) => ({
    name: protection,
    data: districts.map((district) => {
      const key = `${district}|${protection}`;
      return countMap.get(key) || 0;
    }),
  }));

  return {
    categories: districts,
    series,
  };
}
