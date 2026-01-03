<!--
  右侧详情区组件（仅探索模式显示）
  - 空状态提示
  - 区域统计视图
  - 园林详情视图
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import { computed } from 'vue'

const gardenStore = useGardenStore()

// 判断是否有选中的园林
const hasSelectedGarden = computed(() => !!gardenStore.selectedGarden)

// 判断是否有选中的区县
const hasSelectedDistrict = computed(() => !!gardenStore.selectedDistrict)

// 选中区县的园林列表
const districtGardens = computed(() => {
  if (!gardenStore.selectedDistrict) return []
  return gardenStore.getGardensByDistrict(gardenStore.selectedDistrict)
})

// 处理关闭详情
const handleClose = () => {
  gardenStore.clearSelection()
}
</script>

<template>
  <aside class="w-96 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
    <!-- 空状态 -->
    <div v-if="!hasSelectedGarden && !hasSelectedDistrict" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center text-gray-400">
        <svg
          class="w-16 h-16 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-sm font-medium mb-1">未选择园林或区域</p>
        <p class="text-xs">点击地图上的点位或区域查看详情</p>
      </div>
    </div>

    <!-- 区域统计视图 -->
    <div v-else-if="hasSelectedDistrict" class="flex-1 flex flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-900">
          {{ gardenStore.selectedDistrict }} 区域统计
        </h3>
        <button
          @click="handleClose"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 区域统计指标 -->
      <div class="p-4 bg-gray-50 border-b border-gray-200">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">园林数量</p>
            <p class="text-2xl font-bold text-gray-900">{{ districtGardens.length }}</p>
          </div>
          <div class="bg-white rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">开放数量</p>
            <p class="text-2xl font-bold text-green-600">
              {{ districtGardens.filter(g => g.openStatus === '开放').length }}
            </p>
          </div>
        </div>
      </div>

      <!-- 园林列表 -->
      <div class="flex-1 overflow-y-auto p-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">区域内园林</h4>
        <div class="space-y-2">
          <div
            v-for="garden in districtGardens"
            :key="garden.name"
            class="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            @click="gardenStore.selectGarden(garden)"
          >
            <p class="font-medium text-gray-900 text-sm mb-1">{{ garden.name }}</p>
            <div class="flex items-center space-x-2 text-xs">
              <span
                :class="[
                  'px-2 py-0.5 rounded',
                  garden.openStatus === '开放' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ garden.openStatus }}
              </span>
              <span class="text-gray-500">{{ garden.ownershipType }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 园林详情视图 -->
    <div v-else-if="hasSelectedGarden" class="flex-1 flex flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-900">
          园林详情
        </h3>
        <button
          @click="handleClose"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 详情内容 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- 园林名称 -->
        <div>
          <h4 class="text-xl font-bold text-gray-900 mb-1">
            {{ gardenStore.selectedGarden?.name }}
          </h4>
          <p class="text-sm text-gray-600">
            {{ gardenStore.selectedGarden?.district }}
          </p>
        </div>

        <!-- 图片占位 -->
        <div class="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
          <span class="text-gray-400 text-sm">图片展示（里程碑 6 实现）</span>
        </div>

        <!-- 基础信息 -->
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">地址</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.address }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">建造年代</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.constructionPeriod }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">面积</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.area.toLocaleString() }} ㎡</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">文保级别</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.heritageLevel }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">权属性质</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.ownershipType }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">管理单位</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.managementUnit }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">保护状况</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.protectionStatus }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">开放情况</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.openStatus }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">当前用途</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.currentUse }}</span>
          </div>
          <div v-if="gardenStore.selectedGarden?.isWorldHeritage" class="flex items-start">
            <span class="text-sm font-medium text-gray-500 w-24 flex-shrink-0">世界遗产</span>
            <span class="text-sm font-bold text-blue-600">是</span>
          </div>
        </div>

        <!-- 描述 -->
        <div v-if="gardenStore.selectedGarden?.description" class="pt-3 border-t border-gray-200">
          <h5 class="text-sm font-semibold text-gray-700 mb-2">描述</h5>
          <p class="text-sm text-gray-600 leading-relaxed">
            {{ gardenStore.selectedGarden.description }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
