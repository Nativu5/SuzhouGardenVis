<!--
  地图容器组件
  集成高德地图，展示行政区边界和园林点位
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import { loadAMap, DEFAULT_MAP_CONFIG } from '@/services/mapLoader'
import { getHeritageLevelColor, getDistrictColor } from '@/config/theme'
import type { GardenData } from '@/types'

const gardenStore = useGardenStore()

// 地图容器引用
const mapContainer = ref<HTMLDivElement | null>(null)

// 高德地图实例
let mapInstance: any = null
let AMap: any = null

// 行政区边界 Polygon 数组
let districtLayer: any[] | null = null

// Marker 相关
let markersArray: any[] = []
let markerCluster: any = null

// InfoWindow 实例
let infoWindow: any = null

// 加载状态
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// 聚合/散点模式
const isClusterMode = ref(true)
// 是否显示行政区遮罩
const isShowDistrictMask = ref(true)

// 初始化地图
const initMap = async () => {
  try {
    isLoading.value = true
    loadError.value = null

    // 加载高德地图 JS API
    AMap = await loadAMap()

    // 创建地图实例
    if (!mapContainer.value) {
      throw new Error('Map container not found')
    }

    mapInstance = new AMap.Map(mapContainer.value, {
      ...DEFAULT_MAP_CONFIG,
      resizeEnable: true // 允许地图自适应容器大小
    })

    // 监听地图加载完成事件
    mapInstance.on('complete', () => {
      console.log('🗺️ 地图就绪，开始加载园林点位')
      isLoading.value = false
      updateGardenMarkers(gardenStore.filteredData)
    })

    // 添加比例尺控件
    const scale = new AMap.Scale({
      position: 'LB' // 左下角
    })
    mapInstance.addControl(scale)

    // 创建 InfoWindow 实例
    infoWindow = new AMap.InfoWindow({
      isCustom: false,
      offset: new AMap.Pixel(0, -30)
    })

    console.log('✅ 地图初始化成功')

    // 加载行政区边界
    await loadDistrictBoundaries()
  } catch (error) {
    console.error('❌ 地图初始化失败:', error)
    loadError.value = error instanceof Error ? error.message : '地图加载失败'
    isLoading.value = false
  }
}

// 计算每个区县的园林数量
const getDistrictGardenCount = () => {
  const countMap = new Map<string, number>()
  gardenStore.rawData.forEach((garden) => {
    const district = garden.district
    const count = countMap.get(district) || 0
    countMap.set(district, count + 1)
  })
  return countMap
}


// 加载行政区边界
const loadDistrictBoundaries = async () => {
  try {
    // 加载 GeoJSON 数据
    const response = await fetch('/dataset/suzhou_districts.json')
    if (!response.ok) {
      throw new Error(`Failed to load district data: ${response.status}`)
    }
    const geojsonData = await response.json()

    // 统计每个区县的园林数量
    const districtCountMap = getDistrictGardenCount()

    console.log('📊 区县园林数量统计:', Object.fromEntries(districtCountMap))

    // 创建 OverlayGroup 来管理所有 polygon
    const polygons: any[] = []

    // 遍历 GeoJSON features，手动创建 Polygon
    geojsonData.features.forEach((feature: any) => {
      const districtName = feature.properties.name
      const count = districtCountMap.get(districtName) || 0
      const fillColor = getDistrictColor(districtName)

      // 处理 MultiPolygon 或 Polygon
      const geometryType = feature.geometry.type
      let paths: any[] = []

      if (geometryType === 'MultiPolygon') {
        // MultiPolygon: [[[lng, lat], ...], ...]
        paths = feature.geometry.coordinates.map((polygon: any) =>
          polygon.map((ring: any) => ring.map((coord: any) => [coord[0], coord[1]]))
        )
      } else if (geometryType === 'Polygon') {
        // Polygon: [[lng, lat], ...]
        paths = feature.geometry.coordinates.map((ring: any) =>
          ring.map((coord: any) => [coord[0], coord[1]])
        )
      }

      // 为每个 path 创建 Polygon
      paths.forEach((path: any) => {
        const polygon = new AMap.Polygon({
          path: path[0], // 外环
          fillColor: fillColor,
          fillOpacity: 0.5,
          strokeColor: '#1F2937',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          bubble: true,
          extData: {
            ...feature.properties,
            gardenCount: count
          }
        })

        // 添加点击事件
        polygon.on('click', (e: any) => {
          const extData = e.target.getExtData()
          const { name, gardenCount, center } = extData
          console.log(`点击区县: ${name}, 园林数量: ${gardenCount}`)
          showDistrictInfo(name, gardenCount, center)
          // 触发右侧详情区显示区域统计
          gardenStore.selectDistrict(name)
        })

        // 添加鼠标悬停效果
        polygon.on('mouseover', (e: any) => {
          e.target.setOptions({
            fillOpacity: 0.7
          })
        })

        polygon.on('mouseout', (e: any) => {
          e.target.setOptions({
            fillOpacity: 0.5
          })
        })

        polygons.push(polygon)
      })
    })

    // 将所有 polygon 添加到地图
    mapInstance.add(polygons)
    districtLayer = polygons // 保存引用以便后续清理

    console.log('✅ 行政区边界加载成功')
  } catch (error) {
    console.error('❌ 行政区边界加载失败:', error)
  }
}

// 显示园林信息弹窗
const showGardenInfo = (garden: GardenData, position: [number, number]) => {
  const content = `
    <div style="padding: 12px; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
        ${garden.name}
      </h3>
      <div style="font-size: 13px; color: #374151; line-height: 1.6;">
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">区县：</span>${garden.district}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">地址：</span>${garden.address || '未知'}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">文保级别：</span>
          <span style="color: ${getHeritageLevelColor(garden.heritageLevel)}; font-weight: 500;">
            ${garden.heritageLevel}
          </span>
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">开放情况：</span>${garden.openStatus}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">建造年代：</span>${garden.constructionPeriod || '未知'}
        </div>
        <div>
          <span style="color: #6B7280;">面积：</span>${garden.area > 0 ? garden.area.toFixed(0) + ' ㎡' : '未知'}
        </div>
      </div>
    </div>
  `

  infoWindow.setContent(content)
  infoWindow.open(mapInstance, position)
}

// 显示区县信息弹窗
const showDistrictInfo = (districtName: string, gardenCount: number, position: [number, number]) => {
  const content = `
    <div style="padding: 12px; min-width: 180px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
        ${districtName}
      </h3>
      <div style="font-size: 14px; color: #374151;">
        <div style="margin-bottom: 4px;">
          <span style="color: #6B7280;">园林数量：</span>
          <span style="font-weight: 600; color: #5470C6;">${gardenCount}</span> 座
        </div>
      </div>
    </div>
  `

  infoWindow.setContent(content)
  infoWindow.open(mapInstance, position)
}

// 创建单个园林的 Marker
const createGardenMarker = (garden: GardenData): any => {
  // 检查经纬度有效性（排除 0 值和无效值）
  if (typeof garden.longitude !== 'number' || typeof garden.latitude !== 'number' ||
      garden.longitude === 0 || garden.latitude === 0 ||
      isNaN(garden.longitude) || isNaN(garden.latitude)) {
    console.warn(`⚠️ 园林 ${garden.name} 经纬度无效: (${garden.longitude}, ${garden.latitude})`)
    return null
  }

  // 根据文保级别获取颜色
  const color = getHeritageLevelColor(garden.heritageLevel)

  // 创建自定义 Marker 内容（圆点）
  const markerContent = `
    <div style="
      width: 12px;
      height: 12px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>
  `

  // 创建 Marker
  const marker = new AMap.Marker({
    position: [garden.longitude, garden.latitude],
    content: markerContent,
    offset: new AMap.Pixel(-6, -6),
    extData: garden,
    bubble: true
  })

  // 添加点击事件
  marker.on('click', () => {
    console.log('点击园林:', garden.name)
    showGardenInfo(garden, [garden.longitude, garden.latitude])
    // 触发右侧详情区显示园林详情
    gardenStore.selectGarden(garden)
  })

  return marker
}

// 加载园林点位（散点模式）
const loadGardenMarkers = (gardens: GardenData[]) => {
  // 清除现有 Markers
  clearMarkers()

  // 为每个园林创建 Marker
  gardens.forEach((garden) => {
    const marker = createGardenMarker(garden)
    if (marker) {
      markersArray.push(marker)
    }
  })

  // 添加到地图
  mapInstance.add(markersArray)

  console.log(`✅ 已添加 ${markersArray.length} 个园林点位（散点模式）`)
}

// 加载园林点位（聚合模式）
const loadGardenMarkersWithCluster = (gardens: GardenData[]) => {
  // 清除现有 Markers
  clearMarkers()

  // 构造聚合数据（使用纯数据对象而不是 Marker 实例）
  const clusterData = gardens
    .filter(g => g.longitude && g.latitude && !isNaN(g.longitude) && !isNaN(g.latitude))
    .map(g => ({
      lnglat: [g.longitude, g.latitude], // AMap 2.0 要求的格式
      ...g // 包含所有园林数据
    }))

  console.log(`📍 准备聚合数据: ${clusterData.length} 条`)

  if (clusterData.length === 0) {
    console.warn('⚠️ 没有有效的园林点位可以显示')
    return
  }

  // 创建点聚合实例
  try {
    markerCluster = new AMap.MarkerCluster(mapInstance, clusterData, {
      gridSize: 80, // 聚合网格像素大小
      minClusterSize: 2, // 最小聚合数量
      
      // 渲染聚合点（数字气泡）
      renderClusterMarker: (context: any) => {
        const count = context.count
        const factor = Math.pow(count / clusterData.length, 1 / 5)
        const div = document.createElement('div')
        const size = Math.round(30 + factor * 20)

        div.style.cssText = `
          background-color: rgba(84, 112, 198, 0.8);
          width: ${size}px;
          height: ${size}px;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(12, size / 3)}px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        `

        div.innerHTML = count.toString()
        context.marker.setContent(div)
        context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2))
      },

      // 渲染非聚合点（单个园林）
      renderMarker: (context: any) => {
        const garden = context.data[0] // 获取原始数据
        const color = getHeritageLevelColor(garden.heritageLevel)
        
        const div = document.createElement('div')
        div.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `
        
        context.marker.setContent(div)
        context.marker.setOffset(new AMap.Pixel(-6, -6))
      }
    })

    // 绑定点击事件
    markerCluster.on('click', (e: any) => {
      const clusterData = e.clusterData
      // 如果点击的是单个点（非聚合点）
      if (clusterData && clusterData.length === 1) {
        const garden = clusterData[0]
        console.log('点击园林:', garden.name)
        showGardenInfo(garden, [garden.longitude, garden.latitude])
        // 触发右侧详情区显示园林详情
        gardenStore.selectGarden(garden)
      }
      // 如果点击的是聚合点，默认会放大，不需要额外处理
    })

    console.log(`✅ 已添加 ${clusterData.length} 个园林点位（聚合模式）`)
  } catch (error) {
    console.error('❌ 创建 MarkerCluster 失败:', error)
  }
}

// 清除所有 Markers
const clearMarkers = () => {
  if (markerCluster) {
    markerCluster.setMap(null)
    markerCluster = null
  }

  if (markersArray.length > 0) {
    mapInstance.remove(markersArray)
    markersArray = []
  }
}

// 更新园林点位
const updateGardenMarkers = (gardens: GardenData[]) => {
  if (!mapInstance || !AMap) {
    console.warn('⚠️ 地图实例未就绪，跳过点位更新')
    return
  }

  console.log(`🔄 更新园林点位: ${gardens.length} 条数据, 模式: ${isClusterMode.value ? '聚合' : '散点'}`)

  if (isClusterMode.value) {
    loadGardenMarkersWithCluster(gardens)
  } else {
    loadGardenMarkers(gardens)
  }
}

// 切换聚合/散点模式
const toggleClusterMode = () => {
  isClusterMode.value = !isClusterMode.value
  console.log(`切换到${isClusterMode.value ? '聚合' : '散点'}模式`)
  // 重新加载点位
  updateGardenMarkers(gardenStore.filteredData)
}

// 切换行政区遮罩显示/隐藏
const toggleDistrictMask = () => {
  if (!districtLayer || !mapInstance) return
  
  isShowDistrictMask.value = !isShowDistrictMask.value
  
  if (isShowDistrictMask.value) {
    mapInstance.add(districtLayer)
  } else {
    mapInstance.remove(districtLayer)
  }
  console.log(`切换行政区遮罩: ${isShowDistrictMask.value ? '显示' : '隐藏'}`)
}

// 监听筛选数据变化
watch(
  () => gardenStore.filteredData,
  (newData: GardenData[]) => {
    if (mapInstance && AMap) {
      console.log(`地图数据更新: ${newData.length} 条记录`)
      updateGardenMarkers(newData)
    }
  }
)

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})

// 组件卸载时销毁地图实例
onUnmounted(() => {
  // 销毁 InfoWindow
  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }

  // 清除 Markers
  clearMarkers()

  // 清除行政区边界
  if (districtLayer && mapInstance) {
    mapInstance.remove(districtLayer)
    districtLayer = null
  }

  // 销毁地图实例
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
    console.log('✅ 地图实例已销毁')
  }
})

// 暴露地图实例供父组件访问
defineExpose({
  mapInstance,
  AMap
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- 地图容器 -->
    <div ref="mapContainer" class="w-full h-full" />

    <!-- 加载中提示 -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/80 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
        />
        <p class="mt-4 text-gray-600">地图加载中...</p>
      </div>
    </div>

    <!-- 加载失败提示 -->
    <div
      v-if="loadError"
      class="absolute inset-0 bg-white flex items-center justify-center z-10"
    >
      <div class="text-center max-w-md px-4">
        <svg
          class="w-16 h-16 mx-auto mb-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-lg font-medium text-gray-900 mb-2">地图加载失败</p>
        <p class="text-sm text-gray-600 mb-4">{{ loadError }}</p>
        <button
          class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          @click="initMap"
        >
          重新加载
        </button>
      </div>
    </div>

    <!-- 地图控件：聚合/散点切换 & 行政区遮罩切换 -->
    <div
      v-if="!isLoading && !loadError"
      class="absolute top-4 right-4 z-[1000] flex flex-col gap-2"
    >
      <button
        class="px-4 py-2 text-sm font-medium transition-colors rounded-lg shadow-lg"
        :style="{
          backgroundColor: isClusterMode ? '#0ea5e9' : '#ffffff',
          color: isClusterMode ? '#ffffff' : '#374151',
          border: isClusterMode ? 'none' : '1px solid #d1d5db'
        }"
        @click="toggleClusterMode"
      >
        {{ isClusterMode ? '聚合模式' : '散点模式' }}
      </button>

      <button
        class="px-4 py-2 text-sm font-medium transition-colors rounded-lg shadow-lg"
        :style="{
          backgroundColor: isShowDistrictMask ? '#0ea5e9' : '#ffffff',
          color: isShowDistrictMask ? '#ffffff' : '#374151',
          border: isShowDistrictMask ? 'none' : '1px solid #d1d5db'
        }"
        @click="toggleDistrictMask"
      >
        {{ isShowDistrictMask ? '显示区域' : '隐藏区域' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 确保地图容器占满父元素 */
#map-container {
  width: 100%;
  height: 100%;
}
</style>
