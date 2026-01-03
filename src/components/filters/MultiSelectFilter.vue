<!--
  多选筛选器组件
  支持下拉多选，带有选中数量提示
-->
<script setup lang="ts">
import { computed, ref, type Directive } from 'vue'

interface Props {
  label: string // 筛选器标签
  options: string[] // 可选项列表
  modelValue: string[] // 选中的值（v-model）
  placeholder?: string // 占位符
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

// 自定义指令：点击外部关闭（在 script setup 中以 vXxx 命名，模板中自动识别为 v-xxx）
const vClickAway: Directive<HTMLElement & { clickAwayEvent?: (e: Event) => void }, () => void> = {
  mounted(el, binding) {
    el.clickAwayEvent = function (event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickAwayEvent)
  },
  unmounted(el) {
    if (el.clickAwayEvent) {
      document.removeEventListener('click', el.clickAwayEvent)
    }
  }
}

// 是否展开下拉框
const isExpanded = ref(false)

// 选中的项数量
const selectedCount = computed(() => props.modelValue.length)

// 显示文本
const displayText = computed(() => {
  if (selectedCount.value === 0) {
    return props.placeholder
  }
  return `已选 ${selectedCount.value} 项`
})

// 切换选项
function toggleOption(option: string) {
  const currentValues = [...props.modelValue]
  const index = currentValues.indexOf(option)

  if (index > -1) {
    currentValues.splice(index, 1)
  } else {
    currentValues.push(option)
  }

  emit('update:modelValue', currentValues)
}

// 全选
function selectAll() {
  emit('update:modelValue', [...props.options])
}

// 清空
function clearAll() {
  emit('update:modelValue', [])
}

// 点击外部关闭下拉框
function handleClickOutside() {
  isExpanded.value = false
}
</script>

<template>
  <div class="multi-select-filter">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>

    <div class="relative" v-click-away="handleClickOutside">
      <!-- 触发按钮 -->
      <button
        type="button"
        @click="isExpanded = !isExpanded"
        class="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        :class="{ 'border-blue-500 ring-2 ring-blue-500': isExpanded }"
      >
        <span :class="{ 'text-gray-500': selectedCount === 0, 'text-gray-900 font-medium': selectedCount > 0 }">
          {{ displayText }}
        </span>
        <svg
          class="w-4 h-4 text-gray-400 transition-transform"
          :class="{ 'transform rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- 下拉选项 -->
      <div
        v-show="isExpanded"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
      >
        <!-- 操作按钮 -->
        <div class="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <button
            type="button"
            @click="selectAll"
            class="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            全选
          </button>
          <button
            type="button"
            @click="clearAll"
            class="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            清空
          </button>
        </div>

        <!-- 选项列表 -->
        <div class="py-1">
          <label
            v-for="option in options"
            :key="option"
            class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              :checked="modelValue.includes(option)"
              @change="toggleOption(option)"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span class="ml-2 text-sm text-gray-700">{{ option }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>


