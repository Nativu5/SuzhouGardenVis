/**
 * 高德地图加载服务
 * 使用 @amap/amap-jsapi-loader 动态加载高德地图 JS API
 */

import AMapLoader from '@amap/amap-jsapi-loader';

// 扩展 Window 类型以包含高德地图安全配置
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

// 从环境变量读取配置
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;

// 地图是否已加载
let isAMapLoaded = false;
let AMapInstance: any = null;

/**
 * 加载高德地图 JS API
 * @returns Promise<any> AMap 全局对象
 */
export async function loadAMap(): Promise<any> {
  // 如果已经加载过，直接返回
  if (isAMapLoaded && AMapInstance) {
    return AMapInstance;
  }

  try {
    // 设置安全密钥（必须在加载前设置）
    if (AMAP_SECURITY_CODE) {
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CODE,
      };
    }

    // 加载高德地图 JS API
    const AMap = await AMapLoader.load({
      key: AMAP_KEY, // API Key
      version: '2.0', // 使用 2.0 版本
      plugins: [
        'AMap.Scale', // 比例尺控件
        'AMap.MarkerCluster', // 点聚合
      ],
    });

    isAMapLoaded = true;
    AMapInstance = AMap;
    console.log('✅ 高德地图 JS API 加载成功');
    return AMap;
  } catch (error) {
    console.error('❌ 高德地图 JS API 加载失败:', error);
    throw new Error(`Failed to load AMap: ${error}`);
  }
}

/**
 * 获取已加载的 AMap 实例
 * @returns AMap 全局对象或 null
 */
export function getAMapInstance(): any {
  return AMapInstance;
}

/**
 * 苏州市中心坐标（默认地图中心）
 */
export const SUZHOU_CENTER: [number, number] = [120.585316, 31.298886];

/**
 * 默认地图配置
 */
export const DEFAULT_MAP_CONFIG = {
  zoom: 11, // 缩放级别
  center: SUZHOU_CENTER, // 地图中心
  viewMode: '2D' as const, // 2D 模式
  mapStyle: 'amap://styles/normal' as const, // 标准样式
  features: ['bg', 'road', 'building'] as const, // 显示背景、道路、建筑
  showLabel: true, // 显示文字标注
};
