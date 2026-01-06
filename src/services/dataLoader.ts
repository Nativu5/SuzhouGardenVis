/**
 * 数据加载与清洗服务
 */

import Papa from 'papaparse';
import type {
  GardenRawData,
  GardenData,
  AreaRangeConfig,
  EraCategoryConfig,
  DistrictRawData,
  DistrictData,
} from '@/types';

// ==================== 配置常量 ====================

/**
 * 年代分类配置
 * 基于实际数据的精确匹配（数据集中共有：春秋1、汉1、南朝1、南北朝2、宋6、元1、明16、清52、民国9、现代19）
 */
const ERA_CATEGORIES: EraCategoryConfig[] = [
  { label: '宋代及以前', keywords: ['春秋', '汉', '南朝', '南北朝', '宋'] }, // 共11个
  { label: '元代', keywords: ['元'] }, // 共1个
  { label: '明代', keywords: ['明'] }, // 共16个
  { label: '清代', keywords: ['清'] }, // 共52个
  { label: '民国', keywords: ['民国'] }, // 共9个
  { label: '现代', keywords: ['现代'] }, // 共19个
  { label: '未知', keywords: [] }, // 兜底分类
];

/**
 * 面积区间配置（单位：㎡，统一跨度 5000 ㎡）
 */
const AREA_RANGES: AreaRangeConfig[] = [
  { label: '0-5000', min: 0, max: 5000 },
  { label: '5000-10000', min: 5000, max: 10000 },
  { label: '10000-15000', min: 10000, max: 15000 },
  { label: '15000-20000', min: 15000, max: 20000 },
  { label: '20000-25000', min: 20000, max: 25000 },
  { label: '25000以上', min: 25000, max: Infinity },
];

// ==================== 数据清洗函数 ====================

/**
 * 清洗面积字段：提取数值
 */
function cleanArea(areaStr: string): number {
  if (!areaStr || areaStr.trim() === '') return 0;

  // 移除所有非数字和小数点字符，保留数字和小数点
  const numStr = areaStr.replace(/[^\d.]/g, '');
  const num = parseFloat(numStr);

  return isNaN(num) ? 0 : num;
}

/**
 * 清洗文保单位级别：空值归为"未定级"
 * 基于实际数据：全国(26)、省级(15)、市级(19)、县级(2)、空值(45)
 */
function cleanHeritageLevel(level: string): string {
  if (!level || level.trim() === '' || level === 'null' || level === 'undefined') {
    return '未定级';
  }

  return level.trim();
}

/**
 * 清洗权属性质：归一化
 * 基于实际数据：国有(83)、私有(10)、私人(7)、企业(4)、宗教产(4)
 * 归一化规则：私人 → 私有
 */
function cleanOwnershipType(type: string): string {
  if (!type || type.trim() === '') {
    return '未知';
  }

  const normalized = type.trim();

  // 归一化映射
  const mapping: Record<string, string> = {
    私人: '私有',
    私有: '私有',
  };

  return mapping[normalized] || normalized;
}

/**
 * 清洗当前用途：归一化
 * 基于实际数据：游览服务(71)、单位使用(13)、私人(13)、民宿酒店(4)、空置(3)、宗教场所(3)、旅游景点(1)
 * 归一化规则：旅游景点 → 游览服务
 */
function cleanCurrentUse(use: string): string {
  if (!use || use.trim() === '') {
    return '未知';
  }

  const normalized = use.trim();

  // 归一化映射
  const mapping: Record<string, string> = {
    旅游景点: '游览服务',
    游览服务: '游览服务',
  };

  return mapping[normalized] || normalized;
}

/**
 * 清洗世界遗产字段：转为布尔值
 */
function cleanWorldHeritage(value: string): boolean {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return normalized === 'TRUE' || normalized === 'YES' || normalized === '是' || normalized === '1';
}

/**
 * 清洗经纬度：转为数值
 */
function cleanCoordinate(coord: string): number {
  if (!coord || coord.trim() === '') return 0;
  const num = parseFloat(coord);
  return isNaN(num) ? 0 : num;
}

/**
 * 计算建造年代分类
 */
function calculateEraCategory(constructionPeriod: string): string {
  if (!constructionPeriod || constructionPeriod.trim() === '') {
    return '未知';
  }

  const normalized = constructionPeriod.trim();

  // 精确匹配年代分类（基于实际数据）
  for (const config of ERA_CATEGORIES) {
    if (config.keywords.length === 0) continue; // 跳过兜底分类

    for (const keyword of config.keywords) {
      if (normalized === keyword) {
        return config.label;
      }
    }
  }

  // 如果没有匹配到，记录警告并返回未知
  console.warn(`⚠️  未识别的建造年代: "${normalized}"`);
  return '未知';
}

/**
 * 计算面积区间
 */
function calculateAreaRange(area: number): string {
  if (area <= 0) return '未知';

  for (const range of AREA_RANGES) {
    if (area >= range.min && area < range.max) {
      return range.label;
    }
  }

  return '未知';
}

/**
 * 将原始数据转换为清洗后的数据
 */
function transformGardenData(raw: GardenRawData): GardenData {
  const area = cleanArea(raw['面积（㎡）']);
  const constructionPeriod = raw.建造年代?.trim() || '';

  return {
    // 原始字段映射
    publicationBatch: raw.公布批次?.trim() || '',
    name: raw.名称?.trim() || '',
    district: raw.区县?.trim() || '',
    address: raw.地址?.trim() || '',
    constructionPeriod,
    area,
    ownershipType: cleanOwnershipType(raw.权属性质),
    managementUnit: raw.管理单位?.trim() || '',
    protectionStatus: raw.保护状况?.trim() || '',
    openStatus: raw.开放情况?.trim() || '',
    currentUse: cleanCurrentUse(raw.当前用途),
    description: raw.描述?.trim() || '',
    longitude: cleanCoordinate(raw.经度),
    latitude: cleanCoordinate(raw.纬度),
    heritageLevel: cleanHeritageLevel(raw.文保单位级别),
    isWorldHeritage: cleanWorldHeritage(raw.世界遗产),

    // 派生字段
    eraCategory: calculateEraCategory(constructionPeriod),
    areaRange: calculateAreaRange(area),
  };
}

// ==================== 数据加载主函数 ====================

/**
 * 加载并解析 CSV 数据
 * @param csvPath CSV 文件路径（默认为 /dataset/SuzhouGardenListFull.csv）
 * @returns Promise<GardenData[]>
 */
export async function loadGardenData(
  csvPath: string = '/dataset/SuzhouGardenListFull.csv',
): Promise<GardenData[]> {
  try {
    // 使用 fetch 加载 CSV 文件
    const response = await fetch(csvPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    // 使用 PapaParse 解析 CSV
    return new Promise((resolve, reject) => {
      Papa.parse<GardenRawData>(csvText, {
        header: true, // 第一行作为表头
        skipEmptyLines: true, // 跳过空行
        transformHeader: (header) => header.trim(), // 清理表头空格
        complete: (results) => {
          try {
            // 清洗并转换数据
            const cleanedData = results.data.map(transformGardenData);

            console.log(`✅ 成功加载 ${cleanedData.length} 条园林数据`);
            resolve(cleanedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  } catch (error) {
    console.error('❌ 数据加载失败:', error);
    throw error;
  }
}

/**
 * 获取所有唯一的区县列表
 */
export function getDistrictList(data: GardenData[]): string[] {
  const districts = new Set(data.map((d) => d.district).filter(Boolean));
  return Array.from(districts).sort();
}

/**
 * 获取所有唯一的开放情况列表
 */
export function getOpenStatusList(data: GardenData[]): string[] {
  const statuses = new Set(data.map((d) => d.openStatus).filter(Boolean));
  return Array.from(statuses).sort();
}

/**
 * 获取所有唯一的文保单位级别列表
 */
export function getHeritageLevelList(data: GardenData[]): string[] {
  const levels = new Set(data.map((d) => d.heritageLevel).filter(Boolean));
  const order = ['全国', '省级', '市级', '区级', '未定级'];
  return Array.from(levels).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * 获取所有唯一的权属性质列表
 */
export function getOwnershipTypeList(data: GardenData[]): string[] {
  const types = new Set(data.map((d) => d.ownershipType).filter(Boolean));
  return Array.from(types).sort();
}

/**
 * 获取所有唯一的当前用途列表
 */
export function getCurrentUseList(data: GardenData[]): string[] {
  const uses = new Set(data.map((d) => d.currentUse).filter(Boolean));
  return Array.from(uses).sort();
}

/**
 * 获取所有唯一的建造年代列表
 */
export function getConstructionPeriodList(data: GardenData[]): string[] {
  const periods = new Set(data.map((d) => d.constructionPeriod).filter(Boolean));
  return Array.from(periods).sort();
}

/**
 * 获取所有唯一的年代分类列表
 */
export function getEraCategoryList(data: GardenData[]): string[] {
  const categories = new Set(data.map((d) => d.eraCategory).filter(Boolean));
  const order = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '不详'];
  return Array.from(categories).sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

/**
 * 获取所有唯一的公布批次列表
 */
export function getPublicationBatchList(data: GardenData[]): string[] {
  const batches = new Set(data.map((d) => d.publicationBatch).filter(Boolean));
  return Array.from(batches).sort();
}

/**
 * 获取所有面积区间列表
 */
export function getAreaRangeList(): string[] {
  return AREA_RANGES.map((r) => r.label);
}

// 导出配置供其他模块使用
export { AREA_RANGES, ERA_CATEGORIES };

// ==================== 行政区划数据加载 ====================

/**
 * 转换行政区划数据
 */
function transformDistrictData(raw: DistrictRawData): DistrictData {
  const parseNumber = (str: string): number => {
    if (!str || str.trim() === '') return 0;
    const num = parseFloat(str.replace(/[^\d.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  return {
    name: raw.地区?.trim() || '',
    area: parseNumber(raw['土地面积(平方公里)']),
    population: parseNumber(raw['常住人口(万人)']),
  };
}

/**
 * 加载并解析行政区划数据
 * @param csvPath CSV 文件路径（默认为 /dataset/SuzhouDistricts.csv）
 * @returns Promise<DistrictData[]>
 */
export async function loadDistrictData(
  csvPath: string = '/dataset/SuzhouDistricts.csv',
): Promise<DistrictData[]> {
  try {
    const response = await fetch(csvPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch district CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<DistrictRawData>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          try {
            const cleanedData = results.data.map(transformDistrictData);
            console.log(`✅ 成功加载 ${cleanedData.length} 条行政区划数据`);
            resolve(cleanedData);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(new Error(`District CSV parsing error: ${error.message}`));
        },
      });
    });
  } catch (error) {
    console.error('❌ 行政区划数据加载失败:', error);
    throw error;
  }
}
