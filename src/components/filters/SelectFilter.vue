<!--
  单选筛选器组件
  下拉单选，用于简单的单项选择
-->
<script setup lang="ts">
interface Props {
  label: string // 筛选器标签
  options: string[] // 可选项列表
  modelValue: string | null // 选中的值（v-model）
  placeholder?: string // 占位符
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

// 选择选项
function selectOption(option: string | null) {
  emit('update:modelValue', option)
}
</script>

<template>
  <div class="select-filter">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>

    <select
      :value="modelValue"
      @change="selectOption(($event.target as HTMLSelectElement).value || null)"
      class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      :class="{ 'text-gray-500': !modelValue, 'text-gray-900': modelValue }"
    >
      <option :value="null">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
  </div>
</template>
