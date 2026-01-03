<script setup lang="ts">
/**
 * KPI 指标卡片组件
 * 用于展示关键数据指标
 */

interface Props {
  title: string
  value: string | number
  unit?: string
  description?: string
  icon?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="metric-card bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="text-sm text-gray-600 mb-1">{{ props.title }}</div>
        <div class="flex items-baseline gap-1">
          <div class="text-2xl font-semibold text-gray-900">
            {{ props.value }}
          </div>
          <div v-if="props.unit" class="text-sm text-gray-500">
            {{ props.unit }}
          </div>
        </div>
        <div v-if="props.description" class="text-xs text-gray-500 mt-2">
          {{ props.description }}
        </div>
      </div>
      <div v-if="props.icon" class="text-2xl opacity-50">
        {{ props.icon }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  min-height: 100px;
}
</style>
